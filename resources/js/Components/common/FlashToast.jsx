import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const TONES = {
    success: { icon: CircleCheck, className: 'text-court-400' },
    error: { icon: CircleAlert, className: 'text-red-300' },
};

/**
 * Menampilkan flash session (success/error) dari Laravel sebagai toast yang hilang otomatis.
 */
export default function FlashToast() {
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const tone = flash?.error ? 'error' : flash?.success ? 'success' : null;

        if (!tone) return;

        setToast({ tone, message: flash[tone], key: Date.now() });
        const timer = setTimeout(() => setToast(null), 5000);

        return () => clearTimeout(timer);
    }, [flash]);

    if (!toast) return null;

    const { icon: Icon, className } = TONES[toast.tone];

    return (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
            <div
                key={toast.key}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex w-full max-w-sm animate-in items-start gap-3 rounded-md border border-ink-700 bg-ink-800 p-4 text-sm text-bone-50 shadow-2xl shadow-black/40 fade-in slide-in-from-bottom-4"
            >
                <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', className)} />
                <p className="flex-1">{toast.message}</p>
                <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="-m-1 grid size-6 place-items-center rounded-full text-bone-50/50 hover:bg-white/10 hover:text-bone-50"
                    aria-label="Tutup notifikasi"
                >
                    <X className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
