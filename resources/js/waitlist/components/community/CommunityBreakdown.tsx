import type { CommunityOption } from '@/waitlist/lib/types';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

import { FeatureIcon } from '@/waitlist/components/Brand';

const ease = [0.22, 1, 0.36, 1] as const;

export interface CommunityBreakdownProps {
    id: string;
    options: readonly CommunityOption[];
    total: number;
    picks: readonly string[];
    note: string;
}

export const CommunityBreakdown = ({ id, options, total, picks, note }: CommunityBreakdownProps) => {
    const reduce = useReducedMotion();
    return (
        <div className="breakdown-content">
            <div className="breakdown-heading">
                <span className="eyebrow" data-testid={`community-breakdown-heading-${id}`}>
                    THE FULL PICTURE
                </span>
                <span data-testid={`community-breakdown-total-${id}`}>{total} responses</span>
            </div>
            <div className="breakdown-grid">
                {options.map((option, index) => {
                    const yours = picks.includes(option.id);
                    return (
                        <motion.div
                            key={option.id}
                            className={`breakdown-item ${yours ? 'is-yours' : ''}`}
                            data-testid={`community-option-${id}-${option.id}`}
                            initial={reduce ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: reduce ? 0 : 0.12 + index * 0.05 }}
                        >
                            <span className="breakdown-icon" aria-hidden="true">
                                <FeatureIcon name={option.icon} size={18} />
                            </span>
                            <div className="breakdown-option-body">
                                <div className="breakdown-label">
                                    <span data-testid={`community-option-label-${id}-${option.id}`}>{option.label}</span>
                                    {yours && (
                                        <em data-testid={`community-option-you-${id}-${option.id}`}>
                                            <Check size={11} aria-hidden="true" /> You
                                        </em>
                                    )}
                                </div>
                                <div className="breakdown-track" aria-hidden="true">
                                    <motion.div
                                        style={{ width: `${option.percentage}%`, transformOrigin: 'left' }}
                                        initial={reduce ? false : { scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.7, delay: reduce ? 0 : 0.18 + index * 0.06, ease }}
                                    />
                                </div>
                                <span className="breakdown-count" data-testid={`community-option-count-${id}-${option.id}`}>
                                    {option.count} of {total}
                                </span>
                            </div>
                            <strong data-testid={`community-option-percent-${id}-${option.id}`}>
                                {option.percentage}
                                <small>%</small>
                            </strong>
                        </motion.div>
                    );
                })}
            </div>
            <p className="breakdown-note" data-testid={`community-note-${id}`}>
                {note}.{' '}
                {id === 'goal'
                    ? 'Percentages are rounded, so they may not total 100.'
                    : 'People could choose more than one answer, so percentages may add up to more than 100.'}
            </p>
        </div>
    );
};
