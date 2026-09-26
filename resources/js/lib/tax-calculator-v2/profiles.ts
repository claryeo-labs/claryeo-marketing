import type { TaxYearProfile } from '@/lib/tax-calculator-v2/types';

// Derived from extant minimum wage indication; keep configurable for legal updates.
export const DEFAULT_MONTHLY_MINIMUM_WAGE = 70000;

export const TAX_YEAR_PROFILES: TaxYearProfile[] = [
    {
        key: '2026',
        label: '2026',
        effectiveFrom: '2026-01-01',
        ruleSnapshotDate: '2026-01-01',
        paye: {
            minimumWageAnnual: DEFAULT_MONTHLY_MINIMUM_WAGE * 12,
            rentRelief: {
                rate: 0.2,
                annualCap: 500000,
            },
            bands: [
                { cap: 800000, rate: 0 },
                { cap: 2200000, rate: 0.15 },
                { cap: 9000000, rate: 0.18 },
                { cap: 13000000, rate: 0.21 },
                { cap: 25000000, rate: 0.23 },
                { cap: null, rate: 0.25 },
            ],
        },
        business: {
            cit: {
                smallCompanyTurnoverThreshold: 50000000,
                smallCompanyAssetThreshold: 250000000,
                standardRate: 0.3,
                developmentLevyRate: 0.04,
            },
            vatRate: 0.075,
        },
    },
    {
        key: '2025',
        label: '2025',
        effectiveFrom: '2025-01-01',
        ruleSnapshotDate: '2025-01-01',
        paye: {
            minimumWageAnnual: DEFAULT_MONTHLY_MINIMUM_WAGE * 12,
            rentRelief: {
                rate: 0.2,
                annualCap: 500000,
            },
            bands: [
                { cap: 800000, rate: 0 },
                { cap: 2200000, rate: 0.15 },
                { cap: 9000000, rate: 0.18 },
                { cap: 13000000, rate: 0.21 },
                { cap: 25000000, rate: 0.23 },
                { cap: null, rate: 0.25 },
            ],
        },
        business: {
            cit: {
                smallCompanyTurnoverThreshold: 50000000,
                smallCompanyAssetThreshold: 250000000,
                standardRate: 0.3,
                developmentLevyRate: 0.04,
            },
            vatRate: 0.075,
        },
    },
];

// Performance optimization: Pre-index profiles by key during module evaluation
// to enable O(1) hash map lookups instead of O(N) array scans on every calculation cycle.
const TAX_YEAR_PROFILES_BY_KEY: Record<string, TaxYearProfile> =
    Object.fromEntries(
        TAX_YEAR_PROFILES.map((profile) => [profile.key, profile]),
    );

export function getTaxYearProfiles(): TaxYearProfile[] {
    return TAX_YEAR_PROFILES;
}

export function getDefaultTaxYearProfile(): TaxYearProfile {
    return TAX_YEAR_PROFILES[0];
}

export function getTaxYearProfileByKey(key: string): TaxYearProfile {
    return TAX_YEAR_PROFILES_BY_KEY[key] ?? getDefaultTaxYearProfile();
}
