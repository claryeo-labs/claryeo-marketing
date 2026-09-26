import {
    ANNUAL_MULTIPLIERS,
    type BusinessTaxInput,
    type CalculatorResult,
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

function isSmallCompany(
    turnover: number,
    fixedAssets: number,
    input: BusinessTaxInput,
): boolean {
    return (
        turnover <= input.profile.business.cit.smallCompanyTurnoverThreshold &&
        fixedAssets <= input.profile.business.cit.smallCompanyAssetThreshold &&
        !input.isProfessionalService
    );
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

function isPitBusinessType(input: BusinessTaxInput): boolean {
    return (
        input.businessType === 'sole_trader' ||
        input.businessType === 'small_business'
    );
}

export function calculateBusinessTax(
    input: BusinessTaxInput,
): CalculatorResult {
    const turnover = sumAnnualizedLineItems(input.earnings);
    const allowableDeductions = sumAnnualizedLineItems(
        input.deductions,
        (item) => item.deductible !== false,
    );

    const taxableIncome = Math.max(turnover - allowableDeductions, 0);
    const usesPit = isPitBusinessType(input);
    const fixedAssets =
        Number.isFinite(input.fixedAssets) && (input.fixedAssets ?? 0) >= 0
            ? (input.fixedAssets as number)
            : Number.MAX_SAFE_INTEGER;
    const assessableProfit = Math.max(
        input.assessableProfit && input.assessableProfit > 0
            ? input.assessableProfit
            : taxableIncome,
        0,
    );
    const qualifiesAsSmallCompany =
        !usesPit && isSmallCompany(turnover, fixedAssets, input);
    const isNonResidentCompany = input.isNonResidentCompany === true;
    const pitBandAllocations = usesPit
        ? calculateProgressiveBandAllocations(
              taxableIncome,
              input.profile.paye.bands,
          )
        : [];
    // Performance optimization: Sum tax amounts directly from existing allocations
    // instead of re-allocating bands via calculateProgressiveTax().
    const pit = usesPit
        ? pitBandAllocations.reduce(
              (total, allocation) => total + allocation.taxAmount,
              0,
          )
        : 0;
    const citRate = usesPit
        ? 0
        : qualifiesAsSmallCompany
          ? 0
          : input.profile.business.cit.standardRate;
    const cit = usesPit ? 0 : taxableIncome * citRate;
    const developmentLevy =
        usesPit || qualifiesAsSmallCompany || isNonResidentCompany
            ? 0
            : assessableProfit * input.profile.business.cit.developmentLevyRate;
    const vatPayable = Math.max(0, input.vatCollected - input.vatInput);

    const incomeTax = pit + cit + developmentLevy;
    const totalTax = incomeTax + vatPayable;
    const netIncome = turnover - allowableDeductions - totalTax;
    const standardCitRate = input.profile.business.cit.standardRate;
    const taxableIncomeAtChargeableRates = usesPit
        ? pitBandAllocations.reduce((total, allocation) => {
              if (allocation.rate <= 0) {
                  return total;
              }

              return total + allocation.taxableAmount;
          }, 0)
        : qualifiesAsSmallCompany
          ? 0
          : taxableIncome;

    const pitTaxableBandRows = pitBandAllocations.map((allocation) => ({
        key: `pit_taxable_band_${allocation.index + 1}`,
        label: `PIT band ${allocation.index + 1} taxable income`,
        detail: `${formatBandScope(allocation.index, allocation.lowerBound, allocation.cap)} at ${formatRate(allocation.rate)}`,
        annualAmount: allocation.taxableAmount,
        tone: 'muted' as const,
    }));

    const pitTaxBandRows = pitBandAllocations.map((allocation) => ({
        key: `pit_tax_band_${allocation.index + 1}`,
        label: `PIT band ${allocation.index + 1} tax`,
        detail: `${formatRate(allocation.rate)} on ${formatNaira(allocation.taxableAmount)}`,
        annualAmount: -allocation.taxAmount,
        tone: 'muted' as const,
    }));

    const citBand1TaxableIncome = qualifiesAsSmallCompany ? taxableIncome : 0;
    const citBand2TaxableIncome = qualifiesAsSmallCompany ? 0 : taxableIncome;

    const citTaxableBandRows = usesPit
        ? []
        : [
              {
                  key: 'cit_taxable_band_1',
                  label: 'CIT band 1 taxable income',
                  detail: `Small-company band (0%): turnover ≤ ${formatNaira(input.profile.business.cit.smallCompanyTurnoverThreshold)}, fixed assets ≤ ${formatNaira(input.profile.business.cit.smallCompanyAssetThreshold)}, non-professional service`,
                  annualAmount: citBand1TaxableIncome,
                  tone: 'muted' as const,
              },
              {
                  key: 'cit_taxable_band_2',
                  label: 'CIT band 2 taxable income',
                  detail: `Standard band (${formatRate(standardCitRate)}): applies when any band 1 condition is not met`,
                  annualAmount: citBand2TaxableIncome,
                  tone: 'muted' as const,
              },
          ];

    const incomeTaxRows = usesPit
        ? [
              ...pitTaxBandRows,
              {
                  key: 'pit_total',
                  label: 'PIT',
                  annualAmount: -pit,
                  tone: 'strong' as const,
              },
          ]
        : [
              {
                  key: 'cit_tax_band_1',
                  label: 'CIT band 1 tax',
                  detail: `0% on ${formatNaira(citBand1TaxableIncome)}`,
                  annualAmount: 0,
                  tone: 'muted' as const,
              },
              {
                  key: 'cit_tax_band_2',
                  label: 'CIT band 2 tax',
                  detail: `${formatRate(standardCitRate)} on ${formatNaira(citBand2TaxableIncome)}`,
                  annualAmount: -cit,
                  tone: 'muted' as const,
              },
              {
                  key: 'cit_total',
                  label: `CIT (${formatRate(citRate)})`,
                  annualAmount: -cit,
                  tone: 'strong' as const,
              },
          ];

    return {
        mode: 'business_tax',
        profile: input.profile,
        payRow: {
            key: 'net_income',
            label: 'Net income after tax',
            annualAmount: netIncome,
            tone: 'highlight',
        },
        groups: [
            {
                key: 'taxable_income',
                title: 'Taxable income',
                defaultOpen: true,
                rows: [
                    {
                        key: 'turnover',
                        label: 'Turnover',
                        annualAmount: turnover,
                    },
                    {
                        key: 'allowable_deductions',
                        label: 'Allowable deductions',
                        annualAmount: -allowableDeductions,
                        tone: 'muted',
                    },
                    {
                        key: 'total_income',
                        label: 'Total income',
                        annualAmount: taxableIncome,
                        tone: 'strong',
                    },
                    ...(usesPit ? pitTaxableBandRows : citTaxableBandRows),
                    {
                        key: 'taxable_income_applied',
                        label: 'Taxable income',
                        detail: usesPit
                            ? 'Total charged at non-zero PIT rates'
                            : 'Total charged at non-zero CIT rates',
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
                        key: 'business_deductions_total',
                        label: 'Total allowable deductions',
                        annualAmount: -allowableDeductions,
                        tone: 'strong',
                    },
                ],
            },
            {
                key: 'taxes',
                title: 'Taxes',
                rows: [
                    ...incomeTaxRows,
                    {
                        key: 'development_levy',
                        label: `Development levy (${formatRate(input.profile.business.cit.developmentLevyRate)})`,
                        annualAmount: -developmentLevy,
                        tone: 'muted',
                    },
                    {
                        key: 'vat_payable',
                        label: 'VAT payable',
                        annualAmount: -vatPayable,
                        tone: 'muted',
                    },
                    {
                        key: 'total_tax',
                        label: 'Total tax',
                        annualAmount: -totalTax,
                        tone: 'strong',
                    },
                ],
            },
        ],
        totals: {
            annualGrossIncome: turnover,
            annualDeductions: allowableDeductions,
            annualTaxableIncome: taxableIncome,
            annualTax: totalTax,
            annualNetPay: netIncome,
        },
        meta: {
            businessType: input.businessType,
            incomeTaxType: usesPit ? 'PIT' : 'CIT',
            turnover,
            allowableDeductions,
            taxableIncome,
            pit,
            cit,
            citRate,
            fixedAssets,
            assessableProfit,
            qualifiesAsSmallCompany: qualifiesAsSmallCompany ? 'true' : 'false',
            isProfessionalService: input.isProfessionalService
                ? 'true'
                : 'false',
            isNonResidentCompany: isNonResidentCompany ? 'true' : 'false',
            developmentLevy,
            vatCollected: input.vatCollected,
            vatInput: input.vatInput,
            vatPayable,
            totalTax,
        },
    };
}
