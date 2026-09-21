import { Switch } from '@/Components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Toggle dengan label & deskripsi. Dipakai dengan useCheckboxField (checked + onCheckedChange).
 */
export default function SwitchField({ id, label, description, checked, onCheckedChange, error, className }) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-center justify-between gap-6 rounded-md border border-ink-700 bg-ink-900 p-4">
                <label htmlFor={id} className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{label}</span>
                    {description && <span className="text-sm text-bone-50/50">{description}</span>}
                </label>
                <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-invalid={Boolean(error)} />
            </div>
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
