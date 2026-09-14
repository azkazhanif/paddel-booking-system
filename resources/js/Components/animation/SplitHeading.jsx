import { gsap, MOTION_OK, SplitText, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Heading dengan reveal per baris/karakter ber-mask saat masuk viewport.
 * type: 'lines' | 'words' | 'chars'.
 */
export default function SplitHeading({
    as: Tag = 'h2',
    type = 'words',
    stagger = 0.04,
    start = 'top 85%',
    className,
    children,
}) {
    const ref = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                SplitText.create(ref.current, {
                    type: type === 'chars' ? 'lines,words,chars' : type === 'words' ? 'lines,words' : 'lines',
                    mask: 'lines',
                    autoSplit: true,
                    onSplit: (self) =>
                        gsap.from(self[type], {
                            yPercent: 110,
                            rotate: type === 'lines' ? 0 : 4,
                            duration: 1.2,
                            stagger,
                            scrollTrigger: { trigger: ref.current, start, once: true },
                        }),
                });
            });
        },
        { scope: ref },
    );

    return (
        <Tag ref={ref} className={cn('font-display font-semibold tracking-tight', className)}>
            {children}
        </Tag>
    );
}
