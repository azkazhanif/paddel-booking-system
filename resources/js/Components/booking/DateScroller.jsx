import { cn } from '@/lib/utils';

const DAY = 86_400_000;
const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' });
const month = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' });

function toIso(date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

/**
 * Pilihan tanggal berbentuk strip horizontal. from: tanggal awal "YYYY-MM-DD", days: jumlah hari.
 */
export default function DateScroller({ from, days = 14, value, onChange, className }) {
    const start = new Date(`${from}T00:00:00+07:00`);
    const options = Array.from({ length: days + 1 }, (_, index) => new Date(start.getTime() + index * DAY));

    return (
        <div className={cn('-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2', className)} role="radiogroup" aria-label="Pilih tanggal main">
            {options.map((date) => {
                const iso = toIso(date);
                const selected = iso === value;

                return (
                    <button
                        key={iso}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(iso)}
                        className={cn(
                            'flex min-w-16 shrink-0 snap-start flex-col items-center gap-0.5 rounded-md border px-3 py-2.5 transition-colors',
                            selected ? 'border-court-500 bg-court-500 text-ink-950' : 'border-ink-700 text-bone-50 hover:border-court-500/60',
                        )}
                    >
                        <span className={cn('text-xs font-medium', selected ? 'text-ink-950/70' : 'text-bone-50/50')}>{weekday.format(date)}</span>
                        <span className="font-display text-xl leading-none font-semibold tabular-nums">{date.getDate()}</span>
                        <span className={cn('text-xs', selected ? 'text-ink-950/70' : 'text-bone-50/45')}>{month.format(date)}</span>
                    </button>
                );
            })}
        </div>
    );
}
