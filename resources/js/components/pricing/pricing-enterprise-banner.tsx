import type { FC } from 'react';
import { memo } from 'react';

import type { PlanCatalogItem } from '@/types/plan-catalog';

type PricingEnterpriseBannerProps = {
    plan: PlanCatalogItem;
    ctaHref: string;
    className?: string;
};

/**
 * Performance optimization: Wrap PricingEnterpriseBanner with React.memo() to skip
 * re-rendering this banner when parent state updates occur (e.g. toggling billing interval).
 */
const PricingEnterpriseBanner = memo(({
    plan,
    ctaHref,
    className = '',
}: PricingEnterpriseBannerProps) => (
    <div
        className={`rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border dark:bg-card ${className}`}
    >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h3 className="t-ui-title-lg text-foreground">
                    {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {plan.summary}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                    {plan.priceLabel}
                </p>
            </div>
            <a
                href={ctaHref}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted dark:border-border"
            >
                {plan.requiresContactSales
                    ? 'Contact sales'
                    : `Choose ${plan.name}`}
            </a>
        </div>
    </div>
));

PricingEnterpriseBanner.displayName = 'PricingEnterpriseBanner';

export default PricingEnterpriseBanner;
