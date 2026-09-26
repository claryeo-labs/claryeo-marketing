import Lenis from 'lenis';
import { useEffect } from 'react';

/**
 * Lenis runs on the landing page only — it is the one page long enough to want inertial
 * scrolling, and the quiz/result pages need the browser's native scrolling for focus
 * management. Mounted from app/page.tsx so it is torn down on navigation away.
 *
 * The hash jump was handled by the router's ScrollManager before; Next restores scroll
 * position itself, but a first load on /#section still needs the deferred scroll because
 * the target only exists once the page has painted.
 */
export const SmoothScroll = () => {
    useEffect(() => {
        const { hash } = window.location;
        if (!hash) return;
        const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true, autoRaf: true });
        return () => lenis.destroy();
    }, []);

    return null;
};
