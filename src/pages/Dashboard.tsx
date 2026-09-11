import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, type DashboardStats } from '../services/dashboard';
import { listLearningFocus, type LearningFocus } from '../services/learning';
import { Badge, Card, EmptyState, ErrorState, Loading } from '../components/ui';
import { formatJakarta } from '../lib/time';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [focus, setFocus] = useState<LearningFocus[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, f] = await Promise.all([getDashboardStats(), listLearningFocus()]);
      setStats(s);
      setFocus(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat dasbor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading text="Memuat dasbor..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <EmptyState title="Belum ada data" desc="Tambahkan materi belajar pertamamu." />;

  const cards = [
    { label: 'Materi belajar', value: stats.totalMateri, to: '/materi' },
    { label: 'Project aktif', value: stats.projectAktif, to: '/project' },
    { label: 'Project selesai', value: stats.projectSelesai, to: '/project' },
    { label: 'Output', value: stats.totalOutput, to: '/portofolio' },
  ];

  const sedangBelajar = focus.filter((f) => !f.isLearned).slice(0, 5);
  const siapKonten = focus.filter((f) => f.isLearned && f.outputCount === 0).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Lagi belajar apa?</h1>
        <p className="text-sm text-slate-500">Fokusmu saat ini dan langkah berikutnya.</p>
      </div>

      {focus.length === 0 ? (
        <EmptyState title="Belum ada materi" desc="Tambahkan materi pertamamu lewat halaman Materi." />
      ) : (
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-slate-900">Sedang dipelajari</h2>
            <div className="mt-3 space-y-3">
              {sedangBelajar.length === 0 && <p className="text-sm text-slate-500">Semua materi sudah komplet. Kerja bagus!</p>}
              {sedangBelajar.map((f) => (
                <Link key={f.item.id} to={`/materi/${f.item.id}`} className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{f.item.title}</p>
                    <Badge>{f.percent}%</Badge>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-slate-900 transition-all" style={{ width: `${f.percent}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">Langkah berikutnya: {f.nextAction}</p>
                </Link>
              ))}
            </div>
          </Card>

          {siapKonten.length > 0 && (
            <Card>
              <h2 className="font-semibold text-slate-900">Siap jadi konten</h2>
              <p className="mt-1 text-xs text-slate-500">Belajarnya komplet — tinggal produksi: berita, Instagram, YouTube, atau lainnya.</p>
              <div className="mt-3 space-y-2">
                {siapKonten.map((f) => (
                  <Link key={f.item.id} to={`/materi/${f.item.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <span className="text-sm font-medium text-slate-900">{f.item.title}</span>
                    <span className="text-xs font-medium text-slate-700 underline">Produksi konten</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <div>
        <h2 className="text-base font-bold text-slate-900">Ringkasan</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="mt-1 text-sm text-slate-500">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-900">Task yang perlu dikerjakan</h2>
          <div className="mt-3 space-y-2">
            {stats.todoTasks.length === 0 && <p className="text-sm text-slate-500">Tidak ada task tertunda. Bagus!</p>}
            {stats.todoTasks.map((t) => (
              <Link key={t.id} to={`/project/${t.project_id}`} className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-medium text-slate-900">{t.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t.project_title ?? 'Project'} • Jatuh tempo: {formatJakarta(t.due_date)}
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-slate-900">Project aktif terbaru</h2>
            <div className="mt-3 space-y-2">
              {stats.recentActiveProjects.length === 0 && <p className="text-sm text-slate-500">Belum ada project aktif.</p>}
              {stats.recentActiveProjects.map((p) => (
                <Link key={p.id} to={`/project/${p.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <span className="text-sm font-medium text-slate-900">{p.title}</span>
                  <Badge>Aktif</Badge>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Materi belum ada refleksi</h2>
              <Link to="/materi" className="text-sm font-medium text-slate-700 underline">
                Lihat semua
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {stats.materiTanpaRefleksi.length === 0 && <p className="text-sm text-slate-500">Semua materi sudah punya refleksi.</p>}
              {stats.materiTanpaRefleksi.map((m) => (
                <Link key={m.id} to={`/materi/${m.id}`} className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <span className="text-sm font-medium text-slate-900">{m.title}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
