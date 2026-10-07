import StatusBadge from '@/Components/common/StatusBadge';
import { formatDateLong, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Ticket } from 'lucide-react';

/**
 * E-ticket booking: kode yang ditunjukkan ke staff saat check-in beserta detail main.
 */
export default function ETicket({ booking, className }) {
    return (
        <div className={cn('overflow-hidden rounded-md border border-court-500/30 bg-court-500/5', className)}>
            <div className="flex items-center gap-2 border-b border-court-500/20 px-5 py-3 text-court-400">
                <Ticket aria-hidden className="size-4" />
                <p className="text-xs font-semibold tracking-[0.2em] uppercase">E-Ticket</p>
                <StatusBadge type="payment" value={booking.payment_status} className="ml-auto" />
            </div>

            <div className="flex flex-col items-center gap-4 px-5 py-8 text-center">
                {booking.qr && (
                    <span className="rounded-md bg-bone-50 p-3">
                        <img src={booking.qr} alt={`QR e-ticket booking ${booking.code}`} width={176} height={176} className="size-44" />
                    </span>
                )}
                <div>
                    <p className="text-xs text-bone-50/45">
                        {booking.qr ? 'Tunjukkan QR ini ke staff saat tiba' : 'Tunjukkan kode ini ke staff saat tiba'}
                    </p>
                    <p className="mt-1 font-display text-4xl font-semibold tracking-[0.15em] break-all md:text-5xl">{booking.code}</p>
                </div>
            </div>

            <dl className="grid grid-cols-2 gap-px border-t border-court-500/20 bg-court-500/10 text-sm">
                <Cell label="Lapangan" value={booking.court?.name} />
                <Cell label="Pemain" value={`${booking.players_count} orang`} />
                <Cell label="Tanggal" value={formatDateLong(booking.date)} />
                <Cell label="Jam" value={formatTimeRange(booking.start_time, booking.end_time)} />
            </dl>
        </div>
    );
}

function Cell({ label, value }) {
    return (
        <div className="bg-ink-950 px-5 py-4">
            <dt className="text-xs text-bone-50/45">{label}</dt>
            <dd className="mt-1 font-medium">{value ?? '—'}</dd>
        </div>
    );
}
