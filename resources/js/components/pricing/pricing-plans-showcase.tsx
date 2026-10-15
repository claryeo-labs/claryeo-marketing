import { motion } from 'framer-motion';
import type { FC } from 'react';
import { useMemo, useState } from 'react';

import type { PlanCatalogItem } from '@/types/plan-catalog';

import BillingIntervalToggle from './billing-interval-toggle';
import PricingEnterpriseBanner from './pricing-enterprise-banner';
import PricingFreePlanCard from './pricing-free-plan-card';
import PricingProPlanCard from './pricing-pro-plan-card';
import {
    planByKey,
    proHeadlinePriceLabel,
    savingsPercent,
    type BillingInterval,
} from './pricing-utils';

type ShowcaseLayout = {
    sectionId?: string;
    heading?: string;
    subheading?: string;
    sectionClassName?: string;
    compareHref?: string;
    compareLabel?: string;
};

type PricingPlansShowcaseProps = {
    plans: PlanCatalogItem[];
    layout?: ShowcaseLayout;
    billing?: BillingInterval;
    onBillingChange?: (next: BillingInterval) => void;
    getStartedUrl?: string;
    contactUrl?: string;
};

const PricingPlansShowcase: FC<PricingPlansShowcaseProps> = ({
    plans,
    layout = {},
    billing: controlledBilling,
    onBillingChange,
    getStartedUrl = '/get-started',
    contactUrl = '/contact',
}) => {
    const [localBilling, setLocalBilling] = useState<BillingInterval>('annual');
    const billing =
        controlledBilling !== undefined && onBillingChange !== undefined
            ? controlledBilling
            : localBilling;
    const setBilling = onBillingChange ?? setLocalBilling;

    const freePlan = planByKey(plans, 'free');
    const growthPlan = planByKey(plans, 'growth');
    const proPlan = planByKey(plans, 'pro');
    const enterprisePlan = planByKey(plans, 'enterprise');

    const savePct = useMemo(
        () =>
            savingsPercent(
                proPlan?.monthlyAmount ?? null,
                proPlan?.annualAmount ?? null,
            ),
        [proPlan?.monthlyAmount, proPlan?.annualAmount],
    );

    const growthMonthlyKobo =
        growthPlan?.monthlyAmount ?? growthPlan?.amount ?? null;
    const growthAnnualKobo = growthPlan?.annualAmount ?? null;
    const proMonthlyKobo = proPlan?.monthlyAmount ?? proPlan?.amount ?? null;
    const proAnnualKobo = proPlan?.annualAmount ?? null;

    const growthHeadlinePrice = useMemo(
        () =>
            growthPlan
                ? proHeadlinePriceLabel(
                      billing,
                      growthPlan,
                      growthMonthlyKobo,
                      growthAnnualKobo,
                  )
                : '',
        [billing, growthAnnualKobo, growthMonthlyKobo, growthPlan],
    );

    const proHeadlinePrice = useMemo(
        () =>
            proPlan
                ? proHeadlinePriceLabel(
                      billing,
                      proPlan,
                      proMonthlyKobo,
                      proAnnualKobo,
                  )
                : '',
        [billing, proAnnualKobo, proMonthlyKobo, proPlan],
    );

    if (!freePlan || !growthPlan || !proPlan) {
        return null;
    }

    // Marketing is unauthenticated: every CTA hands off to the app via the
    // marketing get-started route (which carries the plan/interval across to
    // app.claryeo.com), and Enterprise routes to the marketing contact form.
    const planCta = (key: 'growth' | 'pro') => ({
        href: `${getStartedUrl}?plan=${key}&billing_interval=${billing}`,
        label: undefined as string | undefined,
        disabled: false,
    });

    const freeCtaHref = getStartedUrl;
    const freeCtaLabel = undefined;
    const growthCta = planCta('growth');
    const proCta = planCta('pro');
    const enterpriseHref = enterprisePlan?.requiresContactSales
        ? `${contactUrl}?plan=${enterprisePlan.key}`
        : getStartedUrl;

    const {
        sectionId,
        heading = 'Simple and transparent pricing for every business size',
        subheading = 'Start free, add automation when you need it, and move into deeper finance operations without changing tools.',
        sectionClassName = 'bg-background py-16 transition-colors duration-300',
        compareHref,
        compareLabel = 'Compare all features in detail',
    } = layout;

    const inner = (
        <>
            {heading && (
                <h2 className="t-display-2 mx-auto max-w-3xl text-center text-foreground">
                    {heading}
                </h2>
            )}
            {subheading && (
                <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
                    {subheading}
                </p>
            )}

            <div className="mt-8">
                <BillingIntervalToggle
                    value={billing}
                    onChange={setBilling}
                    savePercent={savePct}
                />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                >
                    <PricingFreePlanCard
                        plan={freePlan}
                        ctaHref={freeCtaHref}
                        ctaLabel={freeCtaLabel}
                    />
                </motion.div>

                <motion.div
                    id="growth-plan"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                >
                    <PricingProPlanCard
                        tier="growth"
                        plan={growthPlan}
                        billing={billing}
                        headlinePrice={growthHeadlinePrice}
                        ctaHref={growthCta.href}
                        ctaLabel={growthCta.label}
                        ctaDisabled={growthCta.disabled}
                    />
                </motion.div>

                <motion.div
                    id="premium-plan"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.08 }}
                >
                    <PricingProPlanCard
                        tier="pro"
                        plan={proPlan}
                        billing={billing}
                        headlinePrice={proHeadlinePrice}
                        ctaHref={proCta.href}
                        ctaLabel={proCta.label}
                        ctaDisabled={proCta.disabled}
                        popularLabel={(
                            proPlan.badgeLabel ?? 'Most popular'
                        ).toUpperCase()}
                    />
                </motion.div>
            </div>

            {enterprisePlan && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="mt-6"
                >
                    <PricingEnterpriseBanner
                        plan={enterprisePlan}
                        ctaHref={enterpriseHref}
                    />
                </motion.div>
            )}

            {compareHref && (
                <p className="mt-8 text-center">
                    <a
                        href={compareHref}
                        className="rounded-xs text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        {compareLabel} →
                    </a>
                </p>
            )}
        </>
    );

    const shell = (
        <div className="mx-auto max-w-[1180px] px-4 md:px-0">{inner}</div>
    );

    if (sectionId) {
        return (
            <section id={sectionId} className={sectionClassName}>
                {shell}
            </section>
        );
    }

    return <div className={sectionClassName}>{shell}</div>;
};

export default PricingPlansShowcase;
