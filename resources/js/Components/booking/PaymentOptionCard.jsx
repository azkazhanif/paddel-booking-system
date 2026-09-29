import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

/**
 * Kartu pilihan pembayaran di checkout (bayar penuh / DP). locked: tampil terkunci
 * dengan alasan + CTA (mis. tombol daftar untuk tamu).
 */
export default function PaymentOptionCard({ id, name, value, checked, onChange, title, amount, description, note, locked = false, lockedReason, action, className }) {
    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                checked && !locked ? 'border-court-500 bg-court-500/10' : 'border-ink-700 hover:border-ink-400/40',
                locked && 'cursor-not-allowed border-ink-800 bg-white/[0.02]',
                className,
            )}
        >
            <input
                id={id}
                type="radio"
                name={name}
                value={value}
                checked={checked && !locked}
                disabled={locked}
                onChange={() => onChange(value)}
                className="mt-1 size-4 shrink-0 accent-court-500"
            />
            <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn('flex items-center gap-2 font-semibold', locked && 'text-bone-50/45')}>
                        {locked && <Lock aria-hidden className="size-3.5" />}
                        {title}
                    </span>
                    <span className={cn('font-display text-lg font-semibold tabular-nums', locked && 'text-bone-50/35')}>{formatRupiah(amount)}</span>
                </span>
                {description && <span className={cn('mt-1 block text-xs', locked ? 'text-bone-50/35' : 'text-bone-50/55')}>{description}</span>}
                {locked && lockedReason && <span className="mt-2 block text-xs text-amber-300/80">{lockedReason}</span>}
                {note && !locked && <span className="mt-2 block text-xs text-bone-50/45">{note}</span>}
                {action && <span className="mt-3 block">{action}</span>}
            </span>
        </label>
    );
}
