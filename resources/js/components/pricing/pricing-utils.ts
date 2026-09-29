import type { PlanCatalogItem, PlanKey } from '@/types/plan-catalog';

export type BillingInterval = 'monthly' | 'annual';

export function planByKey(
    plans: PlanCatalogItem[],
    key: PlanKey,
): PlanCatalogItem | undefined {
    return plans.find((p) => p.key === key);
}

// Performance optimization: Pre-instantiate module-level Intl.NumberFormat formatter
// to eliminate object allocation during pricing card/table label formatting.
const ngnIntegerFormatter = new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 0,
});

export function formatNgnFromKobo(kobo: number): string {
    const ngn = kobo / 100;

    return `₦${ngnIntegerFormatter.format(ngn)}`;
}

export function savingsPercent(
    monthlyKobo: number | null | undefined,
    annualKobo: number | null | undefined,
): number | null {
    if (
        monthlyKobo == null ||
        annualKobo == null ||
        monthlyKobo <= 0 ||
        annualKobo <= 0
    ) {
        return null;
    }

    const yearlyAtMonthly = monthlyKobo * 12;

    if (yearlyAtMonthly <= annualKobo) {
        return null;
    }

    return Math.round(((yearlyAtMonthly - annualKobo) / yearlyAtMonthly) * 100);
}

export function formatFreePriceLabel(priceLabel: string): string {
    const trimmed = priceLabel.replace(/^NGN\s*/i, '₦').trim();

    if (trimmed === '₦0' || trimmed === '0') {
        return '₦0 /month';
    }

    return trimmed.includes('/') ? trimmed : `${trimmed} /month`;
}

export function proHeadlinePriceLabel(
    billing: BillingInterval,
    proPlan: PlanCatalogItem,
    proMonthlyKobo: number | null,
    proAnnualKobo: number | null,
): string {
    if (billing === 'annual' && proAnnualKobo != null) {
        const perMonth = proAnnualKobo / 12;

        return `${formatNgnFromKobo(perMonth)} /month`;
    }

    if (billing === 'monthly' && proMonthlyKobo != null) {
        return `${formatNgnFromKobo(proMonthlyKobo)} /month`;
    }

    const label =
        billing === 'annual'
            ? (proPlan.annualPriceLabel ?? proPlan.priceLabel)
            : (proPlan.monthlyPriceLabel ?? proPlan.priceLabel);

    return label.replace(/^NGN\s*/i, '₦');
}

export function proCheckoutDisplay(
    billing: BillingInterval,
    proPlan: PlanCatalogItem,
    proMonthlyKobo: number | null,
    proAnnualKobo: number | null,
): { lineLabel: string; lineAmount: string; totalDue: string } {
    const lineLabel =
        billing === 'annual' ? 'Annual subscription' : 'Monthly subscription';
    const lineAmount =
        billing === 'annual' && proAnnualKobo != null
            ? formatNgnFromKobo(proAnnualKobo)
            : proMonthlyKobo != null
              ? formatNgnFromKobo(proMonthlyKobo)
              : (proPlan.priceLabel ?? '').replace(/^NGN\s*/i, '₦');

    return {
        lineLabel,
        lineAmount,
        totalDue: lineAmount,
    };
}
