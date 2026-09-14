import CountUp from '@/Components/animation/CountUp';
import Reveal from '@/Components/animation/Reveal';
import Badge from '@/Components/common/Badge';
import BentoCard from '@/Components/common/BentoCard';
import BentoGrid from '@/Components/common/BentoGrid';
import Container from '@/Components/common/Container';
import CourtVisual from '@/Components/common/CourtVisual';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { cn } from '@/lib/utils';
import { CalendarClock, QrCode, Star, Zap } from 'lucide-react';

// Ilustrasi grid slot (dekoratif) untuk menggambarkan jadwal real-time
const DEMO_SLOTS = ['open', 'booked', 'open', 'open', 'booked', 'booked', 'open', 'selected', 'selected', 'open', 'booked', 'open'];

const SLOT_STYLE = {
    open: 'border border-court-500/60 text-court-500',
    booked: 'bg-white/5 text-bone-50/30 line-through',
    selected: 'bg-court-500 text-ink-950',
};

const PAYMENT_METHODS = ['QRIS', 'GoPay', 'ShopeePay', 'BCA VA', 'Mandiri VA', 'BNI VA', 'Kartu Kredit'];

export default function WhyPbs({ stats }) {
    return (
        <Section id="why" tone="dark">
            <Container>
                <SectionHeading
                    eyebrow="Kenapa PBS"
                    title="Booking secepat smash"
                    description="Semua yang kamu butuhkan untuk main tanpa drama: jadwal pasti, bayar instan, dan lapangan kelas turnamen."
                />

                <Reveal selector="[data-bento]" y={70} scale={0.95} stagger={0.08} className="mt-14">
                    <BentoGrid>
                        <BentoCard tone="forest" colSpan={{ md: 6, lg: 7 }} rowSpan={2} className="gap-8">
                            <CalendarClock className="size-6 text-court-500" />
                            <div>
                                <h3 className="font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Jadwal real-time</h3>
                                <p className="mt-3 max-w-md text-bone-50/70">
                                    Slot yang sudah dipesan langsung terkunci. Tidak ada lagi double booking atau tanya admin via chat.
                                </p>
                            </div>
                            <div className="mt-auto grid grid-cols-4 gap-2 sm:grid-cols-6">
                                {DEMO_SLOTS.map((status, index) => (
                                    <span
                                        key={index}
                                        className={cn('grid h-11 place-items-center rounded-full text-xs font-semibold tabular-nums', SLOT_STYLE[status])}
                                    >
                                        {String(index + 6).padStart(2, '0')}.00
                                    </span>
                                ))}
                            </div>
                        </BentoCard>

                        <BentoCard tone="green" colSpan={{ md: 3, lg: 5 }} className="justify-between gap-6">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">Lapangan premium</span>
                            <p className="font-display text-8xl leading-none font-semibold tracking-tighter">
                                <CountUp value={stats.courts} />
                            </p>
                            <CourtVisual className="absolute -right-10 -bottom-6 w-2/3 text-ink-950/15" />
                        </BentoCard>

                        <BentoCard tone="ink" colSpan={{ md: 3, lg: 5 }} className="gap-5">
                            <Zap className="size-6 text-court-500" />
                            <h3 className="font-display text-3xl leading-none font-semibold tracking-tight">Bayar instan</h3>
                            <div className="flex flex-wrap gap-2">
                                {PAYMENT_METHODS.map((method) => (
                                    <Badge key={method} variant="outline" className="text-bone-50/80">
                                        {method}
                                    </Badge>
                                ))}
                            </div>
                        </BentoCard>

                        <BentoCard tone="ink" colSpan={{ md: 2, lg: 4 }} className="justify-between gap-6">
                            <span className="text-xs font-bold tracking-[0.2em] text-bone-50/50 uppercase">Durasi slot</span>
                            <p className="font-display text-6xl leading-none font-semibold tracking-tighter">
                                <CountUp value={stats.slot_minutes} />
                                <span className="ml-2 text-2xl tracking-normal text-bone-50/50">menit</span>
                            </p>
                        </BentoCard>

                        <BentoCard tone="lime" colSpan={{ md: 2, lg: 4 }} className="justify-between gap-6">
                            <span className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star key={index} className="size-4 fill-current" />
                                ))}
                            </span>
                            <p className="font-display text-6xl leading-none font-semibold tracking-tighter">
                                {stats.reviews > 0 ? <CountUp value={stats.rating} decimals={1} /> : '—'}
                                <span className="block text-base font-medium tracking-normal opacity-60">
                                    {stats.reviews > 0 ? `dari ${stats.reviews} ulasan pemain` : 'Belum ada ulasan'}
                                </span>
                            </p>
                        </BentoCard>

                        <BentoCard tone="ink" colSpan={{ md: 2, lg: 4 }} className="justify-between gap-6">
                            <QrCode className="size-6 text-court-500" />
                            <div>
                                <h3 className="font-display text-3xl leading-none font-semibold tracking-tight">E-ticket QR</h3>
                                <p className="mt-2 text-sm text-bone-50/60">Tunjukkan di resepsionis, langsung masuk lapangan.</p>
                            </div>
                        </BentoCard>
                    </BentoGrid>
                </Reveal>
            </Container>
        </Section>
    );
}
