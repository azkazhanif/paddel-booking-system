import { cn } from '@/lib/utils';

const VARIANTS = {
    green: 'bg-court-500 text-ink-950',
    lime: 'bg-lime-300 text-ink-950',
    dark: 'bg-ink-950 text-bone-50',
    outline: 'border border-current/25',
    glass: 'bg-white/10 text-bone-50 backdrop-blur',
};

export default function Badge({ variant = 'outline', dot = false, className, children }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
                VARIANTS[variant],
                className,
            )}
        >
            {dot && (
                <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-current" />
                </span>
            )}
            {children}
        </span>
    );
}
