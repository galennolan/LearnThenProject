/** Format tanggal ke zona Asia/Jakarta, id-ID. */
export function formatJakarta(dateInput: string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function todayJakartaISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // YYYY-MM-DD
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function toDayKey(input: string): string {
  return input.length >= 10 ? input.slice(0, 10) : input;
}

/** Selisih hari (kalender Jakarta) antara hari ini dan tanggal target. Negatif = terlewat. */
export function daysUntilTarget(target: string | null | undefined): number | null {
  if (!target) return null;
  const today = todayJakartaISO();
  const t = toDayKey(target);
  const ms = Date.parse(`${t}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return Math.round(ms / 86400000);
}

/** Label ramah: "Hari ini", "Besok", "3 hari lagi", "Terlewat 2 hari". */
export function targetLabel(target: string | null | undefined): string | null {
  const diff = daysUntilTarget(target);
  if (diff === null) return null;
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';
  if (diff > 1) return `${diff} hari lagi`;
  const late = Math.abs(diff);
  return late === 1 ? 'Terlewat 1 hari' : `Terlewat ${late} hari`;
}
