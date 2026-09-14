import Marquee from '@/Components/animation/Marquee';
import Container from '@/Components/common/Container';
import Section from '@/Components/common/Section';
import SectionHeading from '@/Components/common/SectionHeading';
import { Star } from 'lucide-react';

function TestimonialCard({ testimonial }) {
    return (
        <figure className="mr-4 flex w-[20rem] shrink-0 flex-col justify-between gap-8 rounded-md border border-ink-700 bg-ink-800 p-6 md:w-[26rem] md:p-8">
            <div>
                <span className="flex gap-1 text-court-500" aria-label={`Rating ${testimonial.rating} dari 5`}>
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                        <Star key={index} className="size-4 fill-current" />
                    ))}
                </span>
                <blockquote className="mt-5 text-lg leading-relaxed text-bone-50/90">“{testimonial.content}”</blockquote>
            </div>
            <figcaption className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-court-500 font-display font-semibold text-ink-950">
                    {testimonial.name.charAt(0)}
                </span>
                <span>
                    <span className="block font-semibold">{testimonial.name}</span>
                    <span className="block text-sm text-bone-50/50">{testimonial.role}</span>
                </span>
            </figcaption>
        </figure>
    );
}

export default function Testimonials({ testimonials }) {
    if (!testimonials.length) return null;

    const half = Math.ceil(testimonials.length / 2);
    const rows = [testimonials.slice(0, half), testimonials.slice(half)].filter((row) => row.length);

    return (
        <Section id="testimonials" tone="dark" className="overflow-hidden">
            <Container>
                <SectionHeading eyebrow="Kata pemain" title="Dipakai pemain setiap hari" />
            </Container>
            <div className="mt-14 flex flex-col gap-4">
                {rows.map((row, index) => (
                    <Marquee key={index} reverse={index % 2 === 1} speed={50} skew={false}>
                        {row.map((testimonial) => (
                            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                        ))}
                    </Marquee>
                ))}
            </div>
        </Section>
    );
}
