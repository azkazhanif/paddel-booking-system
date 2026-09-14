import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Menggeser anak secara vertikal mengikuti scroll. speed positif = lebih lambat dari scroll.
 */
export default function Parallax({ speed = 20, scale, className, children }) {
    const ref = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.fromTo(
                    ref.current.firstElementChild,
                    { yPercent: -speed, scale: scale ?? 1 },
                    {
                        yPercent: speed,
                        scale: 1,
                        ease: 'none',
                        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
                    },
                );
            });
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className={cn('overflow-hidden', className)}>
            {children}
        </div>
    );
}
