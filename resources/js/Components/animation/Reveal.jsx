import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Menampilkan anak langsung (atau elemen [data-reveal]) dengan fade + naik saat masuk viewport.
 */
export default function Reveal({
    as: Tag = 'div',
    y = 48,
    scale = 1,
    stagger = 0.1,
    delay = 0,
    start = 'top 85%',
    selector,
    className,
    children,
    ...props
}) {
    const ref = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const targets = selector ? gsap.utils.toArray(selector, ref.current) : ref.current.children;

                gsap.from(targets, {
                    y,
                    scale,
                    autoAlpha: 0,
                    duration: 1.1,
                    delay,
                    stagger,
                    scrollTrigger: { trigger: ref.current, start, once: true },
                });
            });
        },
        { scope: ref },
    );

    return (
        <Tag ref={ref} className={cn(className)} {...props}>
            {children}
        </Tag>
    );
}
