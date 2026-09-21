import { cn } from '@/lib/utils';

/**
 * Pill pilihan tunggal (tab/periode). options: [{ value, label, count? }].
 */
export default function SegmentedControl({ value, onChange, options, label, className }) {
    return (
        <div role="radiogroup" aria-label={label} className={cn('inline-flex max-w-full flex-wrap gap-1 rounded-full border border-ink-800 bg-ink-900 p-1', className)}>
            {options.map((option) => {
                const selected = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                            selected ? 'bg-bone-50 text-ink-950' : 'text-bone-50/60 hover:text-bone-50',
                        )}
                    >
                        {option.label}
                        {option.count !== undefined && (
                            <span className={cn('rounded-full px-1.5 text-xs tabular-nums', selected ? 'bg-ink-950/10' : 'bg-white/8')}>{option.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
