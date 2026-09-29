import { formatRupiah, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Rincian slot + total booking. items: [{ start_time, end_time, price }].
 * rows: baris tambahan [{ label, value, tone }] (mis. DP, sisa tagihan).
 */
export default function BookingSummary({ items = [], subtotal = 0, serviceFee = 0, discount = 0, total = 0, rows = [], className }) {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {items.length ? (
                <ul className="divide-y divide-ink-800 rounded-md border border-ink-800">
                    {items.map((item) => (
                        <li key={item.start_time} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                            <span className="tabular-nums">{formatTimeRange(item.start_time, item.end_time)}</span>
                            <span className="tabular-nums">{formatRupiah(item.price)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-md border border-dashed border-ink-700 px-4 py-6 text-center text-sm text-bone-50/45">
                    Pilih jam main untuk melihat total.
                </p>
            )}

            <dl className="divide-y divide-ink-800 text-sm">
                <Row label="Subtotal" value={formatRupiah(subtotal)} />
                {discount > 0 && <Row label="Diskon" value={`−${formatRupiah(discount)}`} tone="text-court-400" />}
                {serviceFee > 0 && <Row label="Biaya layanan" value={formatRupiah(serviceFee)} />}
                {rows.filter(Boolean).map((row) => (
                    <Row key={row.label} label={row.label} value={row.value} tone={row.tone} />
                ))}
                <div className="flex items-center justify-between gap-6 py-3 last:pb-0">
                    <dt className="text-bone-50/50">Total</dt>
                    <dd className="font-display text-xl font-semibold tabular-nums">{formatRupiah(total)}</dd>
                </div>
            </dl>
        </div>
    );
}

function Row({ label, value, tone }) {
    return (
        <div className="flex items-start justify-between gap-6 py-3 first:pt-0">
            <dt className="shrink-0 text-bone-50/50">{label}</dt>
            <dd className={cn('text-right font-medium tabular-nums', tone)}>{value}</dd>
        </div>
    );
}
