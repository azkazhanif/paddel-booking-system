import Reveal from '@/Components/animation/Reveal';
import CourtVisual from '@/Components/common/CourtVisual';
import { formatRupiah, formatTime } from '@/lib/format';
import { cn, safeRoute } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

const TYPE_LABEL = { indoor: 'Indoor', outdoor: 'Outdoor' };

/**
 * Kartu lapangan untuk halaman publik. today: { available, total, next } opsional.
 */
export default function CourtCard({ court, delay = 0, className }) {
    const today = court.today;
    const full = today && today.available === 0;

    return (
        <Reveal y={32} delay={delay} className={cn('h-full', className)}>
            <Link
                href={safeRoute('courts.show', safeRoute('booking.create'), { court: court.slug })}
                className="group flex h-full flex-col overflow-hidden rounded-md border border-ink-700 bg-ink-900 transition-colors hover:border-court-500"
                data-cursor="Lihat"
            >
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                    {court.image ? (
                        <img
                            src={court.image}
                            alt={court.name}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="grid size-full place-items-center p-8 text-bone-50/15">
                            <CourtVisual />
                        </div>
                    )}

                    {today && (
                        <span
                            className={cn(
                                'absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold',
                                full ? 'bg-ink-950/85 text-bone-50/60' : 'bg-court-500 text-ink-950',
                            )}
                        >
                            {full ? 'Penuh hari ini' : `${today.available} slot kosong`}
                        </span>
                    )}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-6">
                    <div>
                        <p className="text-xs tracking-[0.2em] text-bone-50/40 uppercase">
                            {TYPE_LABEL[court.type] ?? court.type}
                            {court.surface ? ` · ${court.surface}` : ''}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{court.name}</h3>
                        {court.description && <p className="mt-2 line-clamp-2 text-sm text-bone-50/55">{court.description}</p>}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink-800 pt-4">
                        <div>
                            <p className="text-xs text-bone-50/40">Mulai dari</p>
                            <p className="font-display text-xl font-semibold tabular-nums">{formatRupiah(court.price_from ?? court.base_price)}</p>
                            {today?.next && <p className="mt-1 text-xs text-court-400">Jam kosong terdekat {formatTime(today.next)}</p>}
                        </div>
                        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-ink-700 transition-colors group-hover:border-court-500 group-hover:bg-court-500 group-hover:text-ink-950">
                            <ArrowUpRight aria-hidden className="size-4" />
                        </span>
                    </div>
                </div>
            </Link>
        </Reveal>
    );
}
