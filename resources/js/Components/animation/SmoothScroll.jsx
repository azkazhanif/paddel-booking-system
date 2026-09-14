import { DESKTOP, gsap, MOTION_OK, ScrollSmoother, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useState } from 'react';

/**
 * Membungkus konten dengan ScrollSmoother (desktop, tanpa reduced motion).
 * Children baru dirender setelah smoother dibuat agar ScrollTrigger anak memakai pin berbasis transform.
 * Elemen fixed (navbar, cursor) harus diletakkan di luar komponen ini; `after` dirender di luar wrapper setelah konten siap.
 */
export default function SmoothScroll({ after, children }) {
    const [ready, setReady] = useState(false);

    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
            ScrollSmoother.create({
                wrapper: '#smooth-wrapper',
                content: '#smooth-content',
                smooth: 1.1,
                effects: true,
                normalizeScroll: false,
            });
        });

        setReady(true);

        return () => mm.revert();
    }, []);

    useGSAP(() => {
        if (!ready) return;

        const refresh = () => ScrollTrigger.refresh();
        document.fonts?.ready.then(refresh);
        window.addEventListener('load', refresh);

        return () => window.removeEventListener('load', refresh);
    }, [ready]);

    return (
        <>
            <div id="smooth-wrapper">
                <div id="smooth-content">{ready && children}</div>
            </div>
            {ready && after}
        </>
    );
}
