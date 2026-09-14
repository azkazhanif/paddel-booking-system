import { FINE_POINTER, gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

/**
 * Anak mengikuti kursor secara halus saat di-hover (desktop).
 */
export default function Magnetic({ strength = 0.35, className, children }) {
    const ref = useRef(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(`${FINE_POINTER} and ${MOTION_OK}`, () => {
                const el = ref.current;
                const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
                const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });

                const move = (event) => {
                    const rect = el.getBoundingClientRect();
                    xTo((event.clientX - rect.left - rect.width / 2) * strength);
                    yTo((event.clientY - rect.top - rect.height / 2) * strength);
                };
                const leave = () => {
                    xTo(0);
                    yTo(0);
                };

                el.addEventListener('pointermove', move);
                el.addEventListener('pointerleave', leave);

                return () => {
                    el.removeEventListener('pointermove', move);
                    el.removeEventListener('pointerleave', leave);
                };
            });
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className={cn('inline-block', className)}>
            {children}
        </div>
    );
}
