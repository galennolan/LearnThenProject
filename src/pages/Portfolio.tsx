import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Project } from '../types';
import { PROJECT_TYPE_LABELS } from '../types';
import { formatJakarta } from '../lib/time';
import { Badge, Card, EmptyState, ErrorState, Loading } from '../components/ui';

interface PortfolioItem extends Project {
  learning_title?: string;
  key_insight?: string;
  primary_url?: string;
  output_count?: number;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(
          '*, learning_items(title), project_reviews(key_insight,what_worked), outputs(id,is_primary,url,title)',
        )
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const mapped: PortfolioItem[] = (data ?? []).map((p: Record<string, unknown>) => {
        const outputs = (p['outputs'] as { id: string; is_primary: boolean; url: string }[] | null) ?? [];
        const primary = outputs.find((o) => o.is_primary) ?? outputs[0];
        const reviews = p['project_reviews'] as { key_insight?: string | null }[] | { key_insight?: string | null } | null;
        const keyInsight = Array.isArray(reviews) ? reviews[0]?.key_insight : reviews?.key_insight;
        const learning = p['learning_items'] as { title?: string } | null;
        return {
          ...(p as unknown as Project),
          learning_title: learning?.title,
          key_insight: keyInsight ?? undefined,
          primary_url: primary?.url,
          output_count: outputs.length,
        };
      });
      setItems(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat portofolio.');
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
      <div>
        <h1 className="text-xl font-bold text-slate-900">Portofolio</h1>
        <p className="text-sm text-slate-500">
          Project yang kamu tandai sebagai featured. Centang “Tampilkan di portofolio” di halaman ubah project.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Belum ada project featured" desc="Buka sebuah project, klik Ubah, lalu centang Tampilkan di portofolio." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{p.title}</h2>
                <Badge>{PROJECT_TYPE_LABELS[p.project_type]}</Badge>
              </div>
              {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}
              <dl className="mt-3 space-y-1 text-sm">
                {p.learning_title && (
                  <p className="text-slate-600"><span className="font-medium text-slate-700">Sumber belajar:</span> {p.learning_title}</p>
                )}
                {p.key_insight && (
                  <p className="text-slate-600"><span className="font-medium text-slate-700">Insight kunci:</span> {p.key_insight}</p>
                )}
                <p className="text-slate-600"><span className="font-medium text-slate-700">Selesai:</span> {formatJakarta(p.updated_at)}</p>
                <p className="text-slate-600"><span className="font-medium text-slate-700">Jumlah output:</span> {p.output_count ?? 0}</p>
              </dl>
              <div className="mt-4 flex gap-2">
                <Link to={`/project/${p.id}`} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Lihat detail
                </Link>
                {p.primary_url && (
                  <a href={p.primary_url} target="_blank" rel="noreferrer" className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-700">
                    Buka output
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
