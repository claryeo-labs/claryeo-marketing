import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Abbreviated compact currency (e.g. ₦1.53M) only at or above this absolute amount. */
export const COMPACT_CURRENCY_ABBREVIATION_THRESHOLD = 100_000;

/**
 * Short currency via Intl compact notation (e.g. ₦150K, ₦1.53M).
 * Returns undefined below {@link COMPACT_CURRENCY_ABBREVIATION_THRESHOLD}.
 */
export function formatCurrencyCompactAbbreviation(
    amount: number,
    currency: string = 'NGN',
    options?: { locale?: string; threshold?: number },
): string | undefined {
    const threshold =
        options?.threshold ?? COMPACT_CURRENCY_ABBREVIATION_THRESHOLD;

    if (!Number.isFinite(amount) || Math.abs(amount) < threshold) {
        return undefined;
    }

    const locale = options?.locale ?? (currency === 'NGN' ? 'en-NG' : 'en-US');

    try {
        return new Intl.NumberFormat(locale, {
            notation: 'compact',
            compactDisplay: 'short',
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return undefined;
    }
}

/**
 * Primary balance display: compact Intl currency from {@link COMPACT_CURRENCY_ABBREVIATION_THRESHOLD} up, otherwise full {@link formatCurrency}.
 */
export function formatCurrencyEstimatedBalance(
    amount: number,
    currency: string = 'NGN',
    options?: { locale?: string; threshold?: number },
): string {
    return (
        formatCurrencyCompactAbbreviation(amount, currency, options) ??
        formatCurrency(amount, currency)
    );
}

// Performance optimization: Pre-instantiate module-level Intl.NumberFormat formatters to eliminate
// costly object instantiation and reduce garbage collection overhead during frequent UI re-renders
// (such as interactive real-time tax calculations, dashboard chart tooltips, and summary table updates).
const ngnFormatter = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const defaultFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatCurrency(
    amount: number,
    currency: string = 'NGN',
    options?: { compact?: boolean },
): string {
    const currencySymbols: Record<string, string> = {
        NGN: '₦',
        USD: '$',
        GBP: '£',
        EUR: '€',
        GHS: '₵',
        KES: 'KSh',
        ZAR: 'R',
    };

    const symbol = currencySymbols[currency] || currency;

    if (options?.compact) {
        const abs = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';
        if (abs >= 1000000) {
            return `${sign}${symbol}${(abs / 1000000).toFixed(1)}M`;
        }
        if (abs >= 1000) {
            return `${sign}${symbol}${(abs / 1000).toFixed(1)}K`;
        }
        return `${sign}${symbol}${abs.toFixed(0)}`;
    }

    if (currency === 'NGN') {
        return `${symbol}${ngnFormatter.format(amount)}`;
    }

    return `${symbol}${defaultFormatter.format(amount)}`;
}
