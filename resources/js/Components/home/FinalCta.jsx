import Magnetic from '@/Components/animation/Magnetic';
import Parallax from '@/Components/animation/Parallax';
import ScrubText from '@/Components/animation/ScrubText';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import CourtVisual from '@/Components/common/CourtVisual';
import Section from '@/Components/common/Section';
import { safeRoute } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

export default function FinalCta() {
    return (
        <Section tone="forest" className="overflow-hidden py-32 md:py-48">
            <Parallax speed={15} className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <CourtVisual className="w-[160%] max-w-none text-court-500/15 md:w-[110%]" />
            </Parallax>
            <Container className="relative flex flex-col items-start gap-12">
                <ScrubText
                    as="h2"
                    className="font-display text-[clamp(3.5rem,11vw,10rem)] leading-[0.85] font-semibold tracking-[-0.04em] uppercase"
                >
                    Your next game starts here.
                </ScrubText>
                <div className="flex w-full flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <p className="max-w-md text-lg text-bone-50/70">Pilih jam, bayar dalam hitungan detik, dan biarkan kami menyiapkan lapangannya.</p>
                    <Magnetic>
                        <Button href={safeRoute('booking.create', '#availability')} size="lg" icon={ArrowUpRight} cursor="Book" className="h-16 px-10 text-lg">
                            Book Now
                        </Button>
                    </Magnetic>
                </div>
            </Container>
        </Section>
    );
}
