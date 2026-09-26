import type { FC } from 'react';

import BusinessBalanceSpotlight from '@/components/landing/business-balance-spotlight';
import ContentSection from '@/components/landing/content-section';
import FaqSection from '@/components/faq';
import { landingFaqs } from '@/lib/faqs';
import LandingHero from '@/components/landing/landing-hero';
import LandingPricing from '@/components/landing/landing-pricing';
import LandingTestimonials from '@/components/landing/landing-testimonials';
import ProductBento from '@/components/landing/product-bento';
import ReconciliationRing from '@/components/landing/reconciliation-ring';
import ReconciliationSpotlight from '@/components/landing/reconciliation-spotlight';
import ReportsSpotlight from '@/components/landing/reports-spotlight';
import SiteCta from '@/components/site-cta';
import type { PlanCatalogItem } from '@/types/plan-catalog';

const STEPS = [
    {
        step: '01',
        title: 'Sign up',
        desc: 'Create your account and set your business type.',
    },
    {
        step: '02',
        title: 'Run your business',
        desc: 'Send invoices, log expenses, and let bank sync and payment matching handle the rest.',
    },
    {
        step: '03',
        title: 'Track & export',
        desc: 'Bank transactions sync automatically. Export tax-ready reports when you need them.',
    },
];

type LandingProps = {
    plans?: PlanCatalogItem[];
    waitlistMode?: boolean;
};

const Landing: FC<LandingProps> = ({ plans = [], waitlistMode = false }) => {
    // Waitlist mode serves its own landing page at /, so this island only
    // renders with waitlistMode off; the branches below are kept for safety.
    const getStartedUrl = waitlistMode ? '/quiz' : '/get-started';
    const waitlistUrl = '/quiz';

    return (
        <div className="w-full">
            <LandingHero
                getStartedUrl={getStartedUrl}
                waitlistUrl={waitlistUrl}
                waitlistMode={waitlistMode}
            />

            <section id="benefits" className="bg-ink py-16 transition-colors duration-300 md:py-24">
                <div className="mx-auto w-full max-w-[1180px] px-4 md:px-0">
                    <div className="mx-auto max-w-xl text-center">
                        <span className="t-eyebrow text-mist">
                            What's inside
                        </span>
                        <h2 className="t-display-2 mt-3 text-paper">
                            <em>The</em> admin, actually handled
                        </h2>
                    </div>
                    <div className="mt-12">
                        <ProductBento />
                    </div>
                </div>
            </section>

            <BusinessBalanceSpotlight />

            <ReconciliationSpotlight />

            <ReportsSpotlight />

            <section className="bg-ink py-16 transition-colors duration-300 md:py-28">
                <div className="mx-auto w-full max-w-[1180px] px-4 md:px-0">
                    <ReconciliationRing />
                </div>
            </section>

            <section
                id="how-it-works"
                className="bg-ink py-16 transition-colors duration-300 md:py-24"
            >
                <div className="mx-auto max-w-[1180px] px-4 md:px-0">
                    <div className="mx-auto max-w-xl text-center">
                        <span className="t-eyebrow text-mist">
                            Getting started
                        </span>
                        <h2 className="t-display-2 mt-3 text-paper">
                            <em>Three</em> steps in
                        </h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {STEPS.map(({ step, title, desc }) => (
                            <div key={step} className="border-t border-ink-border pt-6">
                                <span className="t-mono text-sm text-dawn">{step}</span>
                                <h3 className="t-display-4 mt-3 text-paper">{title}</h3>
                                <p className="mt-2 text-sm text-mist">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {!waitlistMode && <LandingTestimonials />}

            <ContentSection
                waitlistUrl={waitlistUrl}
                getStartedUrl={getStartedUrl}
                waitlistMode={waitlistMode}
            />

            {!waitlistMode && plans.length > 0 && <LandingPricing plans={plans} />}

            <FaqSection
                id="faq"
                tone="ink"
                items={landingFaqs}
                description="Everything you need to know about invoicing, bank sync and tax on Claryeo."
            >
                <p className="mt-6 text-center text-mist">
                    Can't find what you're looking for? Contact our{' '}
                    <a
                        href="mailto:hello@claryeo.com"
                        className="font-medium text-paper hover:underline"
                    >
                        customer support team
                    </a>
                </p>
            </FaqSection>

            <SiteCta
                size="bookend"
                heading={
                    <>
                        <em>Close</em> the books.
                        <br />
                        Open your evening.
                    </>
                }
                body="Invoicing, expenses, and tax in one place, with bank sync and payment matching doing the admin, so you don't have to."
                primary={{
                    label: waitlistMode
                        ? 'Join the waitlist'
                        : 'Get started free',
                    href: waitlistMode ? waitlistUrl : getStartedUrl,
                }}
                secondary={null}
            />
        </div>
    );
};

export default Landing;
