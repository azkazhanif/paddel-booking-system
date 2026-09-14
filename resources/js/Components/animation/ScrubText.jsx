import { gsap, MOTION_OK, SplitText, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Teks yang "terisi" per karakter mengikuti progress scroll.
 */
export default function ScrubText({ as: Tag = 'p', className, children }) {
    const ref = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                SplitText.create(ref.current, {
                    type: 'words,chars',
                    autoSplit: true,
                    onSplit: (self) =>
                        gsap.fromTo(
                            self.chars,
                            { opacity: 0.15 },
                            {
                                opacity: 1,
                                ease: 'none',
                                stagger: 0.05,
                                scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'bottom 45%', scrub: true },
                            },
                        ),
                });
            });
        },
        { scope: ref },
    );

    return (
        <Tag ref={ref} className={cn(className)}>
            {children}
        </Tag>
    );
}
