import { createContext, useContext } from 'react';

export const IntroContext = createContext({ introDone: true });

/**
 * true setelah preloader selesai; animasi hero menunggu nilai ini.
 */
export function useIntro() {
    return useContext(IntroContext).introDone;
}
