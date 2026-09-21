import { cn } from '@/lib/utils';

/**
 * Daftar label–nilai. items: [{ label, value }] (item falsy diabaikan).
 */
export default function DetailList({ items, className }) {
    return (
        <dl className={cn('divide-y divide-ink-800 text-sm', className)}>
            {items.filter(Boolean).map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-6 py-3 first:pt-0 last:pb-0">
                    <dt className="shrink-0 text-bone-50/50">{item.label}</dt>
                    <dd className="min-w-0 text-right font-medium break-words">{item.value ?? '—'}</dd>
                </div>
            ))}
        </dl>
    );
}
