/**
 * Menghubungkan field ke form Inertia (useForm): value, error, dan onChange yang sekaligus menghapus error field.
 *
 * const field = useFormField(form);
 * <TextField id="email" {...field('email')} />
 */
export function useFormField({ data, setData, errors, clearErrors }) {
    return (name) => ({
        value: data[name],
        error: errors[name],
        onChange: (event) => {
            setData(name, event.target.value);
            if (errors[name]) clearErrors(name);
        },
    });
}

export function useCheckboxField({ data, setData, errors, clearErrors }) {
    return (name) => ({
        checked: data[name],
        error: errors[name],
        onCheckedChange: (value) => {
            setData(name, value);
            if (errors[name]) clearErrors(name);
        },
    });
}
