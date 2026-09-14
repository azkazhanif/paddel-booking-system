import SplitHeading from '@/Components/animation/SplitHeading';
import Container from '@/Components/common/Container';
import Logo from '@/Components/common/Logo';
import Section from '@/Components/common/Section';
import { NAV_LINKS } from '@/Components/home/Navbar';
import { scrollToTarget } from '@/lib/gsap';
import { safeRoute } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function Footer({ venue = {} }) {
    const legal = [
        { label: 'Syarat & Ketentuan', href: safeRoute('terms', null) },
        { label: 'Kebijakan Privasi', href: safeRoute('privacy', null) },
    ].filter((link) => link.href);

    const socials = Object.entries(venue.socials ?? {});

    return (
        <Section as="footer" tone="dark" className="overflow-hidden pt-24 pb-6 md:pt-32">
            <Container>
                <div className="grid gap-12 border-b border-ink-700 pb-16 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <Logo />
                        <p className="mt-6 max-w-sm text-bone-50/60">{venue.address}</p>
                        {venue.whatsapp && (
                            <a href={`https://wa.me/${venue.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-semibold text-court-500 hover:underline">
                                WhatsApp admin
                            </a>
                        )}
                    </div>
                    <nav className="md:col-span-3" aria-label="Navigasi footer">
                        <p className="text-xs font-bold tracking-[0.2em] text-bone-50/40 uppercase">Jelajahi</p>
                        <ul className="mt-5 flex flex-col gap-3">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            scrollToTarget(link.href);
                                        }}
                                        className="text-bone-50/80 hover:text-court-500"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <div className="md:col-span-4">
                        <p className="text-xs font-bold tracking-[0.2em] text-bone-50/40 uppercase">Ikuti kami</p>
                        <ul className="mt-5 flex flex-col gap-3">
                            {socials.map(([name, url]) => (
                                <li key={name}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-bone-50/80 capitalize hover:text-court-500">
                                        {name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <SplitHeading
                    as="p"
                    type="chars"
                    stagger={0.08}
                    start="top 98%"
                    className="pointer-events-none mt-6 text-center text-[clamp(8rem,38vw,34rem)] leading-[0.78] tracking-[-0.06em] text-court-500 select-none"
                >
                    PBS
                </SplitHeading>

                <div className="mt-6 flex flex-col gap-3 text-sm text-bone-50/40 md:flex-row md:items-center md:justify-between">
                    <p>
                        © {new Date().getFullYear()} {venue.name}. All rights reserved.
                    </p>
                    <ul className="flex gap-5">
                        {legal.map((link) => (
                            <li key={link.label}>
                                <Link href={link.href} className="hover:text-bone-50">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </Container>
        </Section>
    );
}
