import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAllContent, type ContentWithSource } from '../services/learning';
import { PLATFORM_LABELS } from '../types';
import { formatJakarta } from '../lib/time';
import { Badge, Card, EmptyState, ErrorState, Loading, TextInput } from '../components/ui';

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
            <Card key={c.id}>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

