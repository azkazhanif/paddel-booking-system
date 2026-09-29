import Logo from '@/Components/common/Logo';
import { safeRoute } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Layout halaman aplikasi publik (booking, checkout, status): header ringkas tanpa
 * smooth scroll & animasi homepage agar form tetap responsif.
 */
export default function AppLayout({ title, back, children }) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-svh flex-col bg-ink-950 text-bone-50">
            <Head title={title} />

            <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link href={safeRoute('home', '/')} aria-label="PBS — Beranda">
                            <Logo className="text-lg" />
                        </Link>
                        {back && (
                            <Link
                                href={back.href}
                                className="group hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-bone-50/50 transition-colors hover:text-bone-50 sm:inline-flex"
                            >
                                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                                {back.label}
                            </Link>
                        )}
                    </div>

                    <Link
                        href={auth?.user ? safeRoute('dashboard') : safeRoute('login')}
                        className="rounded-full px-4 py-2 text-sm font-medium text-bone-50/70 transition-colors hover:bg-white/5 hover:text-bone-50"
                    >
                        {auth?.user ? auth.user.name : 'Masuk'}
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-12">{children}</main>

            <footer className="border-t border-ink-800 py-6">
                <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-bone-50/35 md:px-6">
                    <p>© {new Date().getFullYear()} PBS — Paddel Booking System</p>
                    <p>Zona waktu WIB (Asia/Jakarta)</p>
                </div>
            </footer>
        </div>
    );
}
