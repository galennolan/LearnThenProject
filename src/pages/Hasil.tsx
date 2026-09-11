import { useEffect, useState } from 'react';
import { listAllContent, type ContentWithSource } from '../services/learning';
import { PLATFORM_LABELS } from '../types';
import { formatJakarta } from '../lib/time';
import { Badge, Card, EmptyState, ErrorState, Loading } from '../components/ui';

/** Hasil: semua konten yang pernah diproduksi dari belajar. */
export default function HasilPage() {
  const [items, setItems] = useState<ContentWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <Loading text="Memuat hasil..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hasil belajarmu</h1>
        <p className="text-sm text-slate-500">{items.length} konten. Link tersimpan apa adanya.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Belum ada hasil" desc="Selesaikan satu materi, lalu produksi konten pertamamu dari halamannya." />
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{c.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {PLATFORM_LABELS[c.platform]}
                    {c.learning_title ? ` • dari: ${c.learning_title}` : ''}
                    {` • ${formatJakarta(c.published_at ?? c.created_at)}`}
                  </p>
                </div>
                {c.is_primary && <Badge>Utama</Badge>}
              </div>
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-sm text-slate-900 underline"
              >
                {c.url}
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
