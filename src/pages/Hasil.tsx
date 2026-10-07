import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAllContent, type ContentWithSource } from '../services/learning';
import { deleteOutput, updateOutput } from '../services/projects';
import type { Output } from '../types';
import { PLATFORM_LABELS } from '../types';
import { formatJakarta, isValidUrl } from '../lib/time';
import { useToast } from '../hooks/useToast';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Loading, SecondaryButton, SelectInput, TextInput } from '../components/ui';

function HasilCard({
  c,
  onChanged,
  onDeleted,
}: {
  c: ContentWithSource;
  onChanged: (o: Output) => void;
  onDeleted: (id: string) => void;
}) {
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(c.title);
  const [platform, setPlatform] = useState<Output['platform']>(c.platform);
  const [url, setUrl] = useState(c.url);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setErr('');
    if (!title.trim()) {
      setErr('Judul wajib diisi.');
      return;
    }
    if (!isValidUrl(url.trim())) {
      setErr('URL tidak valid. Gunakan http(s)://...');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateOutput(c.id, c.project_id, {
        title: title.trim(),
        platform,
        url: url.trim(),
      });
      onChanged(updated);
      setEditing(false);
      push('Hasil diperbarui.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteOutput(c.id);
      onDeleted(c.id);
      push('Hasil dihapus.');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gagal menghapus.', 'error');
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{c.title}</p>
            {c.is_primary && <Badge>Utama</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{PLATFORM_LABELS[c.platform] ?? c.platform}</span>
            {c.learning_title && (
              <>
                {' • dari: '}
                {c.learning_item_id ? (
                  <Link to={`/materi/${c.learning_item_id}`} className="underline hover:text-slate-900">
                    {c.learning_title}
                  </Link>
                ) : (
                  c.learning_title
                )}
              </>
            )}
            {` • ${formatJakarta(c.published_at ?? c.created_at)}`}
          </p>
        </div>
      </div>

      {/* Link Bukti Karya */}
      <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
        <p className="text-xs text-slate-400">Link Publikasi / Repository:</p>
        <a
          href={c.url}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 block break-all text-xs font-medium text-slate-900 underline hover:text-indigo-600"
        >
          {c.url}
        </a>
      </div>

      {/* Evaluasi / Insight bila ada */}
      {c.key_insight && (
        <div className="mt-2.5 rounded-lg border-l-2 border-indigo-500 bg-indigo-50/50 p-2.5 text-xs">
          <span className="font-semibold text-indigo-900">Insight Belajar: </span>
          <span className="text-indigo-800">{c.key_insight}</span>
          {c.next_step && (
            <div className="mt-1 text-slate-600">
              <strong>Langkah berikutnya: </strong>
              {c.next_step}
            </div>
          )}
        </div>
      )}

      {editing ? (
        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
          <Field label="Judul *">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Platform">
            <SelectInput value={platform} onChange={(e) => setPlatform(e.target.value as Output['platform'])}>
              {(Object.keys(PLATFORM_LABELS) as Output['platform'][]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="URL *">
            <TextInput value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
          </Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2">
            <SecondaryButton
              onClick={() => {
                setEditing(false);
                setTitle(c.title);
                setPlatform(c.platform);
                setUrl(c.url);
                setErr('');
              }}
              className="flex-1"
            >
              Batal
            </SecondaryButton>
            <Button onClick={save} disabled={busy} className="flex-1">
              {busy ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-4">
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-slate-700 underline">
            Ubah
          </button>
          <button onClick={() => setConfirming(true)} className="text-xs font-medium text-red-600 underline">
            Hapus
          </button>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="Hapus hasil ini?"
          message={`"${c.title}" akan dihapus permanen. Lanjutkan?`}
          onCancel={() => setConfirming(false)}
          onConfirm={remove}
          busy={deleting}
        />
      )}
    </Card>
  );
}

/** Hasil: semua karya & konten yang pernah diproduksi dari belajar. */
export default function HasilPage() {
  const [items, setItems] = useState<ContentWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listAllContent());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat hasil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const platformsInUse = useMemo(() => {
    const set = new Set(items.map((i) => i.platform));
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((c) => {
      const matchSearch =
        search.trim() === '' ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.learning_title && c.learning_title.toLowerCase().includes(search.toLowerCase())) ||
        (c.key_insight && c.key_insight.toLowerCase().includes(search.toLowerCase()));

      const matchPlatform = selectedPlatform === 'all' || c.platform === selectedPlatform;
      return matchSearch && matchPlatform;
    });
  }, [items, search, selectedPlatform]);

  if (loading) return <Loading text="Memuat hasil karya..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hasil karya & bukti belajar</h1>
        <p className="text-sm text-slate-500">{items.length} karya/konten nyata yang telah dipublikasikan.</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <TextInput
            placeholder="Cari berdasarkan judul karya, materi, atau insight..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {platformsInUse.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPlatform('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedPlatform === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {platformsInUse.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedPlatform === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {PLATFORM_LABELS[p] ?? p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada hasil karya"
          desc="Buka salah satu materi belajarmu, tandai selesai, lalu simpan link karya pertamamu di sana."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState title="Tidak ada hasil yang sesuai" desc="Coba ubah kata kunci atau filter platform di atas." />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((c) => (
            <HasilCard
              key={c.id}
              c={c}
              onChanged={(o) => setItems((list) => list.map((x) => (x.id === o.id ? { ...x, ...o } : x)))}
              onDeleted={(id) => setItems((list) => list.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
