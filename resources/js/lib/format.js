const number = new Intl.NumberFormat('id-ID');
const TIMEZONE = 'Asia/Jakarta';

export function formatRupiah(value) {
    return `Rp${number.format(value ?? 0)}`;
}

export function formatRupiahCompact(value) {
    return `${Math.round((value ?? 0) / 1000)}K`;
}

/**
 * Rupiah ringkas untuk sumbu chart & angka besar: Rp1,2 jt, Rp350 rb.
 */
export function formatRupiahShort(value) {
    const amount = value ?? 0;

    if (Math.abs(amount) >= 1_000_000_000) return `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(amount / 1_000_000_000)} M`;
    if (Math.abs(amount) >= 1_000_000) return `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(amount / 1_000_000)} jt`;
    if (Math.abs(amount) >= 1_000) return `Rp${Math.round(amount / 1_000)} rb`;

    return formatRupiah(amount);
}

export function formatNumber(value) {
    return number.format(value ?? 0);
}

export function formatPercent(value, digits = 1) {
    return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(value ?? 0)}%`;
}

/**
 * Tanggal "YYYY-MM-DD" (kolom date) diparse sebagai tanggal lokal agar tidak bergeser zona waktu.
 */
function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00+07:00`);

    return new Date(value);
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
    const date = toDate(value);

    return date ? new Intl.DateTimeFormat('id-ID', { timeZone: TIMEZONE, ...options }).format(date) : '—';
}

export function formatDateLong(value) {
    return formatDate(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(value) {
    return formatDate(value, { day: 'numeric', month: 'short' });
}

export function formatDateTime(value) {
    return formatDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * "19:00:00" → "19.00"
 */
export function formatTime(value) {
    return value ? value.slice(0, 5).replace(':', '.') : '—';
}

export function formatTimeRange(start, end) {
    return `${formatTime(start)}–${formatTime(end)}`;
}

export function initials(name) {
    return (name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
}
