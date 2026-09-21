import FormField from '@/Components/form/FormField';
import { Textarea } from '@/Components/ui/textarea';

export default function TextareaField({ id, label, action, hint, error, className, ...props }) {
    return (
        <FormField id={id} label={label} action={action} hint={hint} error={error} className={className}>
            <Textarea
                id={id}
                name={id}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                {...props}
            />
        </FormField>
    );
}
