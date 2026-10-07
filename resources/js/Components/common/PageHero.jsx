import Reveal from '@/Components/animation/Reveal';
import SplitHeading from '@/Components/animation/SplitHeading';
import Container from '@/Components/common/Container';
import Eyebrow from '@/Components/common/Eyebrow';
import Section from '@/Components/common/Section';
import { cn } from '@/lib/utils';

/**
 * Hero halaman informasi publik (bukan homepage): eyebrow, judul besar, deskripsi,
 * aksi, dan slot konten tambahan di bawahnya.
 */
export default function PageHero({ eyebrow, title, description, actions, tone = 'dark', className, children }) {
    return (
        <Section tone={tone} className={cn('pt-32 pb-16 md:pt-44 md:pb-20', className)}>
            <Container>
                {eyebrow && (
                    <Reveal y={16}>
                        <Eyebrow className="mb-5 text-court-500">{eyebrow}</Eyebrow>
                    </Reveal>
                )}

                <SplitHeading className="max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] uppercase">{title}</SplitHeading>

                {description && (
                    <Reveal y={24} delay={0.15}>
                        <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-70">{description}</p>
                    </Reveal>
                )}

                {actions && (
                    <Reveal y={20} delay={0.25}>
                        <div className="mt-10 flex flex-wrap gap-3">{actions}</div>
                    </Reveal>
                )}

                {children}
            </Container>
        </Section>
    );
}
