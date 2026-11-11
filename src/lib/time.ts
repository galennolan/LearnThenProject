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

/**
 * Format tanggal transaksi lengkap dengan Nama Hari (Senin, Selasa, dst.) dan Jam (HH:mm WIB).
 * Contoh output: "Rabu, 11 Nov 2026 • 15:45 WIB"
 */
export function formatTransactionDateTime(
  transactionDate: string | null | undefined,
  createdAt?: string | null,
): string {
  if (!transactionDate && !createdAt) return '-';

  let datePart = '-';
  const targetDateStr = transactionDate || createdAt;
  if (targetDateStr) {
    const iso = targetDateStr.includes('T') ? targetDateStr : `${targetDateStr}T00:00:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      datePart = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
  }

  let timePart = '';
  const timeSource = createdAt || (transactionDate && transactionDate.includes('T') ? transactionDate : null);
  if (timeSource) {
    const dt = new Date(timeSource);
    if (!Number.isNaN(dt.getTime())) {
      timePart =
        new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(dt) + ' WIB';
    }
  }

  if (datePart !== '-' && timePart) {
    return `${datePart} • ${timePart}`;
  }
  return datePart !== '-' ? datePart : timePart || '-';
}

/** Jam sekarang di Jakarta format HH:mm */
export function currentTimeJakarta(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
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
