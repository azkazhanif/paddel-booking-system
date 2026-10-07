import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Menyegarkan data ketersediaan slot secara berkala selama tab terlihat, dan
 * segera setelah tab kembali aktif — supaya slot yang baru dipesan orang lain
 * tidak terus tampil kosong.
 *
 * useAvailability(['availability', 'selected'], { court_id, date });
 */
export function useAvailability(only, data, { interval = 30000, enabled = true } = {}) {
    // Disimpan di ref agar perubahan filter tidak mematikan timer yang sedang jalan.
    const payload = useRef({ only, data });

    payload.current = { only, data };

    useEffect(() => {
        if (!enabled) return undefined;

        const refresh = () => {
            if (document.visibilityState !== 'visible') return;

            router.reload({ only: payload.current.only, data: payload.current.data });
        };

        const timer = setInterval(refresh, interval);
        const onVisible = () => document.visibilityState === 'visible' && refresh();

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [enabled, interval]);
}
