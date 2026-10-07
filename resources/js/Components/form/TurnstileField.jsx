import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cf-turnstile';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);

    return new Promise((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID);
        const script = existing ?? document.createElement('script');

        script.addEventListener('load', () => resolve(window.turnstile));
        script.addEventListener('error', () => reject(new Error('Gagal memuat Turnstile.')));

        if (!existing) {
            script.id = SCRIPT_ID;
            script.src = SRC;
            script.async = true;
            document.head.appendChild(script);
        }
    });
}

/**
 * Widget Cloudflare Turnstile untuk booking tamu. Tidak merender apa pun bila
 * siteKey kosong (mis. saat pengembangan lokal).
 */
export default function TurnstileField({ siteKey, onToken, error, className }) {
    const ref = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        if (!siteKey || !ref.current) return undefined;

        let cancelled = false;

        loadTurnstile()
            .then((turnstile) => {
                if (cancelled || !ref.current) return;

                widgetId.current = turnstile.render(ref.current, {
                    sitekey: siteKey,
                    theme: 'dark',
                    callback: (token) => onToken(token),
                    'expired-callback': () => onToken(''),
                    'error-callback': () => onToken(''),
                });
            })
            .catch(() => onToken(''));

        return () => {
            cancelled = true;

            if (widgetId.current && window.turnstile) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
        // onToken sengaja tidak diikutkan agar widget tidak dirender ulang tiap ketikan.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey]);

    if (!siteKey) return null;

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div ref={ref} />
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
