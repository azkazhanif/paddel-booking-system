import CountUp from '@/Components/animation/CountUp';
import Reveal from '@/Components/animation/Reveal';
import Badge from '@/Components/common/Badge';
import BentoCard from '@/Components/common/BentoCard';
import BentoGrid from '@/Components/common/BentoGrid';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { safeRoute } from '@/lib/utils';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { useRef } from 'react';

function AvailabilityBar({ available, total }) {
    const ref = useRef(null);

    useGSAP(
        () => {
            gsap.matchMedia().add(MOTION_OK, () => {
                gsap.from(ref.current, {
                    scaleX: 0,
                    duration: 1.6,
                    scrollTrigger: { trigger: ref.current, start: 'top 95%', once: true },
                });
            });
        },
        { scope: ref },
    );

    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
                ref={ref}
                className="h-full origin-left rounded-full bg-court-500"
                style={{ width: `${total ? (available / total) * 100 : 0}%` }}
            />
        </div>
    );
}

export default function AvailabilityToday({ courts }) {
    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' }).format(new Date());

    return (
        <Section id="availability" tone="ink">
            <Container>
                <SectionHeading
                    eyebrow={today}
                    title="Slot kosong hari ini"
                    description="Diperbarui langsung dari sistem booking. Pilih lapangan dan amankan jam mainmu sebelum diambil orang lain."
                />

                <Reveal selector="[data-bento]" y={60} scale={0.96} className="mt-14">
                    <BentoGrid>
                        {courts.map((court) => (
                            <BentoCard key={court.id} tone="dark" colSpan={{ md: 3, lg: 3 }} rowSpan={2} className="gap-8">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-display text-2xl leading-tight font-semibold">{court.name}</h3>
                                    <Badge variant="outline" className="capitalize">
                                        {court.type}
                                    </Badge>
                                </div>
                                <div className="mt-auto">
                                    <p className="font-display text-7xl leading-none font-semibold tracking-tighter text-court-500">
                                        <CountUp value={court.today.available} />
                                    </p>
                                    <p className="mt-2 text-sm text-bone-50/60">
                                        dari {court.today.total} slot kosong
                                        {court.today.next && (
                                            <>
                                                {' '}
                                                · paling cepat <span className="font-semibold text-bone-50">{court.today.next}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <AvailabilityBar available={court.today.available} total={court.today.total} />
                                <Button
                                    href={safeRoute('booking.create', '#courts')}
                                    variant="outline"
                                    size="sm"
                                    icon={ArrowUpRight}
                                    className="self-start"
                                    cursor="Book"
                                >
                                    Book court
                                </Button>
                            </BentoCard>
                        ))}

                        <BentoCard tone="green" colSpan={{ md: 6, lg: 12 }} className="flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink-950 text-court-500">
                                    <CalendarDays className="size-5" />
                                </span>
                                <p className="font-display text-2xl leading-tight font-semibold md:text-3xl">
                                    Mau main di hari lain? Lihat jadwal 14 hari ke depan.
                                </p>
                            </div>
                            <Button href={safeRoute('schedule.index', '#how')} variant="dark" size="lg" icon={ArrowUpRight}>
                                Lihat Jadwal
                            </Button>
                        </BentoCard>
                    </BentoGrid>
                </Reveal>

                {courts.length === 0 && <p className="mt-10 text-bone-50/60">Belum ada lapangan aktif.</p>}
            </Container>
        </Section>
    );
}
