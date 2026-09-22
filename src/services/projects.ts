import { supabase } from '../lib/supabaseClient';
import type { Output, Project } from '../types';

// Mesin konten di balik layar: project dibuat otomatis dari materi,
// user hanya berinteraksi dengan materi → catatan → hasil.

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
