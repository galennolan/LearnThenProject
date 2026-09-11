import { supabase } from '../lib/supabaseClient';

export interface DashboardStats {
  totalMateri: number;
  projectAktif: number;
  projectSelesai: number;
  totalOutput: number;
  todoTasks: { id: string; title: string; project_id: string; project_title?: string; due_date: string | null }[];
  recentActiveProjects: { id: string; title: string; status: string }[];
  materiTanpaRefleksi: { id: string; title: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [items, projects, outputs, tasks, notes] = await Promise.all([
    supabase.from('learning_items').select('id,title,status'),
    supabase.from('projects').select('id,title,status,created_at').order('created_at', { ascending: false }),
    supabase.from('outputs').select('id'),
    supabase.from('project_tasks').select('id,title,project_id,due_date,status,projects(title)').neq('status', 'done').order('created_at', { ascending: false }).limit(10),
    supabase.from('learning_notes').select('learning_item_id'),
  ]);

  if (items.error) throw new Error(items.error.message);
  if (projects.error) throw new Error(projects.error.message);
  if (outputs.error) throw new Error(outputs.error.message);
  if (tasks.error) throw new Error(tasks.error.message);
  if (notes.error) throw new Error(notes.error.message);

  const notedIds = new Set((notes.data ?? []).map((n: { learning_item_id: string }) => n.learning_item_id));
  const materiTanpaRefleksi = (items.data ?? [])
    .filter((m: { id: string }) => !notedIds.has(m.id))
    .slice(0, 5);

  const allProjects = projects.data ?? [];
  return {
    totalMateri: items.data?.length ?? 0,
    projectAktif: allProjects.filter((p: { status: string }) => p.status === 'active').length,
    projectSelesai: allProjects.filter((p: { status: string }) => p.status === 'completed').length,
    totalOutput: outputs.data?.length ?? 0,
    todoTasks: (tasks.data ?? []).map((t: Record<string, unknown>) => ({
      id: t['id'] as string,
      title: t['title'] as string,
      project_id: t['project_id'] as string,
      project_title: (t['projects'] as { title?: string } | null)?.title,
      due_date: (t['due_date'] as string | null) ?? null,
    })),
    recentActiveProjects: allProjects.filter((p: { status: string }) => p.status === 'active').slice(0, 5),
    materiTanpaRefleksi,
  };
}
