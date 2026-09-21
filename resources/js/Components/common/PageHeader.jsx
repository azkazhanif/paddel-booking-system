import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Judul halaman dalam area aplikasi: tautan kembali opsional, judul, deskripsi, dan aksi di kanan.
 */
export default function PageHeader({ title, description, back, actions, className, children }) {
    return (
        <header className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', className)}>
            <div className="min-w-0">
                {back && (
                    <Link
                        href={back.href}
                        className="group mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-bone-50/50 transition-colors hover:text-bone-50"
                    >
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                        {back.label}
                    </Link>
                )}
                <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{title}</h1>
                {description && <p className="mt-2 max-w-2xl text-sm text-bone-50/60">{description}</p>}
                {children}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
