import Reveal from '@/Components/animation/Reveal';
import BentoCard from '@/Components/common/BentoCard';
import BentoGrid from '@/Components/common/BentoGrid';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { formatRupiah } from '@/lib/format';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn, safeRoute } from '@/lib/utils';
import { ArrowUpRight, Moon, Sun, Trophy } from 'lucide-react';
import { useRef, useState } from 'react';

const MODES = [
    { key: 'weekday', label: 'Senin – Jumat' },
    { key: 'weekend', label: 'Sabtu – Minggu' },
];

export default function PricingPreview({ pricing, stats, dpPercentage }) {
    const [mode, setMode] = useState('weekday');
    const ref = useRef(null);
    const indicatorRef = useRef(null);
    const buttonRefs = useRef({});

    const plans =
        mode === 'weekday'
            ? [
                  { icon: Sun, label: 'Off-peak', time: `${stats.open_time} – 16:00`, price: pricing.off_peak, tone: 'ink' },
                  { icon: Moon, label: 'Peak hour', time: `16:00 – ${stats.close_time}`, price: pricing.peak, tone: 'green', featured: true },
              ]
            : [{ icon: Trophy, label: 'Weekend', time: `${stats.open_time} – ${stats.close_time}`, price: pricing.weekend, tone: 'green', featured: true }];

    useGSAP(
        () => {
            const button = buttonRefs.current[mode];
            gsap.to(indicatorRef.current, { x: button.offsetLeft, width: button.offsetWidth, duration: 0.6, ease: 'expo.out' });

            if (window.matchMedia(MOTION_OK).matches) {
                gsap.from('[data-price-card]', { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.08 });
            }
        },
        { scope: ref, dependencies: [mode] },
    );

    return (
        <Section id="pricing" tone="dark">
            <Container>
                <SectionHeading
                    eyebrow="Harga"
                    title="Transparan, tanpa biaya tersembunyi"
                    description={`Harga per slot ${stats.slot_minutes} menit. Tamu bayar penuh, member bisa DP ${dpPercentage}%.`}
                />

                <div ref={ref} className="mt-14">
                    <Reveal y={20}>
                        <div className="relative inline-flex rounded-full border border-ink-700 bg-ink-900 p-1" role="tablist">
                            <span ref={indicatorRef} aria-hidden className="absolute top-1 bottom-1 left-0 rounded-full bg-court-500" />
                            {MODES.map((item) => (
                                <button
                                    key={item.key}
                                    ref={(node) => (buttonRefs.current[item.key] = node)}
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === item.key}
                                    onClick={() => setMode(item.key)}
                                    className={cn(
                                        'relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300',
                                        mode === item.key ? 'text-ink-950' : 'text-bone-50/60 hover:text-bone-50',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </Reveal>

                    <BentoGrid className="mt-6">
                        {plans.map((plan) => (
                            <BentoCard
                                key={`${mode}-${plan.label}`}
                                data-price-card
                                tone={plan.tone}
                                colSpan={{ md: plans.length === 1 ? 6 : 3, lg: plans.length === 1 ? 8 : 6 }}
                                rowSpan={2}
                                className="justify-between gap-10"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                        <plan.icon className="size-4" />
                                        {plan.label}
                                    </span>
                                    <span className="text-sm opacity-60 tabular-nums">{plan.time}</span>
                                </div>
                                <p className="font-display text-[clamp(3.5rem,7vw,6.5rem)] leading-none font-semibold tracking-tighter">
                                    {formatRupiah(plan.price)}
                                    <span className="block text-base font-medium tracking-normal opacity-60">per slot</span>
                                </p>
                                <p className={cn('text-sm', plan.tone === 'green' ? 'text-ink-950/70' : 'text-bone-50/60')}>
                                    DP member: <span className="font-semibold">{formatRupiah(Math.ceil((plan.price * dpPercentage) / 100 / 1000) * 1000)}</span>
                                </p>
                            </BentoCard>
                        ))}
                        <BentoCard
                            data-price-card
                            tone="lime"
                            colSpan={{ md: 6, lg: plans.length === 1 ? 4 : 12 }}
                            rowSpan={plans.length === 1 ? 2 : 1}
                            className="justify-between gap-6 md:flex-row md:items-center lg:flex-col lg:items-start"
                        >
                            <p className="font-display text-3xl leading-tight font-semibold">Harga spesial di hari libur diumumkan lewat jadwal.</p>
                            <Button href={safeRoute('pricing', '#availability')} variant="dark" icon={ArrowUpRight}>
                                Detail harga
                            </Button>
                        </BentoCard>
                    </BentoGrid>
                </div>
            </Container>
        </Section>
    );
}
