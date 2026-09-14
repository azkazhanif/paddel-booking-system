import CountUp from '@/Components/animation/CountUp';
import Magnetic from '@/Components/animation/Magnetic';
import Reveal from '@/Components/animation/Reveal';
import BentoCard from '@/Components/common/BentoCard';
import BentoGrid from '@/Components/common/BentoGrid';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { safeRoute } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { ArrowUpRight, Check, Minus } from 'lucide-react';

export default function MemberBenefits({ dpPercentage, canRegister }) {
    const { auth } = usePage().props;

    const rows = [
        ['Booking tanpa akun', true, true],
        [`Bayar DP ${dpPercentage}%`, false, true],
        ['Riwayat booking & invoice tersimpan', false, true],
        ['Checkout sekali klik', false, true],
        ['Pengingat jadwal & pelunasan', false, true],
    ];

    return (
        <Section id="membership" tone="green">
            <Container>
                <SectionHeading
                    eyebrow="Member benefits"
                    title="Daftar gratis, main lebih fleksibel"
                    description="Tamu tetap bisa booking dengan bayar penuh. Tapi member bisa mengamankan slot favorit jauh-jauh hari cukup dengan DP."
                />

                <Reveal selector="[data-bento]" y={70} scale={0.95} className="mt-14">
                    <BentoGrid>
                        <BentoCard tone="dark" colSpan={{ md: 6, lg: 5 }} rowSpan={3} className="justify-between gap-10">
                            <span className="text-xs font-bold tracking-[0.2em] text-court-500 uppercase">Eksklusif member</span>
                            <p className="font-display text-[clamp(6rem,14vw,11rem)] leading-[0.8] font-semibold tracking-tighter">
                                <span className="block text-3xl tracking-tight text-bone-50/60">DP</span>
                                <CountUp value={dpPercentage} />
                                <span className="text-court-500">%</span>
                            </p>
                            <div className="flex flex-col gap-5">
                                <p className="max-w-sm text-bone-50/70">Sisanya dilunasi sebelum jam main — online atau langsung di lokasi.</p>
                                {!auth?.user && canRegister && (
                                    <Magnetic className="self-start">
                                        <Button href={safeRoute('register')} size="lg" icon={ArrowUpRight} cursor="Join">
                                            Daftar Gratis
                                        </Button>
                                    </Magnetic>
                                )}
                            </div>
                        </BentoCard>

                        <BentoCard tone="bone" colSpan={{ md: 6, lg: 7 }} rowSpan={3} className="p-0 md:p-0">
                            <div className="grid grid-cols-[1fr_5rem_5rem] items-center border-b border-ink-950/10 px-6 py-5 text-xs font-bold tracking-[0.15em] uppercase md:grid-cols-[1fr_7rem_7rem] md:px-8">
                                <span className="text-ink-950/40">Fitur</span>
                                <span className="text-center text-ink-950/40">Tamu</span>
                                <span className="text-center">Member</span>
                            </div>
                            <Reveal as="ul" selector="li" y={20} stagger={0.07} className="flex flex-1 flex-col">
                                {rows.map(([label, guest, member]) => (
                                    <li
                                        key={label}
                                        className="grid flex-1 grid-cols-[1fr_5rem_5rem] items-center border-b border-ink-950/10 px-6 py-5 last:border-0 md:grid-cols-[1fr_7rem_7rem] md:px-8"
                                    >
                                        <span className="font-medium md:text-lg">{label}</span>
                                        {[guest, member].map((enabled, index) => (
                                            <span key={index} className="flex justify-center">
                                                <span
                                                    className={
                                                        enabled
                                                            ? 'grid size-8 place-items-center rounded-full bg-court-500'
                                                            : 'grid size-8 place-items-center rounded-full bg-ink-950/5 text-ink-950/30'
                                                    }
                                                >
                                                    {enabled ? <Check className="size-4" /> : <Minus className="size-4" />}
                                                </span>
                                            </span>
                                        ))}
                                    </li>
                                ))}
                            </Reveal>
                        </BentoCard>
                    </BentoGrid>
                </Reveal>
            </Container>
        </Section>
    );
}
