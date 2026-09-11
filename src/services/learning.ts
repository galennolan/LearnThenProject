import { supabase } from '../lib/supabaseClient';
import type { LearningItem, LearningNote, LearningStatus, Output, Project } from '../types';
import { createOutput, createProject } from './projects';

export interface LearningItemInput {
  title: string;
  source_url?: string | null;
  source_type: LearningItem['source_type'];
  description?: string | null;
  topic?: string | null;
  learning_goal?: string | null;
  status?: LearningStatus;
  completed_at?: string | null;
}

export async function listLearningItems() {
  const { data, error } = await supabase
    .from('learning_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as LearningItem[];
}

export async function getLearningItem(id: string) {
  const { data, error } = await supabase.from('learning_items').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as LearningItem;
}

export async function createLearningItem(input: LearningItemInput) {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('learning_items')
    .insert({ ...input, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LearningItem;
}

export async function updateLearningItem(id: string, input: Partial<LearningItemInput>) {
  const { data, error } = await supabase
    .from('learning_items')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LearningItem;
}

export async function deleteLearningItem(id: string) {
  const { error } = await supabase.from('learning_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getLearningNote(learningItemId: string) {
  const { data, error } = await supabase
    .from('learning_notes')
    .select('*')
    .eq('learning_item_id', learningItemId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as LearningNote | null;
}

export async function saveLearningNote(
  learningItemId: string,
  input: { understanding: string; critical_comment?: string | null; questions?: string | null; ideas?: string | null },
) {
  if (input.understanding.trim().length < 100) {
    throw new Error('Pemahaman minimal 100 karakter.');
  }
  const { data: auth } = await supabase.auth.getUser();
  const existing = await getLearningNote(learningItemId);
  if (existing) {
    const { data, error } = await supabase
      .from('learning_notes')
      .update({ ...input })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as LearningNote;
  }
  const { data, error } = await supabase
    .from('learning_notes')
    .insert({ ...input, learning_item_id: learningItemId, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LearningNote;
}

export async function markLearned(id: string) {
  return updateLearningItem(id, { status: 'learned', completed_at: new Date().toISOString() });
}

// ---------- Progress belajar (alursederhana) ----------
// Langkah: 1) materi dibuat 2) ada catatan/refleksi 3) ditandai komplet 4) ada konten
export interface LearningFocus {
  item: LearningItem;
  hasReflection: boolean;
  isLearned: boolean;
  outputCount: number;
  percent: number;
  nextAction: string;
}

function buildFocus(
  item: LearningItem,
  notedIds: Set<string>,
  projectIdsByLearning: Map<string, string[]>,
  outputCountByProject: Map<string, number>,
): LearningFocus {
  const hasReflection = notedIds.has(item.id);
  const isLearned = item.status === 'learned';
  const projectIds = projectIdsByLearning.get(item.id) ?? [];
  const outputCount = projectIds.reduce((n, pid) => n + (outputCountByProject.get(pid) ?? 0), 0);
  const steps = [true, hasReflection, isLearned, outputCount > 0];
  const percent = Math.round((steps.filter(Boolean).length / steps.length) * 100);
  const nextAction = !hasReflection
    ? 'Tulis catatan belajar'
    : !isLearned
      ? 'Tandai belajar komplet'
      : outputCount === 0
        ? 'Produksi konten pertama'
        : 'Komplet — lihat portofolio';
  return { item, hasReflection, isLearned, outputCount, percent, nextAction };
}

export async function listLearningFocus(): Promise<LearningFocus[]> {
  const [itemsRes, notesRes, projectsRes, outputsRes] = await Promise.all([
    supabase.from('learning_items').select('*').order('created_at', { ascending: false }),
    supabase.from('learning_notes').select('learning_item_id'),
    supabase.from('projects').select('id,learning_item_id'),
    supabase.from('outputs').select('id,project_id'),
  ]);
  if (itemsRes.error) throw new Error(itemsRes.error.message);
  if (notesRes.error) throw new Error(notesRes.error.message);
  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (outputsRes.error) throw new Error(outputsRes.error.message);

  const notedIds = new Set((notesRes.data ?? []).map((n: { learning_item_id: string }) => n.learning_item_id));
  const projectIdsByLearning = new Map<string, string[]>();
  for (const p of (projectsRes.data ?? []) as { id: string; learning_item_id: string | null }[]) {
    if (!p.learning_item_id) continue;
    projectIdsByLearning.set(p.learning_item_id, [...(projectIdsByLearning.get(p.learning_item_id) ?? []), p.id]);
  }
  const outputCountByProject = new Map<string, number>();
  for (const o of (outputsRes.data ?? []) as { id: string; project_id: string }[]) {
    outputCountByProject.set(o.project_id, (outputCountByProject.get(o.project_id) ?? 0) + 1);
  }
  return ((itemsRes.data ?? []) as LearningItem[]).map((item) =>
    buildFocus(item, notedIds, projectIdsByLearning, outputCountByProject),
  );
}

// ---------- Produksi konten langsung dari materi ----------
// Membuatkan project "Konten: ..." otomatis bila belum ada, lalu menyimpan output.
export interface ProduceContentInput {
  title: string;
  platform: Output['platform'];
  url: string;
  description?: string | null;
  is_primary?: boolean;
}

function projectTypeFor(platform: Output['platform']): Project['project_type'] {
  if (platform === 'youtube' || platform === 'tiktok') return 'video';
  if (platform === 'news' || platform === 'blog' || platform === 'website') return 'article';
  return 'other';
}

export async function produceContentFromLearning(learningItemId: string, input: ProduceContentInput) {
  const item = await getLearningItem(learningItemId);
  const { data: existing, error } = await supabase
    .from('projects')
    .select('id')
    .eq('learning_item_id', learningItemId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);

  let projectId = (existing ?? [])[0]?.id as string | undefined;
  if (!projectId) {
    const p = await createProject({
      title: `Konten: ${item.title}`,
      description: item.learning_goal,
      project_type: projectTypeFor(input.platform),
      status: 'active',
      priority: 'medium',
      learning_item_id: learningItemId,
    });
    projectId = p.id;
  }
  return createOutput(projectId, {
    title: input.title,
    output_type: input.platform === 'youtube' || input.platform === 'tiktok' ? 'video' : 'document',
    platform: input.platform,
    url: input.url,
    description: input.description ?? null,
    is_primary: input.is_primary ?? false,
    status: 'published',
    published_at: new Date().toISOString(),
  });
}

export async function listContentForLearning(learningItemId: string) {
  const { data: projects, error: pErr } = await supabase
    .from('projects')
    .select('id')
    .eq('learning_item_id', learningItemId);
  if (pErr) throw new Error(pErr.message);
  const ids = (projects ?? []).map((p: { id: string }) => p.id);
  if (ids.length === 0) return [] as Output[];
  const { data, error } = await supabase
    .from('outputs')
    .select('*')
    .in('project_id', ids)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Output[];
}

export interface ContentWithSource extends Output {
  learning_title?: string;
}

/** Semua hasil milik user + judul materi sumbernya. */
export async function listAllContent(): Promise<ContentWithSource[]> {
  const { data, error } = await supabase
    .from('outputs')
    .select('*, projects(title, learning_items(title))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((o) => ({
    ...(o as unknown as Output),
    learning_title: (o['projects'] as { learning_items?: { title?: string } | null } | null)
      ?.learning_items?.title,
  }));
}
