import FormField from '@/Components/form/FormField';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Input teks lengkap dengan label & error. icon: komponen lucide di sisi kiri. trailing: elemen di sisi kanan.
 */
export default function TextField({ id, label, action, hint, error, icon: Icon, trailing, className, inputClassName, ...props }) {
    return (
        <FormField id={id} label={label} action={action} hint={hint} error={error} className={className}>
            <div className="relative">
                {Icon && <Icon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-bone-50/40" />}
                <Input
                    id={id}
                    name={id}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                    className={cn(Icon && 'pl-11', trailing && 'pr-12', inputClassName)}
                    {...props}
                />
                {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
            </div>
        </FormField>
    );
}
