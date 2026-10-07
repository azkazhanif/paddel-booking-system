import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import PageHero from '@/Components/common/PageHero';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import PublicLayout from '@/Layouts/PublicLayout';
import { safeRoute } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { ArrowUpRight, Check, Minus } from 'lucide-react';

export default function Membership({ venue, canRegister, policy }) {
    const { auth } = usePage().props;

    const rows = [
        ['Booking tanpa akun', true, true],
        [`Bayar DP ${policy.dp_percentage}%`, false, policy.dp_enabled],
        ['Riwayat booking & e-ticket tersimpan', false, true],
        ['Invoice otomatis di akun', false, true],
        ['Data pemesan terisi otomatis', false, true],
        ['Pengingat pelunasan & jadwal main', false, true],
        ['Batalkan booking sendiri', false, true],
    ];

    const steps = [
        ['Daftar gratis', 'Cukup nama, email, dan nomor WhatsApp.'],
        ['Verifikasi email', 'Klik link yang kami kirim — ini syarat membuka opsi DP.'],
        [`Booking dengan DP ${policy.dp_percentage}%`, `Untuk jadwal minimal H-${policy.dp_min_days_ahead}.`],
        ['Lunasi sebelum main', `Paling lambat ${policy.dp_settle_before_hours} jam sebelum jam main, online atau di venue.`],
    ];

    return (
        <PublicLayout venue={venue}>
            <Head title="Keuntungan member">
                <meta
                    name="description"
                    content={`Jadi member ${venue.name}: bayar DP ${policy.dp_percentage}%, riwayat booking tersimpan, dan checkout lebih cepat.`}
                />
            </Head>

            <PageHero
                eyebrow="Member"
                title={`Kunci lapangan dengan ${policy.dp_percentage}%.`}
                description="Gratis, tanpa iuran bulanan. Member cukup bayar sebagian di awal dan melunasi sebelum main."
                actions={
                    auth?.user ? (
                        <Button href={safeRoute('booking.create')} icon={ArrowUpRight} cursor="Book">
                            Booking sekarang
                        </Button>
                    ) : (
                        <>
                            {canRegister && (
                                <Button href={safeRoute('register')} icon={ArrowUpRight} cursor="Join">
                                    Daftar gratis
                                </Button>
                            )}
                            <Button href={safeRoute('login')} variant="outline">
                                Sudah punya akun
                            </Button>
                        </>
                    )
                }
            />

            <Section tone="ink" className="pt-0 md:pt-0">
                <Container>
                    <Reveal y={28}>
                        <div className="overflow-hidden rounded-md border border-ink-800">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-ink-800 bg-ink-900">
                                        <th className="px-5 py-4 font-medium text-bone-50/50">Yang kamu dapat</th>
                                        <th className="px-5 py-4 text-center font-medium text-bone-50/50">Tamu</th>
                                        <th className="bg-court-500/10 px-5 py-4 text-center font-semibold text-court-400">Member</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-800">
                                    {rows.map(([label, guest, member]) => (
                                        <tr key={label}>
                                            <td className="px-5 py-4">{label}</td>
                                            <td className="px-5 py-4 text-center">{guest ? <Yes /> : <No />}</td>
                                            <td className="bg-court-500/5 px-5 py-4 text-center">{member ? <Yes /> : <No />}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Reveal>
                </Container>
            </Section>

            <Section tone="dark">
                <Container>
                    <SectionHeading eyebrow="Cara kerja" title="Empat langkah." titleClassName="text-[clamp(2rem,4vw,3.5rem)]" />
                    <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {steps.map(([title, description], index) => (
                            <Reveal key={title} y={28} delay={index * 0.08}>
                                <li className="flex h-full flex-col gap-3 rounded-md border border-ink-700 bg-ink-900 p-6">
                                    <span className="grid size-9 place-items-center rounded-full bg-court-500 font-display font-semibold text-ink-950">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                                    <p className="text-sm text-bone-50/55">{description}</p>
                                </li>
                            </Reveal>
                        ))}
                    </ol>

                    <Reveal y={20} delay={0.3}>
                        <p className="mt-10 max-w-2xl text-sm text-bone-50/45">
                            Catatan: DP tidak dikembalikan bila booking dibatalkan kurang dari {policy.dp_refundable_before_hours} jam sebelum main,
                            atau bila kamu tidak hadir sampai {policy.dp_no_show_grace_minutes} menit setelah jam mulai.
                        </p>
                    </Reveal>
                </Container>
            </Section>
        </PublicLayout>
    );
}

function Yes() {
    return (
        <span className="inline-grid size-6 place-items-center rounded-full bg-court-500/20 text-court-400">
            <Check aria-label="Ya" className="size-3.5" />
        </span>
    );
}

function No() {
    return (
        <span className="inline-grid size-6 place-items-center rounded-full bg-white/5 text-bone-50/30">
            <Minus aria-label="Tidak" className="size-3.5" />
        </span>
    );
}
