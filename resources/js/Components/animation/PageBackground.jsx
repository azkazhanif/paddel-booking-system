import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useRef } from 'react';

/**
 * Latar fixed yang berganti warna mengikuti tone section yang sedang aktif (gaya landonorris.com).
 * Letakkan setelah konten dirender; section dengan [data-bg] menjadi transparan lewat class .theme-ready.
 */
export default function PageBackground() {
    const ref = useRef(null);

    useGSAP(() => {
        const sections = gsap.utils.toArray('[data-bg]');
        if (!sections.length) return;

        document.documentElement.classList.add('theme-ready');
        gsap.set(ref.current, { backgroundColor: sections[0].dataset.bg });

        sections.forEach((section) => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 55%',
                end: 'bottom 55%',
                onToggle: (self) => {
                    if (self.isActive) {
                        gsap.to(ref.current, { backgroundColor: section.dataset.bg, duration: 0.7, ease: 'power2.out', overwrite: true });
                    }
                },
            });
        });

        return () => document.documentElement.classList.remove('theme-ready');
    }, []);

    return <div ref={ref} aria-hidden className="fixed inset-0 -z-10 bg-ink-950" />;
}
