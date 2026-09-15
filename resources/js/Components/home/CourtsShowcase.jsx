import PinnedHorizontal from '@/Components/animation/PinnedHorizontal';
import Badge from '@/Components/common/Badge';
import Button from '@/Components/common/Button';
import Container from '@/Components/common/Container';
import CourtImage from '@/Components/common/CourtImage';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { formatRupiah } from '@/lib/format';
import { safeRoute } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

function CourtCard({ court, index }) {
    return (
        <article
            data-pin-item
            data-cursor="Book"
            className="group relative w-[82vw] shrink-0 snap-start overflow-hidden rounded-md sm:w-[60vw] lg:w-[34vw]"
        >
            <div data-pin-media>
                <CourtImage
                    src={court.image}
                    alt={court.name}
                    className="aspect-4/5 rounded-md lg:aspect-auto lg:h-[min(60svh,38rem)]"
                    imageClassName="transition-transform duration-700 ease-out-expo group-hover:scale-105"
                />
            </div>
            <div className="absolute inset-0 flex flex-col justify-between bg-linear-to-t from-ink-950/90 via-ink-950/10 to-transparent p-5 text-bone-50 md:p-7">
                <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                    <Badge variant="glass" className="capitalize">
                        {court.type}
                    </Badge>
                </div>
                <div>
                    <p className="text-sm text-bone-50/60">{court.surface}</p>
                    <h3 className="mt-1 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">{court.name}</h3>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {court.facilities.slice(0, 3).map((facility) => (
                            <Badge key={facility} variant="glass">
                                {facility}
                            </Badge>
                        ))}
                    </div>
                    <div className="mt-6 flex items-end justify-between gap-4">
                        <p className="text-sm text-bone-50/60">
                            Mulai dari
                            <span className="block font-display text-2xl font-semibold text-court-500">{formatRupiah(court.price_from)}</span>
                        </p>
                        <Button href={safeRoute('booking.create', '#availability')} size="sm" icon={ArrowUpRight}>
                            Book
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function CourtsShowcase({ courts }) {
    return (
        <Section id="courts" tone="dark" className="py-0 md:py-0">
            <PinnedHorizontal
                header={
                    <Container className="mb-8 md:mb-10">
                        <SectionHeading
                            eyebrow={`${courts.length} lapangan`}
                            title="Pilih lapanganmu"
                            description="Indoor panoramic untuk main tanpa takut hujan, atau outdoor garden untuk suasana lebih santai."
                        />
                    </Container>
                }
                trackClassName="lg:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] lg:pr-6"
            >
                {courts.map((court, index) => (
                    <CourtCard key={court.id} court={court} index={index} />
                ))}
                <div className="flex w-[82vw] shrink-0 snap-start flex-col justify-between rounded-md bg-court-500 p-7 text-ink-950 sm:w-[60vw] lg:h-[min(60svh,38rem)] lg:w-[26vw]">
                    <p className="font-display text-5xl leading-none font-semibold tracking-tight uppercase">Siap turun ke lapangan?</p>
                    <Button href={safeRoute('courts.index', '#availability')} variant="dark" size="lg" icon={ArrowUpRight} className="self-start">
                        Semua lapangan
                    </Button>
                </div>
            </PinnedHorizontal>
        </Section>
    );
}
