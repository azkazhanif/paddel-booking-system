import { scrollToTarget } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

const VARIANTS = {
    primary: 'bg-court-500 text-ink-950 [--fill:var(--color-bone-50)]',
    dark: 'bg-ink-950 text-bone-50 [--fill:var(--color-court-500)] hover:text-ink-950',
    light: 'bg-bone-50 text-ink-950 [--fill:var(--color-court-500)]',
    outline: 'border border-current bg-transparent [--fill:var(--color-court-500)] hover:border-court-500 hover:text-ink-950',
    ghost: 'bg-transparent [--fill:transparent] hover:opacity-70',
};

const SIZES = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
};

/**
 * Tombol rounded-full dengan efek fill dari bawah saat hover.
 * href "#id" → smooth scroll, "http…" → tab baru, href lain → Inertia Link, tanpa href → <button>.
 */
export default function Button({
    href,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className,
    children,
    cursor,
    onClick,
    ...props
}) {
    const classes = cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court-500',
        VARIANTS[variant],
        SIZES[size],
        className,
    );

    const content = (
        <>
            <span
                aria-hidden
                className="absolute inset-0 translate-y-full rounded-full bg-(--fill) transition-transform duration-500 ease-out-expo group-hover:translate-y-0"
            />
            <span className="relative">{children}</span>
            {Icon && (
                <Icon
                    aria-hidden
                    className="relative size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-rotate-45"
                />
            )}
        </>
    );

    if (href?.startsWith('#')) {
        return (
            <a
                href={href}
                data-cursor={cursor}
                className={classes}
                onClick={(event) => {
                    event.preventDefault();
                    onClick?.(event);
                    scrollToTarget(href);
                }}
                {...props}
            >
                {content}
            </a>
        );
    }

    if (href?.startsWith('http')) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" data-cursor={cursor} className={classes} onClick={onClick} {...props}>
                {content}
            </a>
        );
    }

    if (href) {
        return (
            <Link href={href} data-cursor={cursor} className={classes} onClick={onClick} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" data-cursor={cursor} className={classes} onClick={onClick} {...props}>
            {content}
        </button>
    );
}
