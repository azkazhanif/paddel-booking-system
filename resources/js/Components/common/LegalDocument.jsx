import Reveal from '@/Components/animation/Reveal';
import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import { cn } from '@/lib/utils';

/**
 * Dokumen legal: daftar isi di kiri (desktop) dan pasal-pasal di kanan.
 * sections: [{ id, title, paragraphs?: string[], items?: string[] }].
 */
export default function LegalDocument({ sections, note, className }) {
    return (
        <Section tone="ink" className={cn('pt-0 md:pt-0', className)}>
            <Container className="grid gap-12 lg:grid-cols-12">
                <nav aria-label="Daftar isi" className="lg:col-span-4">
                    <div className="lg:sticky lg:top-28">
                        <p className="text-xs tracking-[0.2em] text-bone-50/40 uppercase">Daftar isi</p>
                        <ol className="mt-5 flex flex-col gap-2 text-sm">
                            {sections.map((section, index) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className="flex gap-3 text-bone-50/60 transition-colors hover:text-court-400">
                                        <span className="tabular-nums opacity-50">{String(index + 1).padStart(2, '0')}</span>
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </div>
                </nav>

                <div className="flex flex-col gap-12 lg:col-span-8">
                    {sections.map((section, index) => (
                        <Reveal key={section.id} y={24} delay={Math.min(index * 0.04, 0.2)}>
                            <article id={section.id} className="scroll-mt-28">
                                <h2 className="font-display text-2xl font-semibold tracking-tight">
                                    <span className="mr-3 text-court-500 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                                    {section.title}
                                </h2>

                                {section.paragraphs?.map((paragraph, paragraphIndex) => (
                                    <p key={paragraphIndex} className="mt-4 leading-relaxed text-bone-50/65">
                                        {paragraph}
                                    </p>
                                ))}

                                {section.items && (
                                    <ul className="mt-4 flex flex-col gap-2.5 text-bone-50/65">
                                        {section.items.map((item, itemIndex) => (
                                            <li key={itemIndex} className="flex gap-3 leading-relaxed">
                                                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-court-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        </Reveal>
                    ))}

                    {note && (
                        <Reveal y={20}>
                            <p className="rounded-md border border-ink-800 bg-ink-900 p-5 text-sm text-bone-50/45">{note}</p>
                        </Reveal>
                    )}
                </div>
            </Container>
        </Section>
    );
}
