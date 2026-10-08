import {
    ArrowUpRight,
    Calculator,
    ChevronDown,
    ChevronUp,
    Loader2,
    Mail,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
} from 'lucide-react';
import type { AnchorHTMLAttributes, Dispatch, FC, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FaqSection from '@/components/faq';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    CurrencyInput,
    formatCurrencyInputValue,
} from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    SUMMARY_PERIODS,
    annualizeAmount,
    calculateCalculatorResult,
    getDefaultTaxYearProfile,
    getTaxYearProfileByKey,
    getTaxYearProfiles,
    toPeriodAmount,
    type AmountFrequency,
    type BusinessType,
    type CalculatorMode,
    type EntryMode,
    type MoneyLineItem,
    type RowTone,
} from '@/lib/tax-calculator-v2';
import { taxCalculatorFaqs } from '@/lib/faqs';
import { cn, formatCurrency } from '@/lib/utils';

import TaxEducationContent from './components/tax-education-content';

/**
 * Standalone replacements for the main app's Inertia/analytics coupling so the
 * page renders as a self-contained marketing island.
 */
function Link({ href = '#', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return <a href={href} {...props} />;
}

const analytics = { track: (_event: string, _payload?: unknown): void => {} };
const AnalyticsEvent = {
    TaxCalculatorConfigChange: 'tax_calculator_config_change',
    TaxCalculatorComputed: 'tax_calculator_computed',
    TaxCalculatorReset: 'tax_calculator_reset',
} as const;
const buildComputedPayload = (payload: unknown): unknown => payload;
const buildConfigChangePayload = (payload: unknown): unknown => payload;
const buildResetPayload = (payload: unknown): unknown => payload;

type EditableLineItem = {
    id: string;
    label: string;
    amount: string;
    frequency: AmountFrequency;
    taxable: boolean;
    deductible: boolean;
};

const taxYearProfiles = getTaxYearProfiles();
const defaultTaxYearProfile = getDefaultTaxYearProfile();

const inputClassName = 'h-10 border-input bg-background/80';
const selectClassName =
    'h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-[var(--gradient-primary-from)] focus-visible:ring-[var(--gradient-primary-from)] focus-visible:ring-opacity-30 focus-visible:ring-[3px]';

const earningPresetsByMode: Record<CalculatorMode, string[]> = {
    employee_paye: [
        'Basic salary',
        'Housing allowance',
        'Transport allowance',
        'Bonus',
        'Other earning',
    ],
    business_tax: ['Product sales', 'Service income', 'Other income'],
};

const deductionPresetsByMode: Record<CalculatorMode, string[]> = {
    employee_paye: [
        'Pension',
        'NHF contribution',
        'NHIS contribution',
        'Union dues',
        'Other deduction',
    ],
    business_tax: [
        'Rent',
        'Salaries',
        'Utilities',
        'Logistics',
        'Other expense',
    ],
};

const businessTypeOptions: { value: BusinessType; label: string }[] = [
    { value: 'sole_trader', label: 'Sole Trader / Freelancer' },
    { value: 'small_business', label: 'Small Business (Unincorporated)' },
    { value: 'registered_company', label: 'Registered Company (Ltd)' },
];

function createLineId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseAmount(value: string): number {
    const sanitized = value.replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(sanitized);

    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return parsed;
}

function toCalculationLineItem(item: EditableLineItem): MoneyLineItem {
    return {
        id: item.id,
        label: item.label.trim() || 'Line item',
        amount: parseAmount(item.amount),
        frequency: item.frequency,
        taxable: item.taxable,
        deductible: item.deductible,
    };
}

function formatSignedNaira(value: number): string {
    if (value < 0) {
        return `(${formatCurrency(Math.abs(value), 'NGN')})`;
    }

    return formatCurrency(value, 'NGN');
}

// Performance optimization: Pre-instantiate static Intl.DateTimeFormat to avoid
// object creation overhead during tax calculator page renders.
const enNgDateFormatter = new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

function formatRuleDate(value: string): string {
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const parsedDate = new Date(
            Number.parseInt(year, 10),
            Number.parseInt(month, 10) - 1,
            Number.parseInt(day, 10),
        );

        return enNgDateFormatter.format(parsedDate);
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return enNgDateFormatter.format(parsedDate);
}

function rowToneClasses(tone?: RowTone): string {
    if (tone === 'highlight') {
        return 'border-primary/35 bg-primary/10 font-semibold';
    }

    if (tone === 'strong') {
        return 'border-primary/30 bg-primary/8 font-semibold';
    }

    return 'border-border bg-background/70';
}

function rowValueClasses(tone?: RowTone): string {
    if (tone === 'muted') {
        return 'text-muted-foreground';
    }

    return 'text-foreground';
}

function updateLineItem(
    setter: Dispatch<SetStateAction<EditableLineItem[]>>,
    id: string,
    updates: Partial<EditableLineItem>,
): void {
    setter((previous) =>
        previous.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
        ),
    );
}

function addLineItem(
    setter: Dispatch<SetStateAction<EditableLineItem[]>>,
    values?: Partial<EditableLineItem>,
): void {
    setter((previous) => [
        ...previous,
        {
            id: createLineId(),
            label: values?.label ?? '',
            amount: values?.amount ?? formatCurrencyInputValue('0'),
            frequency: values?.frequency ?? 'monthly',
            taxable: values?.taxable ?? true,
            deductible: values?.deductible ?? true,
        },
    ]);
}

function removeLineItem(
    setter: Dispatch<SetStateAction<EditableLineItem[]>>,
    id: string,
): void {
    setter((previous) => {
        if (previous.length <= 1) {
            return previous;
        }

        return previous.filter((item) => item.id !== id);
    });
}

const TaxCalculatorPage: FC = () => {
    const isWaitlistMode = false;

    const [reportEmail, setReportEmail] = useState('');
    const [reportConsentContact, setReportConsentContact] = useState(false);
    const [reportConsentMarketing, setReportConsentMarketing] = useState(false);
    const [reportSending, setReportSending] = useState(false);
    const [reportSuccess, setReportSuccess] = useState<string | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [reportFormOpen, setReportFormOpen] = useState(false);

    // Performance optimization: Memoize seededIncome query parameter lookup so URL
    // parsing and currency string formatting only run once on component mount rather
    // than executing on every input keystroke and re-render.
    const seededIncome = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        const raw = new URLSearchParams(window.location.search).get('income');

        if (raw === null) {
            return null;
        }

        const parsed = Number.parseFloat(raw.replace(/[^\d.]/g, ''));

        return Number.isFinite(parsed) && parsed > 0
            ? formatCurrencyInputValue(String(parsed))
            : null;
    }, []);

    const [mode, setMode] = useState<CalculatorMode>('employee_paye');
    const [taxYearKey, setTaxYearKey] = useState(defaultTaxYearProfile.key);
    const [businessType, setBusinessType] =
        useState<BusinessType>('sole_trader');
    const [selectedPeriod, setSelectedPeriod] =
        useState<AmountFrequency>('monthly');
    const [desktopVisiblePeriods, setDesktopVisiblePeriods] = useState<
        Record<AmountFrequency, boolean>
    >({
        weekly: true,
        fortnightly: true,
        monthly: true,
        annually: true,
    });

    const [employeeEarningsEntryMode, setEmployeeEarningsEntryMode] =
        useState<EntryMode>('single');
    const [employeeDeductionsEntryMode, setEmployeeDeductionsEntryMode] =
        useState<EntryMode>('single');

    // Performance optimization: Use lazy state initializers (useState(() => ...)) so
    // initial formatting functions like formatCurrencyInputValue and ID generators
    // only execute during initial mount, bypassing redundant evaluations during re-renders.
    const [employeeSingleEarningAmount, setEmployeeSingleEarningAmount] =
        useState(() => seededIncome ?? formatCurrencyInputValue('60000'));
    const [employeeSingleEarningFrequency, setEmployeeSingleEarningFrequency] =
        useState<AmountFrequency>(() => (seededIncome !== null ? 'annually' : 'monthly'));
    const [employeeSingleEarningTaxable, setEmployeeSingleEarningTaxable] =
        useState(true);

    const [employeeSingleDeductionAmount, setEmployeeSingleDeductionAmount] =
        useState(() => formatCurrencyInputValue('0'));
    const [
        employeeSingleDeductionFrequency,
        setEmployeeSingleDeductionFrequency,
    ] = useState<AmountFrequency>('monthly');

    const [employeeEarningItems, setEmployeeEarningItems] = useState<
        EditableLineItem[]
    >(() => [
        {
            id: createLineId(),
            label: 'Basic salary',
            amount: formatCurrencyInputValue('60000'),
            frequency: 'monthly',
            taxable: true,
            deductible: false,
        },
    ]);

    const [employeeRentPaidAmount, setEmployeeRentPaidAmount] = useState(() =>
        formatCurrencyInputValue('0'),
    );
    const [employeeRentPaidFrequency, setEmployeeRentPaidFrequency] =
        useState<AmountFrequency>('monthly');

    const [employeeDeductionItems, setEmployeeDeductionItems] = useState<
        EditableLineItem[]
    >(() => [
        {
            id: createLineId(),
            label: 'Pension',
            amount: formatCurrencyInputValue('0'),
            frequency: 'monthly',
            taxable: false,
            deductible: true,
        },
    ]);

    const [businessEarningsEntryMode, setBusinessEarningsEntryMode] =
        useState<EntryMode>('single');
    const [businessDeductionsEntryMode, setBusinessDeductionsEntryMode] =
        useState<EntryMode>('single');

    const [businessSingleEarningAmount, setBusinessSingleEarningAmount] =
        useState(() => seededIncome ?? formatCurrencyInputValue('60000'));
    const [businessSingleEarningFrequency, setBusinessSingleEarningFrequency] =
        useState<AmountFrequency>(() => (seededIncome !== null ? 'annually' : 'monthly'));

    const [businessSingleDeductionAmount, setBusinessSingleDeductionAmount] =
        useState(() => formatCurrencyInputValue('0'));
    const [
        businessSingleDeductionFrequency,
        setBusinessSingleDeductionFrequency,
    ] = useState<AmountFrequency>('monthly');

    const [businessEarningItems, setBusinessEarningItems] = useState<
        EditableLineItem[]
    >(() => [
        {
            id: createLineId(),
            label: 'Product sales',
            amount: formatCurrencyInputValue('60000'),
            frequency: 'monthly',
            taxable: true,
            deductible: false,
        },
    ]);

    const [businessDeductionItems, setBusinessDeductionItems] = useState<
        EditableLineItem[]
    >(() => [
        {
            id: createLineId(),
            label: 'Rent',
            amount: formatCurrencyInputValue('0'),
            frequency: 'monthly',
            taxable: false,
            deductible: true,
        },
    ]);

    const [vatCollected, setVatCollected] = useState(() =>
        formatCurrencyInputValue('0'),
    );
    const [vatInput, setVatInput] = useState(() =>
        formatCurrencyInputValue('0'),
    );
    const [businessFixedAssets, setBusinessFixedAssets] = useState(() =>
        formatCurrencyInputValue('0'),
    );
    const [isProfessionalService, setIsProfessionalService] = useState(false);
    const [isNonResidentCompany, setIsNonResidentCompany] = useState(false);
    const [businessAssessableProfit, setBusinessAssessableProfit] = useState(() =>
        formatCurrencyInputValue('0'),
    );

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        taxable_income: true,
        deductions: true,
        taxes: true,
    });

    const activeProfile = useMemo(() => {
        return getTaxYearProfileByKey(taxYearKey);
    }, [taxYearKey]);

    const visibleDesktopPeriods = useMemo(() => {
        return SUMMARY_PERIODS.filter(
            (period) => desktopVisiblePeriods[period.key],
        );
    }, [desktopVisiblePeriods]);

    const desktopGridTemplateColumns = useMemo(() => {
        return `minmax(220px,1fr) repeat(${visibleDesktopPeriods.length}, minmax(96px,1fr))`;
    }, [visibleDesktopPeriods.length]);

    const result = useMemo(() => {
        if (mode === 'employee_paye') {
            const earnings =
                employeeEarningsEntryMode === 'single'
                    ? [
                          {
                              id: 'employee-single-earning',
                              label: 'Total earnings',
                              amount: parseAmount(employeeSingleEarningAmount),
                              frequency: employeeSingleEarningFrequency,
                              taxable: employeeSingleEarningTaxable,
                              deductible: false,
                          } satisfies MoneyLineItem,
                      ]
                    : employeeEarningItems.map(toCalculationLineItem);

            const deductions =
                employeeDeductionsEntryMode === 'single'
                    ? [
                          {
                              id: 'employee-single-deduction',
                              label: 'Total deductions',
                              amount: parseAmount(
                                  employeeSingleDeductionAmount,
                              ),
                              frequency: employeeSingleDeductionFrequency,
                              taxable: false,
                              deductible: true,
                          } satisfies MoneyLineItem,
                      ]
                    : employeeDeductionItems.map(toCalculationLineItem);

            return calculateCalculatorResult({
                mode,
                payload: {
                    profile: activeProfile,
                    earnings,
                    deductions,
                    annualRentPaid: annualizeAmount(
                        parseAmount(employeeRentPaidAmount),
                        employeeRentPaidFrequency,
                    ),
                },
            });
        }

        const earnings =
            businessEarningsEntryMode === 'single'
                ? [
                      {
                          id: 'business-single-earning',
                          label: 'Total earnings',
                          amount: parseAmount(businessSingleEarningAmount),
                          frequency: businessSingleEarningFrequency,
                          taxable: true,
                          deductible: false,
                      } satisfies MoneyLineItem,
                  ]
                : businessEarningItems.map(toCalculationLineItem);

        const deductions =
            businessDeductionsEntryMode === 'single'
                ? [
                      {
                          id: 'business-single-deduction',
                          label: 'Total deductions',
                          amount: parseAmount(businessSingleDeductionAmount),
                          frequency: businessSingleDeductionFrequency,
                          taxable: false,
                          deductible: true,
                      } satisfies MoneyLineItem,
                  ]
                : businessDeductionItems.map(toCalculationLineItem);

        return calculateCalculatorResult({
            mode,
            payload: {
                profile: activeProfile,
                businessType,
                earnings,
                deductions,
                vatCollected: parseAmount(vatCollected),
                vatInput: parseAmount(vatInput),
                fixedAssets: parseAmount(businessFixedAssets),
                isProfessionalService,
                isNonResidentCompany,
                assessableProfit: parseAmount(businessAssessableProfit),
            },
        });
    }, [
        activeProfile,
        businessAssessableProfit,
        businessType,
        businessDeductionItems,
        businessDeductionsEntryMode,
        businessEarningItems,
        businessEarningsEntryMode,
        businessFixedAssets,
        businessSingleDeductionAmount,
        businessSingleDeductionFrequency,
        businessSingleEarningAmount,
        businessSingleEarningFrequency,
        employeeDeductionItems,
        employeeDeductionsEntryMode,
        employeeEarningItems,
        employeeEarningsEntryMode,
        employeeRentPaidAmount,
        employeeRentPaidFrequency,
        employeeSingleDeductionAmount,
        employeeSingleDeductionFrequency,
        employeeSingleEarningAmount,
        employeeSingleEarningFrequency,
        employeeSingleEarningTaxable,
        isNonResidentCompany,
        isProfessionalService,
        mode,
        vatCollected,
        vatInput,
    ]);

    // ── Analytics: config change ────────────────────────────
    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        analytics.track(
            AnalyticsEvent.TaxCalculatorConfigChange,
            buildConfigChangePayload({
                mode,
                taxYearKey: taxYearKey,
                businessType,
                isWaitlistMode,
            }),
        );
    }, [mode, taxYearKey, businessType, isWaitlistMode]);

    // ── Analytics: debounced computed ────────────────────────
    const computedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const earningsLineCount =
        mode === 'employee_paye'
            ? employeeEarningsEntryMode === 'single'
                ? 1
                : employeeEarningItems.length
            : businessEarningsEntryMode === 'single'
              ? 1
              : businessEarningItems.length;

    const deductionsLineCount =
        mode === 'employee_paye'
            ? employeeDeductionsEntryMode === 'single'
                ? 1
                : employeeDeductionItems.length
            : businessDeductionsEntryMode === 'single'
              ? 1
              : businessDeductionItems.length;

    useEffect(() => {
        if (computedTimerRef.current) {
            clearTimeout(computedTimerRef.current);
        }

        computedTimerRef.current = setTimeout(() => {
            analytics.track(
                AnalyticsEvent.TaxCalculatorComputed,
                buildComputedPayload({
                    mode,
                    taxYearKey: taxYearKey,
                    businessType,
                    isWaitlistMode,
                    employeeEarningsEntry: employeeEarningsEntryMode,
                    employeeDeductionsEntry: employeeDeductionsEntryMode,
                    businessEarningsEntry: businessEarningsEntryMode,
                    businessDeductionsEntry: businessDeductionsEntryMode,
                    earningsLineCount,
                    deductionsLineCount,
                    totals: result.totals,
                }),
            );
        }, 1500);

        return () => {
            if (computedTimerRef.current) {
                clearTimeout(computedTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result]);

    // ── Analytics: reset ────────────────────────────────────
    const trackReset = useCallback(() => {
        analytics.track(
            AnalyticsEvent.TaxCalculatorReset,
            buildResetPayload({
                mode,
                taxYearKey: taxYearKey,
                isWaitlistMode,
            }),
        );
    }, [mode, taxYearKey, isWaitlistMode]);

    const resetCalculator = (): void => {
        trackReset();
        setMode('employee_paye');
        setTaxYearKey(defaultTaxYearProfile.key);
        setBusinessType('sole_trader');
        setSelectedPeriod('monthly');
        setDesktopVisiblePeriods({
            weekly: true,
            fortnightly: true,
            monthly: true,
            annually: true,
        });

        setEmployeeEarningsEntryMode('single');
        setEmployeeDeductionsEntryMode('single');
        setEmployeeSingleEarningAmount(formatCurrencyInputValue('60000'));
        setEmployeeSingleEarningFrequency('monthly');
        setEmployeeSingleEarningTaxable(true);
        setEmployeeSingleDeductionAmount(formatCurrencyInputValue('0'));
        setEmployeeSingleDeductionFrequency('monthly');
        setEmployeeRentPaidAmount(formatCurrencyInputValue('0'));
        setEmployeeRentPaidFrequency('monthly');
        setEmployeeEarningItems([
            {
                id: createLineId(),
                label: 'Basic salary',
                amount: formatCurrencyInputValue('60000'),
                frequency: 'monthly',
                taxable: true,
                deductible: false,
            },
        ]);
        setEmployeeDeductionItems([
            {
                id: createLineId(),
                label: 'Pension',
                amount: formatCurrencyInputValue('0'),
                frequency: 'monthly',
                taxable: false,
                deductible: true,
            },
        ]);

        setBusinessEarningsEntryMode('single');
        setBusinessDeductionsEntryMode('single');
        setBusinessSingleEarningAmount(formatCurrencyInputValue('60000'));
        setBusinessSingleEarningFrequency('monthly');
        setBusinessSingleDeductionAmount(formatCurrencyInputValue('0'));
        setBusinessSingleDeductionFrequency('monthly');
        setBusinessEarningItems([
            {
                id: createLineId(),
                label: 'Product sales',
                amount: formatCurrencyInputValue('60000'),
                frequency: 'monthly',
                taxable: true,
                deductible: false,
            },
        ]);
        setBusinessDeductionItems([
            {
                id: createLineId(),
                label: 'Rent',
                amount: formatCurrencyInputValue('0'),
                frequency: 'monthly',
                taxable: false,
                deductible: true,
            },
        ]);

        setVatCollected(formatCurrencyInputValue('0'));
        setVatInput(formatCurrencyInputValue('0'));
        setBusinessFixedAssets(formatCurrencyInputValue('0'));
        setIsProfessionalService(false);
        setIsNonResidentCompany(false);
        setBusinessAssessableProfit(formatCurrencyInputValue('0'));
        setOpenGroups({
            taxable_income: true,
            deductions: true,
            taxes: true,
        });
    };

    const sendReport = async (): Promise<void> => {
        setReportError(null);
        setReportSending(true);

        const payload = {
            email: reportEmail,
            consent_contact: reportConsentContact,
            consent_marketing: reportConsentMarketing,
            document_type: 'tax_calculator_estimate',
            payload: {
                calculator_mode: result.mode,
                tax_year_key: result.profile.key,
                business_type:
                    result.mode === 'business_tax' ? businessType : null,
                profile: {
                    label: result.profile.label,
                    rule_snapshot_date: result.profile.ruleSnapshotDate,
                    effective_from: result.profile.effectiveFrom,
                },
                totals: {
                    annual_gross_income: result.totals.annualGrossIncome,
                    annual_deductions: result.totals.annualDeductions,
                    annual_taxable_income: result.totals.annualTaxableIncome,
                    annual_tax: result.totals.annualTax,
                    annual_net_pay: result.totals.annualNetPay,
                },
                pay_row: {
                    label: result.payRow.label,
                    annual_amount: result.payRow.annualAmount,
                },
                groups: result.groups.map((g) => ({
                    key: g.key,
                    title: g.title,
                    rows: g.rows.map((r) => ({
                        key: r.key,
                        label: r.label,
                        detail: r.detail ?? null,
                        annual_amount: r.annualAmount,
                        tone: r.tone ?? null,
                    })),
                })),
                disclaimer: null,
            },
        };

        try {
            // Performance optimization: Query CSRF meta token on demand when dispatching report
            // rather than performing document.querySelector DOM traversal on every component render.
            const csrf =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ??
                '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (csrf) {
                headers['X-CSRF-TOKEN'] = csrf;
            }

            const response = await fetch('/tax-calculator/report', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                setReportSuccess(data.message);
                setReportEmail('');
                setReportConsentContact(false);
                setReportConsentMarketing(false);
                setReportFormOpen(false);
            } else if (response.status === 422) {
                const data = await response.json();
                const firstError = Object.values(data.errors ?? {}).flat()[0];
                setReportError(
                    (firstError as string) ??
                        'Please check your input and try again.',
                );
            } else if (response.status === 429) {
                setReportError(
                    'Too many requests. Please wait a moment and try again.',
                );
            } else {
                setReportError('Something went wrong. Please try again.');
            }
        } catch {
            setReportError(
                'Unable to send your report. Please check your connection and try again.',
            );
        } finally {
            setReportSending(false);
        }
    };

    return (
        <>
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="t-display-3 text-foreground">
                            Tax calculator
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Realtime PAYE and business tax estimates as you
                            type.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                        <Sparkles className="size-3.5" />
                        Real-time
                    </span>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card text-card-foreground shadow-2xl">
                    <div className="pointer-events-none absolute -top-24 -left-12 size-72 rounded-full bg-violet-bright/10 blur-3xl" />
                    <div className="pointer-events-none absolute right-0 -bottom-24 size-72 rounded-full bg-dawn/8 blur-3xl" />

                    <div className="relative grid lg:grid-cols-[380px_1fr]">
                        <aside className="border-b border-border bg-muted/20 p-6 lg:border-r lg:border-b-0 lg:p-8">
                            <div className="mb-8 flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Calculator className="size-5" />
                                </div>
                                <div>
                                    <h2 className="t-ui-title-lg">
                                        Pay calculator
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Nigeria 2026 PAYE, PIT, CIT and VAT
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm text-foreground">
                                        Calculation mode
                                    </Label>
                                    <ToggleGroup
                                        type="single"
                                        value={mode}
                                        onValueChange={(value) => {
                                            if (value) {
                                                setMode(
                                                    value as CalculatorMode,
                                                );
                                            }
                                        }}
                                        className="w-full"
                                    >
                                        <ToggleGroupItem
                                            value="employee_paye"
                                            className="flex-1"
                                            aria-label="Employee PAYE"
                                        >
                                            Employee PAYE
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value="business_tax"
                                            className="flex-1"
                                            aria-label="Business Tax"
                                        >
                                            Business Tax
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="taxYear"
                                        className="text-sm text-foreground"
                                    >
                                        Tax year profile
                                    </Label>
                                    <select
                                        id="taxYear"
                                        value={taxYearKey}
                                        className={selectClassName}
                                        onChange={(event) =>
                                            setTaxYearKey(event.target.value)
                                        }
                                    >
                                        {taxYearProfiles.map((profile) => (
                                            <option
                                                key={profile.key}
                                                value={profile.key}
                                            >
                                                {profile.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {mode === 'business_tax' && (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="businessType"
                                            className="text-sm text-foreground"
                                        >
                                            Business type
                                        </Label>
                                        <select
                                            id="businessType"
                                            value={businessType}
                                            className={selectClassName}
                                            onChange={(event) =>
                                                setBusinessType(
                                                    event.target
                                                        .value as BusinessType,
                                                )
                                            }
                                        >
                                            {businessTypeOptions.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            Tax regime:{' '}
                                            {businessType ===
                                            'registered_company'
                                                ? 'CIT + VAT'
                                                : 'PIT + VAT'}
                                        </p>
                                    </div>
                                )}

                                {mode === 'business_tax' &&
                                    businessType === 'registered_company' && (
                                        <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    Company attributes
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Needed for small-company CIT
                                                    and development levy rules.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="businessFixedAssets"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Total fixed assets
                                                </Label>
                                                <CurrencyInput
                                                    id="businessFixedAssets"
                                                    value={businessFixedAssets}
                                                    className={inputClassName}
                                                    onValueChange={
                                                        setBusinessFixedAssets
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="businessAssessableProfit"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Assessable profit (optional
                                                    override)
                                                </Label>
                                                <CurrencyInput
                                                    id="businessAssessableProfit"
                                                    value={
                                                        businessAssessableProfit
                                                    }
                                                    className={inputClassName}
                                                    onValueChange={
                                                        setBusinessAssessableProfit
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                                                <Checkbox
                                                    id="isProfessionalService"
                                                    checked={
                                                        isProfessionalService
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setIsProfessionalService(
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="isProfessionalService"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Professional service company
                                                </Label>
                                            </div>

                                            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                                                <Checkbox
                                                    id="isNonResidentCompany"
                                                    checked={
                                                        isNonResidentCompany
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setIsNonResidentCompany(
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="isNonResidentCompany"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Non-resident company
                                                </Label>
                                            </div>
                                        </div>
                                    )}

                                <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">
                                                Earnings
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Add one flat amount or multiple
                                                earning lines.
                                            </p>
                                        </div>
                                    </div>

                                    <ToggleGroup
                                        type="single"
                                        value={
                                            mode === 'employee_paye'
                                                ? employeeEarningsEntryMode
                                                : businessEarningsEntryMode
                                        }
                                        onValueChange={(value) => {
                                            if (!value) {
                                                return;
                                            }

                                            if (mode === 'employee_paye') {
                                                setEmployeeEarningsEntryMode(
                                                    value as EntryMode,
                                                );
                                                return;
                                            }

                                            setBusinessEarningsEntryMode(
                                                value as EntryMode,
                                            );
                                        }}
                                        className="w-full"
                                    >
                                        <ToggleGroupItem
                                            value="single"
                                            className="flex-1"
                                        >
                                            Single amount
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value="multiple"
                                            className="flex-1"
                                        >
                                            Multiple lines
                                        </ToggleGroupItem>
                                    </ToggleGroup>

                                    {(mode === 'employee_paye'
                                        ? employeeEarningsEntryMode
                                        : businessEarningsEntryMode) ===
                                    'single' ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="singleEarning"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Amount
                                                </Label>
                                                <CurrencyInput
                                                    id="singleEarning"
                                                    value={
                                                        mode === 'employee_paye'
                                                            ? employeeSingleEarningAmount
                                                            : businessSingleEarningAmount
                                                    }
                                                    className={inputClassName}
                                                    onValueChange={(value) => {
                                                        if (
                                                            mode ===
                                                            'employee_paye'
                                                        ) {
                                                            setEmployeeSingleEarningAmount(
                                                                value,
                                                            );
                                                            return;
                                                        }

                                                        setBusinessSingleEarningAmount(
                                                            value,
                                                        );
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="singleEarningFrequency"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Frequency
                                                </Label>
                                                <select
                                                    id="singleEarningFrequency"
                                                    value={
                                                        mode === 'employee_paye'
                                                            ? employeeSingleEarningFrequency
                                                            : businessSingleEarningFrequency
                                                    }
                                                    className={selectClassName}
                                                    onChange={(event) => {
                                                        if (
                                                            mode ===
                                                            'employee_paye'
                                                        ) {
                                                            setEmployeeSingleEarningFrequency(
                                                                event.target
                                                                    .value as AmountFrequency,
                                                            );
                                                            return;
                                                        }

                                                        setBusinessSingleEarningFrequency(
                                                            event.target
                                                                .value as AmountFrequency,
                                                        );
                                                    }}
                                                >
                                                    {SUMMARY_PERIODS.map(
                                                        (period) => (
                                                            <option
                                                                key={period.key}
                                                                value={
                                                                    period.key
                                                                }
                                                            >
                                                                {period.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>

                                            {mode === 'employee_paye' && (
                                                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 sm:col-span-2">
                                                    <Checkbox
                                                        id="singleEarningTaxable"
                                                        checked={
                                                            employeeSingleEarningTaxable
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setEmployeeSingleEarningTaxable(
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor="singleEarningTaxable"
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        Mark this amount as
                                                        taxable earning
                                                    </Label>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {(mode === 'employee_paye'
                                                ? employeeEarningItems
                                                : businessEarningItems
                                            ).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="space-y-3 rounded-lg border border-border bg-background/70 p-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={item.label}
                                                            placeholder="Line label"
                                                            className={cn(
                                                                inputClassName,
                                                                'min-w-0 flex-1',
                                                            )}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    updateLineItem(
                                                                        setEmployeeEarningItems,
                                                                        item.id,
                                                                        {
                                                                            label: event
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                updateLineItem(
                                                                    setBusinessEarningItems,
                                                                    item.id,
                                                                    {
                                                                        label: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon-sm"
                                                            aria-label={`Remove ${item.label || 'earning line item'}`}
                                                            className="shrink-0 border-border"
                                                            onClick={() => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    removeLineItem(
                                                                        setEmployeeEarningItems,
                                                                        item.id,
                                                                    );
                                                                    return;
                                                                }

                                                                removeLineItem(
                                                                    setBusinessEarningItems,
                                                                    item.id,
                                                                );
                                                            }}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <CurrencyInput
                                                            value={item.amount}
                                                            placeholder="0.00"
                                                            className={
                                                                inputClassName
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    updateLineItem(
                                                                        setEmployeeEarningItems,
                                                                        item.id,
                                                                        {
                                                                            amount: value,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                updateLineItem(
                                                                    setBusinessEarningItems,
                                                                    item.id,
                                                                    {
                                                                        amount: value,
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                        <select
                                                            value={
                                                                item.frequency
                                                            }
                                                            className={
                                                                selectClassName
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    updateLineItem(
                                                                        setEmployeeEarningItems,
                                                                        item.id,
                                                                        {
                                                                            frequency:
                                                                                event
                                                                                    .target
                                                                                    .value as AmountFrequency,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                updateLineItem(
                                                                    setBusinessEarningItems,
                                                                    item.id,
                                                                    {
                                                                        frequency:
                                                                            event
                                                                                .target
                                                                                .value as AmountFrequency,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            {SUMMARY_PERIODS.map(
                                                                (period) => (
                                                                    <option
                                                                        key={
                                                                            period.key
                                                                        }
                                                                        value={
                                                                            period.key
                                                                        }
                                                                    >
                                                                        {
                                                                            period.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>

                                                    {mode ===
                                                        'employee_paye' && (
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`earning-taxable-${item.id}`}
                                                                checked={
                                                                    item.taxable
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    updateLineItem(
                                                                        setEmployeeEarningItems,
                                                                        item.id,
                                                                        {
                                                                            taxable:
                                                                                checked ===
                                                                                true,
                                                                        },
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`earning-taxable-${item.id}`}
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                Taxable earning
                                                            </Label>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-border bg-background/80"
                                                    onClick={() => {
                                                        if (
                                                            mode ===
                                                            'employee_paye'
                                                        ) {
                                                            addLineItem(
                                                                setEmployeeEarningItems,
                                                                {
                                                                    label: 'Other earning',
                                                                    taxable: true,
                                                                    deductible: false,
                                                                },
                                                            );
                                                            return;
                                                        }

                                                        addLineItem(
                                                            setBusinessEarningItems,
                                                            {
                                                                label: 'Other income',
                                                                taxable: true,
                                                                deductible: false,
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <Plus className="size-4" />
                                                    Add line
                                                </Button>

                                                {(mode === 'employee_paye'
                                                    ? earningPresetsByMode.employee_paye
                                                    : earningPresetsByMode.business_tax
                                                )
                                                    .slice(0, 2)
                                                    .map((preset) => (
                                                        <Button
                                                            key={preset}
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-border bg-background/80"
                                                            onClick={() => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    addLineItem(
                                                                        setEmployeeEarningItems,
                                                                        {
                                                                            label: preset,
                                                                            taxable: true,
                                                                            deductible: false,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                addLineItem(
                                                                    setBusinessEarningItems,
                                                                    {
                                                                        label: preset,
                                                                        taxable: true,
                                                                        deductible: false,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            {preset}
                                                        </Button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Deductions / reliefs
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Capture statutory and custom
                                            deductible lines.
                                        </p>
                                    </div>

                                    {mode === 'employee_paye' && (
                                        <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="employeeRentPaid"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Rent paid
                                                </Label>
                                                <CurrencyInput
                                                    id="employeeRentPaid"
                                                    value={
                                                        employeeRentPaidAmount
                                                    }
                                                    className={inputClassName}
                                                    onValueChange={
                                                        setEmployeeRentPaidAmount
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="employeeRentPaidFrequency"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Rent frequency
                                                </Label>
                                                <select
                                                    id="employeeRentPaidFrequency"
                                                    value={
                                                        employeeRentPaidFrequency
                                                    }
                                                    className={selectClassName}
                                                    onChange={(event) =>
                                                        setEmployeeRentPaidFrequency(
                                                            event.target
                                                                .value as AmountFrequency,
                                                        )
                                                    }
                                                >
                                                    {SUMMARY_PERIODS.map(
                                                        (period) => (
                                                            <option
                                                                key={period.key}
                                                                value={
                                                                    period.key
                                                                }
                                                            >
                                                                {period.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <ToggleGroup
                                        type="single"
                                        value={
                                            mode === 'employee_paye'
                                                ? employeeDeductionsEntryMode
                                                : businessDeductionsEntryMode
                                        }
                                        onValueChange={(value) => {
                                            if (!value) {
                                                return;
                                            }

                                            if (mode === 'employee_paye') {
                                                setEmployeeDeductionsEntryMode(
                                                    value as EntryMode,
                                                );
                                                return;
                                            }

                                            setBusinessDeductionsEntryMode(
                                                value as EntryMode,
                                            );
                                        }}
                                        className="w-full"
                                    >
                                        <ToggleGroupItem
                                            value="single"
                                            className="flex-1"
                                        >
                                            Single amount
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value="multiple"
                                            className="flex-1"
                                        >
                                            Multiple lines
                                        </ToggleGroupItem>
                                    </ToggleGroup>

                                    {(mode === 'employee_paye'
                                        ? employeeDeductionsEntryMode
                                        : businessDeductionsEntryMode) ===
                                    'single' ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="singleDeduction"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Amount
                                                </Label>
                                                <CurrencyInput
                                                    id="singleDeduction"
                                                    value={
                                                        mode === 'employee_paye'
                                                            ? employeeSingleDeductionAmount
                                                            : businessSingleDeductionAmount
                                                    }
                                                    className={inputClassName}
                                                    onValueChange={(value) => {
                                                        if (
                                                            mode ===
                                                            'employee_paye'
                                                        ) {
                                                            setEmployeeSingleDeductionAmount(
                                                                value,
                                                            );
                                                            return;
                                                        }

                                                        setBusinessSingleDeductionAmount(
                                                            value,
                                                        );
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="singleDeductionFrequency"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Frequency
                                                </Label>
                                                <select
                                                    id="singleDeductionFrequency"
                                                    value={
                                                        mode === 'employee_paye'
                                                            ? employeeSingleDeductionFrequency
                                                            : businessSingleDeductionFrequency
                                                    }
                                                    className={selectClassName}
                                                    onChange={(event) => {
                                                        if (
                                                            mode ===
                                                            'employee_paye'
                                                        ) {
                                                            setEmployeeSingleDeductionFrequency(
                                                                event.target
                                                                    .value as AmountFrequency,
                                                            );
                                                            return;
                                                        }

                                                        setBusinessSingleDeductionFrequency(
                                                            event.target
                                                                .value as AmountFrequency,
                                                        );
                                                    }}
                                                >
                                                    {SUMMARY_PERIODS.map(
                                                        (period) => (
                                                            <option
                                                                key={period.key}
                                                                value={
                                                                    period.key
                                                                }
                                                            >
                                                                {period.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {(mode === 'employee_paye'
                                                ? employeeDeductionItems
                                                : businessDeductionItems
                                            ).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="space-y-3 rounded-lg border border-border bg-background/70 p-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={item.label}
                                                            placeholder="Line label"
                                                            className={cn(
                                                                inputClassName,
                                                                'min-w-0 flex-1',
                                                            )}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    updateLineItem(
                                                                        setEmployeeDeductionItems,
                                                                        item.id,
                                                                        {
                                                                            label: event
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                updateLineItem(
                                                                    setBusinessDeductionItems,
                                                                    item.id,
                                                                    {
                                                                        label: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon-sm"
                                                            aria-label={`Remove ${item.label || 'deduction line item'}`}
                                                            className="shrink-0 border-border"
                                                            onClick={() => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    removeLineItem(
                                                                        setEmployeeDeductionItems,
                                                                        item.id,
                                                                    );
                                                                    return;
                                                                }

                                                                removeLineItem(
                                                                    setBusinessDeductionItems,
                                                                    item.id,
                                                                );
                                                            }}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <CurrencyInput
                                                            value={item.amount}
                                                            placeholder="0.00"
                                                            className={
                                                                inputClassName
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    updateLineItem(
                                                                        setEmployeeDeductionItems,
                                                                        item.id,
                                                                        {
                                                                            amount: value,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                updateLineItem(
                                                                    setBusinessDeductionItems,
                                                                    item.id,
                                                                    {
                                                                        amount: value,
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                        <select
                                                            value={
                                                                item.frequency
                                                            }
                                                            className={
                                                                selectClassName
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    updateLineItem(
                                                                        setEmployeeDeductionItems,
                                                                        item.id,
                                                                        {
                                                                            frequency:
                                                                                event
                                                                                    .target
                                                                                    .value as AmountFrequency,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                updateLineItem(
                                                                    setBusinessDeductionItems,
                                                                    item.id,
                                                                    {
                                                                        frequency:
                                                                            event
                                                                                .target
                                                                                .value as AmountFrequency,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            {SUMMARY_PERIODS.map(
                                                                (period) => (
                                                                    <option
                                                                        key={
                                                                            period.key
                                                                        }
                                                                        value={
                                                                            period.key
                                                                        }
                                                                    >
                                                                        {
                                                                            period.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-border bg-background/80"
                                                    onClick={() => {
                                                        if (
                                                            mode ===
                                                            'employee_paye'
                                                        ) {
                                                            addLineItem(
                                                                setEmployeeDeductionItems,
                                                                {
                                                                    label: 'Other deduction',
                                                                    taxable: false,
                                                                    deductible: true,
                                                                },
                                                            );
                                                            return;
                                                        }

                                                        addLineItem(
                                                            setBusinessDeductionItems,
                                                            {
                                                                label: 'Other expense',
                                                                taxable: false,
                                                                deductible: true,
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <Plus className="size-4" />
                                                    Add line
                                                </Button>

                                                {(mode === 'employee_paye'
                                                    ? deductionPresetsByMode.employee_paye
                                                    : deductionPresetsByMode.business_tax
                                                )
                                                    .slice(0, 2)
                                                    .map((preset) => (
                                                        <Button
                                                            key={preset}
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-border bg-background/80"
                                                            onClick={() => {
                                                                if (
                                                                    mode ===
                                                                    'employee_paye'
                                                                ) {
                                                                    addLineItem(
                                                                        setEmployeeDeductionItems,
                                                                        {
                                                                            label: preset,
                                                                            taxable: false,
                                                                            deductible: true,
                                                                        },
                                                                    );
                                                                    return;
                                                                }

                                                                addLineItem(
                                                                    setBusinessDeductionItems,
                                                                    {
                                                                        label: preset,
                                                                        taxable: false,
                                                                        deductible: true,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            {preset}
                                                        </Button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {mode === 'business_tax' && (
                                    <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">
                                                VAT details
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Enter annual VAT totals.
                                            </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="vatCollected"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    VAT collected
                                                </Label>
                                                <CurrencyInput
                                                    id="vatCollected"
                                                    value={vatCollected}
                                                    className={inputClassName}
                                                    onValueChange={
                                                        setVatCollected
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="vatInput"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    VAT input
                                                </Label>
                                                <CurrencyInput
                                                    id="vatInput"
                                                    value={vatInput}
                                                    className={inputClassName}
                                                    onValueChange={setVatInput}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    className="bg-gradient-primary mt-3 w-full text-primary-foreground hover:opacity-90"
                                    onClick={resetCalculator}
                                >
                                    <RotateCcw className="size-4" />
                                    Reset options
                                </Button>

                                <div className="bg-gradient-primary mt-6 rounded-xl p-[1px]">
                                    <div className="rounded-[11px] bg-background p-4">
                                        {reportSuccess ? (
                                            <div
                                                role="status"
                                                className="flex items-start gap-3 text-sm"
                                            >
                                                <div className="bg-gradient-primary flex size-8 shrink-0 items-center justify-center rounded-full text-white">
                                                    <Mail className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        Estimate sent!
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {reportSuccess}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : !reportFormOpen ? (
                                            <div className="space-y-3 text-center">
                                                <div className="bg-gradient-primary mx-auto flex size-10 items-center justify-center rounded-full text-white">
                                                    <Sparkles className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        Get your estimate by
                                                        email
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        We&apos;ll email your
                                                        breakdown. Free,
                                                        instantly.
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    className="bg-gradient-primary w-full text-primary-foreground hover:opacity-90"
                                                    onClick={() =>
                                                        setReportFormOpen(true)
                                                    }
                                                >
                                                    <Mail className="size-4" />
                                                    Email my estimate
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm font-semibold text-foreground">
                                                    Where should we send it?
                                                </p>
                                                <Input
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={reportEmail}
                                                    onChange={(e) =>
                                                        setReportEmail(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                <label className="flex items-start gap-2">
                                                    <Checkbox
                                                        checked={
                                                            reportConsentContact
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setReportConsentContact(
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                        className="mt-0.5 border-muted-foreground/40"
                                                    />
                                                    <span className="text-xs leading-relaxed text-muted-foreground">
                                                        I agree to receive my
                                                        estimate by email
                                                    </span>
                                                </label>
                                                <label className="flex items-start gap-2">
                                                    <Checkbox
                                                        checked={
                                                            reportConsentMarketing
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setReportConsentMarketing(
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                        className="mt-0.5 border-muted-foreground/40"
                                                    />
                                                    <span className="text-xs leading-relaxed text-muted-foreground">
                                                        Send me product updates
                                                        (optional)
                                                    </span>
                                                </label>
                                                {reportError && (
                                                    <p className="text-xs text-destructive">
                                                        {reportError}
                                                    </p>
                                                )}
                                                <Button
                                                    type="button"
                                                    className="bg-gradient-primary w-full text-primary-foreground hover:opacity-90"
                                                    disabled={
                                                        reportSending ||
                                                        !reportEmail ||
                                                        !reportConsentContact
                                                    }
                                                    onClick={sendReport}
                                                >
                                                    {reportSending ? (
                                                        <>
                                                            <Loader2 className="size-4 animate-spin" />
                                                            Sending…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail className="size-4" />
                                                            Send my estimate
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <section className="p-6 lg:p-8">
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="t-display-3">
                                        Summary
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Grouped breakdown, updated instantly.
                                    </p>
                                </div>

                                <div className="hidden items-center gap-3 md:flex">
                                    {SUMMARY_PERIODS.map((period) => {
                                        const isChecked =
                                            desktopVisiblePeriods[period.key];
                                        const isLastVisible =
                                            visibleDesktopPeriods.length ===
                                                1 && isChecked;

                                        return (
                                            <label
                                                key={period.key}
                                                htmlFor={`desktop-period-${period.key}`}
                                                className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground"
                                            >
                                                <Checkbox
                                                    id={`desktop-period-${period.key}`}
                                                    checked={isChecked}
                                                    disabled={isLastVisible}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) => {
                                                        const shouldCheck =
                                                            checked === true;

                                                        setDesktopVisiblePeriods(
                                                            (previousState) => {
                                                                const nextState =
                                                                    {
                                                                        ...previousState,
                                                                        [period.key]:
                                                                            shouldCheck,
                                                                    };
                                                                const selectedCount =
                                                                    Object.values(
                                                                        nextState,
                                                                    ).filter(
                                                                        Boolean,
                                                                    ).length;

                                                                if (
                                                                    selectedCount ===
                                                                    0
                                                                ) {
                                                                    return previousState;
                                                                }

                                                                return nextState;
                                                            },
                                                        );
                                                    }}
                                                />
                                                <span>{period.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                <ToggleGroup
                                    type="single"
                                    value={selectedPeriod}
                                    onValueChange={(value) => {
                                        if (value) {
                                            setSelectedPeriod(
                                                value as AmountFrequency,
                                            );
                                        }
                                    }}
                                    className="md:hidden"
                                >
                                    {SUMMARY_PERIODS.map((period) => (
                                        <ToggleGroupItem
                                            key={period.key}
                                            value={period.key}
                                            aria-label={period.label}
                                        >
                                            {period.label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>

                            <div className="hidden md:block">
                                <div
                                    className="mb-3 grid text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                    style={{
                                        gridTemplateColumns:
                                            desktopGridTemplateColumns,
                                    }}
                                >
                                    <span className="text-left">Category</span>
                                    {visibleDesktopPeriods.map((period) => (
                                        <span key={period.key}>
                                            {period.label}
                                        </span>
                                    ))}
                                </div>

                                <div
                                    className={cn(
                                        'grid items-center rounded-xl border px-4 py-3 text-sm',
                                        rowToneClasses(result.payRow.tone),
                                    )}
                                    style={{
                                        gridTemplateColumns:
                                            desktopGridTemplateColumns,
                                    }}
                                >
                                    <div className="pr-4 text-left text-foreground">
                                        {result.payRow.label}
                                    </div>
                                    {visibleDesktopPeriods.map((period) => (
                                        <div
                                            key={period.key}
                                            className={cn(
                                                'text-right font-semibold tabular-nums',
                                                rowValueClasses(
                                                    result.payRow.tone,
                                                ),
                                            )}
                                        >
                                            {formatSignedNaira(
                                                toPeriodAmount(
                                                    result.payRow.annualAmount,
                                                    period.key,
                                                ),
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 space-y-3">
                                    {result.groups.map((group) => {
                                        const isOpen =
                                            openGroups[group.key] ??
                                            group.defaultOpen ??
                                            true;

                                        return (
                                            <div
                                                key={group.key}
                                                className="overflow-hidden rounded-xl border border-border"
                                            >
                                                <button
                                                    type="button"
                                                    aria-expanded={isOpen}
                                                    aria-controls={`tax-group-${group.key}`}
                                                    className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    onClick={() =>
                                                        setOpenGroups(
                                                            (
                                                                previousState,
                                                            ) => ({
                                                                ...previousState,
                                                                [group.key]:
                                                                    !isOpen,
                                                            }),
                                                        )
                                                    }
                                                >
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {group.title}
                                                    </span>
                                                    {isOpen ? (
                                                        <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                                                    ) : (
                                                        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                                                    )}
                                                </button>

                                                {isOpen && (
                                                    <div id={`tax-group-${group.key}`} role="region" aria-label={group.title} className="space-y-1 p-2">
                                                        {group.rows.map(
                                                            (row) => (
                                                                <div
                                                                    key={
                                                                        row.key
                                                                    }
                                                                    className={cn(
                                                                        'grid items-center rounded-lg border px-3 py-2 text-sm',
                                                                        rowToneClasses(
                                                                            row.tone,
                                                                        ),
                                                                    )}
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            desktopGridTemplateColumns,
                                                                    }}
                                                                >
                                                                    <div className="pr-4 text-left text-foreground">
                                                                        <p>
                                                                            {
                                                                                row.label
                                                                            }
                                                                        </p>
                                                                        {row.detail ? (
                                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                                {
                                                                                    row.detail
                                                                                }
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                    {visibleDesktopPeriods.map(
                                                                        (
                                                                            period,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    period.key
                                                                                }
                                                                                className={cn(
                                                                                    'text-right font-medium tabular-nums',
                                                                                    rowValueClasses(
                                                                                        row.tone,
                                                                                    ),
                                                                                )}
                                                                            >
                                                                                {formatSignedNaira(
                                                                                    toPeriodAmount(
                                                                                        row.annualAmount,
                                                                                        period.key,
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3 md:hidden">
                                <div
                                    className={cn(
                                        'rounded-xl border px-4 py-3',
                                        rowToneClasses(result.payRow.tone),
                                    )}
                                >
                                    <p className="text-sm text-muted-foreground">
                                        {result.payRow.label}
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                                        {formatSignedNaira(
                                            toPeriodAmount(
                                                result.payRow.annualAmount,
                                                selectedPeriod,
                                            ),
                                        )}
                                    </p>
                                </div>

                                {result.groups.map((group) => {
                                    const isOpen =
                                        openGroups[group.key] ??
                                        group.defaultOpen ??
                                        true;

                                    return (
                                        <div
                                            key={group.key}
                                            className="overflow-hidden rounded-xl border border-border"
                                        >
                                            <button
                                                type="button"
                                                aria-expanded={isOpen}
                                                aria-controls={`mobile-tax-group-${group.key}`}
                                                className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                onClick={() =>
                                                    setOpenGroups(
                                                        (previousState) => ({
                                                            ...previousState,
                                                            [group.key]:
                                                                !isOpen,
                                                        }),
                                                    )
                                                }
                                            >
                                                <span className="text-sm font-semibold text-foreground">
                                                    {group.title}
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                                                ) : (
                                                    <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                                                )}
                                            </button>

                                            {isOpen && (
                                                <div id={`mobile-tax-group-${group.key}`} role="region" aria-label={group.title} className="space-y-1 p-2">
                                                    {group.rows.map((row) => (
                                                        <div
                                                            key={row.key}
                                                            className={cn(
                                                                'flex items-center justify-between rounded-lg border px-3 py-2',
                                                                rowToneClasses(
                                                                    row.tone,
                                                                ),
                                                            )}
                                                        >
                                                            <span className="text-sm text-foreground">
                                                                <span>
                                                                    {row.label}
                                                                </span>
                                                                {row.detail ? (
                                                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                                                        {
                                                                            row.detail
                                                                        }
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'text-sm font-medium tabular-nums',
                                                                    rowValueClasses(
                                                                        row.tone,
                                                                    ),
                                                                )}
                                                            >
                                                                {formatSignedNaira(
                                                                    toPeriodAmount(
                                                                        row.annualAmount,
                                                                        selectedPeriod,
                                                                    ),
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Rule snapshot date:{' '}
                                    <span className="font-medium text-foreground">
                                        {formatRuleDate(
                                            activeProfile.ruleSnapshotDate,
                                        )}
                                    </span>{' '}
                                    (effective{' '}
                                    <span className="font-medium text-foreground">
                                        {formatRuleDate(
                                            activeProfile.effectiveFrom,
                                        )}
                                    </span>
                                    ). This calculator provides estimates only
                                    and does not replace professional tax
                                    advice.
                                </p>

                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                                        Gross income:{' '}
                                        {formatCurrency(
                                            result.totals.annualGrossIncome,
                                            'NGN',
                                        )}
                                    </span>
                                    <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                                        Taxable income:{' '}
                                        {formatCurrency(
                                            result.totals.annualTaxableIncome,
                                            'NGN',
                                        )}
                                    </span>
                                    <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                                        Total tax:{' '}
                                        {formatCurrency(
                                            result.totals.annualTax,
                                            'NGN',
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Done estimating? Let Claryeo track your
                                    taxes automatically: invoicing, expenses,
                                    and tax summaries in one place.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        asChild
                                        className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                                    >
                                        <Link href="/get-started">
                                            Create account
                                            <ArrowUpRight className="size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <TaxEducationContent />

            <FaqSection
                items={taxCalculatorFaqs}
                description="Common questions about tax calculation in Nigeria."
            />

        </>
    );
};

export default TaxCalculatorPage;
