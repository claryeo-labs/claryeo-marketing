import { animate, stagger } from 'animejs';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FC, SubmitEvent } from 'react';

import AtmosphereCanvas from '@/components/landing/atmosphere-canvas';
import { prefersReducedMotion } from '@/lib/motion';

type Pillar = { word: string; promise: string };

const PILLARS: Pillar[] = [
    { word: 'confidence', promise: 'Know where your business stands' },
    { word: 'clarity', promise: 'Turn your numbers into simple decisions' },
    { word: 'control', promise: 'Less time on admin, more on growing' },
];

// The word sits alone on the second line of a centred headline, so it can
// grow and shrink freely -- nothing below it moves.

const TYPE_MS = 85;
const HOLD_TICKS = 20;

// Performance optimization: Pre-instantiate static Intl.NumberFormat to avoid
// object creation on every income input keystroke.
const enNgIntegerFormatter = new Intl.NumberFormat('en-NG');

/**
 * Performance optimization: Encapsulate typewriter interval and state in a
 * dedicated subcomponent. Prevents LandingHero (and its subcomponents) from
 * re-rendering every 85ms (~11.7 Hz) during the word cycling animation.
 */
const TypewriterWord: FC = () => {
    const [typed, setTyped] = useState(PILLARS[0].word);

    // One interval drives the whole cycle: type out, linger, erase, next word.
    // Reduced-motion users keep the first word, permanently.
    useEffect(() => {
        if (prefersReducedMotion()) return;

        let index = 0;
        let chars = PILLARS[0].word.length;
        let erasing = false;
        let hold = HOLD_TICKS;

        const id = setInterval(() => {
            if (!erasing && chars === PILLARS[index].word.length) {
                if (hold-- > 0) return;
                erasing = true;
            }

            chars += erasing ? -1 : 1;

            if (chars === 0) {
                erasing = false;
                hold = HOLD_TICKS;
                index = (index + 1) % PILLARS.length;
            }

            setTyped(PILLARS[index].word.slice(0, chars));
        }, TYPE_MS);

        return () => clearInterval(id);
    }, []);

    return <em className="">{typed}</em>;
};

type LandingHeroProps = {
    getStartedUrl: string;
    waitlistUrl: string;
    waitlistMode: boolean;
};

const LandingHero: FC<LandingHeroProps> = ({ getStartedUrl, waitlistUrl, waitlistMode }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [income, setIncome] = useState('');

    // Layout effect, not effect: the tween's `from` values must land before
    // the browser paints, or the hero flashes in fully-formed and then
    // snaps back to opacity 0 to animate.
    useLayoutEffect(() => {
        if (!rootRef.current || prefersReducedMotion()) return;

        const targets = rootRef.current.querySelectorAll('[data-hero-in]');
        const animation = animate(targets, {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 700,
            delay: stagger(90, { start: 150 }),
            ease: 'outQuart',
        });

        return () => {
            animation.revert();
        };
    }, []);

    // Grouped as you type. A native number input can't render separators, so
    // this stays a text input with a numeric keypad and formats on change.
    const handleIncomeChange = (raw: string): void => {
        const digits = raw.replace(/\D/g, '').slice(0, 12);
        setIncome(digits === '' ? '' : enNgIntegerFormatter.format(Number(digits)));
    };

    const handleSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const trimmed = income.replace(/\D/g, '');
        window.location.href = trimmed
            ? `/tax-calculator?income=${trimmed}`
            : '/tax-calculator';
    };

    return (
        <section className="relative overflow-hidden bg-ink">
            <AtmosphereCanvas variant="dawn" />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-ink" />

            <div
                ref={rootRef}
                className="relative mx-auto flex w-full max-w-295 flex-col items-center px-4 pt-20 pb-24 text-center md:px-0 md:pt-28 md:pb-32"
            >
                <span
                    data-hero-in
                    className="t-eyebrow inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-4 py-1.5 text-mist backdrop-blur"
                >
                    Rolling out in Nigeria · FIRS-ready
                </span>

                <h1
                    data-hero-in
                    className="t-display-hero mt-6 max-w-4xl text-paper"
                >
                   Less time on admin.
                    <br />
                    Run your business with 
                    <br />
                    <TypewriterWord />
                    <span aria-hidden className="ml-0.5 animate-pulse font-sans font-light">|</span>
                    <span className="sr-only">confidence, clarity and control.</span>
                </h1>

                <p data-hero-in className="t-lead mt-6 max-w-xl text-balance text-mist">
                    Claryeo syncs your bank, matches your payments and works out your tax,
                    automatically. You spend less time on admin, and more time on the business.
                </p>

                <div data-hero-in className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <a
                        href={waitlistMode ? waitlistUrl : getStartedUrl}
                        className="inline-flex items-center gap-1.5 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink shadow-lg transition-transform hover:scale-[1.02]"
                    >
                        {waitlistMode ? 'Join the waitlist' : 'Get started free'}
                        <ArrowUpRight className="size-4" />
                    </a>
                </div>

                <form
                    data-hero-in
                    onSubmit={handleSubmit}
                    className="mt-10 flex w-full max-w-md items-center gap-2 rounded-full border border-paper/15 bg-paper/5 py-1.5 pr-1.5 pl-5 backdrop-blur"
                >
                    <span className="text-mist">₦</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={income}
                        onChange={(e) => handleIncomeChange(e.target.value)}
                        placeholder="What did you earn this year?"
                        aria-label="Estimated yearly income"
                        className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-paper placeholder:text-mist/70 focus:outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Estimate my tax"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-transform hover:scale-105"
                    >
                        <ArrowUp className="size-4" />
                    </button>
                </form>
                <p data-hero-in className="t-eyebrow mt-3 text-mist">
                    Free tax estimate · No account required
                </p>

                <div
                    data-hero-in
                    className="mt-16 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-paper/10 pt-8"
                >
                    {PILLARS.map((pillar) => (
                        <div key={pillar.word} className="text-center">
                            <div className="t-display-4 text-paper capitalize">{pillar.word}</div>
                            <div className="mt-1 text-xs text-balance text-mist">{pillar.promise}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingHero;
