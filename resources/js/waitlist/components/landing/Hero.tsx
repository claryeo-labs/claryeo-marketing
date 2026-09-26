import { motion } from 'framer-motion';
import { ArrowDown, Clock3 } from 'lucide-react';

import { JoinButton } from '@/waitlist/components/Brand';
import { HeroArt } from '@/waitlist/components/HeroArt';

const TITLE_LINES = ['You build.', 'We handle', 'the busywork.'];

export const Hero = () => (
    <section className="hero wrap" data-testid="landing-hero">
        <div className="hero-copy">
            <h1 className="hero-title" data-testid="hero-title">
                {TITLE_LINES.map((line, i) => (
                    <span className="masked-line" key={line}>
                        <motion.span
                            initial={{ y: '110%', rotate: 3 }}
                            animate={{ y: 0, rotate: 0 }}
                            transition={{ duration: 1.1, delay: 0.15 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                            className={i === 2 ? 'hero-italic' : ''}
                        >
                            {line}
                        </motion.span>
                    </span>
                ))}
            </h1>
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
            >
                <p className="hero-description" data-testid="hero-description">
                    Invoicing, bank sync, and tax. Finally, in sync.
                    <br />
                    Less time figuring out your numbers.
                    <br className="mobile-break" /> More time doing your thing.
                </p>
                <div className="hero-cta-row">
                    <JoinButton id="hero-start">Let’s talk about your business</JoinButton>
                    <span className="time-note" data-testid="quiz-duration">
                        <Clock3 size={13} /> ABOUT 2 MIN
                    </span>
                </div>
            </motion.div>
        </div>
        <HeroArt />
        <div className="hero-bottom">
            <a href="#why-claryeo" className="scroll-cue" data-testid="explore-scroll">
                <span className="scroll-circle">
                    <ArrowDown size={15} />
                </span>
                THERE’S A BETTER WAY
            </a>
            <span data-testid="hero-audience">FOR THE INDEPENDENTS. THE SMALL TEAMS. THE BIG DREAMERS.</span>
        </div>
    </section>
);
