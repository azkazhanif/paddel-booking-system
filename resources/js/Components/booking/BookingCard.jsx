import StatusBadge from '@/Components/common/StatusBadge';
import { formatDateLong, formatRupiah, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowRight, MapPin } from 'lucide-react';

/**
 * Kartu ringkas satu booking untuk daftar riwayat. actions: elemen tombol di kanan bawah.
 */
export default function BookingCard({ booking, href, actions, className }) {
    return (
        <article
            className={cn('flex flex-col gap-4 rounded-md border border-ink-800 bg-ink-900 p-5 sm:flex-row sm:items-center sm:gap-6', className)}
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold tracking-wide">{booking.code}</span>
                    <StatusBadge type="booking" value={booking.status} />
                    <StatusBadge type="payment" value={booking.payment_status} />
                </div>

                <p className="mt-3 font-display text-xl leading-tight font-semibold">{formatDateLong(booking.date)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-bone-50/55">
                    <span className="tabular-nums">{formatTimeRange(booking.start_time, booking.end_time)}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden className="size-3.5" />
                        {booking.court?.name ?? '—'}
                    </span>
                </p>

                {booking.remaining_amount > 0 && booking.payment_status !== 'unpaid' && (
                    <p className="mt-2 text-sm text-amber-300">Sisa tagihan {formatRupiah(booking.remaining_amount)}</p>
                )}
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <p className="font-display text-xl font-semibold tabular-nums">{formatRupiah(booking.total)}</p>
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                    {href && (
                        <Link
                            href={href}
                            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-court-400 transition-colors hover:bg-court-500/10"
                        >
                            Detail
                            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
