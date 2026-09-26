import type { CommunityCategory, CommunityOption } from '@/waitlist/lib/types';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, Layers, Sprout, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { CommunityBreakdown } from '@/waitlist/components/community/CommunityBreakdown';

interface StatMeta {
    index: string;
    eyebrow: string;
    question: string;
    note: string;
    /** One finished sentence per option id, used after "of the community …". */
    phrases: Record<string, string>;
}

const META: Record<CommunityCategory, StatMeta> = {
    pain: {
        index: '01',
        eyebrow: 'THE BUSYWORK',
        question: 'What’s taking up too much headspace?',
        note: 'Up to three each, most pressing first',
        phrases: {
            payments: 'are chasing unpaid invoices.',
            scattered: 'have money scattered across apps, receipts and spreadsheets.',
            tax: 'don’t know what tax they owe.',
            visibility: 'can’t tell if they’re actually making money.',
        },
    },
    goal: {
        index: '02',
        eyebrow: 'THE GOAL',
        question: 'Less admin. More what?',
        note: 'One answer each',
        phrases: {
            time: 'want more time for the work they love.',
            growth: 'want room to grow their business.',
            confidence: 'want to trust their numbers.',
            peace: 'want peace of mind.',
        },
    },
};

const ease = [0.22, 1, 0.36, 1] as const;

const CountUp = ({ value }: { value: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const previous = useRef(0);
    const reduce = useReducedMotion();
    useEffect(() => {
        if (reduce || !ref.current) {
            previous.current = value;
            return;
        }
        const controls = animate(previous.current, value, {
            duration: 1,
            ease,
            onUpdate: (v) => {
                if (ref.current) ref.current.textContent = String(Math.round(v));
            },
        });
        previous.current = value;
        return () => controls.stop();
    }, [value, reduce]);
    return (
        <span ref={ref} aria-hidden="true">
            {value}
        </span>
    );
};

const DotField = ({ percentage }: { percentage: number }) => (
    <span className="stat-dot-field" aria-hidden="true">
        {Array.from({ length: 100 }, (_, index) => (
            <i key={index} className={index < percentage ? 'filled' : ''} />
        ))}
    </span>
);

export interface QuestionStatProps {
    id: CommunityCategory;
    options: readonly CommunityOption[];
    total: number;
    picks: readonly string[];
    open: boolean;
    onToggle: (id: CommunityCategory) => void;
    compact: boolean;
    delay?: number;
}

export const QuestionStat = ({
    id,
    options,
    total,
    picks,
    open,
    onToggle,
    compact,
    delay = 0,
}: QuestionStatProps) => {
    const reduce = useReducedMotion();
    const trigger = useRef<HTMLButtonElement>(null);
    const meta = META[id];
    const sorted = [...options].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    if (!top) return null;
    const saidTop = picks.includes(top.id);
    const mine = saidTop ? null : sorted.find((option) => picks.includes(option.id));
    const Icon = id === 'goal' ? Sprout : Layers;
    const close = () => {
        onToggle(id);
        trigger.current?.focus({ preventScroll: true });
    };
    return (
        <motion.article
            layout={!reduce}
            className={`stat-card stat-card-${id} ${open ? 'is-open' : ''} ${compact ? 'is-compact' : ''}`}
            data-testid={`community-question-${id}`}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.6, delay, ease, layout: { duration: 0.5, ease } }}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && open) {
                    event.stopPropagation();
                    close();
                }
            }}
        >
            <motion.div
                layout={reduce ? false : 'position'}
                className="stat-card-summary"
                transition={{ layout: { duration: 0.5, ease } }}
            >
                <div className="stat-card-topline">
                    <span className="eyebrow" data-testid={`community-eyebrow-${id}`}>
                        {meta.index} <span className="eyebrow-divider">/</span> {meta.eyebrow}
                    </span>
                    {id !== 'pain' && (
                        <Icon className="stat-category-icon" size={20} strokeWidth={1.3} aria-hidden="true" />
                    )}
                </div>
                <p className="stat-question" id={`question-${id}`} data-testid={`community-question-text-${id}`}>
                    {meta.question}
                </p>
                <div className="stat-lead" data-testid={`community-lead-${id}`}>
                    <strong className="stat-percentage" data-testid={`community-percentage-${id}`}>
                        <span className="sr-only">{top.percentage}%</span>
                        <CountUp value={top.percentage} />
                        <span className="stat-percent-sign" aria-hidden="true">
                            %
                        </span>
                    </strong>
                    {id === 'pain' && <DotField percentage={top.percentage} />}
                    <p className="stat-statement" data-testid={`community-statement-${id}`}>
                        <span className="stat-statement-prefix">of the community </span>
                        {meta.phrases[top.id] ?? ''}
                    </p>
                </div>
                <div className="stat-meta">
                    <span data-testid={`community-count-${id}`}>
                        Most common answer · {top.count} of {total}
                    </span>
                    {saidTop && (
                        <span className="you-chip same" data-testid={`community-you-same-${id}`}>
                            <Check size={11} aria-hidden="true" /> You said this too
                        </span>
                    )}
                    {mine && (
                        <span className="you-chip" data-testid={`community-you-other-${id}`}>
                            You chose “{mine.label}” · {mine.percentage}% did too
                        </span>
                    )}
                </div>
                <button
                    ref={trigger}
                    type="button"
                    className="stat-card-trigger"
                    aria-expanded={open}
                    aria-controls={`breakdown-${id}`}
                    aria-label={`${open ? 'Hide breakdown' : 'See the full breakdown'}: ${meta.question}`}
                    onClick={() => onToggle(id)}
                    data-testid={`community-toggle-${id}`}
                >
                    <span className="stat-trigger-label">{open ? 'Hide breakdown' : 'See the full breakdown'}</span>
                    <span className="stat-trigger-icon">
                        {open ? <X size={17} aria-hidden="true" /> : <ArrowUpRight size={19} aria-hidden="true" />}
                    </span>
                </button>
            </motion.div>
            <div
                id={`breakdown-${id}`}
                role="region"
                aria-labelledby={`question-${id}`}
                aria-hidden={!open}
                data-testid={`community-detail-region-${id}`}
            >
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            className="stat-breakdown"
                            data-testid={`community-breakdown-${id}`}
                            initial={reduce ? false : { height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.5, ease }}
                        >
                            <CommunityBreakdown id={id} options={sorted} total={total} picks={picks} note={meta.note} />
                            <button
                                type="button"
                                className="breakdown-close"
                                tabIndex={open ? 0 : -1}
                                onClick={close}
                                data-testid={`community-close-${id}`}
                            >
                                <X size={13} aria-hidden="true" /> Close breakdown
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.article>
    );
};
