import Reveal from '@/Components/animation/Reveal';
import DateScroller from '@/Components/booking/DateScroller';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import EmptyState from '@/Components/common/EmptyState';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import { useAvailability } from '@/hooks/useAvailability';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatDateLong, formatRupiah, formatTime } from '@/lib/format';
import { cn, safeRoute } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, CalendarOff } from 'lucide-react';

const SLOT_STYLE = {
    available: 'border-court-500/40 text-bone-50 hover:border-court-500 hover:bg-court-500 hover:text-ink-950',
    booked: 'border-ink-800 bg-white/[0.02] text-bone-50/25 line-through pointer-events-none',
    blocked: 'border-ink-800 bg-white/[0.02] text-bone-50/25 pointer-events-none',
    past: 'border-ink-800 bg-white/[0.02] text-bone-50/20 pointer-events-none',
};

export default function ScheduleIndex({ venue, selected, today, advanceDays, slotMinutes, schedule }) {
    const totalOpen = schedule.reduce((sum, court) => sum + court.slots.filter((slot) => slot.status === 'available').length, 0);

    const changeDate = (date) => router.reload({ only: ['schedule', 'selected'], data: { date } });

    useAvailability(['schedule'], { date: selected.date });

    return (
        <PublicLayout venue={venue}>
            <Head title="Jadwal">
                <meta name="description" content={`Jadwal lapangan padel ${venue.name} — lihat jam kosong semua lapangan secara real-time.`} />
            </Head>

            <PageHero
                eyebrow="Jadwal"
                title="Semua jam, satu layar."
                description={`Bandingkan jam kosong antar lapangan, lalu klik slotnya untuk langsung booking. Satu slot = ${slotMinutes} menit.`}
            >
                <Reveal y={24} delay={0.3} className="mt-12">
                    <DateScroller from={today} days={advanceDays} value={selected.date} onChange={changeDate} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-bone-50/55">
                            {formatDateLong(selected.date)} · {totalOpen} slot kosong
                        </p>
                        <input
                            type="date"
                            aria-label="Pilih tanggal lain"
                            value={selected.date}
                            min={today}
                            onChange={(event) => event.target.value && changeDate(event.target.value)}
                            className="h-10 rounded-md border border-ink-700 bg-ink-900 px-3 text-sm text-bone-50"
                        />
                    </div>
                </Reveal>
            </PageHero>

            <Section tone="ink" className="pt-0 md:pt-0">
                <Container className="flex flex-col gap-10">
                    {schedule.length ? (
                        schedule.map((court, index) => (
                            <Reveal key={court.id} y={28} delay={index * 0.06}>
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <h2 className="font-display text-2xl font-semibold tracking-tight">{court.name}</h2>
                                        <p className="mt-1 text-sm text-bone-50/45">
                                            {court.slots.filter((slot) => slot.status === 'available').length} dari {court.slots.length} slot kosong
                                        </p>
                                    </div>
                                    <Link
                                        href={safeRoute('courts.show', '#', { court: court.slug })}
                                        className="text-sm font-semibold text-court-400 hover:underline"
                                    >
                                        Detail lapangan →
                                    </Link>
                                </div>

                                {court.slots.length ? (
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                        {court.slots.map((slot) => (
                                            <Link
                                                key={slot.start_time}
                                                href={safeRoute('booking.create', '/booking', {
                                                    court_id: court.id,
                                                    date: selected.date,
                                                })}
                                                className={cn(
                                                    'flex flex-col gap-0.5 rounded-md border px-3 py-2.5 transition-colors',
                                                    SLOT_STYLE[slot.status],
                                                )}
                                                tabIndex={slot.status === 'available' ? undefined : -1}
                                            >
                                                <span className="text-sm font-semibold tabular-nums">{formatTime(slot.start_time)}</span>
                                                <span className="text-xs tabular-nums opacity-70">
                                                    {slot.status === 'available' ? formatRupiah(slot.price) : 'Terisi'}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-4 rounded-md border border-dashed border-ink-700 px-4 py-6 text-center text-sm text-bone-50/45">
                                        Tutup pada tanggal ini.
                                    </p>
                                )}
                            </Reveal>
                        ))
                    ) : (
                        <EmptyState
                            icon={CalendarOff}
                            title="Belum ada lapangan aktif"
                            description="Jadwal akan muncul begitu lapangan diaktifkan admin."
                            className="rounded-md border border-dashed border-ink-700"
                        />
                    )}

                    <Button href={safeRoute('booking.create')} icon={ArrowUpRight} cursor="Book" className="self-start">
                        Mulai booking
                    </Button>
                </Container>
            </Section>
        </PublicLayout>
    );
}
