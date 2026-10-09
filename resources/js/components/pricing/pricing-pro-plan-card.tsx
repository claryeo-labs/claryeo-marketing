import { Check } from 'lucide-react';
import type { FC } from 'react';
import { memo } from 'react';

import type { PlanCatalogItem } from '@/types/plan-catalog';

import { GROWTH_MARKETING_FEATURES } from './growth-marketing-features';
import type { BillingInterval } from './pricing-utils';
import { PRO_MARKETING_FEATURES } from './pro-marketing-features';

type MarketingFeature = {
    readonly title: string;
    readonly description: string;
};

type PricingProPlanCardProps = {
    plan: PlanCatalogItem;
    billing: BillingInterval;
    headlinePrice: string;
    ctaHref: string;
    tier: 'growth' | 'pro';
    popularLabel?: string;
    marketingFeatures?: readonly MarketingFeature[];
    ctaLabel?: string;
    ctaDisabled?: boolean;
    className?: string;
};

/**
 * Performance optimization: Wrap PricingProPlanCard with React.memo() to skip
 * re-rendering plan cards during parent container updates when their props remain stable.
 */
const PricingProPlanCard = memo(({
    plan,
    billing,
    headlinePrice,
    ctaHref,
    tier,
    popularLabel,
    marketingFeatures,
    ctaLabel,
    ctaDisabled = false,
    className = '',
}: PricingProPlanCardProps) => {
    const features =
        marketingFeatures ??
        (tier === 'growth'
            ? GROWTH_MARKETING_FEATURES
            : PRO_MARKETING_FEATURES);
    const defaultCtaLabel =
        tier === 'growth' ? 'Subscribe to Growth' : 'Upgrade to Pro';
    const ribbonLabel = popularLabel ?? (tier === 'pro' ? 'Most popular' : '');
    const [priceValue, priceCadence] = headlinePrice
        .split('/')
        .map((part) => part.trim());
    const isPopular = tier === 'pro';

    return (
        <div
            className={`relative flex h-full flex-col overflow-visible rounded-3xl border bg-card shadow-sm ${
                isPopular
                    ? 'border-primary/40 ring-1 ring-primary/20'
                    : 'border-border'
            } dark:bg-card ${className}`}
        >
            {ribbonLabel ? (
                <div className="absolute top-0 right-8 z-10 -translate-y-1/2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
                    {ribbonLabel}
                </div>
            ) : null}
            <div className="flex min-h-[260px] flex-col p-6 md:p-8">
                <h3
                    className={`text-xl font-semibold ${isPopular ? 'text-primary' : 'text-foreground'}`}
                >
                    {plan.name}
                </h3>
                <p className="t-figure-display mt-6 flex items-end gap-2 text-5xl text-foreground md:text-6xl">
                    {priceValue}
                    <span className="pb-2 text-sm font-medium text-muted-foreground">
                        per {priceCadence ?? 'month'}
                    </span>
                </p>
                <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase">
                    {billing === 'annual'
                        ? 'Billed annually'
                        : 'Billed monthly'}
                </p>
                {ctaDisabled ? (
                    <span
                        aria-disabled="true"
                        className="mt-auto flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-muted/60 px-4 py-3 text-sm font-semibold text-muted-foreground"
                    >
                        {ctaLabel ?? defaultCtaLabel}
                    </span>
                ) : (
                    <a
                        href={ctaHref}
                        className={`mt-auto flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                            isPopular
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-muted text-foreground hover:bg-muted/80 dark:bg-muted/70 dark:hover:bg-muted'
                        }`}
                    >
                        {ctaLabel ?? defaultCtaLabel}
                    </a>
                )}
            </div>

            <div className="border-t border-border p-6 md:p-8">
                <p className="text-sm font-semibold text-foreground uppercase">
                    Features
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    {plan.summary}
                </p>
                <ul className="mt-6 flex flex-col gap-4">
                    {features.map(({ title, description }) => (
                        <li key={title} className="flex gap-3 text-sm">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <span className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {title}
                                </span>
                                <span className="sr-only">: </span>
                                <span className="block">{description}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
});

PricingProPlanCard.displayName = 'PricingProPlanCard';

export default PricingProPlanCard;
