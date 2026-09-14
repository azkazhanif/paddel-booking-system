import { FINE_POINTER, gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { useRef, useState } from 'react';

/**
 * Kursor kustom (desktop). Elemen dengan atribut data-cursor="Label" memperbesar kursor dan menampilkan label.
 */
export default function Cursor() {
    const ref = useRef(null);
    const [label, setLabel] = useState('');

    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add(`${FINE_POINTER} and ${MOTION_OK}`, () => {
            const el = ref.current;
            const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
            const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });

            document.documentElement.classList.add('has-custom-cursor');
            gsap.set(el, { xPercent: 0, yPercent: 0 });

            const move = (event) => {
                if (!el.dataset.visible) {
                    el.dataset.visible = '1';
                    gsap.set(el, { x: event.clientX, y: event.clientY, autoAlpha: 1 });
                }

                xTo(event.clientX);
                yTo(event.clientY);

                const target = event.target.closest?.('a, button, [data-cursor]');
                const text = target?.dataset.cursor ?? '';
                setLabel(text);
                gsap.to(el, { scale: text ? 5 : target ? 2.2 : 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
            };

            window.addEventListener('pointermove', move);

            return () => {
                window.removeEventListener('pointermove', move);
                document.documentElement.classList.remove('has-custom-cursor');
            };
        });
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden
            className="pointer-events-none invisible fixed top-0 left-0 z-[90] -mt-2 -ml-2 grid size-4 place-items-center rounded-full bg-court-500"
        >
            <span className="text-[3px] font-bold tracking-wide whitespace-nowrap text-ink-950 uppercase">{label}</span>
        </div>
    );
}
