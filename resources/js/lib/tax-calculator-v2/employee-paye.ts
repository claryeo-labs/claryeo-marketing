import {
    ANNUAL_MULTIPLIERS,
    type CalculatorResult,
    type EmployeePayeInput,
    type MoneyLineItem,
    type TaxBand,
} from '@/lib/tax-calculator-v2/types';

interface ProgressiveBandAllocation {
    index: number;
    cap: number | null;
    rate: number;
    lowerBound: number;
    taxableAmount: number;
    taxAmount: number;
}

function annualizeLineItem(item: MoneyLineItem): number {
    const multiplier = ANNUAL_MULTIPLIERS[item.frequency];

    return Math.max(item.amount, 0) * multiplier;
}

function sumAnnualizedLineItems(
    lineItems: MoneyLineItem[],
    predicate?: (item: MoneyLineItem) => boolean,
): number {
    return lineItems.reduce((total, item) => {
        if (predicate && !predicate(item)) {
            return total;
        }

        return total + annualizeLineItem(item);
    }, 0);
}

function calculateProgressiveBandAllocations(
    taxableIncome: number,
    bands: TaxBand[],
): ProgressiveBandAllocation[] {
    if (taxableIncome <= 0) {
        return [];
    }

    let remainingIncome = taxableIncome;
    let lowerBound = 0;
    const allocations: ProgressiveBandAllocation[] = [];

    for (const [index, band] of bands.entries()) {
        if (remainingIncome <= 0) {
            break;
        }

        const taxableAmount =
            band.cap === null
                ? remainingIncome
                : Math.min(remainingIncome, band.cap);

        allocations.push({
            index,
            cap: band.cap,
            rate: band.rate,
            lowerBound,
            taxableAmount,
            taxAmount: taxableAmount * band.rate,
        });

        remainingIncome -= taxableAmount;

        if (band.cap !== null) {
            lowerBound += band.cap;
        }
    }

    return allocations;
}

function formatRate(rate: number): string {
    return `${(rate * 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}%`;
}

function formatNaira(value: number): string {
    return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

function formatBandScope(
    index: number,
    lowerBound: number,
    cap: number | null,
): string {
    if (cap === null) {
        return `Above ${formatNaira(lowerBound)}`;
    }

    if (index === 0) {
        return `First ${formatNaira(cap)}`;
    }

    return `Next ${formatNaira(cap)}`;
}

export function calculateEmployeePaye(
    input: EmployeePayeInput,
): CalculatorResult {
    const taxableEarnings = sumAnnualizedLineItems(
        input.earnings,
        (item) => item.taxable !== false,
    );
    const exemptEarnings = sumAnnualizedLineItems(
        input.earnings,
        (item) => item.taxable === false,
    );
    const grossEmolument = taxableEarnings + exemptEarnings;

    const annualRentPaid = Math.max(input.annualRentPaid ?? 0, 0);
    const rentRelief = Math.min(
        annualRentPaid * input.profile.paye.rentRelief.rate,
        input.profile.paye.rentRelief.annualCap,
    );

    const deductibleLines = sumAnnualizedLineItems(
        input.deductions,
        (item) => item.deductible !== false,
    );
    const totalReliefsAndDeductions = rentRelief + deductibleLines;

    const taxableIncome = Math.max(
        taxableEarnings - totalReliefsAndDeductions,
        0,
    );
    const isMinimumWageExempt =
        grossEmolument <= input.profile.paye.minimumWageAnnual;
    const payeBandAllocations = isMinimumWageExempt
        ? []
        : calculateProgressiveBandAllocations(
              taxableIncome,
              input.profile.paye.bands,
          );
    // Performance optimization: Sum tax amounts directly from existing allocations
    // instead of re-allocating bands via calculateProgressiveTax().
    const paye = isMinimumWageExempt
        ? 0
        : payeBandAllocations.reduce(
              (total, allocation) => total + allocation.taxAmount,
              0,
          );

    const netPay = grossEmolument - deductibleLines - paye;
    const taxableIncomeAtChargeableRates = payeBandAllocations.reduce(
        (total, allocation) => {
            if (allocation.rate <= 0) {
                return total;
            }

            return total + allocation.taxableAmount;
        },
        0,
    );
    const taxableBandRows = payeBandAllocations.map((allocation) => ({
        key: `paye_taxable_band_${allocation.index + 1}`,
        label: `PAYE band ${allocation.index + 1} taxable income`,
        detail: `${formatBandScope(allocation.index, allocation.lowerBound, allocation.cap)} at ${formatRate(allocation.rate)}`,
        annualAmount: allocation.taxableAmount,
        tone: 'muted' as const,
    }));
    const payeBandTaxRows = payeBandAllocations.map((allocation) => ({
        key: `paye_tax_band_${allocation.index + 1}`,
        label: `PAYE band ${allocation.index + 1} tax`,
        detail: `${formatRate(allocation.rate)} on ${formatNaira(allocation.taxableAmount)}`,
        annualAmount: -allocation.taxAmount,
        tone: 'muted' as const,
    }));

    return {
        mode: 'employee_paye',
        profile: input.profile,
        payRow: {
            key: 'pay',
            label: 'Take-home pay',
            annualAmount: netPay,
            tone: 'highlight',
        },
        groups: [
            {
                key: 'taxable_income',
                title: 'Taxable income',
                defaultOpen: true,
                rows: [
                    {
                        key: 'gross_emolument',
                        label: 'Gross emolument',
                        annualAmount: grossEmolument,
                    },
                    {
                        key: 'exempt_earnings',
                        label: 'Exempt earnings',
                        annualAmount: exemptEarnings,
                        tone: 'muted',
                    },
                    {
                        key: 'less_rent_relief',
                        label: 'Less rent relief',
                        annualAmount: -rentRelief,
                        tone: 'muted',
                    },
                    {
                        key: 'less_deductions',
                        label: 'Less deductible lines',
                        annualAmount: -deductibleLines,
                        tone: 'muted',
                    },
                    {
                        key: 'total_income',
                        label: 'Total income',
                        annualAmount: taxableIncome,
                        tone: 'strong',
                    },
                    ...taxableBandRows,
                    {
                        key: 'taxable_income_applied',
                        label: 'Taxable income',
                        detail: 'Total charged at non-zero PAYE rates',
                        annualAmount: taxableIncomeAtChargeableRates,
                        tone: 'strong',
                    },
                ],
            },
            {
                key: 'deductions',
                title: 'Deductions / reliefs',
                rows: [
                    {
                        key: 'rent_relief_total',
                        label: `Rent relief (${Math.round(input.profile.paye.rentRelief.rate * 100)}%, max ${input.profile.paye.rentRelief.annualCap.toLocaleString('en-NG')})`,
                        annualAmount: -rentRelief,
                        tone: 'muted',
                    },
                    {
                        key: 'deductible_total',
                        label: 'Other deductible lines',
                        annualAmount: -deductibleLines,
                        tone: 'muted',
                    },
                    {
                        key: 'all_reliefs_total',
                        label: 'Total reliefs and deductions',
                        annualAmount: -totalReliefsAndDeductions,
                        tone: 'strong',
                    },
                ],
            },
            {
                key: 'taxes',
                title: 'Taxes',
                rows: [
                    ...payeBandTaxRows,
                    {
                        key: 'paye_total',
                        label: 'PAYE',
                        annualAmount: -paye,
                        tone: 'strong',
                        detail: isMinimumWageExempt
                            ? `Exempt: gross emolument ≤ ${formatNaira(input.profile.paye.minimumWageAnnual)} annual minimum wage`
                            : undefined,
                    },
                ],
            },
        ],
        totals: {
            annualGrossIncome: grossEmolument,
            annualDeductions: deductibleLines,
            annualTaxableIncome: taxableIncome,
            annualTax: paye,
            annualNetPay: netPay,
        },
        meta: {
            grossEmolument,
            taxableEarnings,
            exemptEarnings,
            annualRentPaid,
            rentRelief,
            deductibleLines,
            isMinimumWageExempt: isMinimumWageExempt ? 'true' : 'false',
            minimumWageAnnual: input.profile.paye.minimumWageAnnual,
            paye,
        },
    };
}
