import FormField from '@/Components/form/FormField';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Select native bergaya input PBS. options: [{ value, label }]. placeholder → opsi kosong di awal.
 */
export default function SelectField({ id, label, hint, error, options = [], placeholder, size = 'md', className, selectClassName, ...props }) {
    return (
        <FormField id={id} label={label} hint={hint} error={error} className={className}>
            <div className="relative">
                <select
                    id={id}
                    name={id}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                    className={cn(
                        'w-full appearance-none rounded-md border border-input bg-ink-900 pr-10 pl-4 text-foreground transition-[color,box-shadow] outline-none hover:border-ink-400/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-50 aria-invalid:border-destructive',
                        size === 'sm' ? 'h-10 text-sm' : 'h-12 text-base',
                        selectClassName,
                    )}
                    {...props}
                >
                    {placeholder !== undefined && <option value="">{placeholder}</option>}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-bone-50/40" />
            </div>
        </FormField>
    );
}
