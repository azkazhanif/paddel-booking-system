import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * State filter halaman index yang disinkronkan ke query string (router.get, preserveState).
 * Field teks (debounceKeys) dikirim setelah jeda mengetik; field lain langsung.
 *
 * const { values, set, reset } = useFilters('admin.bookings.index', filters, { debounceKeys: ['search'] });
 */
export function useFilters(routeName, initial = {}, { debounceKeys = ['search'], delay = 350, params } = {}) {
    const [values, setValues] = useState(initial);
    const timer = useRef(null);

    const visit = (next) => {
        const query = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== '' && value !== null && value !== undefined));

        router.get(route(routeName, params), query, { preserveState: true, preserveScroll: true, replace: true });
    };

    useEffect(() => () => clearTimeout(timer.current), []);

    const set = (key, value) => {
        const next = { ...values, [key]: value };
        setValues(next);
        clearTimeout(timer.current);

        if (debounceKeys.includes(key)) {
            timer.current = setTimeout(() => visit(next), delay);
            return;
        }

        visit(next);
    };

    const reset = (defaults = {}) => {
        clearTimeout(timer.current);
        setValues(defaults);
        visit(defaults);
    };

    const active = Object.entries(values).some(([key, value]) => value && !(key in (params ?? {})));

    return { values, set, reset, active };
}
