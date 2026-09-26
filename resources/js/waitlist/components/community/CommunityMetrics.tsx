import {
    COMMUNITY_CATEGORIES,
    type Answers,
    type CommunityCategory,
    type CommunityStats,
} from '@/waitlist/lib/types';
import { LayoutGroup } from 'framer-motion';
import { useState } from 'react';

import { QuestionStat } from '@/waitlist/components/community/QuestionStat';

const EarlyState = ({ stats }: { stats: CommunityStats }) => (
    <div className="community-early" data-testid="community-early-state">
        <div className="early-copy">
            <span className="eyebrow" data-testid="early-kicker">
                EARLY DAYS
            </span>
            <h3 data-testid="early-title">The picture fills in at {stats.min_responses} people.</h3>
            <p data-testid="early-description">
                You’re one of the first. Once {stats.min_responses} people have answered, we’ll show how the waitlist
                answered the three questions that matter most.
            </p>
        </div>
        <div className="early-progress-wrap">
            <div
                className="early-progress"
                role="progressbar"
                aria-label="Answers until community results unlock"
                aria-valuenow={stats.total}
                aria-valuemin={0}
                aria-valuemax={stats.min_responses}
                data-testid="early-progress"
            >
                <span style={{ width: `${Math.min((stats.total / stats.min_responses) * 100, 100)}%` }} />
            </div>
            <span className="early-progress-note" data-testid="early-progress-note">
                {stats.total} of {stats.min_responses} so far
            </span>
        </div>
    </div>
);

/** A single-choice answer and a multi-choice answer both become a list of picked ids. */
const toPicks = (answer: string | readonly string[] | undefined): readonly string[] =>
    answer === undefined ? [] : Array.isArray(answer) ? answer : [answer as string];

export const CommunityMetrics = ({
    stats,
    answers,
}: {
    stats: CommunityStats;
    answers: Partial<Answers>;
}) => {
    const [active, setActive] = useState<CommunityCategory | null>(null);
    if (!stats.ready) return <EarlyState stats={stats} />;
    const toggle = (id: CommunityCategory) => setActive((current) => (current === id ? null : id));
    return (
        <LayoutGroup id="community-cards">
            <div
                className={`stat-cards ${active ? 'has-expanded-card' : ''}`}
                data-active={active ?? 'none'}
                data-testid="community-live-metrics"
            >
                {COMMUNITY_CATEGORIES.map((id, i) => {
                    const options = stats.categories[id];
                    if (!options?.length) return null;
                    return (
                        <QuestionStat
                            key={id}
                            id={id}
                            options={options}
                            total={stats.total}
                            picks={toPicks(answers[id])}
                            open={active === id}
                            compact={!!active && active !== id}
                            onToggle={toggle}
                            delay={i * 0.07}
                        />
                    );
                })}
            </div>
        </LayoutGroup>
    );
};
