import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { DESKTOP, gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { CalendarCheck, CreditCard, QrCode } from 'lucide-react';
import { useRef } from 'react';

export default function HowItWorks({ dpPercentage }) {
    const ref = useRef(null);

    const steps = [
        { icon: CalendarCheck, title: 'Pilih jadwal', text: 'Pilih tanggal, lapangan, dan jam kosong. Slot langsung ditahan 15 menit untukmu.' },
        { icon: CreditCard, title: 'Bayar instan', text: `Bayar lewat QRIS, e-wallet, atau virtual account. Member cukup DP ${dpPercentage}%.` },
        { icon: QrCode, title: 'Main!', text: 'E-ticket QR & invoice dikirim ke email. Tunjukkan di resepsionis, langsung ke lapangan.' },
    ];

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
                const items = gsap.utils.toArray('[data-step]');

                gsap.set(items.slice(1), { autoAlpha: 0.2 });

                const timeline = gsap.timeline({
                    defaults: { ease: 'none', duration: 1 },
                    scrollTrigger: {
                        trigger: '[data-steps-pin]',
                        start: 'top top',
                        end: `+=${items.length * 70}%`,
                        pin: true,
                        scrub: 1,
                        snap: { snapTo: 1 / (items.length - 1), duration: 0.4, ease: 'power2.inOut' },
                    },
                });

                timeline.fromTo('[data-step-progress]', { scaleY: 0 }, { scaleY: 1, duration: items.length - 1 }, 0);

                items.slice(1).forEach((item, index) => {
                    timeline
                        .to(items[index], { autoAlpha: 0.2 }, index)
                        .to(item, { autoAlpha: 1 }, index)
                        .to('[data-step-numbers]', { yPercent: -((index + 1) * 100) / items.length }, index);
                });
            });
        },
        { scope: ref },
    );

    return (
        <Section id="how" tone="bone" className="py-0 md:py-0">
            <div ref={ref}>
                <div data-steps-pin className="flex min-h-svh items-center py-24">
                    <Container className="grid gap-14 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <SectionHeading eyebrow="Cara booking" title="Tiga langkah ke lapangan" titleClassName="text-[clamp(2.5rem,4.8vw,4.75rem)]" />
                            <div className="mt-10 hidden h-[clamp(6rem,11vw,10rem)] overflow-hidden lg:block">
                                <div data-step-numbers>
                                    {steps.map((_, index) => (
                                        <p
                                            key={index}
                                            className="font-display text-[clamp(6rem,11vw,10rem)] leading-none font-semibold tracking-tighter text-court-700"
                                        >
                                            0{index + 1}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <ol className="relative flex flex-col gap-4 lg:col-span-6 lg:col-start-7">
                            <span aria-hidden className="absolute top-0 bottom-0 left-7 hidden w-px bg-ink-950/10 lg:block">
                                <span data-step-progress className="block h-full w-full origin-top bg-court-700" />
                            </span>
                            {steps.map((step, index) => (
                                <li key={step.title} data-step className="relative flex gap-6 rounded-md bg-white p-6 md:p-8">
                                    <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-ink-950 text-court-500">
                                        <step.icon className="size-6" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold tracking-[0.2em] text-ink-950/40 uppercase">Langkah 0{index + 1}</p>
                                        <h3 className="mt-2 font-display text-3xl leading-none font-semibold tracking-tight md:text-4xl">{step.title}</h3>
                                        <p className="mt-3 text-ink-950/60">{step.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Container>
                </div>
            </div>
        </Section>
    );
}
