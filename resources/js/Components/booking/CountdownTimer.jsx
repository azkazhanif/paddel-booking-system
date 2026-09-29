import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import { TimerReset } from 'lucide-react';

/**
 * Hitung mundur batas bayar. until: timestamp ISO; onExpire dipanggil saat habis.
 */
export default function CountdownTimer({ until, onExpire, label = 'Sisa waktu pembayaran', className }) {
    const { label: time, expired, seconds } = useCountdown(until, onExpire);

    if (seconds === null) return null;

    const urgent = seconds <= 120;

    return (
        <div
            role="timer"
            aria-live="off"
            className={cn(
                'flex items-center justify-between gap-4 rounded-md border px-4 py-3',
                expired || urgent ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-ink-700 bg-ink-900',
                className,
            )}
        >
            <span className="flex items-center gap-2 text-sm text-current/80">
                <TimerReset aria-hidden className="size-4" />
                {expired ? 'Waktu pembayaran habis' : label}
            </span>
            <span className="font-display text-2xl font-semibold tabular-nums">{time}</span>
        </div>
    );
}
