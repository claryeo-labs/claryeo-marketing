import { createAnimatable } from 'animejs';
import { useEffect, useId, useRef } from 'react';
import type { FC } from 'react';

import LedgerRail from '@/components/landing/ledger-rail';
import { onScrollProgress, prefersReducedMotion } from '@/lib/motion';
import { formatCurrency } from '@/lib/utils';

const MONTHS = [
    { label: 'Mar', income: 1_920_000, expense: 1_180_000 },
    { label: 'Apr', income: 1_760_000, expense: 1_240_000 },
    { label: 'May', income: 2_140_000, expense: 1_100_000 },
    { label: 'Jun', income: 2_020_000, expense: 1_340_000 },
    { label: 'Jul', income: 2_480_000, expense: 1_210_000 },
    { label: 'Aug', income: 2_740_000, expense: 1_390_000 },
];

const SCALE = 3_000_000;
const CHART_H = 148;
/** Pixels the card travels across a full pass through the viewport. */
const DRIFT = 120;

const profit = (m: (typeof MONTHS)[number]) => m.income - m.expense;

/**
 * Precomputed static SVG polyline points for the profit trend line.
 * Performance optimization: MONTHS, SCALE, and CHART_H are module constants, so computing
 * points once at module load avoids redundant array iterations, float math, and string formatting on every render.
 */
const PROFIT_POINTS = (() => {
    // Bars sit in equal flex-1 cells and are centred in them, so a vertex
    // belongs at the centre of its month's cell -- not at the chart edges.
    const step = 100 / MONTHS.length;
    return MONTHS.map((m, i) => {
        const y = CHART_H - (profit(m) / SCALE) * CHART_H;
        return `${((i + 0.5) * step).toFixed(2)},${y.toFixed(1)}`;
    }).join(' ');
})();

/** Precomputed aggregate totals for the static MONTHS array. */
const TOTAL = MONTHS.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
    { income: 0, expense: 0 },
);

const MARGIN = Math.round(((TOTAL.income - TOTAL.expense) / TOTAL.income) * 100);

/**
 * The last entry in the ledger run: the month closing into a report. Two
 * things track scroll position rather than fading -- the card drifts up as
 * the section passes, and the profit line writes itself left to right, Mar
 * through Aug, the way the months actually accumulated.
 */
const ReportsSpotlight: FC = () => {
    const wrapperRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const sweepRef = useRef<SVGRectElement>(null);
    const clipId = useId();

    useEffect(() => {
        const card = cardRef.current;
        const wrapper = wrapperRef.current;
        const sweep = sweepRef.current;
        if (!card || !wrapper || !sweep) return;

        if (prefersReducedMotion()) {
            sweep.setAttribute('width', '100');
            return;
        }

        // ponytail: anime's animatable, not a scroll observer -- one setter
        // fed by a listener that re-measures, so nothing goes stale.
        const drifter = createAnimatable(card, { y: 250, ease: 'outQuad' });

        return onScrollProgress(wrapper, (p) => {
            drifter.y((0.5 - p) * DRIFT);
            // Line writes across the first half of the pass, so it finishes
            // as the card reaches centre.
            const drawn = Math.min(Math.max((p - 0.2) / 0.35, 0), 1);
            sweep.setAttribute('width', (drawn * 100).toFixed(2));
        });
    }, []);

    return (
        <section
            ref={wrapperRef}
            className="border-t border-ink-border bg-ink py-16 transition-colors duration-300 md:py-28"
        >
            <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 md:grid-cols-[9rem_1fr_1.1fr] md:items-start md:gap-12 md:px-0">
                <LedgerRail date="31 Aug" reference="Month close" />

                <div>
                    <h2 className="t-display-2 text-paper">
                        <em>Eight</em> reports.
                        <br />
                        Zero spreadsheets.
                    </h2>
                    <p className="t-body mt-5 max-w-sm text-mist">
                        Eight report types: profit &amp; loss, cash flow, invoice aging, client and
                        product summaries, built from the invoices and bank transactions already
                        in your account. Export any of them as PDF or CSV.
                    </p>
                </div>

                <div
                    ref={cardRef}
                    className="rounded-xl border border-ink-border bg-ink-raised p-5 md:p-7"
                >
                    <div className="flex items-baseline justify-between">
                        <span className="t-label text-mist">
                            Profit &amp; loss · Mar–Aug
                        </span>
                        <span className="t-mono text-[11px] text-positive">
                            {MARGIN}% margin
                        </span>
                    </div>

                    <p className="t-figure-display mt-3 text-paper">
                        {formatCurrency(TOTAL.income - TOTAL.expense, 'NGN', { compact: true })}
                    </p>
                    <p className="mt-1 t-mono text-[11px] text-mist">Profit, six months</p>

                    <div className="mt-6 h-px bg-ink-border" />

                    <div className="relative mt-6" style={{ height: CHART_H }}>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-ink-border" />
                        <div className="absolute inset-0 flex items-end justify-between gap-2">
                            {MONTHS.map((m) => (
                                <div
                                    key={m.label}
                                    className="flex flex-1 items-end justify-center gap-[3px]"
                                >
                                    <div
                                        className="w-2.5 bg-chart-income"
                                        style={{ height: `${(m.income / SCALE) * 100}%` }}
                                    />
                                    <div
                                        className="w-2.5 bg-chart-expense"
                                        style={{ height: `${(m.expense / SCALE) * 100}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                        <svg
                            viewBox={`0 0 100 ${CHART_H}`}
                            preserveAspectRatio="none"
                            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                            aria-hidden="true"
                        >
                            <clipPath id={clipId}>
                                <rect ref={sweepRef} x="0" y="0" width="0" height={CHART_H} />
                            </clipPath>
                            <polyline
                                points={PROFIT_POINTS}
                                clipPath={`url(#${clipId})`}
                                fill="none"
                                stroke="var(--color-violet-bright)"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    </div>

                    <div className="mt-2 flex justify-between">
                        {MONTHS.map((m) => (
                            <span
                                key={m.label}
                                className="flex-1 text-center t-mono text-[10px] text-mist"
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink-border pt-4 t-mono text-[10px] text-mist">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 bg-chart-income" /> Income
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 bg-chart-expense" /> Expenses
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-px w-3 bg-violet-bright" /> Profit
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReportsSpotlight;
