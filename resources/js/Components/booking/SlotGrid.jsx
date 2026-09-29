import { formatRupiah, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_STYLE = {
    available: 'border-ink-700 text-bone-50 hover:border-court-500',
    ongoing: 'border-amber-400/40 text-amber-200 hover:border-amber-300',
    booked: 'cursor-not-allowed border-ink-800 bg-white/[0.02] text-bone-50/25 line-through',
    blocked: 'cursor-not-allowed border-ink-800 bg-white/[0.02] text-bone-50/25',
    past: 'cursor-not-allowed border-ink-800 bg-white/[0.02] text-bone-50/20',
};

const STATUS_NOTE = { booked: 'Terisi', blocked: 'Diblokir', past: 'Lewat', ongoing: 'Berjalan' };

const selectable = (slot) => slot.status === 'available' || slot.status === 'ongoing';

/**
 * Grid jam main. slots: [{ start_time, end_time, status, price, price_label }].
 * value: daftar start_time terpilih; pilihan wajib berurutan dan maksimal maxSlots.
 */
export default function SlotGrid({ slots, value = [], onChange, maxSlots = 3, className }) {
    const toggle = (slot) => {
        if (!selectable(slot)) return;

        const next = value.includes(slot.start_time) ? value.filter((time) => time !== slot.start_time) : [...value, slot.start_time].sort();
        const chosen = next.map((time) => slots.find((item) => item.start_time === time)).filter(Boolean);
        const contiguous = chosen.every((item, index) => index === 0 || chosen[index - 1].end_time === item.start_time);

        // Pilihan yang memutus rangkaian atau melewati batas dimulai ulang dari slot yang baru diklik.
        onChange(contiguous && next.length <= maxSlots ? next : [slot.start_time]);
    };

    if (!slots.length) {
        return <p className="rounded-md border border-dashed border-ink-700 px-4 py-8 text-center text-sm text-bone-50/50">Venue tutup pada tanggal ini.</p>;
    }

    return (
        <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4', className)}>
            {slots.map((slot) => {
                const selected = value.includes(slot.start_time);

                return (
                    <button
                        key={slot.start_time}
                        type="button"
                        aria-pressed={selected}
                        disabled={!selectable(slot)}
                        onClick={() => toggle(slot)}
                        className={cn(
                            'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors disabled:pointer-events-none',
                            selected ? 'border-court-500 bg-court-500 text-ink-950' : STATUS_STYLE[slot.status],
                        )}
                    >
                        <span className="text-sm font-semibold tabular-nums">
                            {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                        </span>
                        <span className={cn('text-xs tabular-nums', selected ? 'text-ink-950/70' : 'text-bone-50/45')}>
                            {STATUS_NOTE[slot.status] && !selected ? STATUS_NOTE[slot.status] : formatRupiah(slot.price)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
