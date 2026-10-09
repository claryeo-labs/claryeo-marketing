import { Check, Minus } from 'lucide-react';
import type { FC } from 'react';
import { memo } from 'react';

import type { PlanCatalogItem } from '@/types/plan-catalog';

import { formatFreePriceLabel } from './pricing-utils';

type PricingFreePlanCardProps = {
    plan: PlanCatalogItem;
    ctaHref: string;
    ctaLabel?: string;
    excludedFeatureLabel?: string;
    className?: string;
};

/**
 * Performance optimization: Wrap PricingFreePlanCard with React.memo() to skip
 * re-rendering this static card when parent state updates occur (e.g. toggling
 * billing interval in PricingPlansShowcase or interacting with slider controls
 * on pricing pages).
 */
const PricingFreePlanCard = memo(({
    plan,
    ctaHref,
    ctaLabel = 'Get Started',
    excludedFeatureLabel = 'No Open Banking Sync',
    className = '',
}: PricingFreePlanCardProps) => (
    <div
        className={`flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm dark:border-border dark:bg-card ${className}`}
    >
        <div className="flex min-h-[260px] flex-col p-6 md:p-8">
            <h3 className="t-ui-title-lg text-foreground">
                {plan.name}
            </h3>
            <p className="t-figure-display mt-6 flex items-end gap-2 text-5xl text-foreground md:text-6xl">
                {formatFreePriceLabel(plan.priceLabel).replace(' /month', '')}
                <span className="pb-2 text-sm font-medium text-muted-foreground">
                    per month
                </span>
            </p>
            <a
                href={ctaHref}
                className="mt-auto flex w-full items-center justify-center rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 dark:bg-muted/70 dark:hover:bg-muted"
            >
                {ctaLabel}
            </a>
        </div>

        <div className="border-t border-border p-6 md:p-8">
            <p className="text-sm font-semibold text-foreground uppercase">
                Features
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
            <ul className="mt-6 flex flex-col gap-4">
                {plan.entitlementBullets.map((bullet) => (
                    <li
                        key={bullet}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span>{bullet}</span>
                    </li>
                ))}
                <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Minus className="h-3 w-3" />
                    </span>
                    <span>{excludedFeatureLabel}</span>
                </li>
            </ul>
        </div>
    </div>
));

PricingFreePlanCard.displayName = 'PricingFreePlanCard';

export default PricingFreePlanCard;
