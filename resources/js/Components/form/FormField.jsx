import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Pembungkus field: label, aksi opsional di kanan label, konten input, hint, dan pesan error.
 */
export default function FormField({ id, label, action, hint, error, className, children }) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            {(label || action) && (
                <div className="flex items-center justify-between gap-4">
                    {label && (
                        <Label htmlFor={id} className="text-bone-50/80">
                            {label}
                        </Label>
                    )}
                    {action}
                </div>
            )}
            {children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            ) : (
                hint && (
                    <p id={`${id}-hint`} className="text-sm text-bone-50/50">
                        {hint}
                    </p>
                )
            )}
        </div>
    );
}
