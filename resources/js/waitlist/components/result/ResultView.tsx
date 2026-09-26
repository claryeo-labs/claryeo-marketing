import type { Answers, CommunityStats, WaitlistResponse } from '@/waitlist/lib/types';
import { ArrowUpRight, Copy, RefreshCw, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Brand, Footer, FeatureIcon, JoinButton } from '@/waitlist/components/Brand';
import { CommunityMetrics } from '@/waitlist/components/community/CommunityMetrics';
import { Reveal } from '@/waitlist/components/Reveal';
import { Button } from '@/waitlist/components/ui/button';
import { useCommunity } from '@/waitlist/hooks/useCommunity';
import { readSession, SESSION_KEYS } from '@/waitlist/lib/session';

/** Headline count: everyone on the waitlist, or quiz respondents from an API that predates `signups`. */
const Respondents = ({ stats }: { stats: CommunityStats | null | undefined }) => {
    const signups = stats?.signups;
    const count = signups ?? stats?.total;
    const label =
        signups !== undefined
            ? count === 1 ? 'person on the waitlist' : 'people on the waitlist'
            : count === 1 ? 'person has answered so far' : 'people have answered so far';

    return (
        <div className="respondents" data-testid="community-respondents">
            <strong data-testid="community-total">{count ?? '—'}</strong>
            <span data-testid="community-total-label">{label}</span>
        </div>
    );
};

const Skeleton = () => (
    <div
        className="community-skeleton"
        role="status"
        aria-label="Loading community results"
        data-testid="community-loading"
    >
        {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-row">
                <span className="sk sk-eyebrow" />
                <span className="sk sk-number" />
                <span className="sk sk-line" />
            </div>
        ))}
    </div>
);

const ErrorState = ({ refresh }: { refresh: () => void }) => (
    <div className="community-error" role="alert" data-testid="community-error">
        <p>We couldn’t load the community results. Your place on the list is safe.</p>
        <Button onClick={refresh} data-testid="community-retry" className="pill-button">
            Try again{' '}
            <span className="button-arrow">
                <RefreshCw size={15} />
            </span>
        </Button>
    </div>
);

const EmptyResult = () => (
    <div className="result-page">
        <header className="quiz-header wrap">
            <Brand suffix="result-empty" />
        </header>
        <main className="result-empty wrap" data-testid="result-empty">
            <h1 data-testid="result-empty-title">Nothing to show yet.</h1>
            <p data-testid="result-empty-description">
                Answer five quick questions to see your Claryeo match and how your answers compare with the waitlist.
            </p>
            <JoinButton id="result-empty-start">Start the questions</JoinButton>
        </main>
        <Footer />
    </div>
);

export const ResultView = () => {
    // `undefined` until the session has been read — the server has no session, so rendering
    // the real result on the first client pass would not match the streamed HTML.
    const [result, setResult] = useState<WaitlistResponse | null | undefined>(undefined);
    const [draftAnswers, setDraftAnswers] = useState<Partial<Answers>>({});

    useEffect(() => {
        setResult(readSession<WaitlistResponse | null>(SESSION_KEYS.result, null));
        setDraftAnswers(readSession<{ answers?: Partial<Answers> }>(SESSION_KEYS.draft, {}).answers ?? {});
    }, []);

    const { stats, loading, error, refresh } = useCommunity(!!result?.profile);

    const share = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/`);
            toast.success('Link copied.');
        } catch {
            toast.error('Couldn’t copy the link. Please try again.');
        }
    };

    if (result === undefined) return null;
    if (!result?.profile) return <EmptyResult />;

    const { profile, name } = result;
    // A repeat signup keeps the answers from the first time, so the page has to stop short of
    // "you're in" — nothing was saved just now, and saying otherwise would be a small lie.
    const repeat = result.status === 'already-joined';
    const answers = result.answers ?? draftAnswers;
    const firstName = name.trim().split(/\s+/)[0] ?? name;
    const feature = profile.features[0];
    if (!feature) return <EmptyResult />;

    return (
        <div className="result-page community-result">
            <header className="quiz-header wrap">
                <Brand suffix="result" />
                <span className="quiz-header-note" data-testid="result-header-note">
                    EARLY ACCESS · {repeat ? 'ALREADY ON THE LIST' : 'YOU’RE ON THE LIST'}
                </span>
                <a href="/" data-testid="result-home" className="text-link">
                    Back to Claryeo <ArrowUpRight size={15} />
                </a>
            </header>
            <main className="community-container wrap">
                <Reveal className="community-intro">
                    <div>
                        <span className="joined-badge" data-testid="waitlist-success">
                            <Check size={12} /> {repeat ? 'ALREADY ON THE LIST' : 'YOU’RE ON THE LIST'}
                        </span>
                        <h1 data-testid="result-title">
                            {repeat ? `You’re already in, ${firstName}.` : `You’re in, ${firstName}.`}
                            <br />
                            <em>Here’s what everyone else said.</em>
                        </h1>
                        {repeat && (
                            <p className="result-repeat-note" data-testid="result-repeat-note">
                                You joined before, so we kept the answers you gave the first time round rather
                                than replacing them. We’ve sent a note to your inbox to confirm.
                            </p>
                        )}
                    </div>
                    <Respondents stats={stats} />
                </Reveal>
                <section className="community-pulse" aria-labelledby="community-heading">
                    <div className="community-section-header">
                        <h2 id="community-heading" className="eyebrow" data-testid="community-heading">
                            <span className="status-dot" /> WHAT THE WAITLIST TOLD US
                        </h2>
                        <span className="eyebrow" data-testid="community-scope">
                            THREE QUESTIONS · LIVE TOTALS
                        </span>
                    </div>
                    {!stats && loading ? (
                        <Skeleton />
                    ) : !stats ? (
                        <ErrorState refresh={refresh} />
                    ) : (
                        <CommunityMetrics stats={stats} answers={answers} />
                    )}
                    {stats && error && (
                        <div className="community-stale" role="status" data-testid="community-stale">
                            <span data-testid="community-stale-message">
                                Showing the last available responses. Live results couldn’t reconnect.
                            </span>
                            <button type="button" onClick={refresh} disabled={loading} data-testid="community-stale-retry">
                                {loading ? 'Reconnecting…' : 'Try again'} <RefreshCw size={12} aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </section>
                <Reveal className="personal-fit" data-testid="personal-fit-compact">
                    <div className="personal-fit-intro">
                        <span className="eyebrow" data-testid="recommendation-eyebrow">
                            BASED ON YOUR ANSWERS
                        </span>
                        <h2 data-testid="recommendation-intro">
                            Where Claryeo
                            <br />
                            <em>helps you first.</em>
                        </h2>
                    </div>
                    <article className="personal-fit-feature" data-testid={`recommendation-${feature.id}`}>
                        <div className="personal-fit-icon">
                            <FeatureIcon name={feature.icon} size={23} />
                        </div>
                        <div>
                            <span className="eyebrow" data-testid="recommendation-label-0">
                                YOUR TOP MATCH · {feature.label}
                            </span>
                            <h3 data-testid="recommendation-title-0">{feature.title}</h3>
                            <p data-testid="recommendation-description-0">{feature.description}</p>
                            <small data-testid="result-tool-note">{profile.tool_note}</small>
                        </div>
                    </article>
                </Reveal>
                <Reveal className="community-invite">
                    <div>
                        <span className="eyebrow" data-testid="result-next-eyebrow">
                            BRING SOMEONE ALONG
                        </span>
                        <h2 data-testid="result-next-title">
                            Know someone who’d say <em>“same”?</em>
                        </h2>
                        <p data-testid="result-next-description">
                            Send them the link. We’ll be in touch about launch and early access.
                        </p>
                    </div>
                    <Button className="pill-button" data-testid="result-share" onClick={share}>
                        Copy the link{' '}
                        <span className="button-arrow">
                            <Copy size={16} />
                        </span>
                    </Button>
                </Reveal>
                <p className="community-footnote" data-testid="result-footnote">
                    Percentages use {stats ? `all ${stats.total} completed responses` : 'all completed responses'},
                    rounded to the nearest whole number. Recommendations aren’t financial or tax advice.
                </p>
            </main>
            <Footer />
        </div>
    );
};
