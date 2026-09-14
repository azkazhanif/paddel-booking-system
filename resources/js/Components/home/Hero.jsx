import Magnetic from '@/Components/animation/Magnetic';
import Badge from '@/Components/common/Badge';
import BentoCard from '@/Components/common/BentoCard';
import BentoGrid from '@/Components/common/BentoGrid';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import CourtVisual from '@/Components/common/CourtVisual';
import Section from '@/Components/common/Section';
import { useIntro } from '@/hooks/useIntro';
import { formatRupiahCompact } from '@/lib/format';
import { gsap, MOTION_OK, SplitText, useGSAP } from '@/lib/gsap';
import { safeRoute } from '@/lib/utils';
import { ArrowDown, ArrowUpRight, Clock, Wallet } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Hero({ hero, pricing, stats, dpPercentage }) {
    const introDone = useIntro();
    const ref = useRef(null);
    const headlineRef = useRef(null);
    const timelineRef = useRef(null);
    const introDoneRef = useRef(introDone);

    const words = (hero?.headline ?? 'Own The Court.').trim().split(' ');
    const lastWord = words.pop();
    const lowestPrice = Math.min(...Object.values(pricing).filter(Boolean));

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                SplitText.create(headlineRef.current, {
                    type: 'lines,words,chars',
                    mask: 'lines',
                    autoSplit: true,
                    onSplit: (self) => {
                        const timeline = gsap
                            .timeline({ paused: !introDoneRef.current })
                            .from(self.chars, { yPercent: 120, duration: 1.4, stagger: 0.03 })
                            .from('[data-court-line]', { drawSVG: 0, duration: 2.2, stagger: 0.18, ease: 'power2.inOut' }, 0)
                            .from('[data-hero-fade]', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.5)
                            .from('[data-hero-card]', { y: 100, autoAlpha: 0, duration: 1.3, stagger: 0.1 }, 0.7);

                        timelineRef.current = timeline;

                        return timeline;
                    },
                });

                gsap.to(headlineRef.current, {
                    yPercent: -30,
                    ease: 'none',
                    scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
                });
            });
        },
        { scope: ref },
    );

    useEffect(() => {
        introDoneRef.current = introDone;
        if (introDone) timelineRef.current?.play();
    }, [introDone]);

    return (
        <Section tone="dark" className="flex min-h-svh flex-col overflow-hidden pt-28 pb-6 md:pt-36 md:pb-10">
            <div ref={ref} className="flex flex-1 flex-col">
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 flex justify-center" data-speed="0.7">
                    <CourtVisual className="w-[140%] max-w-none text-court-500/15 md:w-[92%]" strokeClassName="stroke-current" />
                </div>
                <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[48rem] -translate-x-1/2 rounded-full bg-court-700/30 blur-[140px]" />

                <Container className="relative flex flex-1 flex-col">
                    <div data-hero-fade className="flex flex-wrap items-center gap-2">
                        <Badge variant="glass" dot className="text-court-500">
                            {stats.available_today} slot tersedia hari ini
                        </Badge>
                        <Badge variant="glass">{stats.courts} lapangan premium</Badge>
                    </div>

                    <h1
                        ref={headlineRef}
                        className="mt-8 font-display text-[clamp(3.75rem,14.5vw,13.5rem)] leading-[0.82] font-semibold tracking-[-0.045em] uppercase"
                    >
                        {words.join(' ')} <span className="text-court-500">{lastWord}</span>
                    </h1>

                    <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
                        <p data-hero-fade className="max-w-md text-base leading-relaxed text-bone-50/70 md:text-lg">
                            {hero?.subheadline}
                        </p>
                        <div data-hero-fade className="flex flex-wrap items-center gap-3">
                            <Magnetic>
                                <Button href={safeRoute('booking.create', '#availability')} size="lg" icon={ArrowUpRight} cursor="Book">
                                    Book a Court
                                </Button>
                            </Magnetic>
                            <Button href="#availability" size="lg" variant="outline" icon={ArrowDown}>
                                Cek Jadwal
                            </Button>
                        </div>
                    </div>

                    <BentoGrid className="mt-auto pt-12 md:auto-rows-auto">
                        <BentoCard data-hero-card tone="green" colSpan={{ md: 2, lg: 4 }} className="justify-between gap-6 p-5 md:p-6">
                            <Wallet className="size-5" />
                            <p className="text-sm font-medium">
                                Mulai dari
                                <span className="block font-display text-4xl font-semibold tracking-tight">
                                    Rp{formatRupiahCompact(lowestPrice)}
                                    <span className="text-base font-medium opacity-60"> /jam</span>
                                </span>
                            </p>
                        </BentoCard>
                        <BentoCard data-hero-card tone="ink" colSpan={{ md: 2, lg: 4 }} className="justify-between gap-6 p-5 md:p-6">
                            <Clock className="size-5 text-court-500" />
                            <p className="text-sm font-medium text-bone-50/70">
                                Buka setiap hari
                                <span className="block font-display text-4xl font-semibold tracking-tight text-bone-50">
                                    {stats.open_time}–{stats.close_time}
                                </span>
                            </p>
                        </BentoCard>
                        <BentoCard data-hero-card tone="lime" colSpan={{ md: 2, lg: 4 }} className="justify-between gap-6 p-5 md:p-6">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">Member only</span>
                            <p className="text-sm font-medium">
                                Amankan slot cukup
                                <span className="block font-display text-4xl font-semibold tracking-tight">DP {dpPercentage}%</span>
                            </p>
                        </BentoCard>
                    </BentoGrid>
                </Container>
            </div>
        </Section>
    );
}
