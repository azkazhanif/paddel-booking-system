import CourtVisual from '@/Components/common/CourtVisual';
import Logo from '@/Components/common/Logo';
import { gsap, MOTION_OK, SplitText, useGSAP } from '@/lib/gsap';
import { safeRoute } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useRef } from 'react';

/**
 * Panel brand hijau untuk halaman auth: judul besar, daftar keuntungan, dan kartu highlight.
 */
export default function AuthAside({ title, benefits = [], highlight }) {
    const ref = useRef(null);

    useGSAP(
        () => {
            gsap.matchMedia().add(MOTION_OK, () => {
                const split = SplitText.create('[data-aside-title]', { type: 'lines,words,chars', mask: 'lines' });

                gsap.timeline({ defaults: { ease: 'expo.out' } })
                    .from(ref.current, { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.1, ease: 'expo.inOut' })
                    .from(split.chars, { yPercent: 120, duration: 1.2, stagger: 0.025 }, '-=0.45')
                    .from('[data-court-line]', { drawSVG: 0, duration: 1.8, stagger: 0.12, ease: 'power2.inOut' }, '<')
                    .from('[data-aside-item]', { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, '-=1.2');
            });
        },
        { scope: ref },
    );

    return (
        <aside ref={ref} className="relative hidden h-svh flex-col justify-between overflow-hidden bg-court-500 p-10 text-ink-950 lg:sticky lg:top-0 lg:flex xl:p-14">
            <CourtVisual className="pointer-events-none absolute -right-1/4 bottom-[-10%] w-[120%] rotate-90 text-ink-950/10" />

            <Link href={safeRoute('home', '/')} className="relative self-start" aria-label="PBS — Beranda">
                <Logo inverted />
            </Link>

            <div className="relative">
                <p
                    data-aside-title
                    className="font-display text-[clamp(3.5rem,6.5vw,7rem)] leading-[0.85] font-semibold tracking-[-0.045em] uppercase"
                >
                    {title}
                </p>

                <ul className="mt-10 flex max-w-md flex-col gap-4">
                    {benefits.map((benefit) => (
                        <li key={benefit} data-aside-item className="flex items-start gap-3 text-lg font-medium">
                            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink-950 text-court-500">
                                <Check className="size-3.5" />
                            </span>
                            {benefit}
                        </li>
                    ))}
                </ul>
            </div>

            {highlight && (
                <div data-aside-item className="relative flex items-center justify-between gap-6 rounded-md bg-ink-950 p-6 text-bone-50">
                    {highlight}
                </div>
            )}
        </aside>
    );
}
