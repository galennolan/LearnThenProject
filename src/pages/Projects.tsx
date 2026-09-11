import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Output, Project, ProjectTask } from '../types';
import { OUTPUT_TYPE_LABELS, PLATFORM_LABELS, PROJECT_TYPE_LABELS } from '../types';
import {
  createOutput,
  createProject,
  createTask,
  deleteOutput,
  deleteProject,
  deleteTask,
  getProject,
  getReview,
  listOutputs,
  listProjects,
  listTasks,
  saveReview,
  updateOutput,
  updateProject,
  updateTask,
} from '../services/projects';
import { getLearningItem, listLearningItems } from '../services/learning';
import { formatJakarta, isValidUrl } from '../lib/time';
import { useToast } from '../hooks/useToast';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  SecondaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from '../components/ui';

const PROJECT_TYPES: Project['project_type'][] = ['experiment', 'application', 'article', 'video', 'research', 'business', 'learning', 'other'];
const STATUSES: Project['status'][] = ['planned', 'active', 'completed', 'paused', 'archived'];

// ---------- LIST ----------
export function ProjectListPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listProjects());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const shown = filter === 'all' ? items : items.filter((p) => p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Project</h1>
          <p className="text-sm text-slate-500">{items.length} project.</p>
        </div>
        <Link to="/project/baru">
          <Button>+ Project</Button>
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-300'}`}
          >
            {s === 'all' ? 'Semua' : s}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState title="Belum ada project" desc="Buat project manual atau dari halaman materi." />
      ) : (
        <div className="grid gap-3">
          {shown.map((p) => (
            <Link key={p.id} to={`/project/${p.id}`}>
              <Card className="transition hover:border-slate-400">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{p.title}</p>
                  <Badge>{p.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {PROJECT_TYPE_LABELS[p.project_type]} • Prioritas: {p.priority}
                  {p.due_date ? ` • Tenggat: ${formatJakarta(p.due_date)}` : ''}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- FORM ----------
export function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_type: 'experiment' as Project['project_type'],
    status: 'planned' as Project['status'],
    priority: 'medium' as Project['priority'],
    start_date: '',
    due_date: '',
    learning_item_id: '',
    is_featured: false,
  });

  useEffect(() => {
    listLearningItems().then((m) => setMaterials(m.map((x) => ({ id: x.id, title: x.title })))).catch(() => {});
    if (!id) return;
    getProject(id)
      .then((p) =>
        setForm({
          title: p.title,
          description: p.description ?? '',
          project_type: p.project_type,
          status: p.status,
          priority: p.priority,
          start_date: p.start_date ? p.start_date.slice(0, 10) : '',
          due_date: p.due_date ? p.due_date.slice(0, 10) : '',
          learning_item_id: p.learning_item_id ?? '',
          is_featured: p.is_featured,
        }),
      )
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat.'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Judul wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        project_type: form.project_type,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        learning_item_id: form.learning_item_id || null,
        is_featured: form.is_featured,
      };
      if (isEdit && id) {
        await updateProject(id, payload);
        push('Project diperbarui.');
        navigate(`/project/${id}`);
      } else {
        const created = await createProject(payload);
        push('Project dibuat.');
        navigate(`/project/${created.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Ubah Project' : 'Project Baru'}</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Judul *">
            <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="cth: Klon UI landing page" />
          </Field>
          <Field label="Deskripsi">
            <TextArea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipe">
              <SelectInput value={form.project_type} onChange={(e) => set('project_type', e.target.value)}>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Prioritas">
              <SelectInput value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </SelectInput>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal mulai">
              <TextInput type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </Field>
            <Field label="Tenggat">
              <TextInput type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
            </Field>
          </div>
          <Field label="Materi sumber (opsional)">
            <SelectInput value={form.learning_item_id} onChange={(e) => set('learning_item_id', e.target.value)}>
              <option value="">— Tanpa materi —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </SelectInput>
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
            Tampilkan di portofolio
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={() => navigate(-1)} className="flex-1">Batal</SecondaryButton>
            <Button type="submit" disabled={busy} className="flex-1">{busy ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ---------- DETAIL ----------
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [sourceTitle, setSourceTitle] = useState('');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const [outForm, setOutForm] = useState({ title: '', output_type: 'code' as Output['output_type'], platform: 'github' as Output['platform'], url: '', description: '', is_primary: false });
  const [outErr, setOutErr] = useState('');
  const [editingOutput, setEditingOutput] = useState<Output | null>(null);

  const [review, setReview] = useState({ what_worked: '', what_failed: '', key_insight: '', next_step: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const p = await getProject(id);
      setProject(p);
      const [t, o, r] = await Promise.all([listTasks(id), listOutputs(id), getReview(id)]);
      setTasks(t);
      setOutputs(o);
      if (r) setReview({ what_worked: r.what_worked ?? '', what_failed: r.what_failed ?? '', key_insight: r.key_insight ?? '', next_step: r.next_step ?? '' });
      if (p.learning_item_id) {
        try {
          const m = await getLearningItem(p.learning_item_id);
          setSourceTitle(m.title);
        } catch {
          setSourceTitle('');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);

  const addTask = async () => {
    if (!id || !taskTitle.trim()) return;
    try {
      const created = await createTask(id, { title: taskTitle.trim(), due_date: taskDue || null });
      setTasks((t) => [...t, created]);
      setTaskTitle('');
      setTaskDue('');
      push('Task ditambahkan.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menambah task.', 'error');
    }
  };

  const cycleTask = async (t: ProjectTask) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
    try {
      const updated = await updateTask(t.id, { status: next });
      setTasks((list) => list.map((x) => (x.id === t.id ? updated : x)));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal memperbarui task.', 'error');
    }
  };

  const removeTask = async (taskId: string) => {
    if (!window.confirm('Hapus task ini?')) return;
    try {
      await deleteTask(taskId);
      setTasks((list) => list.filter((x) => x.id !== taskId));
      push('Task dihapus.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menghapus task.', 'error');
    }
  };

  const submitOutput = async () => {
    if (!id) return;
    setOutErr('');
    if (!outForm.title.trim()) {
      setOutErr('Judul output wajib diisi.');
      return;
    }
    if (!isValidUrl(outForm.url.trim())) {
      setOutErr('URL tidak valid. Gunakan http(s)://...');
      return;
    }
    try {
      if (editingOutput) {
        const updated = await updateOutput(editingOutput.id, id, {
          title: outForm.title.trim(),
          output_type: outForm.output_type,
          platform: outForm.platform,
          url: outForm.url.trim(),
          description: outForm.description.trim() || null,
          is_primary: outForm.is_primary,
        });
        setOutputs((list) => list.map((o) => (o.id === updated.id ? updated : { ...o, is_primary: updated.is_primary ? false : o.is_primary })));
        if (updated.is_primary) {
          const fresh = await listOutputs(id);
          setOutputs(fresh);
        }
        push('Output diperbarui.');
      } else {
        const created = await createOutput(id, {
          title: outForm.title.trim(),
          output_type: outForm.output_type,
          platform: outForm.platform,
          url: outForm.url.trim(),
          description: outForm.description.trim() || null,
          is_primary: outForm.is_primary,
          status: 'draft',
        });
        if (created.is_primary) {
          setOutputs(await listOutputs(id));
        } else {
          setOutputs((list) => [created, ...list]);
        }
        push('Output ditambahkan. Link tersimpan apa adanya (belum diverifikasi otomatis).');
      }
      setOutForm({ title: '', output_type: 'code', platform: 'github', url: '', description: '', is_primary: false });
      setEditingOutput(null);
    } catch (e) {
      setOutErr(e instanceof Error ? e.message : 'Gagal menyimpan output.');
    }
  };

  const removeOutput = async (outputId: string) => {
    if (!window.confirm('Hapus output ini?')) return;
    try {
      await deleteOutput(outputId);
      setOutputs((list) => list.filter((o) => o.id !== outputId));
      push('Output dihapus.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menghapus output.', 'error');
    }
  };

  const saveProjectReview = async () => {
    if (!id) return;
    setReviewMsg('');
    try {
      await saveReview(id, {
        what_worked: review.what_worked.trim() || null,
        what_failed: review.what_failed.trim() || null,
        key_insight: review.key_insight.trim() || null,
        next_step: review.next_step.trim() || null,
      });
      push('Review tersimpan.');
    } catch (e) {
      setReviewMsg(e instanceof Error ? e.message : 'Gagal menyimpan review.');
    }
  };

  const markCompleted = async () => {
    if (!id) return;
    try {
      const updated = await updateProject(id, { status: 'completed' });
      setProject(updated);
      push('Project ditandai selesai.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal memperbarui.', 'error');
    }
  };

  const createFollowUp = async () => {
    if (!id || !project) return;
    try {
      const p = await createProject({
        title: `Lanjutan: ${project.title}`,
        description: review.next_step || project.description,
        project_type: project.project_type,
        status: 'planned',
        priority: project.priority,
        parent_project_id: id,
        learning_item_id: project.learning_item_id,
      });
      push('Project lanjutan dibuat.');
      navigate(`/project/${p.id}`);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal membuat project lanjutan.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      push('Project dihapus.');
      navigate('/project');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menghapus.', 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!project) return <EmptyState title="Project tidak ditemukan" />;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {PROJECT_TYPE_LABELS[project.project_type]} • {project.status} • Prioritas {project.priority}
          </p>
          {project.description && <p className="mt-2 text-sm text-slate-600">{project.description}</p>}
          {project.learning_item_id && (
            <p className="mt-2 text-sm">
              <span className="text-slate-500">Materi sumber: </span>
              <Link to={`/materi/${project.learning_item_id}`} className="font-medium text-slate-900 underline">
                {sourceTitle || 'Lihat materi'}
              </Link>
            </p>
          )}
        </div>
        <Link to={`/project/${project.id}/ubah`}>
          <SecondaryButton>Ubah</SecondaryButton>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Progress task ({doneCount}/{tasks.length})</h2>
          <Badge>{progress}%</Badge>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex gap-2">
          <TextInput value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task baru, cth: Buat kerangka" className="flex-1" />
          <TextInput type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="w-36" />
          <Button onClick={addTask}>Tambah</Button>
        </div>
        <div className="mt-3 space-y-2">
          {tasks.length === 0 && <p className="text-sm text-slate-500">Belum ada task.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5">
              <button
                onClick={() => cycleTask(t)}
                title="Ubah status"
                className={`rounded-md px-2 py-1 text-xs font-medium ${t.status === 'done' ? 'bg-green-100 text-green-700' : t.status === 'doing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {t.status === 'todo' ? 'Todo' : t.status === 'doing' ? 'Doing' : 'Done'}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                {t.due_date && <p className="text-xs text-slate-500">Tenggat: {formatJakarta(t.due_date)}</p>}
              </div>
              <button onClick={() => removeTask(t.id)} className="text-xs font-medium text-red-600 underline">
                Hapus
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Output</h2>
        <p className="mt-1 text-xs text-slate-500">Link hanya disimpan; tidak otomatis diverifikasi.</p>
        <div className="mt-3 space-y-3">
          {outputs.map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{o.title}</p>
                {o.is_primary && <Badge>Utama</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{OUTPUT_TYPE_LABELS[o.output_type]} • {PLATFORM_LABELS[o.platform]}</p>
              <a href={o.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-slate-900 underline">
                {o.url}
              </a>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() => {
                    setEditingOutput(o);
                    setOutForm({ title: o.title, output_type: o.output_type, platform: o.platform, url: o.url, description: o.description ?? '', is_primary: o.is_primary });
                  }}
                  className="text-xs font-medium text-slate-700 underline"
                >
                  Ubah
                </button>
                <button onClick={() => removeOutput(o.id)} className="text-xs font-medium text-red-600 underline">
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {outputs.length === 0 && <p className="text-sm text-slate-500">Belum ada output.</p>}
        </div>
        <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-slate-900">{editingOutput ? 'Ubah output' : 'Tambah output'}</h3>
          <Field label="Judul *">
            <TextInput value={outForm.title} onChange={(e) => setOutForm((f) => ({ ...f, title: e.target.value }))} placeholder="cth: Repo GitHub v1" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipe">
              <SelectInput value={outForm.output_type} onChange={(e) => setOutForm((f) => ({ ...f, output_type: e.target.value as Output['output_type'] }))}>
                {(Object.keys(OUTPUT_TYPE_LABELS) as Output['output_type'][]).map((t) => (
                  <option key={t} value={t}>{OUTPUT_TYPE_LABELS[t]}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Platform">
              <SelectInput value={outForm.platform} onChange={(e) => setOutForm((f) => ({ ...f, platform: e.target.value as Output['platform'] }))}>
                {(Object.keys(PLATFORM_LABELS) as Output['platform'][]).map((t) => (
                  <option key={t} value={t}>{PLATFORM_LABELS[t]}</option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="URL *">
            <TextInput value={outForm.url} onChange={(e) => setOutForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." inputMode="url" />
          </Field>
          <Field label="Deskripsi">
            <TextArea rows={2} value={outForm.description} onChange={(e) => setOutForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={outForm.is_primary} onChange={(e) => setOutForm((f) => ({ ...f, is_primary: e.target.checked }))} />
            Jadikan output utama (menggantikan yang lama)
          </label>
          {outErr && <p className="text-sm text-red-600">{outErr}</p>}
          <div className="flex gap-2">
            {editingOutput && (
              <SecondaryButton onClick={() => { setEditingOutput(null); setOutForm({ title: '', output_type: 'code', platform: 'github', url: '', description: '', is_primary: false }); }} className="flex-1">
                Batal
              </SecondaryButton>
            )}
            <Button onClick={submitOutput} className="flex-1">{editingOutput ? 'Simpan perubahan' : 'Tambah output'}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Review project</h2>
        <div className="mt-3 grid gap-3">
          <Field label="Apa yang berhasil?">
            <TextArea rows={2} value={review.what_worked} onChange={(e) => setReview((r) => ({ ...r, what_worked: e.target.value }))} />
          </Field>
          <Field label="Apa yang gagal?">
            <TextArea rows={2} value={review.what_failed} onChange={(e) => setReview((r) => ({ ...r, what_failed: e.target.value }))} />
          </Field>
          <Field label="Insight kunci">
            <TextArea rows={2} value={review.key_insight} onChange={(e) => setReview((r) => ({ ...r, key_insight: e.target.value }))} />
          </Field>
          <Field label="Langkah berikutnya">
            <TextArea rows={2} value={review.next_step} onChange={(e) => setReview((r) => ({ ...r, next_step: e.target.value }))} />
          </Field>
          {reviewMsg && <p className="text-sm text-red-600">{reviewMsg}</p>}
          <Button onClick={saveProjectReview}>Simpan review</Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SecondaryButton onClick={markCompleted} className="flex-1">Tandai project selesai</SecondaryButton>
            <SecondaryButton onClick={createFollowUp} className="flex-1">Buat project lanjutan</SecondaryButton>
            {project.learning_item_id && (
              <Link to={`/materi/${project.learning_item_id}`} className="flex-1">
                <SecondaryButton className="w-full">Kembali ke materi</SecondaryButton>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-600 underline">
        Hapus project ini
      </button>
      {confirmDelete && (
        <ConfirmDialog
          title="Hapus project?"
          message="Project, task, output, dan review akan ikut terhapus. Lanjutkan?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}
    </div>
  );
}
