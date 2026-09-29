import { cn } from '@/lib/utils';

/**
 * Pilihan metode bayar berbentuk kartu radio. Dipakai di form booking walk-in.
 */
export default function PaymentMethodCard({ id, name, value, checked, onChange, icon: Icon, title, description, disabled = false, className }) {
    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                checked ? 'border-court-500 bg-court-500/10' : 'border-ink-700 hover:border-ink-400/40',
                disabled && 'cursor-not-allowed opacity-50',
                className,
            )}
        >
            <input
                id={id}
                type="radio"
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(value)}
                className="mt-0.5 size-4 shrink-0 accent-court-500"
            />
            <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold">
                    {Icon && <Icon aria-hidden className="size-4" />}
                    {title}
                </span>
                <span className="mt-1 block text-xs text-bone-50/55">{description}</span>
            </span>
        </label>
    );
}
