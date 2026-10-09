import type { FC } from 'react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { BillingInterval } from './pricing-utils';

type BillingIntervalToggleProps = {
    value: BillingInterval;
    onChange: (next: BillingInterval) => void;
    savePercent: number | null;
    compact?: boolean;
};

/**
 * Performance optimization: Wrap BillingIntervalToggle with React.memo() to avoid
 * unnecessary re-renders when parent component state updates without changing toggle props.
 */
const BillingIntervalToggle = memo(({
    value,
    onChange,
    savePercent,
    compact = false,
}: BillingIntervalToggleProps) => (
    <div
        role="group"
        aria-label="Billing interval"
        className="flex justify-center"
    >
        <button
            type="button"
            aria-pressed={value === 'monthly'}
            onClick={() => onChange('monthly')}
            className={cn(
                'rounded-lg px-4 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                compact && 'px-3 py-2 text-xs',
                value === 'monthly'
                    ? 'bg-card text-foreground shadow-md ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {compact ? 'Monthly' : 'Monthly billing'}
        </button>
        <button
            type="button"
            aria-pressed={value === 'annual'}
            onClick={() => onChange('annual')}
            className={cn(
                'rounded-lg px-4 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                compact && 'px-3 py-2 text-xs',
                value === 'annual'
                    ? 'bg-card text-foreground shadow-md ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            <span className="inline-flex items-center gap-2">
                {compact ? 'Annual' : 'Annual billing'}
                {savePercent != null && savePercent > 0 && (
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-primary/25">
                        Save {savePercent}%
                    </span>
                )}
            </span>
        </button>
    </div>
));

BillingIntervalToggle.displayName = 'BillingIntervalToggle';

export default BillingIntervalToggle;
