import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Marquee tanpa henti; laju bertambah mengikuti velocity scroll, dengan skew ringan.
 */
export default function Marquee({ reverse = false, speed = 40, skew = true, className, trackClassName, children }) {
    const ref = useRef(null);
    const trackRef = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const loop = gsap.fromTo(
                    trackRef.current,
                    { xPercent: reverse ? -50 : 0 },
                    { xPercent: reverse ? 0 : -50, duration: speed, ease: 'none', repeat: -1 },
                );
                const skewTo = gsap.quickTo(trackRef.current, 'skewX', { duration: 0.5, ease: 'power3' });
                let settle;

                ScrollTrigger.create({
                    trigger: ref.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    onUpdate: (self) => {
                        const velocity = self.getVelocity();

                        gsap.timeline({ overwrite: true })
                            .to(loop, { timeScale: 1 + Math.min(Math.abs(velocity) / 250, 6), duration: 0.2 })
                            .to(loop, { timeScale: 1, duration: 1.2, ease: 'power2.out' });

                        if (skew) {
                            skewTo(gsap.utils.clamp(-6, 6, velocity / -400));
                            settle?.kill();
                            settle = gsap.delayedCall(0.15, () => skewTo(0));
                        }
                    },
                });
            });
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className={cn('overflow-hidden', className)}>
            <div ref={trackRef} className={cn('flex w-max will-change-transform', trackClassName)}>
                <div className="flex shrink-0 items-center">{children}</div>
                <div aria-hidden className="flex shrink-0 items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
