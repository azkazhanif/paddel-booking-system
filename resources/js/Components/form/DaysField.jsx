import { cn } from '@/lib/utils';

const DAYS = [
    { value: 1, short: 'Sen', label: 'Senin' },
    { value: 2, short: 'Sel', label: 'Selasa' },
    { value: 3, short: 'Rab', label: 'Rabu' },
    { value: 4, short: 'Kam', label: 'Kamis' },
    { value: 5, short: 'Jum', label: 'Jumat' },
    { value: 6, short: 'Sab', label: 'Sabtu' },
    { value: 7, short: 'Min', label: 'Minggu' },
];

/**
 * Pilih hari dalam seminggu (ISO: 1 = Senin … 7 = Minggu). value & onChange memakai array angka.
 */
export default function DaysField({ label, value = [], onChange, error, className }) {
    const toggle = (day) => onChange(value.includes(day) ? value.filter((item) => item !== day) : [...value, day].sort());

    return (
        <fieldset className={cn('flex flex-col gap-2', className)}>
            {label && <legend className="mb-2 text-sm font-medium text-bone-50/80">{label}</legend>}
            <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                    const selected = value.includes(day.value);

                    return (
                        <button
                            key={day.value}
                            type="button"
                            onClick={() => toggle(day.value)}
                            aria-pressed={selected}
                            aria-label={day.label}
                            className={cn(
                                'h-9 rounded-full px-3 text-sm font-medium transition-colors',
                                selected ? 'bg-court-500 text-ink-950' : 'border border-ink-700 text-bone-50/60 hover:border-ink-400/40 hover:text-bone-50',
                            )}
                        >
                            {day.short}
                        </button>
                    );
                })}
            </div>
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </fieldset>
    );
}
