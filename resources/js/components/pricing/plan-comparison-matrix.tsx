import { Check, Info, Minus } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { useEffect, memo, useMemo, useState } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PlanCatalogItem, PlanKey } from '@/types/plan-catalog';
import type {
    PricingComparisonAddOnRow,
    PricingComparisonGroup,
    PricingComparisonRow,
} from '@/types/pricing-comparison-addons';

import BillingIntervalToggle from './billing-interval-toggle';
import type { PlanComparisonCell } from './plan-comparison-rows';
import {
    formatFreePriceLabel,
    planByKey,
    proHeadlinePriceLabel,
    savingsPercent,
    type BillingInterval,
} from './pricing-utils';

/**
 * Inlined replacement for `@uidotdev/usehooks`' `useDebounce` — returns the
 * value after it has stayed unchanged for `delay` ms.
 */
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

type PlanComparisonMatrixProps = {
    plans: PlanCatalogItem[];
    billing: BillingInterval;
    onBillingChange?: (next: BillingInterval) => void;
    groups?: PricingComparisonGroup[];
    addOns?: PricingComparisonAddOnRow[];
    className?: string;
    getStartedUrl?: string;
    contactUrl?: string;
};

type ComparisonPlan = {
    key: PlanKey;
    name: string;
    price: string;
    ctaLabel: string;
    ctaHref: string;
    accent?: boolean;
};

type ComparisonRowLike = {
    key: string;
    label: string;
    description?: string;
    free: PlanComparisonCell;
    growth: PlanComparisonCell;
    pro: PlanComparisonCell;
    enterprise: PlanComparisonCell;
};

const AI_CREDIT_MIN = 500;

const AI_CREDIT_MAX = 5000;

const AI_CREDIT_STEP = 500;

const AI_CREDIT_INCLUDED = 1000;

const AI_CREDIT_PRICE_TIERS = [
    { credits: 500, priceNaira: 2500 },
    { credits: 1000, priceNaira: 4500 },
    { credits: 2500, priceNaira: 10000 },
    { credits: 5000, priceNaira: 17500 },
] as const;

const AI_CREDIT_ADD_ON_KEYS = AI_CREDIT_PRICE_TIERS.map(
    (tier) => `ai_credits_${tier.credits}`,
);

const TOOLTIP_DELAY_MS = 350;

type TooltipController = {
    open: boolean;
    openTooltip: () => void;
    closeTooltip: () => void;
    setOpen: (open: boolean) => void;
};

function useTooltipController(): TooltipController {
    const [requestedOpen, setRequestedOpen] = useState(false);
    const open = useDebounce(requestedOpen, TOOLTIP_DELAY_MS);

    return {
        open,
        openTooltip: () => setRequestedOpen(true),
        closeTooltip: () => setRequestedOpen(false),
        setOpen: setRequestedOpen,
    };
}

function cellForPlan(
    row: ComparisonRowLike,
    planKey: PlanKey,
): PlanComparisonCell {
    return row[planKey];
}

// Performance optimization: Pre-instantiate static Intl.NumberFormat instances to avoid
// object creation on pricing credit and amount formatting.
const enNgIntegerFormatter = new Intl.NumberFormat('en-NG');
const enNgZeroDecimalFormatter = new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 0,
});

function formatCredits(credits: number): string {
    return enNgIntegerFormatter.format(credits);
}

function formatNaira(amount: number): string {
    return `₦${enNgZeroDecimalFormatter.format(amount)}`;
}

function normalizeAiCredits(value: number): number {
    if (!Number.isFinite(value)) {
        return AI_CREDIT_MIN;
    }

    const clamped = Math.min(AI_CREDIT_MAX, Math.max(AI_CREDIT_MIN, value));

    return Math.round(clamped / AI_CREDIT_STEP) * AI_CREDIT_STEP;
}

/**
 * Un-memoized fallback price calculator for arbitrary credit amounts.
 */
function calculateAiCreditPrice(credits: number): number {
    const exactTier = AI_CREDIT_PRICE_TIERS.find(
        (tier) => tier.credits === credits,
    );

    if (exactTier) {
        return exactTier.priceNaira;
    }

    const lowerTier = [...AI_CREDIT_PRICE_TIERS]
        .reverse()
        .find((tier) => tier.credits < credits);
    const upperTier = AI_CREDIT_PRICE_TIERS.find(
        (tier) => tier.credits > credits,
    );

    if (!lowerTier || !upperTier) {
        return AI_CREDIT_PRICE_TIERS[AI_CREDIT_PRICE_TIERS.length - 1]
            .priceNaira;
    }

    const progress =
        (credits - lowerTier.credits) / (upperTier.credits - lowerTier.credits);
    const interpolatedPrice =
        lowerTier.priceNaira +
        (upperTier.priceNaira - lowerTier.priceNaira) * progress;

    return Math.round(interpolatedPrice / 100) * 100;
}

/**
 * Performance optimization: Pre-computed price lookup map for all valid credit slider steps.
 * Avoids array copying (`[...AI_CREDIT_PRICE_TIERS].reverse()`), linear `.find()` searches,
 * and floating-point interpolation math on every component re-render and slider input.
 */
const AI_CREDIT_PRICE_MAP: Record<number, number> = (() => {
    const map: Record<number, number> = {};
    for (let c = AI_CREDIT_MIN; c <= AI_CREDIT_MAX; c += AI_CREDIT_STEP) {
        map[c] = calculateAiCreditPrice(c);
    }
    return map;
})();

function aiCreditPrice(credits: number): number {
    return AI_CREDIT_PRICE_MAP[credits] ?? calculateAiCreditPrice(credits);
}

function aiCreditCellForPlan(
    planKey: PlanKey,
    credits: number,
): PlanComparisonCell {
    if (planKey === 'pro' || planKey === 'enterprise') {
        if (credits <= AI_CREDIT_INCLUDED) {
            return { kind: 'text', value: '1,000/mo included' };
        }

        return {
            kind: 'text',
            value: `${formatNaira(aiCreditPrice(credits))} top-up`,
        };
    }

    return { kind: 'text', value: formatNaira(aiCreditPrice(credits)) };
}

function ComparisonCellView({ cell }: { cell: PlanComparisonCell }) {
    if (cell.kind === 'included') {
        return (
            <span
                className="inline-flex items-center justify-center text-primary"
                aria-label="Included"
            >
                <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
        );
    }

    if (cell.kind === 'excluded') {
        return (
            <span
                className="inline-flex items-center justify-center text-muted-foreground/45"
                aria-label="Not included"
            >
                <Minus className="h-4 w-4" strokeWidth={2} />
            </span>
        );
    }

    return <span className="text-sm text-muted-foreground">{cell.value}</span>;
}

function FeatureLabel({
    label,
    description,
    children,
    tooltip,
}: {
    label: string;
    description?: string;
    children?: ReactNode;
    tooltip?: TooltipController;
}) {
    return (
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <span className="min-w-0 text-sm text-muted-foreground">
                    {label}
                </span>
                {description && (
                    <Tooltip
                        open={tooltip?.open}
                        onOpenChange={tooltip?.setOpen}
                    >
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                aria-label={`${label} details`}
                            >
                                <Info className="size-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64 leading-relaxed">
                            {description}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            {children}
        </div>
    );
}

/**
 * Performance optimization: Memoized row components to avoid re-rendering
 * ~30 static feature comparison rows during state changes (e.g., when moving
 * the AI credit slider or updating the draft input).
 */
const DesktopRow = memo(function DesktopRow({
    row,
    plans,
    index,
}: {
    row: ComparisonRowLike;
    plans: ComparisonPlan[];
    index: number;
}) {
    const tooltip = useTooltipController();

    return (
        <div
            className={cn(
                'grid grid-cols-[minmax(240px,280px)_repeat(4,minmax(140px,1fr))] border-b border-border/70 transition-colors',
                index % 2 === 0
                    ? 'hover:bg-muted/35'
                    : 'bg-muted/[0.025] hover:bg-muted/45',
            )}
            onMouseEnter={tooltip.openTooltip}
            onMouseLeave={tooltip.closeTooltip}
            onFocus={tooltip.openTooltip}
            onBlur={tooltip.closeTooltip}
        >
            <div className="py-4 pr-6 pl-4">
                <FeatureLabel
                    label={row.label}
                    description={row.description}
                    tooltip={tooltip}
                />
            </div>
            {plans.map((plan) => (
                <div
                    key={plan.key}
                    className={cn(
                        'border-l border-border/70 px-4 py-4 align-middle',
                        plan.accent && 'bg-muted/40',
                    )}
                >
                    <ComparisonCellView cell={cellForPlan(row, plan.key)} />
                </div>
            ))}
        </div>
    );
});

const MobileRow = memo(function MobileRow({
    row,
    selectedPlan,
    index,
}: {
    row: ComparisonRowLike;
    selectedPlan: ComparisonPlan;
    index: number;
}) {
    const tooltip = useTooltipController();

    return (
        <div
            className={cn(
                'grid grid-cols-[minmax(0,1fr)_minmax(112px,40%)] border-b border-border/70 transition-colors',
                index % 2 === 0
                    ? 'hover:bg-muted/35'
                    : 'bg-muted/[0.025] hover:bg-muted/45',
            )}
            onMouseEnter={tooltip.openTooltip}
            onMouseLeave={tooltip.closeTooltip}
            onFocus={tooltip.openTooltip}
            onBlur={tooltip.closeTooltip}
        >
            <div className="py-4 pr-4 pl-4">
                <FeatureLabel
                    label={row.label}
                    description={row.description}
                    tooltip={tooltip}
                />
            </div>
            <div
                className={cn(
                    'border-l border-border/70 px-4 py-4',
                    selectedPlan.accent && 'bg-muted/40',
                )}
            >
                <ComparisonCellView cell={cellForPlan(row, selectedPlan.key)} />
            </div>
        </div>
    );
});

const PlanComparisonMatrix: FC<PlanComparisonMatrixProps> = ({
    plans,
    billing,
    onBillingChange,
    groups = [],
    addOns = [],
    className = '',
    getStartedUrl = '/get-started',
    contactUrl = '/contact',
}) => {
    const freePlan = planByKey(plans, 'free');
    const growthPlan = planByKey(plans, 'growth');
    const proPlan = planByKey(plans, 'pro');
    const enterprisePlan = planByKey(plans, 'enterprise');
    const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>('pro');
    const [selectedAiCredits, setSelectedAiCredits] = useState(2500);
    const [isEditingAiCredits, setIsEditingAiCredits] = useState(false);
    const [aiCreditsDraft, setAiCreditsDraft] = useState('2500');
    const desktopAiTooltip = useTooltipController();
    const mobileAiTooltip = useTooltipController();

    if (!freePlan || !growthPlan || !proPlan || groups.length === 0) {
        return null;
    }

    const growthMonthlyKobo =
        growthPlan.monthlyAmount ?? growthPlan.amount ?? null;
    const growthAnnualKobo = growthPlan.annualAmount ?? null;
    const growthHeadline = proHeadlinePriceLabel(
        billing,
        growthPlan,
        growthMonthlyKobo,
        growthAnnualKobo,
    );
    const growthPriceColumn =
        billing === 'annual'
            ? `${growthHeadline} yearly`
            : `${growthHeadline} monthly`;

    const proMonthlyKobo = proPlan.monthlyAmount ?? proPlan.amount ?? null;
    const proAnnualKobo = proPlan.annualAmount ?? null;
    const proHeadline = proHeadlinePriceLabel(
        billing,
        proPlan,
        proMonthlyKobo,
        proAnnualKobo,
    );
    const proPriceColumn =
        billing === 'annual'
            ? `${proHeadline} yearly`
            : `${proHeadline} monthly`;
    const savePercent = savingsPercent(proMonthlyKobo, proAnnualKobo);

    // Performance optimization: Memoize comparison plans array and derived
    // items so DesktopRow / MobileRow receive stable props and skip re-renders.
    const comparisonPlans = useMemo<ComparisonPlan[]>(
        () => [
            {
                key: 'free',
                name: freePlan.name,
                price: formatFreePriceLabel(freePlan.priceLabel),
                ctaLabel: 'Get started',
                ctaHref: getStartedUrl,
            },
            {
                key: 'growth',
                name: growthPlan.name,
                price: growthPriceColumn,
                ctaLabel: 'Get started',
                ctaHref: `${getStartedUrl}?plan=growth&billing_interval=${billing}`,
            },
            {
                key: 'pro',
                name: proPlan.name,
                price: proPriceColumn,
                ctaLabel: 'Get started',
                ctaHref: `${getStartedUrl}?plan=pro&billing_interval=${billing}`,
                accent: true,
            },
            ...(enterprisePlan
                ? [
                      {
                          key: 'enterprise' as const,
                          name: enterprisePlan.name,
                          price: enterprisePlan.priceLabel,
                          ctaLabel: 'Contact sales',
                          ctaHref: `${contactUrl}?plan=${enterprisePlan.key}`,
                      },
                  ]
                : []),
        ],
        [
            freePlan.name,
            freePlan.priceLabel,
            getStartedUrl,
            growthPlan.name,
            growthPriceColumn,
            billing,
            proPlan.name,
            proPriceColumn,
            enterprisePlan,
            contactUrl,
        ],
    );

    const selectedPlan = useMemo(
        () =>
            comparisonPlans.find((plan) => plan.key === selectedPlanKey) ??
            comparisonPlans[0],
        [comparisonPlans, selectedPlanKey],
    );

    const hasAiCreditAddOns = addOns.some((row) =>
        AI_CREDIT_ADD_ON_KEYS.includes(row.key),
    );
    const nonAiAddOns = useMemo(
        () => addOns.filter((row) => !AI_CREDIT_ADD_ON_KEYS.includes(row.key)),
        [addOns],
    );
    const commitAiCreditDraft = (): void => {
        const normalizedCredits = normalizeAiCredits(Number(aiCreditsDraft));

        setSelectedAiCredits(normalizedCredits);
        setAiCreditsDraft(String(normalizedCredits));
        setIsEditingAiCredits(false);
    };
    const addOnGroup = useMemo<PricingComparisonGroup | null>(
        () =>
            addOns.length > 0
                ? {
                      title: 'Add-ons',
                      rows: nonAiAddOns.map((row) => ({
                          ...row,
                          description: '',
                      })),
                  }
                : null,
        [addOns.length, nonAiAddOns],
    );
    const aiCreditRow = useMemo<PricingComparisonRow>(
        () => ({
            key: 'ai_credits',
            label: 'AI credits',
            description:
                'Optional credit packs for AI-assisted tax and finance workflows.',
            free: aiCreditCellForPlan('free', selectedAiCredits),
            growth: aiCreditCellForPlan('growth', selectedAiCredits),
            pro: aiCreditCellForPlan('pro', selectedAiCredits),
            enterprise: aiCreditCellForPlan('enterprise', selectedAiCredits),
        }),
        [selectedAiCredits],
    );

    return (
        <div className={cn('rounded-2xl bg-card/40', className)}>
            <div className="flex flex-col gap-3 border-b border-border pb-5 md:hidden">
                <label
                    htmlFor="comparison-plan"
                    className="text-sm font-medium text-muted-foreground"
                >
                    Change plan
                </label>
                <select
                    id="comparison-plan"
                    value={selectedPlan.key}
                    onChange={(event) =>
                        setSelectedPlanKey(event.target.value as PlanKey)
                    }
                    className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm"
                >
                    {comparisonPlans.map((plan) => (
                        <option key={plan.key} value={plan.key}>
                            {plan.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="hidden md:block">
                <div className="sticky top-14 z-10 grid grid-cols-[minmax(240px,280px)_repeat(4,minmax(140px,1fr))] border-b border-border bg-background">
                    <div className="flex items-end justify-start py-5 pr-6 pl-4">
                        {onBillingChange && (
                            <BillingIntervalToggle
                                value={billing}
                                onChange={onBillingChange}
                                savePercent={savePercent}
                                compact
                            />
                        )}
                    </div>
                    {comparisonPlans.map((plan) => (
                        <div
                            key={plan.key}
                            className={cn(
                                'border-l border-border/70 px-4 py-5',
                                plan.accent && 'bg-muted/60',
                            )}
                        >
                            <div className="text-sm font-semibold text-foreground">
                                {plan.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {plan.price}
                            </div>
                            <a
                                href={plan.ctaHref}
                                className={cn(
                                    'mt-4 inline-flex h-9 w-full items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
                                    plan.accent
                                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'border-border bg-muted text-foreground hover:bg-muted/80',
                                )}
                            >
                                {plan.ctaLabel}
                            </a>
                        </div>
                    ))}
                </div>

                {groups.map((group) => (
                    <section key={group.title}>
                        <div className="border-b border-border/70 pt-8 pb-3 pl-4 text-base font-semibold text-foreground">
                            {group.title}
                        </div>
                        {group.rows.map((row, index) => (
                            <DesktopRow
                                key={row.key}
                                row={row}
                                plans={comparisonPlans}
                                index={index}
                            />
                        ))}
                    </section>
                ))}

                {addOnGroup && (
                    <section>
                        <div className="border-b border-border/70 pt-8 pb-3 pl-4 text-base font-semibold text-foreground">
                            {addOnGroup.title}
                        </div>
                        {addOnGroup.rows.map((row, index) => (
                            <DesktopRow
                                key={row.key}
                                row={row}
                                plans={comparisonPlans}
                                index={index}
                            />
                        ))}
                        {hasAiCreditAddOns && (
                            <div
                                className="grid grid-cols-[minmax(240px,280px)_repeat(4,minmax(140px,1fr))] border-b border-border/70 transition-colors hover:bg-muted/35"
                                onMouseEnter={desktopAiTooltip.openTooltip}
                                onMouseLeave={desktopAiTooltip.closeTooltip}
                                onFocus={desktopAiTooltip.openTooltip}
                                onBlur={desktopAiTooltip.closeTooltip}
                            >
                                <div className="py-4 pr-6 pl-4">
                                    <FeatureLabel
                                        label={aiCreditRow.label}
                                        description={aiCreditRow.description}
                                        tooltip={desktopAiTooltip}
                                    >
                                        <div className="mt-3 max-w-[260px]">
                                            <div className="flex items-center justify-between gap-3">
                                                {isEditingAiCredits ? (
                                                    <input
                                                        type="number"
                                                        min={AI_CREDIT_MIN}
                                                        max={AI_CREDIT_MAX}
                                                        step={AI_CREDIT_STEP}
                                                        value={aiCreditsDraft}
                                                        autoFocus
                                                        aria-label="AI credit count"
                                                        onChange={(event) =>
                                                            setAiCreditsDraft(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        onBlur={
                                                            commitAiCreditDraft
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                commitAiCreditDraft();
                                                            }

                                                            if (
                                                                event.key ===
                                                                'Escape'
                                                            ) {
                                                                setAiCreditsDraft(
                                                                    String(
                                                                        selectedAiCredits,
                                                                    ),
                                                                );
                                                                setIsEditingAiCredits(
                                                                    false,
                                                                );
                                                            }
                                                        }}
                                                        className="h-7 w-20 rounded-md border border-border bg-background px-2 text-right text-xs font-semibold text-foreground"
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onDoubleClick={() => {
                                                            setAiCreditsDraft(
                                                                String(
                                                                    selectedAiCredits,
                                                                ),
                                                            );
                                                            setIsEditingAiCredits(
                                                                true,
                                                            );
                                                        }}
                                                        className="rounded-md px-1 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                                                        title="Double-click to edit"
                                                    >
                                                        {formatCredits(
                                                            selectedAiCredits,
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="range"
                                                min={AI_CREDIT_MIN}
                                                max={AI_CREDIT_MAX}
                                                step={AI_CREDIT_STEP}
                                                value={selectedAiCredits}
                                                aria-label="AI credit add-on amount"
                                                onChange={(event) =>
                                                    setSelectedAiCredits(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mt-3 h-1.5 w-full accent-primary"
                                            />
                                            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                                                <span>500</span>
                                                <span>2,500</span>
                                                <span>5,000</span>
                                            </div>
                                        </div>
                                    </FeatureLabel>
                                </div>
                                {comparisonPlans.map((plan) => (
                                    <div
                                        key={plan.key}
                                        className={cn(
                                            'border-l border-border/70 px-4 py-4',
                                            plan.accent && 'bg-muted/40',
                                        )}
                                    >
                                        <ComparisonCellView
                                            cell={cellForPlan(
                                                aiCreditRow,
                                                plan.key,
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>

            <div className="md:hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(112px,40%)] border-b border-border py-5 pr-0 pl-4 text-sm font-semibold text-foreground">
                    <div>Features</div>
                    <div>
                        <span>{selectedPlan.name}</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            {selectedPlan.price}
                        </span>
                    </div>
                </div>

                {groups.map((group) => (
                    <section key={group.title}>
                        <div className="border-b border-border/70 pt-8 pb-3 pl-4 text-sm font-semibold text-foreground">
                            {group.title}
                        </div>
                        {group.rows.map((row, index) => (
                            <MobileRow
                                key={row.key}
                                row={row}
                                selectedPlan={selectedPlan}
                                index={index}
                            />
                        ))}
                    </section>
                ))}

                {addOnGroup && (
                    <section>
                        <div className="border-b border-border/70 pt-8 pb-3 pl-4 text-sm font-semibold text-foreground">
                            {addOnGroup.title}
                        </div>
                        {addOnGroup.rows.map((row, index) => (
                            <MobileRow
                                key={row.key}
                                row={row}
                                selectedPlan={selectedPlan}
                                index={index}
                            />
                        ))}
                        {hasAiCreditAddOns && (
                            <div
                                className={cn(
                                    'grid grid-cols-[minmax(0,1fr)_minmax(112px,40%)] border-b border-border/70 transition-colors',
                                    addOnGroup.rows.length % 2 === 0
                                        ? 'hover:bg-muted/35'
                                        : 'bg-muted/[0.025] hover:bg-muted/45',
                                )}
                                onMouseEnter={mobileAiTooltip.openTooltip}
                                onMouseLeave={mobileAiTooltip.closeTooltip}
                                onFocus={mobileAiTooltip.openTooltip}
                                onBlur={mobileAiTooltip.closeTooltip}
                            >
                                <div className="py-4 pr-4 pl-4">
                                    <FeatureLabel
                                        label={aiCreditRow.label}
                                        description={aiCreditRow.description}
                                        tooltip={mobileAiTooltip}
                                    >
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between gap-3">
                                                {isEditingAiCredits ? (
                                                    <input
                                                        type="number"
                                                        min={AI_CREDIT_MIN}
                                                        max={AI_CREDIT_MAX}
                                                        step={AI_CREDIT_STEP}
                                                        value={aiCreditsDraft}
                                                        autoFocus
                                                        aria-label="AI credit count"
                                                        onChange={(event) =>
                                                            setAiCreditsDraft(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        onBlur={
                                                            commitAiCreditDraft
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                commitAiCreditDraft();
                                                            }

                                                            if (
                                                                event.key ===
                                                                'Escape'
                                                            ) {
                                                                setAiCreditsDraft(
                                                                    String(
                                                                        selectedAiCredits,
                                                                    ),
                                                                );
                                                                setIsEditingAiCredits(
                                                                    false,
                                                                );
                                                            }
                                                        }}
                                                        className="h-7 w-20 rounded-md border border-border bg-background px-2 text-right text-xs font-semibold text-foreground"
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onDoubleClick={() => {
                                                            setAiCreditsDraft(
                                                                String(
                                                                    selectedAiCredits,
                                                                ),
                                                            );
                                                            setIsEditingAiCredits(
                                                                true,
                                                            );
                                                        }}
                                                        className="rounded-md px-1 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                                                        title="Double-click to edit"
                                                    >
                                                        {formatCredits(
                                                            selectedAiCredits,
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="range"
                                                min={AI_CREDIT_MIN}
                                                max={AI_CREDIT_MAX}
                                                step={AI_CREDIT_STEP}
                                                value={selectedAiCredits}
                                                aria-label="AI credit add-on amount"
                                                onChange={(event) =>
                                                    setSelectedAiCredits(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mt-3 h-1.5 w-full accent-primary"
                                            />
                                            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                                                <span>500</span>
                                                <span>2,500</span>
                                                <span>5,000</span>
                                            </div>
                                        </div>
                                    </FeatureLabel>
                                </div>
                                <div
                                    className={cn(
                                        'border-l border-border/70 px-4 py-4',
                                        selectedPlan.accent && 'bg-muted/40',
                                    )}
                                >
                                    <ComparisonCellView
                                        cell={cellForPlan(
                                            aiCreditRow,
                                            selectedPlan.key,
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default PlanComparisonMatrix;
