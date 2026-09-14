import Logo from '@/Components/common/Logo';
import { gsap, useGSAP } from '@/lib/gsap';
import { useRef } from 'react';

export default function Preloader({ onComplete }) {
    const ref = useRef(null);
    const counterRef = useRef(null);

    useGSAP(
        () => {
            const root = document.documentElement;
            const counter = { n: 0 };
            root.style.overflow = 'hidden';

            gsap.timeline({
                onComplete: () => {
                    root.style.overflow = '';
                    onComplete();
                },
            })
                .to(counter, {
                    n: 100,
                    duration: 1.6,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                        counterRef.current.textContent = String(Math.round(counter.n)).padStart(3, '0');
                    },
                })
                .to('[data-bar]', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
                .to('[data-content]', { yPercent: -120, duration: 0.6, ease: 'power3.in' })
                .to('[data-panel="dark"]', { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
                .to('[data-panel="green"]', { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.75');

            return () => {
                root.style.overflow = '';
            };
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className="fixed inset-0 z-[100]" aria-busy="true" aria-label="Memuat halaman">
            <div data-panel="green" className="absolute inset-0 bg-court-500" />
            <div data-panel="dark" className="absolute inset-0 overflow-hidden bg-ink-950 text-bone-50">
                <div data-content className="flex h-full flex-col justify-between p-6 md:p-10">
                    <Logo />
                    <div>
                        <p
                            ref={counterRef}
                            className="font-display text-[clamp(5rem,22vw,18rem)] leading-none font-semibold tracking-tighter tabular-nums"
                        >
                            000
                        </p>
                        <div className="mt-4 h-px w-full bg-ink-700">
                            <div data-bar className="h-full origin-left scale-x-0 bg-court-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
