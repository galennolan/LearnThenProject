import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLearningFocus, type LearningFocus } from '../services/learning';
import { Badge, Button, Card, EmptyState, ErrorState, Loading } from '../components/ui';

/** Beranda: lagi belajar apa + progresnya + langkah berikutnya. */
export default function BelajarPage() {
  const [items, setItems] = useState<LearningFocus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <Loading text="Memuat belajarmu..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lagi belajar apa?</h1>
          <p className="text-sm text-slate-500">{items.length} materi.</p>
        </div>
        <Link to="/materi/baru">
          <Button>+ Baru</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Belum ada yang dipelajari" desc="Klik + Baru untuk menambahkan bacaan, video, atau hal yang ingin kamu kuasai." />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <Link key={f.item.id} to={`/materi/${f.item.id}`}>
              <Card className="transition hover:border-slate-400">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{f.item.title}</p>
                  <Badge>{f.percent}%</Badge>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-slate-900 transition-all" style={{ width: `${f.percent}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {f.outputCount > 0
                    ? `${f.outputCount} hasil • ${f.nextAction}`
                    : f.nextAction}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
