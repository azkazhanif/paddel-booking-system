import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { useRef } from 'react';

/**
 * Angka yang menghitung dari 0 saat masuk viewport. format: (n) => string.
 */
export default function CountUp({ value, decimals = 0, format, className }) {
    const ref = useRef(null);
    const render = (n) => (format ? format(n) : Number(n).toFixed(decimals));

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const counter = { n: 0 };
                ref.current.textContent = render(0);

                gsap.to(counter, {
                    n: value,
                    duration: 1.8,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
                    onUpdate: () => {
                        ref.current.textContent = render(decimals ? counter.n : Math.round(counter.n));
                    },
                });
            });
        },
        { scope: ref, dependencies: [value] },
    );

    return (
        <span ref={ref} className={className}>
            {render(value)}
        </span>
    );
}
