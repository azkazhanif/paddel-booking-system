import { cn } from '@/lib/utils';

export default function Logo({ className }) {
    return (
        <span className={cn('inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight', className)}>
            <span aria-hidden className="relative grid size-7 place-items-center rounded-full bg-court-500">
                <span className="size-2.5 rounded-full bg-ink-950" />
            </span>
            PBS
        </span>
    );
}
