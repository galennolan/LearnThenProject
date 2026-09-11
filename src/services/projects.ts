import { supabase } from '../lib/supabaseClient';
import type { Output, Project, ProjectReview, ProjectTask } from '../types';

export interface ProjectInput {
  title: string;
  description?: string | null;
  project_type: Project['project_type'];
  status?: Project['status'];
  priority?: Project['priority'];
  start_date?: string | null;
  due_date?: string | null;
  learning_item_id?: string | null;
  parent_project_id?: string | null;
  is_featured?: boolean;
}

export async function listProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Project[];
}

export async function getProject(id: string) {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function createProject(input: ProjectInput) {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...input, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const { data, error } = await supabase.from('projects').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Tasks ----
export async function listTasks(projectId: string) {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return data as ProjectTask[];
}

export async function createTask(projectId: string, input: { title: string; description?: string | null; due_date?: string | null }) {
  const { data: auth } = await supabase.auth.getUser();
  const existing = await listTasks(projectId);
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      ...input,
      project_id: projectId,
      user_id: auth.user!.id,
      status: 'todo',
      position: existing.length,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectTask;
}

export async function updateTask(id: string, input: Partial<{ title: string; description: string | null; status: ProjectTask['status']; due_date: string | null; position: number }>) {
  const { data, error } = await supabase.from('project_tasks').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as ProjectTask;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('project_tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Outputs ----
export async function listOutputs(projectId: string) {
  const { data, error } = await supabase.from('outputs').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Output[];
}

export async function createOutput(
  projectId: string,
  input: { title: string; output_type: Output['output_type']; platform: Output['platform']; url: string; description?: string | null; is_primary?: boolean; status?: string; published_at?: string | null },
) {
  const { data: auth } = await supabase.auth.getUser();
  if (input.is_primary) {
    await supabase.from('outputs').update({ is_primary: false }).eq('project_id', projectId);
  }
  const { data, error } = await supabase
    .from('outputs')
    .insert({ ...input, project_id: projectId, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Output;
}

export async function updateOutput(id: string, projectId: string, input: Partial<{ title: string; output_type: Output['output_type']; platform: Output['platform']; url: string; description: string | null; is_primary: boolean; status: string; published_at: string | null }>) {
  if (input.is_primary) {
    await supabase.from('outputs').update({ is_primary: false }).eq('project_id', projectId);
  }
  const { data, error } = await supabase.from('outputs').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as Output;
}

export async function deleteOutput(id: string) {
  const { error } = await supabase.from('outputs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Review ----
export async function getReview(projectId: string) {
  const { data, error } = await supabase.from('project_reviews').select('*').eq('project_id', projectId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as ProjectReview | null;
}

export async function saveReview(
  projectId: string,
  input: { what_worked?: string | null; what_failed?: string | null; key_insight?: string | null; next_step?: string | null },
) {
  const { data: auth } = await supabase.auth.getUser();
  const existing = await getReview(projectId);
  if (existing) {
    const { data, error } = await supabase.from('project_reviews').update(input).eq('id', existing.id).select().single();
    if (error) throw new Error(error.message);
    return data as ProjectReview;
  }
  const { data, error } = await supabase
    .from('project_reviews')
    .insert({ ...input, project_id: projectId, user_id: auth.user!.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProjectReview;
}
