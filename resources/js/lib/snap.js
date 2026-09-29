const SCRIPT_ID = 'midtrans-snap';

/**
 * Muat snap.js sekali lalu kembalikan window.snap. clientKey & isProduction dikirim
 * dari server (client key aman di browser, server key tidak pernah dikirim).
 */
export function loadSnap({ clientKey, isProduction }) {
    if (window.snap) return Promise.resolve(window.snap);

    const src = isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';

    return new Promise((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID);
        const script = existing ?? document.createElement('script');

        script.addEventListener('load', () => resolve(window.snap));
        script.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap.')));

        if (!existing) {
            script.id = SCRIPT_ID;
            script.src = src;
            script.dataset.clientKey = clientKey;
            document.head.appendChild(script);
        }
    });
}
