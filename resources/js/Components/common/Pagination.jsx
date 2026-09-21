import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

/**
 * Navigasi halaman dari paginator Laravel (props: links, from, to, total).
 */
export default function Pagination({ paginator, className }) {
    if (!paginator || paginator.total === 0) return null;

    const { links, from, to, total, last_page: lastPage } = paginator;

    return (
        <nav aria-label="Navigasi halaman" className={cn('flex flex-col items-center justify-between gap-3 text-sm sm:flex-row', className)}>
            <p className="text-bone-50/50">
                Menampilkan {formatNumber(from)}–{formatNumber(to)} dari {formatNumber(total)}
            </p>
            {lastPage > 1 && (
                <ul className="flex flex-wrap items-center gap-1">
                    {links.map((link, index) => {
                        const label = index === 0 ? '‹' : index === links.length - 1 ? '›' : link.label;
                        const classes = cn(
                            'grid h-9 min-w-9 place-items-center rounded-full px-3 font-medium tabular-nums transition-colors',
                            link.active ? 'bg-court-500 text-ink-950' : 'text-bone-50/70 hover:bg-white/5 hover:text-bone-50',
                            !link.url && 'pointer-events-none opacity-30',
                        );

                        return (
                            <li key={`${index}-${link.label}`}>
                                {link.url ? (
                                    <Link
                                        href={link.url}
                                        preserveScroll
                                        preserveState
                                        className={classes}
                                        aria-current={link.active ? 'page' : undefined}
                                        aria-label={index === 0 ? 'Sebelumnya' : index === links.length - 1 ? 'Berikutnya' : undefined}
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span className={classes}>{label}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </nav>
    );
}
