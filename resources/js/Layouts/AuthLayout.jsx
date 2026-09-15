import Reveal from '@/Components/animation/Reveal';
import SplitHeading from '@/Components/animation/SplitHeading';
import AuthAside from '@/Components/auth/AuthAside';
import Eyebrow from '@/Components/common/Eyebrow';
import Logo from '@/Components/common/Logo';
import { safeRoute } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Layout split untuk halaman auth: panel brand di kiri (desktop), form di kanan.
 */
export default function AuthLayout({ title, eyebrow, heading, description, aside, footer, children }) {
    return (
        <div className="min-h-svh bg-ink-950 text-bone-50 lg:grid lg:grid-cols-2">
            <Head title={title} />

            <AuthAside {...aside} />

            <main className="flex min-h-svh flex-col px-4 py-5 md:px-10 lg:px-16">
                <header className="flex items-center justify-between">
                    <Link href={safeRoute('home', '/')} className="lg:invisible" aria-label="PBS — Beranda">
                        <Logo />
                    </Link>
                    <Link
                        href={safeRoute('home', '/')}
                        className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-bone-50/60 transition-colors hover:bg-white/5 hover:text-bone-50"
                    >
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                        Beranda
                    </Link>
                </header>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
                    {eyebrow && (
                        <Reveal y={12}>
                            <Eyebrow className="mb-4 text-court-500">{eyebrow}</Eyebrow>
                        </Reveal>
                    )}
                    <SplitHeading as="h1" className="text-5xl leading-[0.95] md:text-6xl">
                        {heading}
                    </SplitHeading>
                    {description && (
                        <Reveal y={16} delay={0.15}>
                            <p className="mt-4 text-bone-50/60">{description}</p>
                        </Reveal>
                    )}
                    {aside?.highlight && (
                        <Reveal y={16} delay={0.2} className="lg:hidden">
                            <div className="mt-8 flex items-center justify-between gap-6 rounded-md border border-ink-700 bg-ink-800 p-5">{aside.highlight}</div>
                        </Reveal>
                    )}

                    <div className="mt-10">{children}</div>

                    {footer && (
                        <Reveal y={12} delay={0.3}>
                            <div className="mt-8 border-t border-ink-700 pt-6 text-sm text-bone-50/60">{footer}</div>
                        </Reveal>
                    )}
                </div>

                <p className="text-center text-xs text-bone-50/30 lg:text-left">© {new Date().getFullYear()} PBS — Paddel Booking System</p>
            </main>
        </div>
    );
}
