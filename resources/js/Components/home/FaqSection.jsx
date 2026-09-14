import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn, safeRoute } from '@/lib/utils';
import { MessageCircle, Plus } from 'lucide-react';
import { useId, useRef, useState } from 'react';

function FaqItem({ faq, open, onToggle }) {
    const ref = useRef(null);
    const panelId = useId();

    useGSAP(
        () => {
            gsap.to('[data-panel]', { height: open ? 'auto' : 0, duration: 0.6, ease: 'expo.out' });
            gsap.to('[data-icon]', { rotate: open ? 135 : 0, duration: 0.5, ease: 'expo.out' });
        },
        { scope: ref, dependencies: [open] },
    );

    return (
        <div ref={ref} className="border-b border-bone-50/10">
            <h3>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left md:py-8"
                >
                    <span className="font-display text-xl leading-tight font-semibold md:text-2xl">{faq.question}</span>
                    <span
                        data-icon
                        className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-300',
                            open ? 'bg-court-500 text-ink-950' : 'bg-white/10',
                        )}
                    >
                        <Plus className="size-5" />
                    </span>
                </button>
            </h3>
            <div id={panelId} data-panel className="h-0 overflow-hidden" role="region">
                <p className="max-w-2xl pb-8 leading-relaxed text-bone-50/70">{faq.answer}</p>
            </div>
        </div>
    );
}

export default function FaqSection({ faqs, whatsapp }) {
    const [openId, setOpenId] = useState(faqs[0]?.id ?? null);

    if (!faqs.length) return null;

    return (
        <Section id="faq" tone="ink">
            <Container className="grid gap-12 lg:grid-cols-12">
                <div className="flex flex-col gap-8 lg:col-span-5">
                    <SectionHeading eyebrow="FAQ" title="Masih ada pertanyaan?" titleClassName="text-[clamp(2.5rem,4.8vw,4.75rem)]" />
                    <Reveal y={20} className="flex flex-wrap gap-3">
                        {whatsapp && (
                            <Button href={`https://wa.me/${whatsapp}`} variant="outline" icon={MessageCircle}>
                                Chat admin
                            </Button>
                        )}
                        {safeRoute('faq', null) && (
                            <Button href={safeRoute('faq')} variant="ghost">
                                Semua FAQ
                            </Button>
                        )}
                    </Reveal>
                </div>
                <Reveal y={30} stagger={0.08} className="lg:col-span-7">
                    {faqs.map((faq) => (
                        <FaqItem key={faq.id} faq={faq} open={openId === faq.id} onToggle={() => setOpenId(openId === faq.id ? null : faq.id)} />
                    ))}
                </Reveal>
            </Container>
        </Section>
    );
}
