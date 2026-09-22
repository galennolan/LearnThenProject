import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLearningFocus, type LearningFocus } from '../services/learning';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, TextInput } from '../components/ui';

type FilterTab = 'all' | 'active' | 'completed';

/** Beranda: lagi belajar apa + progres siklus + pencarian + filter status. */
export default function BelajarPage() {
  const [items, setItems] = useState<LearningFocus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listLearningFocus());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((f) => {
      const matchSearch =
        search.trim() === '' ||
        f.item.title.toLowerCase().includes(search.toLowerCase()) ||
        (f.item.topic && f.item.topic.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (filter === 'active') return f.percent < 100;
      if (filter === 'completed') return f.percent === 100;
      return true;
    });
  }, [items, search, filter]);

  if (loading) return <Loading text="Memuat belajarmu..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header Beranda */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lagi belajar apa?</h1>
          <p className="text-sm text-slate-500">
            {items.length} materi • Siklus belajar ke karya nyata
          </p>
        </div>
        <Link to="/materi/baru">
          <Button>+ Baru</Button>
        </Link>
      </div>

      {/* Pencarian dan Filter Tab */}
      {items.length > 0 && (
        <div className="space-y-2">
          <TextInput
            placeholder="Cari materi atau topik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                filter === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sedang Berjalan ({items.filter((i) => i.percent < 100).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                filter === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Siklus Tuntas ({items.filter((i) => i.percent === 100).length})
            </button>
          </div>
        </div>
      )}

      {/* Daftar Materi */}
      {items.length === 0 ? (
        <EmptyState
          title="Belum ada yang dipelajari"
          desc="Klik + Baru untuk menambahkan bacaan, video, atau topik yang ingin kamu kuasai dan ubah jadi karya."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Tidak ada materi yang sesuai"
          desc="Coba ubah kata kunci pencarian atau filter status di atas."
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((f) => (
            <Link key={f.item.id} to={`/materi/${f.item.id}`}>
              <Card className="transition hover:border-slate-400">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{f.item.title}</p>
                    {f.item.topic && (
                      <span className="mt-0.5 inline-block text-xs font-normal text-slate-500">
                        Topik: {f.item.topic}
                      </span>
                    )}
                  </div>
                  <Badge>{f.percent}%</Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-slate-900 transition-all" style={{ width: `${f.percent}%` }} />
                </div>

                {/* Status siklus & langkah berikutnya */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">
                    {f.outputCount > 0 ? `${f.outputCount} karya tersimpan • ` : ''}
                    <strong className="font-medium text-slate-700">{f.nextAction}</strong>
                  </span>
                  <span className="shrink-0 text-slate-400">Buka →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

