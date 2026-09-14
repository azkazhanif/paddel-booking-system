import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Satu-satunya tempat registrasi plugin GSAP (lihat CLAUDE.md)
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin);

gsap.defaults({ ease: 'expo.out', duration: 1 });

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
export const DESKTOP = '(min-width: 1024px)';
export const FINE_POINTER = '(pointer: fine)';

export function scrollToTarget(target) {
    // Ditunda satu frame agar overlay/menu yang mengunci scroll sempat tertutup
    requestAnimationFrame(() => {
        const smoother = ScrollSmoother.get();

        if (smoother) {
            smoother.scrollTo(target, true, 'top 72px');
            return;
        }

        document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    });
}

export { DrawSVGPlugin, gsap, ScrollSmoother, ScrollTrigger, SplitText, useGSAP };
