import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import CourtVisual from '@/Components/common/CourtVisual';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import CourtCard from '@/Components/court/CourtCard';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatDateLong, formatRupiah, formatTimeRange } from '@/lib/format';
import { cn, safeRoute } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, Check, Clock } from 'lucide-react';

const TYPE_LABEL = { indoor: 'Indoor', outdoor: 'Outdoor' };
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const LABELS = { off_peak: 'Off-peak', peak: 'Peak', weekend: 'Weekend', custom: 'Khusus' };

const SLOT_STYLE = {
    available: 'border-court-500/40 text-bone-50',
    booked: 'border-ink-700 text-bone-50/25 line-through',
    blocked: 'border-ink-700 text-bone-50/25',
    past: 'border-ink-800 text-bone-50/20',
};

export default function CourtShow({ venue, court, rules, selected, availability, others, today, advanceDays, slotMinutes }) {
    const maxDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
        new Date(new Date(`${today}T00:00:00+07:00`).getTime() + advanceDays * 86_400_000),
    );

    const bookingUrl = safeRoute('booking.create', '/booking', { court_id: court.id, date: selected.date });
    const openSlots = availability.filter((slot) => slot.status === 'available').length;

    return (
        <PublicLayout venue={venue}>
            <Head title={court.name}>
                <meta name="description" content={court.description ?? `Lapangan padel ${court.name} di ${venue.name}.`} />
            </Head>

            <PageHero
                eyebrow={`${TYPE_LABEL[court.type] ?? court.type}${court.surface ? ` · ${court.surface}` : ''}`}
                title={court.name}
                description={court.description}
                actions={
                    <>
                        <Button href={bookingUrl} icon={ArrowUpRight} cursor="Book">
                            Booking lapangan ini
                        </Button>
                        <Button href={safeRoute('courts.index')} variant="outline">
                            Lapangan lain
                        </Button>
                    </>
                }
            >
                <Reveal y={28} delay={0.3}>
                    <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-ink-700 bg-ink-700 sm:grid-cols-3">
                        <Stat label="Mulai dari" value={formatRupiah(court.price_from)} />
                        <Stat label="Durasi sewa" value={`${slotMinutes} menit / slot`} />
                        <Stat label="Kosong hari ini" value={`${openSlots} slot`} />
                    </dl>
                </Reveal>
            </PageHero>

            {court.images.length > 0 && (
                <Section tone="ink" className="py-0 md:py-0">
                    <Container>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {court.images.map((image, index) => (
                                <Reveal key={image.id} y={32} delay={index * 0.06}>
                                    <img src={image.url} alt={image.alt} loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />
                                </Reveal>
                            ))}
                        </div>
                    </Container>
                </Section>
            )}

            <Section tone="ink">
                <Container className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <SectionHeading eyebrow="Jadwal" title="Jam kosong." titleClassName="text-[clamp(2rem,4vw,3.5rem)]" />

                        <Reveal y={24} className="mt-8">
                            <label htmlFor="date" className="text-sm text-bone-50/55">
                                Tanggal
                            </label>
                            <input
                                id="date"
                                type="date"
                                value={selected.date}
                                min={today}
                                max={maxDate}
                                onChange={(event) =>
                                    event.target.value && router.reload({ only: ['availability', 'selected'], data: { date: event.target.value } })
                                }
                                className="mt-2 block h-12 rounded-md border border-ink-700 bg-ink-900 px-4 text-bone-50"
                            />
                            <p className="mt-2 text-sm text-bone-50/45">{formatDateLong(selected.date)}</p>
                        </Reveal>

                        {availability.length ? (
                            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {availability.map((slot) => (
                                    <div key={slot.start_time} className={cn('rounded-md border px-3 py-2.5', SLOT_STYLE[slot.status])}>
                                        <p className="text-sm font-semibold tabular-nums">{formatTimeRange(slot.start_time, slot.end_time)}</p>
                                        <p className="mt-0.5 text-xs opacity-60 tabular-nums">
                                            {slot.status === 'available' ? formatRupiah(slot.price) : 'Tidak tersedia'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-6 rounded-md border border-dashed border-ink-700 px-4 py-8 text-center text-sm text-bone-50/50">
                                Venue tutup pada tanggal ini.
                            </p>
                        )}

                        <Button href={bookingUrl} className="mt-8" icon={ArrowUpRight} cursor="Book">
                            Pilih jam & booking
                        </Button>
                    </div>

                    <div className="flex flex-col gap-8 lg:col-span-5">
                        {court.facilities.length > 0 && (
                            <Reveal y={24}>
                                <h3 className="font-display text-xl font-semibold">Fasilitas</h3>
                                <ul className="mt-4 flex flex-col gap-2 text-sm text-bone-50/70">
                                    {court.facilities.map((facility) => (
                                        <li key={facility} className="flex items-start gap-2">
                                            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-court-500" />
                                            {facility}
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                        )}

                        {rules.length > 0 && (
                            <Reveal y={24} delay={0.1}>
                                <h3 className="font-display text-xl font-semibold">Harga per jam</h3>
                                <ul className="mt-4 divide-y divide-ink-800 overflow-hidden rounded-md border border-ink-800 text-sm">
                                    <li className="flex items-center justify-between gap-4 bg-ink-800/60 px-4 py-3">
                                        <span className="text-bone-50/60">Harga dasar</span>
                                        <span className="font-semibold tabular-nums">{formatRupiah(court.base_price)}</span>
                                    </li>
                                    {rules.map((rule, index) => (
                                        <li key={index} className="flex items-center justify-between gap-4 px-4 py-3">
                                            <span className="min-w-0">
                                                <span className="block font-medium">{LABELS[rule.label] ?? rule.label}</span>
                                                <span className="block text-xs text-bone-50/45">
                                                    {rule.days_of_week.map((day) => DAYS[day - 1]).join(', ')} ·{' '}
                                                    {formatTimeRange(rule.start_time, rule.end_time)}
                                                </span>
                                            </span>
                                            <span className="shrink-0 font-semibold tabular-nums">{formatRupiah(rule.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                        )}

                        {court.rules && (
                            <Reveal y={24} delay={0.15}>
                                <h3 className="font-display text-xl font-semibold">Aturan main</h3>
                                <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-bone-50/70">{court.rules}</p>
                            </Reveal>
                        )}

                        <Reveal y={24} delay={0.2}>
                            <p className="flex items-start gap-2 rounded-md border border-ink-800 bg-ink-900 p-4 text-sm text-bone-50/60">
                                <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-court-500" />
                                Booking bisa dibuat hingga {advanceDays} hari ke depan.
                            </p>
                        </Reveal>
                    </div>
                </Container>
            </Section>

            {others.length > 0 && (
                <Section tone="dark">
                    <Container>
                        <SectionHeading eyebrow="Lainnya" title="Lapangan lain." titleClassName="text-[clamp(2rem,4vw,3.5rem)]" />
                        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {others.map((other, index) => (
                                <CourtCard key={other.slug} court={other} delay={index * 0.08} />
                            ))}
                        </div>
                    </Container>
                </Section>
            )}
        </PublicLayout>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-ink-900 px-5 py-4">
            <dt className="text-xs tracking-[0.18em] text-bone-50/40 uppercase">{label}</dt>
            <dd className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</dd>
        </div>
    );
}
