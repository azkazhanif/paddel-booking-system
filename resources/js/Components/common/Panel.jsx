import { cn } from '@/lib/utils';

/**
 * Kartu konten area aplikasi dengan header opsional (judul, deskripsi, aksi).
 */
export default function Panel({ title, description, actions, className, bodyClassName, children }) {
    return (
        <section className={cn('flex flex-col overflow-hidden rounded-md border border-ink-800 bg-ink-900', className)}>
            {(title || actions) && (
                <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
                    <div className="min-w-0">
                        {title && <h2 className="font-semibold">{title}</h2>}
                        {description && <p className="mt-1 text-sm text-bone-50/50">{description}</p>}
                    </div>
                    {actions}
                </header>
            )}
            <div className={cn('flex-1 p-5 md:p-6', bodyClassName)}>{children}</div>
        </section>
    );
}
