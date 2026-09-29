import { useEffect, useState } from 'react';

function secondsUntil(target) {
    if (!target) return null;

    return Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
}

/**
 * Hitung mundur ke waktu `target` (ISO string). Mengembalikan { seconds, expired, label }.
 * onExpire dipanggil sekali saat mencapai nol.
 */
export function useCountdown(target, onExpire) {
    const [seconds, setSeconds] = useState(() => secondsUntil(target));

    useEffect(() => {
        setSeconds(secondsUntil(target));

        if (!target) return undefined;

        const timer = setInterval(() => {
            const left = secondsUntil(target);

            setSeconds(left);

            if (left === 0) {
                clearInterval(timer);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(timer);
        // onExpire sengaja tidak diikutkan agar timer tidak restart tiap render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    const total = seconds ?? 0;
    const pad = (value) => String(value).padStart(2, '0');

    return {
        seconds,
        expired: seconds === 0,
        label: seconds === null ? null : total >= 3600 ? `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}` : `${pad(Math.floor(total / 60))}:${pad(total % 60)}`,
    };
}
