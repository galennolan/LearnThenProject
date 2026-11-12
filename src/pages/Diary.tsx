import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listDiaries,
  createDiary,
  updateDiary,
  deleteDiary,
} from '../services/diary';
import type { DiaryEntry } from '../types';
import { todayJakartaISO } from '../lib/time';
import { useToast } from '../hooks/useToast';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Loading,
  SecondaryButton,
  TextInput,
} from '../components/ui';

interface StoryworthyPrompt {
  id: string;
  category: string;
  question: string;
  hint: string;
}

const STORYWORTHY_PROMPTS: StoryworthyPrompt[] = [
  {
    id: 'first-last-best-worst',
    category: 'Perubahan & Momen',
    question: 'Momen 5 detik apa yang mengubah cara pandangmu hari ini?',
    hint: 'Detik ketika kamu sadar ada sesuatu yang berbeda, keputusan kecil, atau emosi yang bergeser.',
  },
  {
    id: 'unusual-detail',
    category: 'Detail Unik',
    question: 'Hal kecil tak biasa apa yang membedakan hari ini dari kemarin?',
    hint: 'Bukan rutinitas makan/kerja, melainkan interaksi, ekspresi orang lain, atau kejadian ganjil di jalan.',
  },
  {
    id: 'vulnerability',
    category: 'Emosi & Kejujuran',
    question: 'Kapan hari ini kamu merasa tersentuh, bersyukur, atau menertawakan diri sendiri?',
    hint: 'Kejujuran pada rasa canggung, haru, atau kehangatan spontan.',
  },
  {
    id: 'one-minute-dinner',
    category: 'Kisah Sahabat',
    question: 'Jika hari ini harus diceritakan dalam 1 menit ke sahabat, adegan mana yang kamu pilih?',
    hint: 'Pilih satu fragmen adegan nyata, bukan rangkuman seharian penuh.',
  },
];

function formatFullDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const iso = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatShortDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const iso = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

export default function DiaryPage() {
  const { push } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string>(todayJakartaISO());
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listDiaries();
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat diary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApplyPrompt = (prompt: StoryworthyPrompt) => {
    const promptQuote = `"${prompt.question}"\n`;
    if (!content.trim()) {
      setContent(promptQuote);
    } else {
      setContent((prev) => `${prev.trim()}\n\n${promptQuote}`);
    }
    setShowPromptPicker(false);
  };

  const handleStartEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setEntryDate(entry.entry_date);
    setContent(entry.content);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEntryDate(todayJakartaISO());
    setContent('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setFormError('Isi catatan momen tidak boleh kosong.');
      return;
    }

    if (!entryDate) {
      setFormError('Tanggal transaksi momen wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateDiary(editingId, {
          entry_date: entryDate,
          content: trimmedContent,
        });
        setEntries((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        push('Catatan diary berhasil diperbarui');
        handleCancelEdit();
      } else {
        const existing = entries.find((item) => item.entry_date === entryDate);
        if (existing) {
          const updated = await updateDiary(existing.id, {
            entry_date: entryDate,
            content: trimmedContent,
          });
          setEntries((prev) => prev.map((item) => (item.id === existing.id ? updated : item)));
          push('Catatan untuk tanggal ini berhasil diperbarui');
        } else {
          const created = await createDiary({
            entry_date: entryDate,
            content: trimmedContent,
          });
          setEntries((prev) => [created, ...prev]);
          push('Momen hari ini tersimpan di diary dan jejak aktivitas');
        }
        setContent('');
        setEntryDate(todayJakartaISO());
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan catatan diary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteDiary(deletingId);
      setEntries((prev) => prev.filter((e) => e.id !== deletingId));
      push('Catatan berhasil dihapus');
      if (editingId === deletingId) {
        handleCancelEdit();
      }
      setDeletingId(null);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal menghapus catatan.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.content.toLowerCase().includes(q) ||
        e.entry_date.includes(q) ||
        formatFullDateDisplay(e.entry_date).toLowerCase().includes(q)
    );
  }, [entries, search]);

  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [content]);

  const isToday = entryDate === todayJakartaISO();

  if (loading) return <Loading text="Memuat jurnal harian..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catatan Refleksi</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Homework for Life
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Abadikan satu momen kecil paling bermakna setiap hari dalam 1–3 kalimat padat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Metode Refleksi
          </button>
          <Link
            to="/jejak"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Buka Grid Jejak
          </Link>
        </div>
      </div>

      {/* Editor Canvas Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5">
        <form onSubmit={handleSubmit}>
          {/* Editor Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                {editingId ? 'Edit Catatan' : 'Tulis Momen'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                >
                  Batalkan
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Date Selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500">
                  {isToday ? 'Hari ini:' : 'Tanggal:'}
                </span>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  max={todayJakartaISO()}
                  className="text-xs font-medium text-slate-800 bg-transparent outline-none cursor-pointer"
                  required
                />
              </div>

              {/* Prompt Trigger */}
              <button
                type="button"
                onClick={() => setShowPromptPicker((prev) => !prev)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                  showPromptPicker
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Inspirasi Momen
              </button>
            </div>
          </div>

          {/* Prompt Selection Drawer (Collapsible) */}
          {showPromptPicker && (
            <div className="border-b border-slate-100 bg-slate-50/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pilih Sudut Pandang Cerita
                </span>
                <button
                  type="button"
                  onClick={() => setShowPromptPicker(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {STORYWORTHY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => handleApplyPrompt(prompt)}
                    className="text-left rounded-lg border border-slate-200/80 bg-white p-3 hover:border-slate-400 hover:shadow-xs transition"
                  >
                    <div className="text-[11px] font-semibold text-slate-500">{prompt.category}</div>
                    <div className="mt-0.5 text-xs font-medium text-slate-900">{prompt.question}</div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-snug">{prompt.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Textarea */}
          <div className="p-4 sm:p-5">
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ceritakan momen 5 detik hari ini. Adegan nyata apa yang membuat hari ini terasa hidup dan berbeda dari kemarin..."
              className="w-full resize-none border-0 bg-transparent text-sm sm:text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              required
            />
          </div>

          {formError && (
            <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </div>
          )}

          {/* Editor Footer Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatShortDateDisplay(entryDate)}</span>
              <span>•</span>
              <span>{wordCount} kata</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{content.trim().length} karakter</span>
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <SecondaryButton
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="text-xs py-2 px-3.5"
                >
                  Batal
                </SecondaryButton>
              )}
              <Button
                type="submit"
                disabled={submitting || !content.trim()}
                className="text-xs py-2 px-4 font-semibold"
              >
                {submitting
                  ? 'Menyimpan...'
                  : editingId
                    ? 'Simpan Perubahan'
                    : 'Simpan Catatan'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Control Bar: Search & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="w-full sm:max-w-xs">
          <TextInput
            placeholder="Cari dalam catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-2"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {filteredEntries.length} catatan
          </span>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu Baca
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Spreadsheet
            </button>
          </div>
        </div>
      </div>

      {/* Entries List or Grid */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          title={search ? 'Catatan tidak ditemukan' : 'Belum ada catatan momen'}
          desc={
            search
              ? 'Tidak ada catatan yang cocok dengan kata kunci pencarian.'
              : 'Tulis satu momen 5 detik dari keseharianmu pada form di atas.'
          }
        />
      ) : viewMode === 'cards' ? (
        /* Mode Kartu Baca */
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const isSelected = editingId === entry.id;
            return (
              <div
                key={entry.id}
                className={`group rounded-xl border bg-white p-4 sm:p-5 transition-all shadow-xs ${
                  isSelected
                    ? 'border-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <time
                        dateTime={entry.entry_date}
                        className="text-xs font-bold uppercase tracking-wider text-slate-900"
                      >
                        {formatFullDateDisplay(entry.entry_date)}
                      </time>
                      <span className="text-[11px] font-mono text-slate-400">
                        {entry.entry_date}
                      </span>
                    </div>

                    <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(entry)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(entry.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode Tabel Spreadsheet ala Matthew Dicks Homework for Life */
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Spreadsheet Refleksi
            </span>
            <span className="text-[11px] text-slate-500">Tersinkronisasi ke kalender aktivitas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-100/50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-4 w-44 whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-4">Momen Berkesan (The Story)</th>
                  <th className="py-2.5 px-4 w-24 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`transition hover:bg-slate-50/80 ${
                      editingId === entry.id ? 'bg-slate-50 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-900 block">
                        {formatShortDateDisplay(entry.entry_date)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {entry.entry_date}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top text-xs leading-relaxed text-slate-800">
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(entry)}
                          className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(entry.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guide Modal: Education on Homework for Life without cluttering page */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Metode Refleksi: Homework for Life
              </h2>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                Konsep ini digagas oleh <strong>Matthew Dicks</strong>, seorang pencerita ulung dunia (Moth GrandSLAM Champion).
              </p>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 space-y-2">
                <div className="font-semibold text-slate-800 text-[13px]">
                  Bukan buku harian biasa yang panjang
                </div>
                <p>
                  Hindari mencatat rutinitas seperti apa yang kamu makan atau pekerjaan yang kamu selesaikan. Cukup tangkap <strong>satu momen 5 detik</strong> di mana kamu mengalami:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li>Perubahan perasaan atau cara pandang terhadap sesuatu</li>
                  <li>Kesadaran baru tentang diri sendiri atau orang terdekat</li>
                  <li>Adegan unik yang membedakan hari ini dari kemarin</li>
                </ul>
              </div>
              <p>
                Catatan ini disimpan dalam format spreadsheet ringkas dan otomatis tercatat sebagai jejak konsistensi harian di kalender Jejak Anda.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" onClick={() => setShowGuideModal(false)} className="text-xs py-2 px-4">
                Saya Mengerti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      {deletingId && (
        <ConfirmDialog
          title="Hapus Catatan Diary"
          message="Apakah kamu yakin ingin menghapus catatan momen ini? Aktivitas hari ini di jejak grid juga akan disesuaikan."
          confirmLabel="Hapus Momen"
          busy={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
