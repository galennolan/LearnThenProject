import { supabase } from '../lib/supabaseClient';
import type { LearningItem, LearningNote, LearningStatus } from '../types';

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
