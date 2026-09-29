import CourtVisual from '@/Components/common/CourtVisual';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

const TYPE_LABEL = { indoor: 'Indoor', outdoor: 'Outdoor' };

/**
 * Kartu pilih lapangan beserta sisa slot pada tanggal terpilih.
 * courts: [{ id, name, type, surface, base_price, image, available, total }].
 */
export default function CourtPicker({ courts, value, onChange, className }) {
    return (
        <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)} role="radiogroup" aria-label="Pilih lapangan">
            {courts.map((court) => {
                const selected = court.id === value;
                const full = court.available === 0;

                return (
                    <button
                        key={court.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(court.id)}
                        className={cn(
                            'group overflow-hidden rounded-md border text-left transition-colors',
                            selected ? 'border-court-500' : 'border-ink-700 hover:border-ink-400/50',
                        )}
                    >
                        <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
                            {court.image ? (
                                <img src={court.image} alt={court.name} className="size-full object-cover" loading="lazy" />
                            ) : (
                                <div className="grid size-full place-items-center p-6 text-bone-50/15">
                                    <CourtVisual />
                                </div>
                            )}
                            <span
                                className={cn(
                                    'absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-semibold',
                                    full ? 'bg-ink-950/80 text-bone-50/50' : 'bg-court-500 text-ink-950',
                                )}
                            >
                                {full ? 'Penuh' : `${court.available} slot kosong`}
                            </span>
                        </div>
                        <div className="flex items-end justify-between gap-3 p-4">
                            <div className="min-w-0">
                                <p className="truncate font-semibold">{court.name}</p>
                                <p className="mt-0.5 truncate text-xs text-bone-50/50">
                                    {TYPE_LABEL[court.type] ?? court.type}
                                    {court.surface ? ` · ${court.surface}` : ''}
                                </p>
                            </div>
                            <p className="shrink-0 text-right text-xs text-bone-50/50">
                                mulai
                                <span className="block text-sm font-semibold text-bone-50 tabular-nums">{formatRupiah(court.base_price)}</span>
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
