import { supabase } from '../lib/supabaseClient';
import type { DiaryEntry, DiaryEntryInput } from '../types';

const LOCAL_STORAGE_KEY_PREFIX = 'outputlab_diaries_';
const UNIVERSAL_KEY = 'outputlab_diaries_all';

function getLocalKey(userId?: string): string {
  return userId ? `${LOCAL_STORAGE_KEY_PREFIX}${userId}` : UNIVERSAL_KEY;
}

export function getAllLocalDiaries(): DiaryEntry[] {
  const map = new Map<string, DiaryEntry>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(LOCAL_STORAGE_KEY_PREFIX) || k === UNIVERSAL_KEY)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.id) {
                map.set(item.id, item);
              }
            }
          }
        }
      }
    }
  } catch {
    /* ignore localStorage error */
  }
  return Array.from(map.values());
}

export function getLocalDiaries(userId?: string): DiaryEntry[] {
  try {
    if (userId) {
      const raw = localStorage.getItem(getLocalKey(userId));
      if (raw) {
        return JSON.parse(raw) as DiaryEntry[];
      }
    }
    return getAllLocalDiaries();
  } catch {
    return [];
  }
}

export function saveLocalDiaries(userId: string | undefined, entries: DiaryEntry[]) {
  try {
    const json = JSON.stringify(entries);
    if (userId) {
      localStorage.setItem(getLocalKey(userId), json);
    }
    localStorage.setItem(UNIVERSAL_KEY, json);
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
  const userId = auth?.user?.id;
  const local = getAllLocalDiaries();

  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const mergedMap = new Map<string, DiaryEntry>();
      // Masukkan local entries terlebih dahulu
      for (const item of local) {
        mergedMap.set(item.entry_date || item.id, item);
      }
      // Gabungkan dengan remote entries
      for (const item of data as DiaryEntry[]) {
        mergedMap.set(item.entry_date || item.id, item);
      }
      const merged = Array.from(mergedMap.values()).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
      if (userId) {
        saveLocalDiaries(userId, merged);
      }
      return merged;
    }

    if (error && !isTableMissingError(error)) {
      console.warn('Error fetching remote diaries:', error.message);
    }

    return local.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  } catch (err) {
    console.warn('Fetch diaries catch fallback to local:', err);
    return local.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }
}

export async function getDiaryForDate(entryDate: string): Promise<DiaryEntry | null> {
  const all = await listDiaries();
  return all.find((d) => d.entry_date === entryDate) ?? null;
}

export async function createDiary(input: DiaryEntryInput): Promise<DiaryEntry> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default_user';

  const content = input.content.trim();
  if (!content) {
    throw new Error('Isi catatan momen diary tidak boleh kosong.');
  }

  const now = new Date().toISOString();
  const newEntry: DiaryEntry = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    user_id: userId,
    entry_date: input.entry_date,
    content,
    created_at: now,
    updated_at: now,
  };

  // Simpan segera ke local storage agar seketika muncul dan tercatat di jejak grid
  const current = getAllLocalDiaries();
  const nextLocal = [newEntry, ...current.filter((c) => c.entry_date !== input.entry_date && c.id !== newEntry.id)];
  saveLocalDiaries(userId, nextLocal);

  // Simpan ke Supabase
  try {
    const { data, error } = await supabase
      .from('diaries')
      .insert({
        user_id: userId,
        entry_date: input.entry_date,
        content,
      })
      .select()
      .single();

    if (!error && data) {
      const created = data as DiaryEntry;
      const updatedList = [created, ...current.filter((c) => c.entry_date !== input.entry_date && c.id !== created.id)];
      saveLocalDiaries(userId, updatedList);
      return created;
    }
  } catch (err) {
    console.warn('Supabase insert error, diary disimpan lokal:', err);
  }

  return newEntry;
}

export async function updateDiary(id: string, input: Partial<DiaryEntryInput>): Promise<DiaryEntry> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default_user';

  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (input.content !== undefined) {
    if (!input.content.trim()) throw new Error('Isi catatan momen tidak boleh kosong.');
    patch.content = input.content.trim();
  }
  if (input.entry_date !== undefined) {
    patch.entry_date = input.entry_date;
  }

  const current = getAllLocalDiaries();
  const idx = current.findIndex((c) => c.id === id);
  let updatedEntry: DiaryEntry;

  if (idx >= 0) {
    updatedEntry = { ...current[idx], ...patch } as DiaryEntry;
    current[idx] = updatedEntry;
    saveLocalDiaries(userId, current);
  } else {
    updatedEntry = {
      id,
      user_id: userId,
      entry_date: input.entry_date || new Date().toISOString().slice(0, 10),
      content: input.content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalDiaries(userId, [updatedEntry, ...current]);
  }

  try {
    const { data, error } = await supabase
      .from('diaries')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const remoteUpdated = data as DiaryEntry;
      saveLocalDiaries(
        userId,
        current.map((c) => (c.id === id ? remoteUpdated : c)),
      );
      return remoteUpdated;
    }
  } catch (err) {
    console.warn('Supabase update error, pembaruan tetap tersimpan di lokal:', err);
  }

  return updatedEntry;
}

export async function deleteDiary(id: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  const current = getAllLocalDiaries();
  saveLocalDiaries(
    userId,
    current.filter((c) => c.id !== id),
  );

  try {
    await supabase.from('diaries').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }
}

/** Ambil seluruh data diary untuk jejak grid & detail hari (gabungan Supabase + Local) */
export async function getDiariesForActivity(): Promise<{ id: string; entry_date: string; content: string; created_at: string }[]> {
  const itemsMap = new Map<string, { id: string; entry_date: string; content: string; created_at: string }>();

  // 1. Ambil dari local storage terlebih dahulu (instan)
  const localList = getAllLocalDiaries();
  for (const item of localList) {
    if (item && item.entry_date) {
      itemsMap.set(item.entry_date, {
        id: item.id,
        entry_date: item.entry_date,
        content: item.content,
        created_at: item.created_at || new Date().toISOString(),
      });
    }
  }

  // 2. Ambil dari database Supabase
  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('id, entry_date, content, created_at');

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row && row.entry_date) {
          itemsMap.set(row.entry_date, {
            id: row.id,
            entry_date: row.entry_date,
            content: row.content,
            created_at: row.created_at,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Gagal membaca data diary dari Supabase:', err);
  }

  return Array.from(itemsMap.values());
}
