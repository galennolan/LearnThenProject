import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { LearningItem, LearningNote, Output, OutputPlatform, ProjectReview, SketchSnapshot, SourceType } from '../types';
import { PLATFORM_LABELS, SOURCE_TYPE_LABELS } from '../types';
import {
  createLearningItem,
  createLearningNote,
  deleteLearningItem,
  getLearningItem,
  getReviewForLearning,
  listContentForLearning,
  listLearningNotes,
  markLearned,
  produceContentFromLearning,
  saveReviewForLearning,
  getSketch,
  saveSketch,
  updateLearningItem,
} from '../services/learning';
import { isValidUrl } from '../lib/time';
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

const SOURCE_TYPES: SourceType[] = ['article', 'news', 'journal', 'youtube', 'documentation', 'book', 'google_doc', 'other'];

const SketchEditor = lazy(() => import('../components/SketchEditor'));

export function LearningFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: searchParams.get('title') ?? '',
    source_url: searchParams.get('source_url') ?? '',
    source_type: (searchParams.get('source_type') as SourceType) || 'article',
    description: searchParams.get('description') ?? '',
    topic: searchParams.get('topic') ?? '',
    learning_goal: searchParams.get('goal') ?? '',
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Ubah Materi' : 'Materi Baru'}</h1>
        {searchParams.get('from_cycle') && (
          <Badge>Materi Lanjutan</Badge>
        )}
      </div>
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
          <Field label="Deskripsi ringkas">
            <TextArea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ringkasan singkat materi..." />
          </Field>
          <Field label="Tujuan belajar / Target output">
            <TextArea rows={2} value={form.learning_goal} onChange={(e) => set('learning_goal', e.target.value)} placeholder="cth: Membuat prototipe mini project dan artikel ringkasan" />
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

function buildNoteText(n: import('../types').LearningNote): string {
  const parts = [`[Pemahaman]\n${n.understanding}`];
  if (n.critical_comment) parts.push(`[Komentar Kritis]\n${n.critical_comment}`);
  if (n.ideas) parts.push(`[Ide Proyek]\n${n.ideas}`);
  if (n.questions) parts.push(`[Pertanyaan Terbuka]\n${n.questions}`);
  return parts.join('\n\n');
}

function NoteCard({ note: n, index: idx }: { note: import('../types').LearningNote; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildNoteText(n)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">Catatan {idx + 1}</p>
        <button
          type="button"
          onClick={handleCopy}
          className={`rounded px-2 py-0.5 text-xs font-medium transition ${
            copied ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          {copied ? '✓ Disalin!' : 'Salin'}
        </button>
      </div>
      <p className="text-slate-800 whitespace-pre-wrap">{n.understanding}</p>
      {n.critical_comment && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-500">Komentar Kritis:</p>
          <p className="text-slate-700 whitespace-pre-wrap">{n.critical_comment}</p>
        </div>
      )}
      {n.ideas && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-500">Ide Proyek:</p>
          <p className="text-slate-700 whitespace-pre-wrap">{n.ideas}</p>
        </div>
      )}
      {n.questions && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-500">Pertanyaan Terbuka:</p>
          <p className="text-slate-700 whitespace-pre-wrap">{n.questions}</p>
        </div>
      )}
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

  // Catatan & Refleksi (multiple notes)
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [note, setNote] = useState('');
  const [criticalComment, setCriticalComment] = useState('');
  const [ideas, setIdeas] = useState('');
  const [questions, setQuestions] = useState('');
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [showAdvancedReflection, setShowAdvancedReflection] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');

  // Coretan papan tulis (tldraw)
  const [noteTab, setNoteTab] = useState<'tulis' | 'coret'>('tulis');
  const [sketch, setSketch] = useState<SketchSnapshot | null>(null);
  const [hasSketch, setHasSketch] = useState(false);
  const [savingSketch, setSavingSketch] = useState(false);
  const [sketchMsg, setSketchMsg] = useState('');

  // Hasil karya / Output
  const [contents, setContents] = useState<Output[]>([]);
  const [cTitle, setCTitle] = useState('');
  const [cPlatform, setCPlatform] = useState<OutputPlatform>('github');
  const [cUrl, setCUrl] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [contentMsg, setContentMsg] = useState('');

  // Review & Evaluasi
  const [review, setReview] = useState<ProjectReview | null>(null);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatFailed, setWhatFailed] = useState('');
  const [keyInsight, setKeyInsight] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const m = await getLearningItem(id);
      setItem(m);
      const existingNotes = await listLearningNotes(id);
      setNotes(existingNotes);
      const existingSketch = await getSketch(id);
      if (existingSketch) {
        setSketch(existingSketch.snapshot);
        setHasSketch(true);
      } else {
        setSketch(null);
        setHasSketch(false);
      }
      setContents(await listContentForLearning(id));
      const rev = await getReviewForLearning(id);
      if (rev) {
        setReview(rev);
        setWhatWorked(rev.what_worked ?? '');
        setWhatFailed(rev.what_failed ?? '');
        setKeyInsight(rev.key_insight ?? '');
        setNextStep(rev.next_step ?? '');
        if (rev.what_worked || rev.what_failed) setShowReviewDetail(true);
      }
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
    if (note.trim().length < 100) {
      setNoteMsg(`Pemahaman masih ${note.trim().length} karakter, minimal 100 karakter.`);
      return;
    }
    setSavingNote(true);
    try {
      const created = await createLearningNote(id, {
        understanding: note.trim(),
        critical_comment: criticalComment.trim() || null,
        ideas: ideas.trim() || null,
        questions: questions.trim() || null,
      });
      setNotes((prev) => [...prev, created]);
      push('Catatan tersimpan.');
      // Reset form
      setNote('');
      setCriticalComment('');
      setIdeas('');
      setQuestions('');
      setShowAdvancedReflection(false);
      setShowNewNoteForm(false);
    } catch (e) {
      setNoteMsg(e instanceof Error ? e.message : 'Gagal menyimpan catatan.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveSketch = async (snapshot: SketchSnapshot) => {
    if (!id) return;
    setSketchMsg('');
    setSavingSketch(true);
    try {
      const saved = await saveSketch(id, snapshot);
      setSketch(saved.snapshot);
      setHasSketch(true);
      push('Coretan tersimpan.');
    } catch (e) {
      setSketchMsg(e instanceof Error ? e.message : 'Gagal menyimpan coretan.');
    } finally {
      setSavingSketch(false);
    }
  };

  const handleMarkLearned = async () => {
    if (!id) return;
    try {
      const updated = await markLearned(id);
      setItem(updated);
      push('Materi ditandai selesai dipelajari.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal memperbarui.', 'error');
    }
  };

  const handleProduceContent = async () => {
    if (!id) return;
    setContentMsg('');
    if (!cTitle.trim()) {
      setContentMsg('Judul karya/konten wajib diisi.');
      return;
    }
    if (!isValidUrl(cUrl.trim())) {
      setContentMsg('URL tidak valid. Gunakan http(s)://...');
      return;
    }
    setSavingContent(true);
    try {
      const created = await produceContentFromLearning(id, {
        title: cTitle.trim(),
        platform: cPlatform,
        url: cUrl.trim(),
        description: null,
        is_primary: contents.length === 0,
      });
      if (created.is_primary) {
        setContents(await listContentForLearning(id));
      } else {
        setContents((list) => [created, ...list]);
      }
      setCTitle('');
      setCUrl('');
      push('Hasil karya tersimpan. Link dicatat apa adanya.');
    } catch (e) {
      setContentMsg(e instanceof Error ? e.message : 'Gagal menyimpan konten.');
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveReview = async () => {
    if (!id) return;
    setReviewMsg('');
    if (!keyInsight.trim() && !nextStep.trim() && !whatWorked.trim()) {
      setReviewMsg('Isi setidaknya insight kunci atau rencana langkah berikutnya.');
      return;
    }
    setSavingReview(true);
    try {
      const saved = await saveReviewForLearning(id, {
        what_worked: whatWorked.trim() || null,
        what_failed: whatFailed.trim() || null,
        key_insight: keyInsight.trim() || null,
        next_step: nextStep.trim() || null,
      });
      setReview(saved);
      push('Review hasil belajar tersimpan.');
    } catch (e) {
      setReviewMsg(e instanceof Error ? e.message : 'Gagal menyimpan review.');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteLearningItem(id);
      push('Materi dihapus.');
      navigate('/');
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
  const hasNote = notes.length > 0 || hasSketch;
  const hasReview = Boolean(review?.key_insight || review?.next_step || review?.what_worked);
  const steps = [
    { label: '1. Materi', done: true },
    { label: '2. Catatan & Opini', done: hasNote },
    { label: '3. Komplet', done: isLearned },
    { label: '4. Karya/Output', done: hasContent },
    { label: '5. Evaluasi & Lanjutan', done: hasReview },
  ];
  const progressPercent = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  const nextCycleUrl = `/materi/baru?from_cycle=true&topic=${encodeURIComponent(item.topic || '')}&title=${encodeURIComponent(
    nextStep.trim() ? nextStep.trim() : `Proyek Lanjutan: ${item.title}`,
  )}&goal=${encodeURIComponent(keyInsight.trim() ? `Menerapkan insight: ${keyInsight.trim()}` : '')}`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header Materi */}
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

      {/* 1. Stepper Progress Belajar-ke-Output */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Siklus Learning-to-Output</h2>
            <p className="text-xs text-slate-500">Alur tuntas dari eksplorasi sampai karya nyata</p>
          </div>
          <Badge>{progressPercent}%</Badge>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
          {steps.map((s) => (
            <div
              key={s.label}
              className={`rounded-lg p-1.5 text-center text-[11px] font-medium leading-tight sm:p-2 sm:text-xs ${
                s.done ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {s.done ? '✓ ' : ''}{s.label}
            </div>
          ))}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-slate-900 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </Card>

      {/* Info Sumber Belajar */}
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
              <dt className="font-medium text-slate-700">Tujuan belajar / Target output</dt>
              <dd className="text-slate-600">{item.learning_goal}</dd>
            </div>
          )}
        </dl>
        {!isLearned ? (
          <Button onClick={handleMarkLearned} className="mt-4 w-full">
            Tandai belajar selesai
          </Button>
        ) : (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            ✓ Belajar selesai — lanjut hasilkan karya atau konten di bawah.
          </p>
        )}
      </Card>

      {/* 2. Catatan Pemahaman, Komentar Kritis & Ide (multiple notes) */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Catatan & Coretan</h2>
            <p className="text-xs text-slate-500">Tulis pemahaman atau coret-coret idemu di papan tulis.</p>
          </div>
          {hasNote && <Badge>{notes.length + (hasSketch ? 1 : 0)} Catatan</Badge>}
        </div>

        <div className="mt-3 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['tulis', 'coret'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setNoteTab(t)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                noteTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'tulis' ? 'Tulis' : 'Coret'}
            </button>
          ))}
        </div>

        {noteTab === 'tulis' ? (
        <>
        {/* Daftar catatan yang sudah tersimpan */}
        {notes.length > 0 && (
          <div className="mt-3 space-y-2">
            {notes.map((n, idx) => (
              <NoteCard key={n.id} note={n} index={idx} />
            ))}
          </div>
        )}

        {/* Form tambah catatan baru */}
        {showNewNoteForm ? (
          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-700">Catatan {notes.length + 1}</p>
            <Field label="Pemahaman Inti *">
              <TextArea
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Apa inti materi ini? Konsep apa yang paling penting untuk diingat dan diterapkan?"
              />
              <p className="mt-1 text-xs text-slate-500">{note.trim().length}/100 karakter minimum</p>
            </Field>

            <button
              type="button"
              onClick={() => setShowAdvancedReflection(!showAdvancedReflection)}
              className="text-xs font-medium text-slate-600 underline"
            >
              {showAdvancedReflection ? '− Sembunyikan refleksi tambahan' : '+ Tambah komentar kritis, ide proyek, atau pertanyaan'}
            </button>

            {showAdvancedReflection && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Field label="Komentar Kritis / Opini Pribadi" hint="Apakah ada kelemahan pendekatan ini?">
                  <TextArea
                    rows={2}
                    value={criticalComment}
                    onChange={(e) => setCriticalComment(e.target.value)}
                    placeholder="cth: Pendekatan ini bagus untuk dataset kecil, tetapi kurang optimal jika konkurensi tinggi..."
                  />
                </Field>
                <Field label="Ide Proyek / Bentuk Karya Nyata" hint="Mini project apa yang bisa dibuat?">
                  <TextArea
                    rows={2}
                    value={ideas}
                    onChange={(e) => setIdeas(e.target.value)}
                    placeholder="cth: Buat Colab notebook membandingkan BM25 vs Dense Retrieval..."
                  />
                </Field>
                <Field label="Pertanyaan Terbuka / Yang Masih Membingungkan" hint="Hal yang perlu dieksplorasi lebih lanjut">
                  <TextArea
                    rows={2}
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="cth: Bagaimana strategi re-ranking yang paling hemat latensi?"
                  />
                </Field>
              </div>
            )}

            {noteMsg && <p className="text-sm text-red-600">{noteMsg}</p>}
            <div className="flex gap-2">
              <SecondaryButton
                type="button"
                onClick={() => { setShowNewNoteForm(false); setNote(''); setCriticalComment(''); setIdeas(''); setQuestions(''); setNoteMsg(''); setShowAdvancedReflection(false); }}
                className="flex-1"
              >
                Batal
              </SecondaryButton>
              <Button onClick={handleSaveNote} disabled={savingNote} className="flex-1">
                {savingNote ? 'Menyimpan...' : 'Simpan catatan'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewNoteForm(true)}
            className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900"
          >
            + Tambah catatan {notes.length > 0 ? notes.length + 1 : ''}
          </button>
        )}
        </>
        ) : (
          <div className="mt-3">
            {hasSketch && (
              <p className="mb-2 text-xs text-slate-500">Coretan tersimpan — lanjutkan menggambar lalu simpan lagi.</p>
            )}
            <Suspense fallback={<Loading text="Memuat papan coretan..." />}>
              <SketchEditor initial={sketch} saving={savingSketch} onSave={handleSaveSketch} />
            </Suspense>
            {sketchMsg && <p className="mt-2 text-sm text-red-600">{sketchMsg}</p>}
          </div>
        )}
      </Card>

      {/* 3. Hasil Karya / Output (GitHub, Colab, YouTube, Blog, dll) */}
      <Card>
        <h2 className="font-semibold text-slate-900">Hasil Karya / Output Nyata</h2>
        {!isLearned ? (
          <p className="mt-1 text-xs text-slate-500">
            Selesaikan belajar dulu di atas, lalu ubah pemahamanmu menjadi karya nyata (kode, Colab, video, artikel).
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Pilih platform tempat karyamu diunggah, lalu simpan link buktinya.
          </p>
        )}

        {contents.length > 0 && (
          <div className="mt-3 space-y-2">
            {contents.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{PLATFORM_LABELS[c.platform] ?? c.platform}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {c.is_primary && <Badge>Utama</Badge>}
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-700 underline">
                    Buka Link
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PLATFORM_LABELS) as OutputPlatform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCPlatform(p)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  cPlatform === p ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Platform">
              <SelectInput value={cPlatform} onChange={(e) => setCPlatform(e.target.value as OutputPlatform)}>
                {(Object.keys(PLATFORM_LABELS) as OutputPlatform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Judul karya / konten *">
              <TextInput value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="cth: Mini Project RAG Hybrid di Colab" />
            </Field>
          </div>
          <Field label="Link karya / hasil *">
            <TextInput value={cUrl} onChange={(e) => setCUrl(e.target.value)} placeholder="https://github.com/... atau https://colab.research..." inputMode="url" />
          </Field>
          {contentMsg && <p className="text-sm text-red-600">{contentMsg}</p>}
          <Button onClick={handleProduceContent} disabled={savingContent} className="w-full">
            {savingContent ? 'Menyimpan...' : 'Simpan hasil karya'}
          </Button>
        </div>
      </Card>

      {/* 4. Evaluasi & Review Hasil Karya (Closing the Loop) */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Evaluasi & Review Hasil</h2>
            <p className="text-xs text-slate-500">Petik insight dan tentukan langkah berikutnya.</p>
          </div>
          {hasReview && <Badge>Terekam</Badge>}
        </div>

        <div className="mt-3 space-y-3">
          <Field label="Insight kunci">
            <TextArea
              rows={2}
              value={keyInsight}
              onChange={(e) => setKeyInsight(e.target.value)}
              placeholder="Apa yang paling kamu pelajari setelah mengerjakan karya ini?"
            />
          </Field>
          <Field label="Langkah berikutnya">
            <TextInput
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="Topik atau proyek apa yang logis dikerjakan berikutnya?"
            />
          </Field>

          <button
            type="button"
            onClick={() => setShowReviewDetail(!showReviewDetail)}
            className="text-xs font-medium text-slate-500 underline"
          >
            {showReviewDetail ? '− Sembunyikan detail' : '+ Tambah detail (apa yang berhasil & kendala)'}
          </button>

          {showReviewDetail && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Field label="Apa yang berjalan baik? (opsional)">
                <TextArea
                  rows={2}
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  placeholder="cth: Integrasi vector DB cepat dan lancar..."
                />
              </Field>
              <Field label="Kendala / yang masih kurang? (opsional)">
                <TextArea
                  rows={2}
                  value={whatFailed}
                  onChange={(e) => setWhatFailed(e.target.value)}
                  placeholder="cth: Latensi agak lambat saat embedding dokumen panjang..."
                />
              </Field>
            </div>
          )}

          {reviewMsg && <p className="text-sm text-red-600">{reviewMsg}</p>}
          <Button onClick={handleSaveReview} disabled={savingReview} className="w-full">
            {savingReview ? 'Menyimpan...' : 'Simpan evaluasi'}
          </Button>
        </div>
      </Card>

      {/* 5. Flywheel: Lanjutkan ke Proyek/Materi Berikutnya */}
      {(hasReview || hasContent) && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-slate-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Flywheel Learning-to-Output</p>
              <h3 className="font-bold text-slate-900">Siap melangkah ke materi berikutnya?</h3>
              <p className="text-xs text-slate-600">
                {nextStep.trim() ? `Langkah berikutnya: "${nextStep.trim()}"` : 'Jadikan insight materi ini sebagai dasar proyek baru.'}
              </p>
            </div>
            <Link to={nextCycleUrl} className="shrink-0">
              <Button>+ Mulai Materi Berikutnya</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Hapus Materi */}
      <div className="pt-2 text-right">
        <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-600 hover:text-red-700 underline">
          Hapus materi ini
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus materi?"
          message="Materi, catatan, karya terkait, dan review akan ikut terhapus. Lanjutkan?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}
    </div>
  );
}

