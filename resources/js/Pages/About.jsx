import CountUp from '@/Components/animation/CountUp';
import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import CourtVisual from '@/Components/common/CourtVisual';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import Testimonials from '@/Components/home/Testimonials';
import PublicLayout from '@/Layouts/PublicLayout';
import { safeRoute } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, MapPin, MessageCircle } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function About({ venue, hours, stats, testimonials }) {
    return (
        <PublicLayout venue={venue}>
            <Head title="Tentang">
                <meta name="description" content={`Tentang ${venue.name} — venue padel dengan booking online real-time.`} />
            </Head>

            <PageHero
                eyebrow="Tentang"
                title={`Rumah padel di ${venue.name.split(' ')[0]}.`}
                description="Kami membangun PBS supaya mengunci lapangan tidak lagi berarti menunggu balasan chat. Cek jam kosong, pilih slot, bayar — selesai dalam satu menit."
                actions={
                    <>
                        <Button href={safeRoute('booking.create')} icon={ArrowUpRight} cursor="Book">
                            Booking sekarang
                        </Button>
                        <Button href={safeRoute('courts.index')} variant="outline">
                            Lihat lapangan
                        </Button>
                    </>
                }
            >
                <Reveal y={28} delay={0.3}>
                    <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat label="Lapangan" value={<CountUp value={stats.courts} />} />
                        <Stat label="Durasi slot" value={`${stats.slot_minutes} menit`} />
                        <Stat label="Rating" value={stats.rating ? stats.rating.toFixed(1) : '—'} />
                        <Stat label="Ulasan" value={<CountUp value={stats.reviews} />} />
                    </dl>
                </Reveal>
            </PageHero>

            <Section tone="ink" className="pt-0 md:pt-0">
                <Container className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <SectionHeading eyebrow="Cara kami bekerja" title="Jadwal jujur." titleClassName="text-[clamp(2rem,4vw,3.5rem)]" />
                        <Reveal y={24} stagger={0.08} className="mt-10 flex flex-col gap-6 text-bone-50/70">
                            <p>
                                Ketersediaan slot dihitung langsung dari database, bukan dari rekap manual. Begitu ada pembayaran masuk, slot terkunci
                                dan tidak bisa dipesan orang lain.
                            </p>
                            <p>
                                Harga pun dihitung ulang di server mengikuti aturan hari dan jam, jadi yang kamu lihat di layar adalah yang kamu
                                bayar. Semua transaksi lewat Midtrans dan setiap booking punya invoice sendiri.
                            </p>
                            <p>
                                Datang tanpa akun? Tetap bisa booking dengan bayar penuh. Buat akun kalau mau mengunci lapangan dengan DP dan
                                menyimpan riwayat mainmu.
                            </p>
                        </Reveal>
                    </div>

                    <div className="flex flex-col gap-8 lg:col-span-5">
                        <Reveal y={24}>
                            <div className="rounded-md border border-ink-800 bg-ink-900 p-6">
                                <h3 className="font-display text-xl font-semibold">Jam operasional</h3>
                                <ul className="mt-4 divide-y divide-ink-800 text-sm">
                                    {hours.map((hour) => (
                                        <li key={hour.day_of_week} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                                            <span className="text-bone-50/60">{DAYS[hour.day_of_week - 1]}</span>
                                            <span className={hour.is_closed ? 'text-bone-50/35' : 'font-medium tabular-nums'}>
                                                {hour.is_closed ? 'Tutup' : `${hour.open_time}–${hour.close_time}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>

                        <Reveal y={24} delay={0.1}>
                            <div className="rounded-md border border-ink-800 bg-ink-900 p-6">
                                <h3 className="font-display text-xl font-semibold">Lokasi</h3>
                                <p className="mt-3 flex items-start gap-2 text-sm text-bone-50/60">
                                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-court-500" />
                                    {venue.address || 'Alamat menyusul.'}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Button
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address || venue.name)}`}
                                        variant="outline"
                                        size="sm"
                                        icon={MapPin}
                                    >
                                        Buka peta
                                    </Button>
                                    {venue.whatsapp && (
                                        <Button href={`https://wa.me/${venue.whatsapp}`} variant="ghost" size="sm" icon={MessageCircle}>
                                            Chat admin
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Reveal>

                        <Reveal y={24} delay={0.15}>
                            <div className="overflow-hidden rounded-md border border-ink-800 bg-ink-900 p-8 text-court-500/25">
                                <CourtVisual glow />
                            </div>
                        </Reveal>
                    </div>
                </Container>
            </Section>

            {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}
        </PublicLayout>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-ink-900 px-5 py-4">
            <dt className="text-xs tracking-[0.18em] text-bone-50/40 uppercase">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</dd>
        </div>
    );
}
