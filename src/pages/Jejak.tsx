import { useEffect, useState } from 'react';
import { getActivity, type ActivitySummary } from '../services/learning';
import { formatJakarta } from '../lib/time';
import { Card, EmptyState, ErrorState, Loading } from '../components/ui';

function intensity(count: number): string {
  if (count === 0) return 'bg-slate-100';
  if (count === 1) return 'bg-emerald-200';
  if (count <= 3) return 'bg-emerald-400';
  if (count <= 5) return 'bg-emerald-600';
  return 'bg-emerald-800';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Jejak: heatmap kotak-kotak ala GitHub dari aktivitas belajarmu. */
export default function JejakPage() {
  const [data, setData] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getActivity(53));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat jejak.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading text="Memuat jejak..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState title="Belum ada data" />;

  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }

  const monthLabels = weeks.map((week, wi) => {
    const m = Number(week[0].date.slice(5, 7));
    if (wi === 0) return MONTHS[m - 1];
    const prevM = Number(weeks[wi - 1][0].date.slice(5, 7));
    return m !== prevM ? MONTHS[m - 1] : '';
  });

  const stats = [
    { label: 'Total aktivitas', value: data.total },
    { label: 'Hari aktif', value: data.activeDays },
    { label: 'Rangkaian hari', value: data.streak },
    { label: 'Materi', value: data.materi },
    { label: 'Catatan', value: data.catatan },
    { label: 'Konten', value: data.konten },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Jejak belajarmu</h1>
        <p className="text-sm text-slate-500">12 bulan terakhir. Satu kotak satu hari — makin hijau, makin produktif.</p>
      </div>

      <Card>
        <div className="overflow-x-auto pb-1">
          <div className="grid w-max gap-[3px]" style={{ gridAutoFlow: 'column' }}>
            {monthLabels.map((label, i) => (
              <div key={i} className="h-4 w-3.5 whitespace-nowrap text-[9px] leading-4 text-slate-500">
                {label}
              </div>
            ))}
          </div>
          <div
            className="mt-1 grid w-max gap-[3px]"
            style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', gridAutoFlow: 'column' }}
          >
            {weeks.map((week, wi) =>
              week.map((d, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={`${d.count} aktivitas • ${formatJakarta(`${d.date}T00:00:00Z`)}`}
                  className={`h-3.5 w-3.5 rounded-[3px] ${intensity(d.count)}`}
                />
              )),
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-slate-500">
          <span>Sepi</span>
          {[0, 1, 2, 4, 6].map((c) => (
            <div key={c} className={`h-3.5 w-3.5 rounded-[3px] ${intensity(c)}`} />
          ))}
          <span>Rajin</span>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
