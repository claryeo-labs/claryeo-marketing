import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, ArrowRight } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { FeatureIcon, JoinButton } from '@/waitlist/components/Brand';
import { Reveal } from '@/waitlist/components/Reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/waitlist/components/ui/accordion';

interface Pain {
    label: string;
    icon: string;
    kicker: string;
    title: string;
    description: string;
    detail: string;
    feature: string;
    value: string;
    status: string;
}

const pains: Pain[] = [
    {
        label: '“I’m always chasing payments.”',
        icon: 'receipt',
        kicker: '01 / INVOICES & REMINDERS',
        title: 'Great work deserves\na paid invoice.',
        description:
            'Send polished invoices, see what’s paid and pending, and let automatic reminders handle the awkward follow-ups.',
        detail: 'Less “just following up”. More moving forward.',
        feature: 'Invoice #014',
        value: '₦45,000.00',
        status: 'Paid, and accounted for.',
    },
    {
        label: '“My money is all over the place.”',
        icon: 'bank',
        kicker: '02 / BANK SYNC & MATCHING',
        title: 'Every account.\nOne clear picture.',
        description:
            'Bank transactions sync automatically. Incoming payments are checked against your invoices, with the evidence there for you to confirm.',
        detail: 'Connected numbers. Confident decisions.',
        feature: 'Your connected balance',
        value: '₦4,082,650.00',
        status: 'Your money, in sync.',
    },
    {
        label: '“Tax shouldn’t be this confusing.”',
        icon: 'shield',
        kicker: '03 / TAX ESTIMATES & SUMMARIES',
        title: 'Know what you owe.\nBefore you owe it.',
        description:
            'PIT, CIT and VAT estimates update as your books do. Get tax-ready summaries, without that last-minute scramble.',
        detail: 'Estimates for planning, not a substitute for tax advice.',
        feature: 'Estimated PIT',
        value: '₦212,400.00',
        status: 'A little more peace of mind.',
    },
    {
        label: '“Am I actually making a profit?”',
        icon: 'chart',
        kicker: '04 / EXPENSES & REPORTS',
        title: 'Your numbers.\nNow making sense.',
        description:
            'See revenue, expenses, profit and cash flow in one place. Eight report types, ready to export as PDF or CSV. Zero new spreadsheets.',
        detail: 'The bigger picture, without the bigger workload.',
        feature: 'Six-month profit',
        value: '₦5,600,000.00',
        status: 'See where your business stands.',
    },
];

const faqs: [string, string][] = [
    [
        'What exactly is Claryeo?',
        'Claryeo brings invoicing, expenses, bank sync, payment matching, and tax estimates into one place. It’s built for freelancers and small businesses, so you can spend less time on admin and more time on your business.',
    ],
    [
        'Why the questions before joining?',
        'Because your business isn’t one-size-fits-all. Your answers help us understand your biggest pain points, show you the Claryeo features that fit, and shape what we build next. It takes about two minutes.',
    ],
    [
        'What happens after I join the waitlist?',
        'Your place on the early-access list is saved, and you’ll see your results straight away. We’ll use your email for launch and early-access updates, and your answers to help shape what we build.',
    ],
    [
        'What will my results show?',
        'A look at what you have in common with the Claryeo community, plus a feature picked for your priorities. Community percentages come from real, anonymous waitlist responses and appear after at least five people have completed the conversation.',
    ],
    [
        'Can my answers help shape Claryeo?',
        'Absolutely. The things you’re interested in, and the admin you’d love to stop doing, help us understand what to focus on. Your individual answers stay private; only anonymous community totals are shared.',
    ],
];

const steps = [
    {
        n: '01',
        title: 'Tell us your story.',
        text: 'A few simple questions about your business, your busywork, and what you wish worked better.',
        icon: 'pen',
    },
    {
        n: '02',
        title: 'Meet your kind of clarity.',
        text: 'Discover the Claryeo features that make the most sense for the way you work.',
        icon: 'sun',
    },
    {
        n: '03',
        title: 'Be part of what’s next.',
        text: 'Join the early-access list. Help shape a product that’s built for people like you.',
        icon: 'sprout',
    },
];

export const Chapters = () => {
    const [active, setActive] = useState(0);
    const current = pains[active];

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let nextIndex: number | null = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (index + 1) % pains.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (index - 1 + pains.length) % pains.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            nextIndex = pains.length - 1;
        }

        if (nextIndex !== null) {
            setActive(nextIndex);
            const targetButton = document.getElementById(`pain-tab-${nextIndex}`);
            targetButton?.focus();
        }
    };

    if (!current) return null;
    return (
        <>
            <section className="manifesto wrap" id="why-claryeo">
                <Reveal className="chapter-label">
                    <span className="chapter-number">01</span>
                    <h2 data-testid="why-heading">BUILT AROUND YOU</h2>
                    <span className="chapter-line" />
                </Reveal>
                <Reveal className="manifesto-intro">
                    <p className="section-display" data-testid="manifesto-title">
                        You didn’t start a business
                        <br />
                        to become <em>its bookkeeper.</em>
                    </p>
                    <p className="section-aside" data-testid="manifesto-description">
                        The late-night spreadsheets. The missing payments.
                        <br className="desktop-only" /> The tax questions with no simple answers.
                        <br />
                        <span>We think you deserve a different kind of workday.</span>
                    </p>
                </Reveal>
                <div className="pain-explorer">
                    <Reveal className="pain-choices">
                        <span className="eyebrow" data-testid="pain-prompt">
                            SOUND FAMILIAR? PICK ONE.
                        </span>
                        <div role="tablist" aria-label="Explore business pain points" className="pain-tabs">
                            {pains.map((pain, i) => (
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={active === i}
                                    aria-controls="pain-feature-panel"
                                    id={`pain-tab-${i}`}
                                    key={pain.label}
                                    tabIndex={active === i ? 0 : -1}
                                    className={`pain-tab ${active === i ? 'active' : ''}`}
                                    onClick={() => setActive(i)}
                                    onKeyDown={(e) => handleKeyDown(e, i)}
                                    data-testid={`pain-tab-${i}`}
                                >
                                    <FeatureIcon name={pain.icon} size={19} />
                                    <span>{pain.label}</span>
                                    <ArrowUpRight size={18} />
                                </button>
                            ))}
                        </div>
                        <p className="pain-footnote" data-testid="pain-footnote">
                            Not just software. A little weight off your shoulders.
                        </p>
                    </Reveal>
                    <div
                        className="feature-panel"
                        role="tabpanel"
                        id="pain-feature-panel"
                        aria-labelledby={`pain-tab-${active}`}
                        data-testid="feature-panel"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                            >
                                <span className="eyebrow" data-testid="feature-kicker">
                                    {current.kicker}
                                </span>
                                <h3 data-testid="feature-title">{current.title}</h3>
                                <p data-testid="feature-description">{current.description}</p>
                                <div className="feature-receipt" data-testid="feature-example">
                                    <div>
                                        <span>{current.feature}</span>
                                        <strong>{current.value}</strong>
                                    </div>
                                    <span className="receipt-check">
                                        <Check size={22} />
                                    </span>
                                    <div className="receipt-bottom">
                                        <span>
                                            <span className="tiny-dot" />
                                            {current.status}
                                        </span>
                                        <span>PREVIEW</span>
                                    </div>
                                </div>
                                <span className="feature-detail" data-testid="feature-note">
                                    {current.detail}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </section>
            <section className="how-section" id="how-it-works">
                <div className="wrap">
                    <Reveal className="chapter-label">
                        <span className="chapter-number">02</span>
                        <h2 data-testid="how-heading">A CONVERSATION, NOT A COMMITMENT</h2>
                        <span className="chapter-line" />
                    </Reveal>
                    <Reveal className="how-intro">
                        <p className="section-display" data-testid="how-title">
                            A little about you.
                            <br />
                            <em>A lot of possibility.</em>
                        </p>
                        <JoinButton id="how-start" className="dark-button">
                            Let’s find your fit
                        </JoinButton>
                    </Reveal>
                    <div className="steps-grid">
                        {steps.map((step, i) => (
                            <Reveal delay={i * 0.1} className="step" key={step.n}>
                                <div className="step-top">
                                    <span>{step.n} /</span>
                                    <FeatureIcon name={step.icon} size={26} />
                                </div>
                                <h3 data-testid={`step-title-${i}`}>{step.title}</h3>
                                <p data-testid={`step-description-${i}`}>{step.text}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
            <section className="faq-section wrap" id="questions">
                <Reveal className="faq-intro">
                    <div className="chapter-label">
                        <span className="chapter-number">03</span>
                        <h2 data-testid="faq-heading">GOOD QUESTIONS</h2>
                    </div>
                    <p className="section-display" data-testid="faq-title">
                        A little clarity.
                        <br />
                        <em>Before we begin.</em>
                    </p>
                    <a href="/contact" className="text-link" data-testid="faq-contact">
                        Something else on your mind? Say hello <ArrowRight size={16} />
                    </a>
                </Reveal>
                <Reveal className="faq-list">
                    <Accordion type="single" collapsible>
                        {faqs.map(([q, a], i) => (
                            <AccordionItem value={`faq-${i}`} key={q} className="faq-item">
                                <AccordionTrigger className="faq-trigger" data-testid={`faq-toggle-${i}`}>
                                    {q}
                                </AccordionTrigger>
                                <AccordionContent className="faq-answer" data-testid={`faq-answer-${i}`}>
                                    {a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Reveal>
            </section>
        </>
    );
};
