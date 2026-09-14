import { cn } from '@/lib/utils';

export default function Eyebrow({ className, children }) {
    return (
        <p className={cn('flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase', className)}>
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {children}
        </p>
    );
}
