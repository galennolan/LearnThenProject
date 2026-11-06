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
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  SecondaryButton,
  TextArea,
  TextInput,
} from '../components/ui';

const STORYWORTHY_PROMPTS = [
  'Momen 5 detik apa yang mengubah cara pandangmu hari ini?',
  'Hal kecil tak biasa apa yang terjadi dan membedakan hari ini dari kemarin?',
  'Kapan hari ini kamu merasa tersentuh, tertawa sendiri, atau bersyukur?',
  'Jika hari ini harus diceritakan dalam 1 menit ke sahabat, adegan mana yang kamu pilih?',
];

function formatFullDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const iso = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export default function DiaryPage() {
  const { push } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [showGuide, setShowGuide] = useState(false);

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

  const handlePromptClick = (promptText: string) => {
    if (!content.trim()) {
      setContent(`[${promptText}]\n`);
    } else {
      setContent((prev) => `${prev.trim()}\n\n[${promptText}]\n`);
    }
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
      setFormError('Isi momen diary Storyworthy tidak boleh kosong.');
      return;
    }

    if (!entryDate) {
      setFormError('Tanggal wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateDiary(editingId, {
          entry_date: entryDate,
          content: trimmedContent,
        });
        setEntries((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
        push('Catatan diary berhasil diperbarui & disimpan di grid!');
        handleCancelEdit();
      } else {
        // Cek apakah tanggal ini sudah pernah diisi
        const existing = entries.find((e) => e.entry_date === entryDate);
        if (existing) {
          const updated = await updateDiary(existing.id, {
            entry_date: entryDate,
            content: trimmedContent,
          });
          setEntries((prev) => prev.map((e) => (e.id === existing.id ? updated : e)));
          push('Catatan tanggal ini diperbarui & disimpan di grid!');
        } else {
          const created = await createDiary({
            entry_date: entryDate,
            content: trimmedContent,
          });
          setEntries((prev) => [created, ...prev]);
          push('Momen tersimpan di Diary & jejak grid harian!');
        }
        setContent('');
        setEntryDate(todayJakartaISO());
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan diary.');
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
      push('Catatan diary dihapus.');
      if (editingId === deletingId) {
        handleCancelEdit();
      }
      setDeletingId(null);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal menghapus.', 'error');
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
        formatFullDateDisplay(e.entry_date).toLowerCase().includes(q),
    );
  }, [entries, search]);

  if (loading) return <Loading text="Memuat diary Storyworthy..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Diary Storyworthy</h1>
            <Badge>Homework for Life</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tulis 1 momen pendek paling bercerita setiap hari. Otomatis terekam di jejak grid.
          </p>
        </div>
        <Link
          to="/jejak"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition w-fit"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Lihat di Jejak Grid →
        </Link>
      </div>

      {/* Form Penulisan Momen Storyworthy */}
      <Card className="border-slate-300 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">
                {editingId ? '✏️ Ubah Catatan Diary' : '✍️ Catat Momen Hari Ini'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Batal ubah
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
            >
              {showGuide ? 'Tutup panduan' : '💡 Panduan Storyworthy'}
            </button>
          </div>

          {showGuide && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold">Konsep Homework for Life (Storyworthy - Matthew Dicks):</p>
              <p>
                Bukan membuat buku harian panjang tentang jadwal sarapan atau pekerjaanmu. Cukup tangkap{' '}
                <strong>1 momen spesifik (1–3 kalimat)</strong> di mana kamu merasakan perubahan emosi, kesadaran baru,
                atau kejadian tak terduga yang membuat hari ini berbeda dari kemarin.
              </p>
              <p className="text-[11px] text-amber-800">
                Data disimpan dalam tabel grid dan otomatis dihitung sebagai aktivitas harian di menu Jejak!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Field label="Tanggal">
                <TextInput
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  max={todayJakartaISO()}
                  required
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1 text-sm font-medium text-slate-700">Inspirasi Pemantik Cerita</label>
              <div className="flex flex-wrap gap-1">
                {STORYWORTHY_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePromptClick(p)}
                    className="text-[11px] rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    + {p.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Field
            label="Isi Diary Pendek (Khas Storyworthy)"
            hint="Ceritakan momen 5 detik atau peristiwa berkesan dalam 1–3 kalimat padat."
          >
            <TextArea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contoh: Saat menunggu lampu merah di jalan pulang, aku melihat seorang ayah memakaikan jas hujan plastik ke anaknya sambil tertawa bersama di tengah hujan deras..."
              required
            />
          </Field>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              {content.trim().length} karakter • {content.trim().split(/\s+/).filter(Boolean).length} kata
            </span>
            <div className="flex gap-2">
              {editingId && (
                <SecondaryButton type="button" onClick={handleCancelEdit} disabled={submitting}>
                  Batal
                </SecondaryButton>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Menyimpan...'
                  : editingId
                    ? 'Simpan Perubahan'
                    : 'Simpan ke Diary & Grid'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Filter & Kontrol Tampilan */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="w-full sm:w-64">
          <TextInput
            placeholder="Cari momen dalam diary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-2"
          />
        </div>
        <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabel Grid (Spreadsheet)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Kartu
          </button>
        </div>
      </div>

      {/* Daftar / Tabel Grid Momen Storyworthy */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          title={search ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan diary'}
          desc={
            search
              ? 'Coba gunakan kata kunci pencarian yang lain.'
              : 'Mulai dengan menulis satu momen kecil yang terjadi hari ini di form atas.'
          }
        />
      ) : viewMode === 'grid' ? (
        /* Mode Tabel Grid (Spreadsheet ala Storyworthy Homework for Life) */
        <Card className="overflow-hidden p-0 border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Grid Cerita Harian ({filteredEntries.length})
            </span>
            <span className="text-[11px] text-slate-500">Tersinkronisasi ke Grid Jejak</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-4 w-36 whitespace-nowrap font-semibold">Tanggal</th>
                  <th className="py-2.5 px-4 font-semibold">Momen Storyworthy (Homework for Life)</th>
                  <th className="py-2.5 px-3 w-28 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`group transition hover:bg-slate-50 ${
                      editingId === entry.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block text-xs">
                        {formatFullDateDisplay(entry.entry_date)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{entry.entry_date}</span>
                    </td>
                    <td className="py-3 px-4 align-top text-xs text-slate-800 leading-relaxed font-normal">
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </td>
                    <td className="py-3 px-3 align-top text-right whitespace-nowrap">
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
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
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
        </Card>
      ) : (
        /* Mode Kartu */
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className={`transition hover:border-slate-300 ${
                editingId === entry.id ? 'border-indigo-400 ring-1 ring-indigo-400' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {formatFullDateDisplay(entry.entry_date)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">({entry.entry_date})</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </Card>
          ))}
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

