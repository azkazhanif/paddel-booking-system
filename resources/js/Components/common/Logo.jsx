import { cn } from '@/lib/utils';

export default function Logo({ inverted = false, className }) {
    return (
        <span className={cn('inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight', className)}>
            <span aria-hidden className={cn('relative grid size-7 place-items-center rounded-full', inverted ? 'bg-ink-950' : 'bg-court-500')}>
                <span className={cn('size-2.5 rounded-full', inverted ? 'bg-court-500' : 'bg-ink-950')} />
            </span>
            PBS
        </span>
    );
}
