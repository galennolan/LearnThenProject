import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { LearningItem, Output, SourceType } from '../types';
import { PLATFORM_LABELS, SOURCE_TYPE_LABELS } from '../types';
import { createLearningItem, deleteLearningItem, getLearningItem, getLearningNote, listContentForLearning, listLearningItems, markLearned, produceContentFromLearning, saveLearningNote, updateLearningItem } from '../services/learning';
import { createProject } from '../services/projects';
import { isValidUrl } from '../lib/time';
import { useToast } from '../hooks/useToast';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Loading, SecondaryButton, SelectInput, TextArea, TextInput } from '../components/ui';

const SOURCE_TYPES: SourceType[] = ['article', 'news', 'journal', 'youtube', 'documentation', 'book', 'google_doc', 'other'];

export function LearningListPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listLearningItems());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat materi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Materi Belajar</h1>
          <p className="text-sm text-slate-500">{items.length} materi tersimpan.</p>
        </div>
        <Link to="/materi/baru">
          <Button>+ Materi</Button>
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Belum ada materi" desc="Klik + Materi untuk menambahkan bacaan, video, atau dokumentasi." />
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <Link key={m.id} to={`/materi/${m.id}`}>
              <Card className="transition hover:border-slate-400">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{m.title}</p>
                  <Badge>{m.status === 'learned' ? 'Selesai' : m.status === 'learning' ? 'Diproses' : 'Baru'}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {SOURCE_TYPE_LABELS[m.source_type]}
                  {m.topic ? ` • ${m.topic}` : ''}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function LearningFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    source_url: '',
    source_type: 'article' as SourceType,
    description: '',
    topic: '',
    learning_goal: '',
    status: 'new' as LearningItem['status'],
  });

  useEffect(() => {
    if (!id) return;
    getLearningItem(id)
      .then((m) =>
        setForm({
          title: m.title,
          source_url: m.source_url ?? '',
          source_type: m.source_type,
          description: m.description ?? '',
          topic: m.topic ?? '',
          learning_goal: m.learning_goal ?? '',
          status: m.status,
        }),
      )
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat.'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Judul wajib diisi.');
      return;
    }
    if (form.source_url.trim() && !isValidUrl(form.source_url.trim())) {
      setError('URL sumber tidak valid. Gunakan http(s)://...');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        source_url: form.source_url.trim() || null,
        source_type: form.source_type,
        description: form.description.trim() || null,
        topic: form.topic.trim() || null,
        learning_goal: form.learning_goal.trim() || null,
        status: form.status,
      };
      if (isEdit && id) {
        await updateLearningItem(id, payload);
        push('Materi diperbarui.');
        navigate(`/materi/${id}`);
      } else {
        const created = await createLearningItem(payload);
        push('Materi ditambahkan.');
        navigate(`/materi/${created.id}`);
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
      <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Ubah Materi' : 'Materi Baru'}</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Judul *">
            <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="cth: Memahami React Query" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jenis sumber">
              <SelectInput value={form.source_type} onChange={(e) => set('source_type', e.target.value)}>
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="new">Baru</option>
                <option value="learning">Diproses</option>
                <option value="learned">Selesai dipelajari</option>
              </SelectInput>
            </Field>
          </div>
          <Field label="URL sumber" hint="Opsional, harus diawali http(s)://">
            <TextInput value={form.source_url} onChange={(e) => set('source_url', e.target.value)} placeholder="https://..." inputMode="url" />
          </Field>
          <Field label="Topik">
            <TextInput value={form.topic} onChange={(e) => set('topic', e.target.value)} placeholder="cth: Frontend" />
          </Field>
          <Field label="Deskripsi">
            <TextArea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ringkasan singkat materi..." />
          </Field>
          <Field label="Tujuan belajar">
            <TextArea rows={2} value={form.learning_goal} onChange={(e) => set('learning_goal', e.target.value)} placeholder="cth: Bisa menjelaskan caching ke orang lain" />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={() => navigate(-1)} className="flex-1">
              Batal
            </SecondaryButton>
            <Button type="submit" disabled={busy} className="flex-1">
              {busy ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function LearningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [item, setItem] = useState<LearningItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [understanding, setUnderstanding] = useState('');
  const [criticalComment, setCriticalComment] = useState('');
  const [questions, setQuestions] = useState('');
  const [ideas, setIdeas] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');
  const [hasNote, setHasNote] = useState(false);

  const [contents, setContents] = useState<Output[]>([]);
  const [cTitle, setCTitle] = useState('');
  const [cPlatform, setCPlatform] = useState<Output['platform']>('news');
  const [cUrl, setCUrl] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cPrimary, setCPrimary] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [contentMsg, setContentMsg] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const m = await getLearningItem(id);
      setItem(m);
      const note = await getLearningNote(id);
      if (note) {
        setHasNote(true);
        setUnderstanding(note.understanding);
        setCriticalComment(note.critical_comment ?? '');
        setQuestions(note.questions ?? '');
        setIdeas(note.ideas ?? '');
      }
      setContents(await listContentForLearning(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat materi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveNote = async () => {
    if (!id) return;
    setNoteMsg('');
    if (understanding.trim().length < 100) {
      setNoteMsg(`Pemahaman masih ${understanding.trim().length} karakter, minimal 100 karakter.`);
      return;
    }
    setSavingNote(true);
    try {
      await saveLearningNote(id, {
        understanding: understanding.trim(),
        critical_comment: criticalComment.trim() || null,
        questions: questions.trim() || null,
        ideas: ideas.trim() || null,
      });
      push('Refleksi tersimpan.');
      setHasNote(true);
    } catch (e) {
      setNoteMsg(e instanceof Error ? e.message : 'Gagal menyimpan refleksi.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleMarkLearned = async () => {
    if (!id) return;
    try {
      const updated = await markLearned(id);
      setItem(updated);
      push('Materi ditandai sudah dipelajari.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal memperbarui.', 'error');
    }
  };

  const handleCreateProject = async () => {
    if (!id || !item) return;
    try {
      const p = await createProject({
        title: `Output: ${item.title}`,
        description: item.learning_goal,
        project_type: 'learning',
        status: 'planned',
        priority: 'medium',
        learning_item_id: id,
      });
      push('Project dibuat dari materi.');
      navigate(`/project/${p.id}`);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal membuat project.', 'error');
    }
  };

  const handleProduceContent = async () => {
    if (!id) return;
    setContentMsg('');
    if (!cTitle.trim()) {
      setContentMsg('Judul konten wajib diisi.');
      return;
    }
    if (!isValidUrl(cUrl.trim())) {
      setContentMsg('URL konten tidak valid. Gunakan http(s)://...');
      return;
    }
    setSavingContent(true);
    try {
      const created = await produceContentFromLearning(id, {
        title: cTitle.trim(),
        platform: cPlatform,
        url: cUrl.trim(),
        description: cDesc.trim() || null,
        is_primary: cPrimary,
      });
      if (created.is_primary) {
        setContents(await listContentForLearning(id));
      } else {
        setContents((list) => [created, ...list]);
      }
      setCTitle('');
      setCUrl('');
      setCDesc('');
      setCPrimary(false);
      push('Konten tersimpan. Link dicatat apa adanya (belum diverifikasi otomatis).');
    } catch (e) {
      setContentMsg(e instanceof Error ? e.message : 'Gagal menyimpan konten.');
    } finally {
      setSavingContent(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteLearningItem(id);
      push('Materi dihapus.');
      navigate('/materi');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menghapus.', 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!item) return <EmptyState title="Materi tidak ditemukan" />;

  const isLearned = item.status === 'learned';
  const hasContent = contents.length > 0;
  const steps = [
    { label: 'Materi', done: true },
    { label: 'Catatan', done: hasNote },
    { label: 'Komplet', done: isLearned },
    { label: 'Konten', done: hasContent },
  ];
  const progressPercent = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{item.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {SOURCE_TYPE_LABELS[item.source_type]}
            {item.topic ? ` • ${item.topic}` : ''} • Status: {item.status}
          </p>
        </div>
        <Link to={`/materi/${item.id}/ubah`}>
          <SecondaryButton>Ubah</SecondaryButton>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Progress belajar</h2>
          <Badge>{progressPercent}%</Badge>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {steps.map((s) => (
            <div key={s.label} className={`rounded-lg px-2 py-2 text-center text-xs font-medium ${s.done ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {s.done ? '✓ ' : ''}{s.label}
            </div>
          ))}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-slate-900 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </Card>

      <Card>
        <dl className="space-y-2 text-sm">
          {item.source_url && (
            <div>
              <dt className="font-medium text-slate-700">URL sumber</dt>
              <dd>
                <a href={item.source_url} target="_blank" rel="noreferrer" className="break-all text-slate-900 underline">
                  {item.source_url}
                </a>
              </dd>
            </div>
          )}
          {item.description && (
            <div>
              <dt className="font-medium text-slate-700">Deskripsi</dt>
              <dd className="text-slate-600">{item.description}</dd>
            </div>
          )}
          {item.learning_goal && (
            <div>
              <dt className="font-medium text-slate-700">Tujuan belajar</dt>
              <dd className="text-slate-600">{item.learning_goal}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <SecondaryButton onClick={handleMarkLearned} className="flex-1">
            Tandai sudah dipelajari
          </SecondaryButton>
          <Button onClick={handleCreateProject} className="flex-1">
            Buat project dari materi
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Refleksi</h2>
        <div className="mt-3 space-y-4">
          <Field label="Pemahaman * (min. 100 karakter)" hint={`${understanding.trim().length}/100 karakter`}>
            <TextArea rows={6} value={understanding} onChange={(e) => setUnderstanding(e.target.value)} placeholder="Tulis ulang dengan bahasamu sendiri: apa inti materi ini?" />
          </Field>
          <Field label="Komentar kritis (opsional)">
            <TextArea rows={3} value={criticalComment} onChange={(e) => setCriticalComment(e.target.value)} placeholder="Apa yang kurang meyakinkan / bias / perlu diuji?" />
          </Field>
          <Field label="Pertanyaan (opsional)">
            <TextArea rows={2} value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Apa yang masih membingungkan?" />
          </Field>
          <Field label="Ide penerapan (opsional)">
            <TextArea rows={2} value={ideas} onChange={(e) => setIdeas(e.target.value)} placeholder="Ide project / eksperimen dari materi ini..." />
          </Field>
          {noteMsg && <p className="text-sm text-red-600">{noteMsg}</p>}
          <Button onClick={handleSaveNote} disabled={savingNote} className="w-full">
            {savingNote ? 'Menyimpan...' : 'Simpan refleksi'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Produksi Konten</h2>
        {!isLearned ? (
          <p className="mt-1 text-xs text-slate-500">
            Selesaikan belajar dulu (tombol <em>Tandai sudah dipelajari</em> di atas), lalu ubah pemahamanmu jadi konten: berita, Instagram, YouTube, atau lainnya.
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Belajar komplet — saatnya produksi. Pilih platform, tempel link karyamu.
          </p>
        )}

        {contents.length > 0 && (
          <div className="mt-3 space-y-2">
            {contents.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{PLATFORM_LABELS[c.platform]}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {c.is_primary && <Badge>Utama</Badge>}
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-700 underline">
                    Buka
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
          <div className="grid grid-cols-3 gap-2">
            {(['news', 'instagram', 'youtube', 'tiktok', 'blog', 'linkedin'] as Output['platform'][]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCPlatform(p)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium ${cPlatform === p ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-600'}`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Platform">
              <SelectInput value={cPlatform} onChange={(e) => setCPlatform(e.target.value as Output['platform'])}>
                {(Object.keys(PLATFORM_LABELS) as Output['platform'][]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Judul konten *">
              <TextInput value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="cth: Utas ringkasanku" />
            </Field>
          </div>
          <Field label="Link konten *">
            <TextInput value={cUrl} onChange={(e) => setCUrl(e.target.value)} placeholder="https://..." inputMode="url" />
          </Field>
          <Field label="Catatan (opsional)">
            <TextArea rows={2} value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Konteks singkat konten ini..." />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={cPrimary} onChange={(e) => setCPrimary(e.target.checked)} />
            Jadikan konten utama
          </label>
          {contentMsg && <p className="text-sm text-red-600">{contentMsg}</p>}
          <Button onClick={handleProduceContent} disabled={savingContent} className="w-full">
            {savingContent ? 'Menyimpan...' : 'Simpan konten'}
          </Button>
        </div>
      </Card>

      <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-600 underline">
        Hapus materi ini
      </button>
      {confirmDelete && (
        <ConfirmDialog
          title="Hapus materi?"
          message="Materi, refleksi, dan relasinya akan ikut terhapus. Lanjutkan?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}
    </div>
  );
}
