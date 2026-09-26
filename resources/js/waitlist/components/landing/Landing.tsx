import { Footer, JoinButton } from '@/waitlist/components/Brand';
import { Chapters } from '@/waitlist/components/landing/Chapters';
import { Header } from '@/waitlist/components/landing/Header';
import { Hero } from '@/waitlist/components/landing/Hero';
import { Marquee } from '@/waitlist/components/landing/Marquee';
import { Reveal } from '@/waitlist/components/Reveal';
import { SmoothScroll } from '@/waitlist/components/SmoothScroll';

/**
 * A server component. Only the parts that genuinely need the browser are client
 * components — Header (menu state), Hero/HeroArt (entry animation, pointer parallax),
 * Chapters (tabs + accordion) and Reveal. The marquee, the closing copy and the footer
 * render on the server and ship no JavaScript of their own.
 */
export const Landing = () => (
    <div className="landing">
        <SmoothScroll />
        <div className="hero-atmosphere">
            <Header />
            <Hero />
        </div>
        <Marquee />
        <Chapters />
        <section className="closing-section" data-testid="closing-section">
            <div className="closing-glow" />
            <Reveal className="wrap closing-content">
                <span className="eyebrow" data-testid="closing-eyebrow">
                    <span className="status-dot" /> YOUR NEXT CHAPTER STARTS HERE
                </span>
                <p className="closing-title" data-testid="closing-title">
                    Close the books.
                    <br />
                    <em>Open your evening.</em>
                </p>
                <p className="closing-description" data-testid="closing-description">
                    Tell us a little about your business.
                    <br />
                    Let’s make room for what you started it for.
                </p>
                <JoinButton id="closing-join">Find my clarity</JoinButton>
                <span className="closing-note" data-testid="closing-note">
                    YOUR BUSINESS. YOUR PACE. YOUR EARLY ACCESS.
                </span>
            </Reveal>
            <div className="oversized-wordmark" aria-hidden="true">
                claryeo.
            </div>
        </section>
        <Footer />
    </div>
);
