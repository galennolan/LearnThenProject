import { supabase } from '../lib/supabaseClient';
import type { DiaryEntry, DiaryEntryInput } from '../types';

const LOCAL_STORAGE_KEY_PREFIX = 'outputlab_diaries_';

function getLocalKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

export function getLocalDiaries(userId: string): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(getLocalKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as DiaryEntry[];
  } catch {
    return [];
  }
}

export function saveLocalDiaries(userId: string, entries: DiaryEntry[]) {
  try {
    localStorage.setItem(getLocalKey(userId), JSON.stringify(entries));
  } catch {
    /* ignore storage full */
  }
}

/** Cek apakah error dari Supabase karena tabel belum dibuat (code 42P01). */
function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = (error as { message?: string; code?: string }).message?.toLowerCase() ?? '';
  const code = (error as { code?: string }).code ?? '';
  return code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
}

export async function listDiaries(): Promise<DiaryEntry[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error) && userId) {
        return getLocalDiaries(userId).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
      }
      throw new Error(error.message);
    }

    const entries = (data ?? []) as DiaryEntry[];
    if (userId) {
      saveLocalDiaries(userId, entries);
    }
    return entries;
  } catch (err) {
    if (userId) {
      const local = getLocalDiaries(userId);
      if (local.length > 0) {
        return local.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
      }
    }
    throw err;
  }
}

export async function getDiaryForDate(entryDate: string): Promise<DiaryEntry | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('entry_date', entryDate)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error) && userId) {
        return getLocalDiaries(userId).find((d) => d.entry_date === entryDate) ?? null;
      }
      throw new Error(error.message);
    }

    return (data ?? null) as DiaryEntry | null;
  } catch {
    if (userId) {
      return getLocalDiaries(userId).find((d) => d.entry_date === entryDate) ?? null;
    }
    return null;
  }
}

export async function createDiary(input: DiaryEntryInput): Promise<DiaryEntry> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Pengguna belum masuk.');
  const userId = auth.user.id;

  const content = input.content.trim();
  if (!content) {
    throw new Error('Isi catatan momen diary tidak boleh kosong.');
  }

  const payload = {
    user_id: userId,
    entry_date: input.entry_date,
    content,
  };

  try {
    const { data, error } = await supabase
      .from('diaries')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        // Fallback simpan di localStorage
        const now = new Date().toISOString();
        const newEntry: DiaryEntry = {
          id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
          user_id: userId,
          entry_date: input.entry_date,
          content,
          created_at: now,
          updated_at: now,
        };
        const current = getLocalDiaries(userId);
        saveLocalDiaries(userId, [newEntry, ...current]);
        return newEntry;
      }
      throw new Error(error.message);
    }

    const created = data as DiaryEntry;
    const current = getLocalDiaries(userId);
    saveLocalDiaries(userId, [created, ...current.filter((c) => c.id !== created.id)]);
    return created;
  } catch (err) {
    if (isTableMissingError(err)) {
      const now = new Date().toISOString();
      const newEntry: DiaryEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
        user_id: userId,
        entry_date: input.entry_date,
        content,
        created_at: now,
        updated_at: now,
      };
      const current = getLocalDiaries(userId);
      saveLocalDiaries(userId, [newEntry, ...current]);
      return newEntry;
    }
    throw err;
  }
}

export async function updateDiary(id: string, input: Partial<DiaryEntryInput>): Promise<DiaryEntry> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Pengguna belum masuk.');
  const userId = auth.user.id;

  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (input.content !== undefined) {
    if (!input.content.trim()) throw new Error('Isi catatan momen tidak boleh kosong.');
    patch.content = input.content.trim();
  }
  if (input.entry_date !== undefined) {
    patch.entry_date = input.entry_date;
  }

  try {
    const { data, error } = await supabase
      .from('diaries')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        const current = getLocalDiaries(userId);
        const idx = current.findIndex((c) => c.id === id);
        if (idx >= 0) {
          const updated = { ...current[idx], ...patch } as DiaryEntry;
          current[idx] = updated;
          saveLocalDiaries(userId, current);
          return updated;
        }
      }
      throw new Error(error.message);
    }

    const updated = data as DiaryEntry;
    const current = getLocalDiaries(userId);
    saveLocalDiaries(
      userId,
      current.map((c) => (c.id === id ? updated : c)),
    );
    return updated;
  } catch (err) {
    if (isTableMissingError(err)) {
      const current = getLocalDiaries(userId);
      const idx = current.findIndex((c) => c.id === id);
      if (idx >= 0) {
        const updated = { ...current[idx], ...patch } as DiaryEntry;
        current[idx] = updated;
        saveLocalDiaries(userId, current);
        return updated;
      }
    }
    throw err;
  }
}

export async function deleteDiary(id: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  try {
    const { error } = await supabase.from('diaries').delete().eq('id', id);
    if (error && !isTableMissingError(error)) {
      throw new Error(error.message);
    }
  } catch (err) {
    if (!isTableMissingError(err)) throw err;
  } finally {
    if (userId) {
      const current = getLocalDiaries(userId);
      saveLocalDiaries(
        userId,
        current.filter((c) => c.id !== id),
      );
    }
  }
}

/** Ambil seluruh data diary untuk jejak grid & detail hari */
export async function getDiariesForActivity(): Promise<{ id: string; entry_date: string; content: string; created_at: string }[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('id, entry_date, content, created_at');

    if (error || !data) {
      if (userId) {
        return getLocalDiaries(userId).map((d) => ({
          id: d.id,
          entry_date: d.entry_date,
          content: d.content,
          created_at: d.created_at,
        }));
      }
      return [];
    }

    return data as { id: string; entry_date: string; content: string; created_at: string }[];
  } catch {
    if (userId) {
      return getLocalDiaries(userId).map((d) => ({
        id: d.id,
        entry_date: d.entry_date,
        content: d.content,
        created_at: d.created_at,
      }));
    }
    return [];
  }
}

