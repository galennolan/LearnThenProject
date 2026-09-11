import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, type DashboardStats } from '../services/dashboard';
import { Badge, Card, EmptyState, ErrorState, Loading } from '../components/ui';
import { formatJakarta } from '../lib/time';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await getDashboardStats());
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dasbor</h1>
        <p className="text-sm text-slate-500">Ringkasan progres belajarmu menjadi output.</p>
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
