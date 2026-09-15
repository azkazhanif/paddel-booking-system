import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function TextLink({ href, className, children, ...props }) {
    return (
        <Link
            href={href}
            className={cn(
                'font-semibold text-court-500 underline-offset-4 transition-colors hover:text-court-400 hover:underline focus-visible:underline focus-visible:outline-none',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
