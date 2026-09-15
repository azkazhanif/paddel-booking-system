import { Checkbox } from '@/Components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function CheckboxField({ id, checked, onCheckedChange, error, className, children }) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-start gap-3">
                <Checkbox
                    id={id}
                    name={id}
                    checked={checked}
                    onCheckedChange={(value) => onCheckedChange(value === true)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className="mt-0.5"
                />
                <label htmlFor={id} className="text-sm leading-relaxed text-bone-50/70 select-none">
                    {children}
                </label>
            </div>
            {error && (
                <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
