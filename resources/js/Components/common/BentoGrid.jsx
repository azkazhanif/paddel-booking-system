import { cn } from '@/lib/utils';

export default function BentoGrid({ className, children, ...props }) {
    return (
        <div
            className={cn(
                'grid grid-flow-dense grid-cols-1 gap-3 md:auto-rows-[minmax(11rem,auto)] md:grid-cols-6 md:gap-4 lg:grid-cols-12',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
