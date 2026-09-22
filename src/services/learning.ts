import { supabase } from '../lib/supabaseClient';
import type { LearningItem, LearningNote, LearningStatus, Output, Project, ProjectReview } from '../types';
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
  target_date?: string | null;
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

export async function listLearningNotes(learningItemId: string): Promise<LearningNote[]> {
  const { data, error } = await supabase
    .from('learning_notes')
    .select('*')
    .eq('learning_item_id', learningItemId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as LearningNote[];
}

export async function getLearningNote(learningItemId: string) {
  const { data, error } = await supabase
    .from('learning_notes')
    .select('*')
    .eq('learning_item_id', learningItemId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as LearningNote | null;
}

export async function createLearningNote(
  learningItemId: string,
  input: { understanding: string; critical_comment?: string | null; questions?: string | null; ideas?: string | null },
): Promise<LearningNote> {
  if (input.understanding.trim().length < 100) {
    throw new Error('Pemahaman minimal 100 karakter.');
  }
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('learning_notes')
    .insert({ ...input, learning_item_id: learningItemId, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LearningNote;
}

export async function updateLearningNote(
  noteId: string,
  input: { understanding: string; critical_comment?: string | null; questions?: string | null; ideas?: string | null },
): Promise<LearningNote> {
  if (input.understanding.trim().length < 100) {
    throw new Error('Pemahaman minimal 100 karakter.');
  }
  const { data, error } = await supabase
    .from('learning_notes')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LearningNote;
}

export async function deleteLearningNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('learning_notes').delete().eq('id', noteId);
  if (error) throw new Error(error.message);
}

export async function saveLearningNote(
  learningItemId: string,
  input: { understanding: string; critical_comment?: string | null; questions?: string | null; ideas?: string | null },
) {
  return createLearningNote(learningItemId, input);
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
  hasReview: boolean;
  percent: number;
  nextAction: string;
}

function buildFocus(
  item: LearningItem,
  notedIds: Set<string>,
  projectIdsByLearning: Map<string, string[]>,
  outputCountByProject: Map<string, number>,
  reviewedProjectIds: Set<string>,
): LearningFocus {
  const hasReflection = notedIds.has(item.id);
  const isLearned = item.status === 'learned';
  const projectIds = projectIdsByLearning.get(item.id) ?? [];
  const outputCount = projectIds.reduce((n, pid) => n + (outputCountByProject.get(pid) ?? 0), 0);
  const hasReview = projectIds.some((pid) => reviewedProjectIds.has(pid));
  const steps = [true, hasReflection, isLearned, outputCount > 0, hasReview];
  const percent = Math.round((steps.filter(Boolean).length / steps.length) * 100);
  const nextAction = !hasReflection
    ? 'Tulis catatan & refleksi'
    : !isLearned
      ? 'Tandai belajar selesai'
      : outputCount === 0
        ? 'Produksi karya/konten pertama'
        : !hasReview
          ? 'Tulis evaluasi & review hasil'
          : 'Siklus tuntas — lanjut materi berikutnya';
  return { item, hasReflection, isLearned, outputCount, hasReview, percent, nextAction };
}

export async function listLearningFocus(): Promise<LearningFocus[]> {
  const [itemsRes, notesRes, projectsRes, outputsRes, reviewsRes] = await Promise.all([
    supabase.from('learning_items').select('*').order('created_at', { ascending: false }),
    supabase.from('learning_notes').select('learning_item_id'),
    supabase.from('projects').select('id,learning_item_id'),
    supabase.from('outputs').select('id,project_id'),
    supabase.from('project_reviews').select('project_id'),
  ]);
  if (itemsRes.error) throw new Error(itemsRes.error.message);
  if (notesRes.error) throw new Error(notesRes.error.message);
  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (outputsRes.error) throw new Error(outputsRes.error.message);
  if (reviewsRes.error) throw new Error(reviewsRes.error.message);

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
  const reviewedProjectIds = new Set(
    (reviewsRes.data ?? []).map((r: { project_id: string }) => r.project_id),
  );
  return ((itemsRes.data ?? []) as LearningItem[]).map((item) =>
    buildFocus(item, notedIds, projectIdsByLearning, outputCountByProject, reviewedProjectIds),
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
  if (platform === 'youtube') return 'video';
  if (platform === 'blog') return 'article';
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
    output_type: input.platform === 'youtube' ? 'video' : 'document',
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

export async function getProjectForLearning(learningItemId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('learning_item_id', learningItemId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as Project | null;
}

export async function getReviewForLearning(learningItemId: string): Promise<ProjectReview | null> {
  const project = await getProjectForLearning(learningItemId);
  if (!project) return null;
  const { data, error } = await supabase
    .from('project_reviews')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as ProjectReview | null;
}

export async function saveReviewForLearning(
  learningItemId: string,
  input: { what_worked?: string | null; what_failed?: string | null; key_insight?: string | null; next_step?: string | null },
): Promise<ProjectReview> {
  const { data: auth } = await supabase.auth.getUser();
  let project = await getProjectForLearning(learningItemId);
  if (!project) {
    const item = await getLearningItem(learningItemId);
    project = await createProject({
      title: `Proyek: ${item.title}`,
      description: item.learning_goal,
      project_type: 'other',
      status: 'active',
      priority: 'medium',
      learning_item_id: learningItemId,
    });
  }
  const existing = await getReviewForLearning(learningItemId);
  if (existing) {
    const { data, error } = await supabase
      .from('project_reviews')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ProjectReview;
  }
  const { data, error } = await supabase
    .from('project_reviews')
    .insert({ ...input, project_id: project.id, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectReview;
}

export interface ContentWithSource extends Output {
  learning_title?: string;
  learning_item_id?: string;
  key_insight?: string | null;
  next_step?: string | null;
}

/** Semua hasil milik user + judul materi sumbernya + insight review jika ada. */
export async function listAllContent(): Promise<ContentWithSource[]> {
  const { data, error } = await supabase
    .from('outputs')
    .select('*, projects(title, learning_item_id, learning_items(title), project_reviews(key_insight, next_step))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((o) => {
    const project = o['projects'] as
      | {
          title?: string;
          learning_item_id?: string;
          learning_items?: { title?: string } | null;
          project_reviews?:
            | { key_insight?: string | null; next_step?: string | null }
            | { key_insight?: string | null; next_step?: string | null }[]
            | null;
        }
      | null
      | undefined;
    const reviews = project?.project_reviews;
    const review = Array.isArray(reviews) ? reviews[0] : reviews;
    return {
      ...(o as unknown as Output),
      learning_title: project?.learning_items?.title,
      learning_item_id: project?.learning_item_id,
      key_insight: review?.key_insight ?? null,
      next_step: review?.next_step ?? null,
    };
  });
}

// ---------- Jejak aktivitas (heatmap ala GitHub) ----------
export interface ActivityDay {
  date: string; // YYYY-MM-DD (Asia/Jakarta)
  count: number;
  materi: number;
  catatan: number;
  konten: number;
}

export interface ActivitySummary {
  days: ActivityDay[];
  total: number;
  activeDays: number;
  streak: number;
  materi: number;
  catatan: number;
  konten: number;
}

function jakartaDayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

/** Aktivitas harian dari materi + catatan + konten, diratakan ke hari Senin. */
export async function getActivity(weeks = 16): Promise<ActivitySummary> {
  const [itemsRes, notesRes, outputsRes] = await Promise.all([
    supabase.from('learning_items').select('created_at'),
    supabase.from('learning_notes').select('created_at'),
    supabase.from('outputs').select('created_at'),
  ]);
  if (itemsRes.error) throw new Error(itemsRes.error.message);
  if (notesRes.error) throw new Error(notesRes.error.message);
  if (outputsRes.error) throw new Error(outputsRes.error.message);

  const items = (itemsRes.data ?? []) as { created_at: string }[];
  const notes = (notesRes.data ?? []) as { created_at: string }[];
  const outputs = (outputsRes.data ?? []) as { created_at: string }[];

  const counts = new Map<string, { m: number; c: number; k: number }>();
  const bump = (iso: string, kind: 'm' | 'c' | 'k') => {
    const key = jakartaDayKey(iso);
    const cur = counts.get(key) ?? { m: 0, c: 0, k: 0 };
    cur[kind]++;
    counts.set(key, cur);
  };
  items.forEach((r) => bump(r.created_at, 'm'));
  notes.forEach((r) => bump(r.created_at, 'c'));
  outputs.forEach((r) => bump(r.created_at, 'k'));

  const todayKey = jakartaDayKey(new Date().toISOString());
  const start = new Date(`${todayKey}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7)); // mundur ke Senin

  const days: ActivityDay[] = [];
  const cursor = new Date(start);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    const b = counts.get(key) ?? { m: 0, c: 0, k: 0 };
    days.push({ date: key, count: b.m + b.c + b.k, materi: b.m, catatan: b.c, konten: b.k });
    if (key >= todayKey) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else break;
  }

  const sum = (f: (d: ActivityDay) => number) => days.reduce((n, d) => n + f(d), 0);
  return {
    days,
    total: sum((d) => d.count),
    activeDays: days.filter((d) => d.count > 0).length,
    streak,
    materi: sum((d) => d.materi),
    catatan: sum((d) => d.catatan),
    konten: sum((d) => d.konten),
  };
}

