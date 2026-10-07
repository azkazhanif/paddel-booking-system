import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import FaqSection from '@/Components/home/FaqSection';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatDateLong, formatRupiah, formatTimeRange } from '@/lib/format';
import { safeRoute } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Info } from 'lucide-react';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Pricing({ venue, courts, labels, specialPrices, policy, faqs }) {
    const labelOf = (value) => labels.find((label) => label.value === value)?.label ?? value;

    return (
        <PublicLayout venue={venue}>
            <Head title="Harga">
                <meta name="description" content={`Daftar harga sewa lapangan padel di ${venue.name}, termasuk harga off-peak, peak, dan weekend.`} />
            </Head>

            <PageHero
                eyebrow="Harga"
                title="Transparan, per jam."
                description={`Harga dihitung per slot ${policy.slot_minutes} menit dan ditentukan server saat kamu booking${
                    policy.service_fee > 0 ? `, ditambah biaya layanan ${formatRupiah(policy.service_fee)} per booking` : ' tanpa biaya tersembunyi'
                }.`}
                actions={
                    <Button href={safeRoute('booking.create')} icon={ArrowUpRight} cursor="Book">
                        Booking sekarang
                    </Button>
                }
            />

            <Section tone="ink" className="pt-0 md:pt-0">
                <Container className="flex flex-col gap-10">
                    {courts.map((court, index) => (
                        <Reveal key={court.slug} y={28} delay={index * 0.06}>
                            <div className="overflow-hidden rounded-md border border-ink-800 bg-ink-900">
                                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-800 p-6">
                                    <div>
                                        <h2 className="font-display text-2xl font-semibold tracking-tight">{court.name}</h2>
                                        <p className="mt-1 text-sm text-bone-50/45">Harga dasar {formatRupiah(court.base_price)} / jam</p>
                                    </div>
                                    <Link
                                        href={safeRoute('courts.show', '#', { court: court.slug })}
                                        className="text-sm font-semibold text-court-400 hover:underline"
                                    >
                                        Detail lapangan →
                                    </Link>
                                </div>

                                {court.rules.length ? (
                                    <ul className="divide-y divide-ink-800">
                                        {court.rules.map((rule, ruleIndex) => (
                                            <li key={ruleIndex} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                                                <div className="min-w-0">
                                                    <p className="font-medium">{labelOf(rule.label)}</p>
                                                    <p className="mt-0.5 text-sm text-bone-50/45">
                                                        {rule.days_of_week.map((day) => DAYS[day - 1]).join(', ')} ·{' '}
                                                        {formatTimeRange(rule.start_time, rule.end_time)}
                                                    </p>
                                                </div>
                                                <p className="font-display text-xl font-semibold tabular-nums">{formatRupiah(rule.price)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="px-6 py-5 text-sm text-bone-50/45">Hanya memakai harga dasar — berlaku untuk semua hari & jam.</p>
                                )}
                            </div>
                        </Reveal>
                    ))}

                    {specialPrices.length > 0 && (
                        <Reveal y={28}>
                            <div className="rounded-md border border-court-500/30 bg-court-500/5 p-6">
                                <h2 className="font-display text-xl font-semibold">Harga khusus mendatang</h2>
                                <ul className="mt-4 divide-y divide-court-500/15 text-sm">
                                    {specialPrices.map((special, index) => (
                                        <li key={index} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{formatDateLong(special.date)}</p>
                                                <p className="mt-0.5 text-bone-50/50">
                                                    {special.court ?? 'Semua lapangan'}
                                                    {special.start_time
                                                        ? ` · ${formatTimeRange(special.start_time, special.end_time)}`
                                                        : ' · sepanjang hari'}
                                                    {special.note ? ` — ${special.note}` : ''}
                                                </p>
                                            </div>
                                            <p className="font-semibold tabular-nums">{formatRupiah(special.price)}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                    )}
                </Container>
            </Section>

            <Section tone="dark">
                <Container>
                    <SectionHeading
                        eyebrow="Pembayaran"
                        title="Bayar penuh atau DP."
                        titleClassName="text-[clamp(2rem,4vw,3.5rem)]"
                        description="Semua pembayaran diproses Midtrans: QRIS, e-wallet, virtual account, dan kartu."
                    />

                    <div className="mt-12 grid gap-4 md:grid-cols-2">
                        <Reveal y={28}>
                            <div className="flex h-full flex-col gap-3 rounded-md border border-ink-700 bg-ink-900 p-6">
                                <h3 className="font-display text-2xl font-semibold">Bayar penuh</h3>
                                <p className="text-sm text-bone-50/60">
                                    Tersedia untuk tamu maupun member. Slot ditahan {policy.hold_minutes} menit sampai pembayaran masuk, lalu e-ticket
                                    langsung terbit.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal y={28} delay={0.1}>
                            <div className="flex h-full flex-col gap-3 rounded-md border border-court-500/40 bg-court-500/10 p-6">
                                <h3 className="font-display text-2xl font-semibold">DP {policy.dp_percentage}% — member</h3>
                                <p className="text-sm text-bone-50/70">
                                    Untuk jadwal minimal H-{policy.dp_min_days_ahead}. Sisanya dilunasi paling lambat {policy.dp_settle_before_hours}{' '}
                                    jam sebelum main, online atau di venue.
                                </p>
                                <Button href={safeRoute('membership')} variant="outline" size="sm" className="mt-auto self-start">
                                    Keuntungan member
                                </Button>
                            </div>
                        </Reveal>
                    </div>

                    <Reveal y={20} delay={0.2}>
                        <p className="mt-8 flex items-start gap-2 text-sm text-bone-50/50">
                            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                            Satu booking maksimal {policy.max_slots} slot berurutan, dan bisa dibuat hingga {policy.advance_days} hari ke depan.
                        </p>
                    </Reveal>
                </Container>
            </Section>

            {faqs.length > 0 && <FaqSection faqs={faqs} whatsapp={venue.whatsapp} />}
        </PublicLayout>
    );
}
