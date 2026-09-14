import Cursor from '@/Components/animation/Cursor';
import PageBackground from '@/Components/animation/PageBackground';
import SmoothScroll from '@/Components/animation/SmoothScroll';
import Footer from '@/Components/home/Footer';
import Navbar from '@/Components/home/Navbar';
import Preloader from '@/Components/home/Preloader';
import { IntroContext } from '@/hooks/useIntro';
import { REDUCED_MOTION } from '@/lib/gsap';
import { useState } from 'react';

const INTRO_KEY = 'pbs:intro-played';

function shouldSkipIntro() {
    try {
        return sessionStorage.getItem(INTRO_KEY) === '1' || window.matchMedia(REDUCED_MOTION).matches;
    } catch {
        return true;
    }
}

export default function PublicLayout({ venue, children }) {
    const [introDone, setIntroDone] = useState(shouldSkipIntro);

    const finishIntro = () => {
        try {
            sessionStorage.setItem(INTRO_KEY, '1');
        } catch {
            // sessionStorage tidak tersedia (private mode) — abaikan
        }
        setIntroDone(true);
    };

    return (
        <IntroContext.Provider value={{ introDone }}>
            {!introDone && <Preloader onComplete={finishIntro} />}
            <Navbar />
            <Cursor />
            <SmoothScroll after={<PageBackground />}>
                <main>{children}</main>
                <Footer venue={venue} />
            </SmoothScroll>
        </IntroContext.Provider>
    );
}
