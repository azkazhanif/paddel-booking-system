import Marquee from '@/Components/animation/Marquee';
import Section from '@/Components/common/Section';

export default function MarqueeStrip({ words = ['Padel', 'Book', 'Play', 'Repeat'], tone = 'green' }) {
    return (
        <Section tone={tone} solid className="relative z-10 overflow-hidden py-8 md:py-10">
            <Marquee speed={28}>
                {words.map((word) => (
                    <span key={word} className="flex items-center font-display text-[clamp(3.5rem,10vw,9rem)] leading-none font-semibold tracking-tight uppercase">
                        <span className="px-6 md:px-10">{word}</span>
                        <span aria-hidden className="size-4 rounded-full bg-current md:size-6" />
                    </span>
                ))}
            </Marquee>
        </Section>
    );
}
