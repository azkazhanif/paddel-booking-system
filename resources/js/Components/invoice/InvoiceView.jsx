import { formatDate, formatDateLong, formatDateTime, formatRupiah, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS = {
    unpaid: ['Belum dibayar', 'bg-amber-400/15 text-amber-300'],
    partial: ['DP', 'bg-lime-300/15 text-lime-300'],
    paid: ['Lunas', 'bg-court-500/15 text-court-400'],
    void: ['Batal', 'bg-white/8 text-bone-50/50'],
};

const TYPE_LABEL = { full: 'Bayar penuh', dp: 'DP', settlement: 'Pelunasan', offline: 'Di venue' };

/**
 * Invoice versi web (mengikuti isi PDF). invoice, booking, payments, venue dari server.
 */
export default function InvoiceView({ invoice, booking, payments = [], venue, className }) {
    const [statusLabel, statusClass] = STATUS[invoice.status] ?? STATUS.unpaid;

    return (
        <article className={cn('overflow-hidden rounded-md border border-ink-800 bg-ink-900', className)}>
            <header className="flex flex-col gap-6 border-b border-ink-800 p-6 sm:flex-row sm:items-start sm:justify-between md:p-8">
                <div className="min-w-0">
                    <p className="font-display text-2xl font-semibold tracking-tight">{venue.name}</p>
                    {venue.address && <p className="mt-1 text-sm text-bone-50/50">{venue.address}</p>}
                    {venue.whatsapp && <p className="text-sm text-bone-50/50">WhatsApp {venue.whatsapp}</p>}
                    {venue.tax_id && <p className="text-sm text-bone-50/50">NPWP {venue.tax_id}</p>}
                </div>
                <div className="shrink-0 sm:text-right">
                    <span
                        className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase', statusClass)}
                    >
                        {statusLabel}
                    </span>
                    <p className="mt-3 font-mono text-sm font-semibold break-all">{invoice.number}</p>
                    <p className="mt-1 text-xs text-bone-50/45">Terbit {formatDate(invoice.issued_at)}</p>
                    <p className="text-xs text-bone-50/45">Booking {booking.code}</p>
                </div>
            </header>

            <div className="grid gap-6 border-b border-ink-800 p-6 sm:grid-cols-2 md:p-8">
                <div>
                    <p className="text-xs tracking-[0.2em] text-bone-50/40 uppercase">Ditagihkan kepada</p>
                    <p className="mt-2 font-semibold">{invoice.billed_name}</p>
                    {invoice.billed_email && <p className="text-sm text-bone-50/60">{invoice.billed_email}</p>}
                    <p className="text-sm text-bone-50/60">{invoice.billed_phone}</p>
                </div>
                <div>
                    <p className="text-xs tracking-[0.2em] text-bone-50/40 uppercase">Jadwal main</p>
                    <p className="mt-2 font-semibold">{booking.court?.name}</p>
                    <p className="text-sm text-bone-50/60">{formatDateLong(booking.date)}</p>
                    <p className="text-sm text-bone-50/60">
                        {formatTimeRange(booking.start_time, booking.end_time)} WIB · {booking.players_count} pemain
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-ink-700 text-left text-xs tracking-[0.15em] text-bone-50/40 uppercase">
                            <th className="pb-3 font-medium">Deskripsi</th>
                            <th className="pb-3 text-right font-medium">Jam</th>
                            <th className="pb-3 text-right font-medium">Harga</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-800">
                        {booking.items.map((item) => (
                            <tr key={item.start_time}>
                                <td className="py-3">Sewa {booking.court?.name}</td>
                                <td className="py-3 text-right tabular-nums">{formatTimeRange(item.start_time, item.end_time)}</td>
                                <td className="py-3 text-right tabular-nums">{formatRupiah(item.price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <dl className="mt-6 ml-auto flex max-w-xs flex-col gap-2 text-sm">
                    <Row label="Subtotal" value={formatRupiah(invoice.subtotal)} />
                    {invoice.discount > 0 && <Row label="Diskon" value={`−${formatRupiah(invoice.discount)}`} />}
                    {invoice.service_fee > 0 && <Row label="Biaya layanan" value={formatRupiah(invoice.service_fee)} />}
                    <div className="mt-1 flex items-center justify-between gap-6 border-t border-ink-700 pt-3">
                        <dt className="font-semibold">Total</dt>
                        <dd className="font-display text-xl font-semibold tabular-nums">{formatRupiah(invoice.total)}</dd>
                    </div>
                    <Row label="Sudah dibayar" value={formatRupiah(invoice.paid_amount)} tone="text-court-400" />
                    <Row
                        label="Sisa tagihan"
                        value={formatRupiah(invoice.remaining_amount)}
                        tone={invoice.remaining_amount > 0 ? 'text-amber-300' : undefined}
                    />
                </dl>
            </div>

            {payments.length > 0 && (
                <div className="border-t border-ink-800 p-6 md:p-8">
                    <p className="text-xs tracking-[0.2em] text-bone-50/40 uppercase">Riwayat pembayaran</p>
                    <ul className="mt-4 divide-y divide-ink-800 text-sm">
                        {payments.map((payment) => (
                            <li key={payment.order_id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="font-medium">{TYPE_LABEL[payment.type] ?? payment.type}</p>
                                    <p className="mt-0.5 font-mono text-xs break-all text-bone-50/40">
                                        {payment.payment_method ?? payment.provider} · {payment.order_id}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="tabular-nums">{payment.status === 'settlement' ? formatRupiah(payment.amount) : '—'}</p>
                                    {payment.paid_at && <p className="text-xs text-bone-50/40">{formatDateTime(payment.paid_at)}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {venue.note && <footer className="border-t border-ink-800 p-6 text-xs text-bone-50/40 md:px-8">{venue.note}</footer>}
        </article>
    );
}

function Row({ label, value, tone }) {
    return (
        <div className="flex items-center justify-between gap-6">
            <dt className="text-bone-50/50">{label}</dt>
            <dd className={cn('font-medium tabular-nums', tone)}>{value}</dd>
        </div>
    );
}
