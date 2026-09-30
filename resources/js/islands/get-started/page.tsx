import { motion } from 'framer-motion';
import {
    ArrowRight,
    BadgeCheck,
    Building2,
    Calculator,
    CheckCircle2,
    Clock3,
    FileText,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useState, type ComponentType, type FC } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    isSelfServePlanKey,
    type PlanCatalogItem,
    type PlanKey,
} from '@/types/plan-catalog';

type BillingInterval = 'monthly' | 'annual';

type GetStartedProps = {
    plans?: PlanCatalogItem[];
    appUrl?: string;
    contactUrl?: string;
    initialPlan?: 'free' | 'growth' | 'pro' | 'enterprise';
    initialInterval?: 'monthly' | 'annual';
};

type Benefit = {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
};

type PlanCard = PlanCatalogItem & {
    icon: ComponentType<{ className?: string }>;
};

const PLAN_ICONS: Record<PlanKey, ComponentType<{ className?: string }>> = {
    free: BadgeCheck,
    growth: TrendingUp,
    pro: Sparkles,
    enterprise: Building2,
};

const benefits: Benefit[] = [
    {
        icon: FileText,
        title: 'Invoices and receipts',
        description:
            'Create polished invoices, send receipts, and keep every payment trail visible.',
    },
    {
        icon: RefreshCw,
        title: 'Connected transaction flow',
        description:
            'Bank sync and transaction movement feel built into the workflow, not bolted on later.',
    },
    {
        icon: Calculator,
        title: 'Tax-ready summaries',
        description:
            'Move from scattered records to structured PIT, CIT, and VAT-ready reporting.',
    },
    {
        icon: ShieldCheck,
        title: 'A cleaner setup path',
        description:
            'Your selection is preserved through auth so setup continues instead of restarting.',
    },
];

const intervalCopy: Record<
    BillingInterval,
    { label: string; badge: string; description: string }
> = {
    monthly: {
        label: 'Monthly cadence',
        badge: 'Flexible billing',
        description:
            'Stay light on commitment while unlocking the full Pro workflow immediately.',
    },
    annual: {
        label: 'Annual cadence',
        badge: 'Longer runway',
        description:
            'Choose the longer billing rhythm if Claryeo is becoming part of your operating stack.',
    },
};

const selectionHighlights = [
    {
        icon: ShieldCheck,
        title: 'Your choice stays with you',
        description:
            'Pick a plan once and Claryeo preserves it through sign up or sign in.',
    },
    {
        icon: Clock3,
        title: 'The next step stays clear',
        description:
            'Free goes to the dashboard, Growth and Pro continue to billing, and Enterprise moves into sales follow-up.',
    },
    {
        icon: Sparkles,
        title: 'Start simple, upgrade later',
        description:
            'You can begin on the plan that fits today and move into a deeper workflow when you are ready.',
    },
];

const GetStarted: FC<GetStartedProps> = ({
    plans = [],
    appUrl = '',
    contactUrl = '/contact',
    initialPlan,
    initialInterval,
}) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanKey>(
        initialPlan ?? 'free',
    );
    const [billingInterval, setBillingInterval] = useState<BillingInterval>(
        initialInterval ?? 'monthly',
    );

    const planCards: PlanCard[] = plans.map((plan) => ({
        ...plan,
        icon: PLAN_ICONS[plan.key] ?? BadgeCheck,
    }));

    const selectedPlanDetails =
        planCards.find((plan) => plan.key === selectedPlan) ?? planCards[0];
    const selectedInterval = isSelfServePlanKey(selectedPlan)
        ? intervalCopy[billingInterval]
        : null;
    const SelectedPlanIcon = selectedPlanDetails?.icon ?? BadgeCheck;

    if (planCards.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading plans…</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative overflow-hidden">
                <div className="bg-gradient-primary pointer-events-none absolute -top-20 left-0 h-96 w-96 rounded-full opacity-10 blur-3xl" />
                <div className="pointer-events-none absolute top-24 right-0 h-80 w-80 rounded-full bg-violet-bright/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-linear-to-b from-background via-background/95 to-transparent" />

                <div className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 md:px-0 md:py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_28rem]"
                    >
                        <div className="space-y-8 md:space-y-10">
                            <div className="space-y-7">
                                <span className="t-label inline-flex items-center rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground shadow-sm backdrop-blur">
                                    Choose your starting plan
                                </span>

                                <div className="space-y-5">
                                    <h1 className="t-display-hero max-w-2xl text-foreground">
                                        Start with the Claryeo setup that fits
                                        your workflow.
                                    </h1>
                                    <p className="t-lead max-w-xl text-muted-foreground">
                                        Pick a plan once and Claryeo keeps that
                                        choice through account creation,
                                        onboarding, and the right next step.
                                    </p>
                                </div>

                                <div className="rounded-4xl border border-border bg-card/95 p-6 shadow-lg">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="t-eyebrow text-muted-foreground">
                                                Current selection
                                            </p>
                                            <h2 className="t-display-3 mt-3 text-foreground">
                                                {selectedPlanDetails?.name}
                                                {isSelfServePlanKey(
                                                    selectedPlan,
                                                ) && (
                                                    <span className="text-gradient-primary ml-2 text-base font-medium">
                                                        {billingInterval}
                                                    </span>
                                                )}
                                            </h2>
                                        </div>
                                        <div className="bg-gradient-primary flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground shadow-sm">
                                            <SelectedPlanIcon className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
                                            {selectedPlanDetails?.outcome}
                                        </span>
                                        <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
                                            {isSelfServePlanKey(selectedPlan)
                                                ? selectedInterval?.label
                                                : selectedPlanDetails?.priceLabel}
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                        {selectedPlanDetails?.summary}
                                    </p>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        {selectedPlanDetails?.requiresContactSales ? (
                                            <Button
                                                asChild
                                                size="lg"
                                                className="h-12 rounded-full sm:w-auto"
                                            >
                                                <a
                                                    href={`${contactUrl}?plan=${selectedPlan}`}
                                                >
                                                    Contact sales
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    asChild
                                                    size="lg"
                                                    className="h-12 rounded-full sm:flex-1"
                                                >
                                                    <a
                                                        href={
                                                            isSelfServePlanKey(
                                                                selectedPlan,
                                                            )
                                                                ? `${appUrl}/start?plan=${selectedPlan}&billing_interval=${billingInterval}`
                                                                : `${appUrl}/start?plan=free`
                                                        }
                                                    >
                                                        Create account
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </a>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    asChild
                                                    className="h-12 rounded-full border-border bg-background sm:flex-1"
                                                >
                                                    <a
                                                        href={`${appUrl}/login`}
                                                    >
                                                        Log in instead
                                                    </a>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:max-w-xl">
                                    {selectionHighlights.map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={item.title}
                                                className="flex items-start gap-4"
                                            >
                                                <div className="bg-gradient-primary mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-sm">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h2 className="t-ui-title text-foreground">
                                                        {item.title}
                                                    </h2>
                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-4xl border border-border bg-card/95 p-6 shadow-lg">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="t-eyebrow text-muted-foreground">
                                            Included from day one
                                        </p>
                                        <h2 className="t-display-3 mt-2 text-foreground">
                                            The product value stays visible
                                            while you choose.
                                        </h2>
                                    </div>
                                </div>

                                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {benefits.map((item, index) => {
                                        const Icon = item.icon;

                                        return (
                                            <motion.li
                                                key={item.title}
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: 0.06 * index,
                                                    duration: 0.28,
                                                }}
                                                className="rounded-3xl border border-border bg-muted/20 p-5"
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                </div>
                                                <h3 className="t-ui-title mt-4 text-foreground">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <div className="relative overflow-hidden rounded-[2.2rem] border border-border bg-card/95 p-5 shadow-xl backdrop-blur">
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-primary/10 via-primary/5 to-transparent" />

                                <div className="relative">
                                    <div
                                        className={cn(
                                            'rounded-[1.8rem] border p-4 transition-colors',
                                            isSelfServePlanKey(selectedPlan)
                                                ? 'border-primary/20 bg-primary/5'
                                                : 'border-border bg-muted/20',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="t-eyebrow text-muted-foreground">
                                                    Billing cadence
                                                </p>
                                                <h2 className="t-display-4 mt-2 text-foreground">
                                                    Shape your plan before auth
                                                </h2>
                                            </div>
                                            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                                                Applies to Growth &amp; Pro
                                            </span>
                                        </div>

                                        <div
                                            role="group"
                                            aria-label="Billing cadence"
                                            className="mt-4 inline-flex w-full rounded-full border border-border bg-card p-1"
                                        >
                                            {(
                                                ['monthly', 'annual'] as const
                                            ).map((interval) => (
                                                <button
                                                    key={interval}
                                                    type="button"
                                                    aria-pressed={
                                                        billingInterval ===
                                                        interval
                                                    }
                                                    onClick={() =>
                                                        setBillingInterval(
                                                            interval,
                                                        )
                                                    }
                                                    className={cn(
                                                        'flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                        billingInterval ===
                                                            interval
                                                            ? isSelfServePlanKey(
                                                                  selectedPlan,
                                                              )
                                                                ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                                                                : 'bg-foreground text-background shadow-sm'
                                                            : 'text-muted-foreground hover:text-foreground',
                                                    )}
                                                >
                                                    {interval === 'monthly'
                                                        ? 'Monthly'
                                                        : 'Annual'}
                                                </button>
                                            ))}
                                        </div>

                                        <p className="mt-3 text-sm text-muted-foreground">
                                            {isSelfServePlanKey(selectedPlan)
                                                ? 'Your billing choice is ready and will continue into the paid activation flow.'
                                                : 'The cadence is ready if you switch to Growth or Pro, but it is ignored for Free and Enterprise.'}
                                        </p>
                                    </div>

                                    <div
                                        role="group"
                                        aria-label="Available plans"
                                        className="mt-5 grid gap-3"
                                    >
                                        {planCards.map((plan, index) => {
                                            const Icon = plan.icon;
                                            const isSelected =
                                                selectedPlan === plan.key;
                                            const isPremium =
                                                isSelfServePlanKey(plan.key);

                                            return (
                                                <motion.button
                                                    key={plan.key}
                                                    type="button"
                                                    initial={{
                                                        opacity: 0,
                                                        y: 16,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        delay: 0.06 * index,
                                                        duration: 0.3,
                                                    }}
                                                    onClick={() =>
                                                        setSelectedPlan(
                                                            plan.key,
                                                        )
                                                    }
                                                    className={cn(
                                                        'group rounded-[1.8rem] border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                                                        isSelected &&
                                                            isPremium &&
                                                            'border-primary/35 bg-linear-to-br from-primary/10 via-card to-card shadow-lg',
                                                        isSelected &&
                                                            !isPremium &&
                                                            'border-foreground bg-foreground text-background shadow-lg',
                                                        !isSelected &&
                                                            isPremium &&
                                                            'border-primary/20 bg-primary/5 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md',
                                                        !isSelected &&
                                                            !isPremium &&
                                                            'border-border bg-card hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md',
                                                    )}
                                                    aria-pressed={isSelected}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={cn(
                                                                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                                                                    isSelected &&
                                                                        isPremium &&
                                                                        'bg-gradient-primary text-primary-foreground',
                                                                    isSelected &&
                                                                        !isPremium &&
                                                                        'bg-background/12 text-background',
                                                                    !isSelected &&
                                                                        isPremium &&
                                                                        'bg-primary/15 text-primary',
                                                                    !isSelected &&
                                                                        !isPremium &&
                                                                        'bg-muted text-foreground',
                                                                )}
                                                            >
                                                                <Icon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p
                                                                    className={cn(
                                                                        't-eyebrow',
                                                                        isSelected &&
                                                                            isPremium &&
                                                                            'text-primary',
                                                                        isSelected &&
                                                                            !isPremium &&
                                                                            'text-background/60',
                                                                        !isSelected &&
                                                                            'text-muted-foreground',
                                                                    )}
                                                                >
                                                                    {plan.label}
                                                                </p>
                                                                <h3 className="t-display-4 mt-1">
                                                                    {plan.name}
                                                                </h3>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={cn(
                                                                'rounded-full px-3 py-1 text-xs font-medium',
                                                                isSelected &&
                                                                    isPremium &&
                                                                    'bg-primary/10 text-primary',
                                                                isSelected &&
                                                                    !isPremium &&
                                                                    'bg-background/12 text-background',
                                                                !isSelected &&
                                                                    'border border-border bg-muted/60 text-muted-foreground',
                                                            )}
                                                        >
                                                            {plan.priceLabel}
                                                        </span>
                                                    </div>

                                                    <p
                                                        className={cn(
                                                            'mt-4 text-sm leading-6',
                                                            isSelected &&
                                                                !isPremium &&
                                                                'text-background/75',
                                                            isSelected &&
                                                                isPremium &&
                                                                'text-muted-foreground',
                                                            !isSelected &&
                                                                'text-muted-foreground',
                                                        )}
                                                    >
                                                        {plan.headline}
                                                    </p>

                                                    <div className="mt-5 flex flex-wrap gap-2">
                                                        {plan.entitlementBullets.map(
                                                            (bullet) => (
                                                                <span
                                                                    key={bullet}
                                                                    className={cn(
                                                                        'rounded-full px-3 py-1 text-xs font-medium',
                                                                        isSelected &&
                                                                            isPremium &&
                                                                            'bg-primary/10 text-primary',
                                                                        isSelected &&
                                                                            !isPremium &&
                                                                            'bg-background/10 text-background/85',
                                                                        !isSelected &&
                                                                            'bg-muted text-muted-foreground',
                                                                    )}
                                                                >
                                                                    {bullet}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>

                                                    <p
                                                        className={cn(
                                                            'mt-4 text-sm',
                                                            isSelected &&
                                                                !isPremium &&
                                                                'text-background/80',
                                                            isSelected &&
                                                                isPremium &&
                                                                'text-foreground/80',
                                                            !isSelected &&
                                                                'text-muted-foreground',
                                                        )}
                                                    >
                                                        {plan.detail}
                                                    </p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-5 rounded-[1.9rem] border border-border bg-muted/20 p-5">
                                        <p className="t-eyebrow text-muted-foreground">
                                            What happens next
                                        </p>

                                        <div className="mt-4 space-y-3">
                                            {(
                                                selectedPlanDetails?.nextSteps ??
                                                []
                                            ).map((point) => (
                                                <div
                                                    key={point}
                                                    className="flex gap-3"
                                                >
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                    <p className="text-sm leading-6 text-muted-foreground">
                                                        {point}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default GetStarted;
