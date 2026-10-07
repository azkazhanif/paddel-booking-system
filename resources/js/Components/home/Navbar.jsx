import Button from '@/Components/common/Button';
import Logo from '@/Components/common/Logo';
import { useIntro } from '@/hooks/useIntro';
import { gsap, scrollToTarget, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { safeRoute } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Menu utama. Setiap item memakai halamannya sendiri bila route-nya sudah ada,
 * dan jatuh ke anchor section homepage bila belum.
 */
export function navLinks() {
    return [
        { label: 'Lapangan', href: safeRoute('courts.index', '#courts') },
        { label: 'Jadwal', href: safeRoute('schedule.index', '#availability') },
        { label: 'Harga', href: safeRoute('pricing', '#pricing') },
        { label: 'Member', href: safeRoute('membership', '#membership') },
        { label: 'FAQ', href: safeRoute('faq', '#faq') },
    ];
}

export default function Navbar() {
    const { auth } = usePage().props;
    const introDone = useIntro();
    const links = navLinks();
    const ref = useRef(null);
    const menuRef = useRef(null);
    const [open, setOpen] = useState(false);

    useGSAP(
        () => {
            gsap.set(ref.current, { yPercent: introDone ? 0 : -150 });

            if (introDone) {
                gsap.to(ref.current, { yPercent: 0, duration: 1, delay: 0.4 });
            }

            ScrollTrigger.create({
                start: 0,
                end: 'max',
                onUpdate: (self) => {
                    const hide = self.scroll() > 160 && self.direction === 1;
                    gsap.to(ref.current, { yPercent: hide ? -150 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
                },
            });
        },
        { dependencies: [introDone], revertOnUpdate: true },
    );

    useGSAP(
        () => {
            if (!open) return;

            gsap.fromTo(menuRef.current, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 });
            gsap.from('[data-menu-link]', { yPercent: 120, stagger: 0.06, duration: 0.9, delay: 0.15 });
        },
        { dependencies: [open], scope: menuRef },
    );

    useEffect(() => {
        document.documentElement.style.overflow = open ? 'hidden' : '';
    }, [open]);

    const go = (href) => {
        setOpen(false);

        if (href.startsWith('#')) {
            scrollToTarget(href);

            return;
        }

        router.visit(href);
    };

    const account = auth?.user ? { label: 'Akun', href: safeRoute('dashboard') } : { label: 'Masuk', href: safeRoute('login') };

    return (
        <>
            <header ref={ref} className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
                <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-white/10 bg-ink-950/70 pr-2 pl-5 text-bone-50 backdrop-blur-md">
                    <Link href={safeRoute('home', '/')} aria-label="PBS — Beranda">
                        <Logo className="text-lg" />
                    </Link>

                    <ul className="hidden items-center gap-1 lg:flex">
                        {links.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        go(link.href);
                                    }}
                                    className="rounded-full px-4 py-2 text-sm font-medium text-bone-50/70 transition-colors hover:bg-white/10 hover:text-bone-50"
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-2">
                        <Link
                            href={account.href}
                            className="hidden rounded-full px-4 py-2 text-sm font-medium text-bone-50/80 hover:text-bone-50 sm:inline-flex"
                        >
                            {account.label}
                        </Link>
                        <Button href={safeRoute('booking.create', '#availability')} size="sm" icon={ArrowUpRight} cursor="Book">
                            Book Now
                        </Button>
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="grid size-10 place-items-center rounded-full bg-white/10 lg:hidden"
                            aria-label="Buka menu"
                            aria-expanded={open}
                        >
                            <Menu className="size-5" />
                        </button>
                    </div>
                </nav>
            </header>

            {open && (
                <div ref={menuRef} className="fixed inset-0 z-[60] flex flex-col bg-court-500 p-6 text-ink-950" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-between">
                        <Logo />
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="grid size-11 place-items-center rounded-full bg-ink-950 text-bone-50"
                            aria-label="Tutup menu"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                    <ul className="mt-auto flex flex-col gap-1">
                        {links.map((link) => (
                            <li key={link.href} className="overflow-hidden">
                                <a
                                    data-menu-link
                                    href={link.href}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        go(link.href);
                                    }}
                                    className="block font-display text-6xl leading-tight font-semibold uppercase"
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10 flex gap-3">
                        <Button href={account.href} variant="dark" className="flex-1">
                            {account.label}
                        </Button>
                        <Button href={safeRoute('booking.create', '#availability')} variant="light" className="flex-1" onClick={() => setOpen(false)}>
                            Book Now
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
