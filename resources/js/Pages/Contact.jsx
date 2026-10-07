import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import PublicLayout from '@/Layouts/PublicLayout';
import { safeRoute } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, AtSign, Clock, MapPin, MessageCircle } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function Contact({ venue, hours }) {
    const mapsUrl = venue.coordinates?.lat
        ? `https://www.google.com/maps/search/?api=1&query=${venue.coordinates.lat},${venue.coordinates.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address || venue.name)}`;

    const socials = Object.entries(venue.socials ?? {}).filter(([, url]) => url);

    return (
        <PublicLayout venue={venue}>
            <Head title="Kontak">
                <meta name="description" content={`Hubungi ${venue.name} — alamat, jam operasional, dan WhatsApp admin.`} />
            </Head>

            <PageHero
                eyebrow="Kontak"
                title="Sampai jumpa di lapangan."
                description="Pertanyaan soal booking, pembatalan, atau sewa untuk acara? Hubungi admin lewat WhatsApp — paling cepat dijawab."
                actions={
                    <>
                        {venue.whatsapp && (
                            <Button href={`https://wa.me/${venue.whatsapp}`} icon={MessageCircle} cursor="Chat">
                                WhatsApp admin
                            </Button>
                        )}
                        <Button href={safeRoute('booking.create')} variant="outline" icon={ArrowUpRight}>
                            Booking sekarang
                        </Button>
                    </>
                }
            />

            <Section tone="ink" className="pt-0 md:pt-0">
                <Container className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Reveal y={28}>
                        <div className="flex h-full flex-col gap-3 rounded-md border border-ink-800 bg-ink-900 p-6">
                            <span className="grid size-10 place-items-center rounded-full bg-court-500 text-ink-950">
                                <MapPin aria-hidden className="size-4" />
                            </span>
                            <h2 className="font-display text-xl font-semibold">Lokasi</h2>
                            <p className="text-sm text-bone-50/60">{venue.address || 'Alamat menyusul.'}</p>
                            <Button href={mapsUrl} variant="outline" size="sm" className="mt-auto self-start">
                                Petunjuk arah
                            </Button>
                        </div>
                    </Reveal>

                    <Reveal y={28} delay={0.08}>
                        <div className="flex h-full flex-col gap-3 rounded-md border border-ink-800 bg-ink-900 p-6">
                            <span className="grid size-10 place-items-center rounded-full bg-court-500 text-ink-950">
                                <Clock aria-hidden className="size-4" />
                            </span>
                            <h2 className="font-display text-xl font-semibold">Jam buka</h2>
                            <ul className="divide-y divide-ink-800 text-sm">
                                {hours.map((hour) => (
                                    <li key={hour.day_of_week} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                                        <span className="text-bone-50/55">{DAYS[hour.day_of_week - 1]}</span>
                                        <span className={hour.is_closed ? 'text-bone-50/35' : 'font-medium tabular-nums'}>
                                            {hour.is_closed ? 'Tutup' : `${hour.open_time}–${hour.close_time}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>

                    <Reveal y={28} delay={0.16}>
                        <div className="flex h-full flex-col gap-3 rounded-md border border-ink-800 bg-ink-900 p-6">
                            <span className="grid size-10 place-items-center rounded-full bg-court-500 text-ink-950">
                                <AtSign aria-hidden className="size-4" />
                            </span>
                            <h2 className="font-display text-xl font-semibold">Media sosial</h2>
                            {socials.length ? (
                                <ul className="flex flex-col gap-2 text-sm">
                                    {socials.map(([name, url]) => (
                                        <li key={name}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="capitalize text-court-400 hover:underline"
                                            >
                                                {name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-bone-50/50">Akun media sosial menyusul.</p>
                            )}
                            {venue.whatsapp && (
                                <p className="mt-auto text-sm text-bone-50/60">
                                    WhatsApp <span className="font-medium text-bone-50">+{venue.whatsapp}</span>
                                </p>
                            )}
                        </div>
                    </Reveal>
                </Container>
            </Section>
        </PublicLayout>
    );
}
