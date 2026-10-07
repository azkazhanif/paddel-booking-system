import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import FaqSection from '@/Components/home/FaqSection';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatRupiah } from '@/lib/format';
import { safeRoute } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export default function FaqPage({ venue, faqs, policy }) {
    const rules = [
        ['Durasi satu slot', `${policy.slot_minutes} menit`],
        ['Maksimal per booking', `${policy.max_slots} slot berurutan`],
        ['Booking paling jauh', `${policy.advance_days} hari ke depan`],
        ['Slot ditahan sebelum bayar', `${policy.hold_minutes} menit`],
        ['Batas pembatalan sendiri', `${policy.cancel_before_hours} jam sebelum main`],
        ['Biaya layanan', policy.service_fee > 0 ? formatRupiah(policy.service_fee) : 'Tidak ada'],
        ['Booking tanpa akun', policy.guest_enabled ? 'Bisa, wajib bayar penuh' : 'Sementara ditutup'],
        [
            `DP ${policy.dp_percentage}% (member)`,
            policy.dp_enabled
                ? `Jadwal minimal H-${policy.dp_min_days_ahead}, lunas ${policy.dp_settle_before_hours} jam sebelum main`
                : 'Sementara dinonaktifkan',
        ],
    ];

    return (
        <PublicLayout venue={venue}>
            <Head title="FAQ">
                <meta name="description" content={`Pertanyaan yang sering diajukan soal booking lapangan padel di ${venue.name}.`} />
            </Head>

            <PageHero
                eyebrow="FAQ"
                title="Tanya jawab."
                description="Yang paling sering ditanyakan soal booking, pembayaran, dan pembatalan."
                actions={
                    <>
                        <Button href={safeRoute('booking.create')} icon={ArrowUpRight} cursor="Book">
                            Booking sekarang
                        </Button>
                        {venue.whatsapp && (
                            <Button href={`https://wa.me/${venue.whatsapp}`} variant="outline" icon={MessageCircle}>
                                Chat admin
                            </Button>
                        )}
                    </>
                }
            />

            <Section tone="ink" className="pt-0 md:pt-0">
                <Container>
                    <Reveal y={28}>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">Ringkasan aturan</h2>
                        <dl className="mt-6 grid gap-px overflow-hidden rounded-md border border-ink-800 bg-ink-800 sm:grid-cols-2">
                            {rules.map(([label, value]) => (
                                <div key={label} className="bg-ink-900 px-5 py-4">
                                    <dt className="text-xs tracking-[0.15em] text-bone-50/40 uppercase">{label}</dt>
                                    <dd className="mt-1.5 font-medium">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </Container>
            </Section>

            <FaqSection faqs={faqs} whatsapp={venue.whatsapp} />
        </PublicLayout>
    );
}
