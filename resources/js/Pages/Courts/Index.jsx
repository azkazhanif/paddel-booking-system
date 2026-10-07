import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import CourtCard from '@/Components/court/CourtCard';
import EmptyState from '@/Components/common/EmptyState';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import PublicLayout from '@/Layouts/PublicLayout';
import { safeRoute } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, CalendarRange, LayoutGrid } from 'lucide-react';

export default function CourtsIndex({ venue, courts, slotMinutes, dpPercentage }) {
    const available = courts.reduce((sum, court) => sum + court.today.available, 0);

    return (
        <PublicLayout venue={venue}>
            <Head title="Lapangan">
                <meta name="description" content={`Lapangan padel di ${venue.name} — cek fasilitas, harga, dan jam kosong hari ini.`} />
            </Head>

            <PageHero
                eyebrow="Lapangan"
                title="Pilih lapanganmu."
                description={`Semua lapangan disewakan per ${slotMinutes} menit. Hari ini masih ada ${available} slot kosong.`}
                actions={
                    <>
                        <Button href={safeRoute('booking.create')} icon={ArrowUpRight} cursor="Book">
                            Booking sekarang
                        </Button>
                        <Button href={safeRoute('schedule.index')} variant="outline" icon={CalendarRange}>
                            Lihat jadwal
                        </Button>
                    </>
                }
            />

            <Section tone="ink" className="pt-0 pb-24 md:pt-0 md:pb-32">
                <Container>
                    {courts.length ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {courts.map((court, index) => (
                                <CourtCard key={court.id} court={court} delay={index * 0.08} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={LayoutGrid}
                            title="Belum ada lapangan aktif"
                            description="Lapangan sedang disiapkan. Hubungi admin venue untuk info jadwal."
                            className="rounded-md border border-dashed border-ink-700"
                        />
                    )}

                    <p className="mt-10 text-sm text-bone-50/45">
                        Member bisa mengunci lapangan dengan DP {dpPercentage}% dan melunasi sebelum main.
                    </p>
                </Container>
            </Section>
        </PublicLayout>
    );
}
