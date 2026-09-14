import { DESKTOP, gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Desktop: section di-pin dan track bergeser horizontal mengikuti scroll.
 * Mobile / reduced motion: track menjadi carousel swipe dengan scroll-snap.
 * header dirender di atas track dan ikut ter-pin.
 */
export default function PinnedHorizontal({ header, className, trackClassName, children }) {
    const ref = useRef(null);
    const trackRef = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
                const track = trackRef.current;
                const distance = () => track.scrollWidth - track.clientWidth;

                gsap.to(track, {
                    x: () => -distance(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: ref.current,
                        start: 'top top',
                        end: () => `+=${distance()}`,
                        pin: true,
                        scrub: 1,
                        invalidateOnRefresh: true,
                    },
                });

                gsap.utils.toArray('[data-pin-item]', track).forEach((item) => {
                    gsap.from(item.querySelector('[data-pin-media]') ?? item, {
                        scale: 1.15,
                        ease: 'none',
                        scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${distance()}`, scrub: true },
                    });
                });
            });
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className={cn('flex min-h-svh flex-col justify-center overflow-hidden py-20', className)}>
            {header}
            <div
                ref={trackRef}
                className={cn(
                    'flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:px-6 lg:snap-none lg:overflow-visible',
                    trackClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}
