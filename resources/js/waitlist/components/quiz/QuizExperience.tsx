import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, LoaderCircle, LockKeyhole, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState, type SubmitEvent } from 'react';

import { Brand } from '@/waitlist/components/Brand';
import { QuestionCard } from '@/waitlist/components/quiz/QuestionCard';
import { EMPTY_CONTACT, SignupForm, type Contact } from '@/waitlist/components/quiz/SignupForm';
import { Button } from '@/waitlist/components/ui/button';
import { fetchQuiz, joinWaitlist, validQuestions } from '@/waitlist/lib/api';
import { readSession, SESSION_KEYS, writeSession } from '@/waitlist/lib/session';
import type { Answers, Question, QuestionId } from '@/waitlist/lib/types';

const reflections = [
    'Let’s start with you.',
    'Be honest. This is the useful part.',
    'No wrong answers here.',
    'This shapes what we build first.',
    'Last question. The one that matters.',
    'Almost there. Where should we reach you?',
];

/**
 * The source hardcoded six steps; the questions now come from the API (four
 * today), so the counts are derived. The signup step always gets the last
 * reflection and the final question the one before it.
 */
const reflectionFor = (step: number, lastStep: number): string => {
    const last = reflections.length - 1;
    if (step >= lastStep) return reflections[last] ?? '';
    if (step === lastStep - 1) return reflections[last - 1] ?? '';
    return reflections[Math.min(step, last - 2)] ?? '';
};

const STEP_WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];

const go = (path: string) => window.location.assign(path);

const TIMED_OUT = 'This is taking longer than expected. Your answers are safe. Please try again.';
const GENERIC = 'Please check your details and try again.';

interface Draft {
    step?: number;
    answers?: Partial<Answers>;
}

/**
 * Questions arrive as island props (server-fetched, cached) and fall back to
 * GET /waitlist/quiz when those are missing.
 */
export const QuizExperience = ({ questions: initial }: { questions?: unknown }) => {
    const [questions, setQuestions] = useState<readonly Question[] | null>(() => validQuestions(initial));
    const [failed, setFailed] = useState(false);

    const load = useCallback(() => {
        setFailed(false);
        fetchQuiz()
            .then((quiz) => setQuestions(quiz.questions))
            .catch(() => setFailed(true));
    }, []);

    useEffect(() => {
        if (!questions) load();
    }, [questions, load]);

    if (questions) return <Conversation questions={questions} />;

    return (
        <QuizShell>
            {failed ? (
                <div className="quiz-load-error" role="alert" data-testid="quiz-load-error">
                    <p>We couldn’t load the questions. Please try again in a moment.</p>
                    <Button className="pill-button" onClick={load} data-testid="quiz-load-retry">
                        Try again{' '}
                        <span className="button-arrow">
                            <RefreshCw size={15} />
                        </span>
                    </Button>
                </div>
            ) : (
                <div className="quiz-loading" role="status" aria-label="Loading the questions" data-testid="quiz-loading">
                    <LoaderCircle className="spin" size={22} />
                </div>
            )}
        </QuizShell>
    );
};

const QuizHeader = ({ note }: { note: string }) => (
    <header className="quiz-header wrap">
        <Brand suffix="quiz" />
        <span className="quiz-header-note" data-testid="quiz-header-note">
            {note}
        </span>
        <a href="/" className="quiz-close" data-testid="quiz-close" aria-label="Save progress and return home">
            <X size={19} />
        </a>
    </header>
);

const QuizFooter = () => (
    <div className="quiz-footer wrap">
        <span data-testid="quiz-footer-note">LESS ADMIN. MORE LIFE.</span>
        <a href="/privacy" data-testid="quiz-privacy">
            How we use your answers <ArrowLeft size={11} style={{ transform: 'rotate(135deg)' }} />
        </a>
    </div>
);

const QuizShell = ({ children }: { children: React.ReactNode }) => (
    <div className="quiz-page quiz-focused">
        <QuizHeader note="ABOUT TWO MINUTES" />
        <main className="quiz-layout quiz-focus wrap" data-testid="quiz-centered-layout">
            <section className="quiz-main" aria-label="Your Claryeo conversation">
                {children}
            </section>
        </main>
        <QuizFooter />
    </div>
);

const Conversation = ({ questions }: { questions: readonly Question[] }) => {
    /** The questions plus the signup step. */
    const LAST_STEP = questions.length;
    const totalSteps = LAST_STEP + 1;
    const totalLabel = String(totalSteps).padStart(2, '0');
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<Answers>>({});
    const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // sessionStorage cannot be read while rendering: the server has no session, so reading
    // it in a state initialiser would make the first client render disagree with the HTML.
    // Restore after mount instead, and hold the save back until it has happened so the
    // default state never overwrites a real draft. The step body is gated on this too —
    // server-rendering question 1 and then animating to the saved step would show returning
    // visitors the wrong question first.
    const [restored, setRestored] = useState(false);

    useEffect(() => {
        const draft = readSession<Draft>(SESSION_KEYS.draft, {});
        setStep(Math.max(0, Math.min(LAST_STEP, Number(draft.step) || 0)));
        setAnswers(draft.answers ?? {});
        setRestored(true);
    }, []);

    useEffect(() => {
        if (restored) writeSession(SESSION_KEYS.draft, { step, answers });
    }, [restored, step, answers]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const question = questions[step];
    const goNext = () => {
        setError('');
        setStep((s) => Math.min(s + 1, LAST_STEP));
    };
    const goBack = () => {
        setError('');
        setStep((s) => Math.max(s - 1, 0));
    };
    const setAnswer = (id: QuestionId, value: string | string[]) =>
        setAnswers((current) => ({ ...current, [id]: value }) as Partial<Answers>);

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const result = await joinWaitlist({ ...contact, answers });

            writeSession(SESSION_KEYS.result, result);
            // A full page load: the result page reads the session on mount.
            // `submitting` stays on so the form cannot be sent twice meanwhile.
            go('/result');
        } catch (caught) {
            const failure = caught instanceof Error ? caught : null;
            setError(failure?.name === 'TimeoutError' ? TIMED_OUT : (failure?.message ?? GENERIC));
            setSubmitting(false);
        }
    };

    return (
        <div className="quiz-page quiz-focused">
            <QuizHeader note={`${STEP_WORDS[totalSteps] ?? totalSteps} STEPS · ABOUT TWO MINUTES`} />
            <main className="quiz-layout quiz-focus wrap" data-testid="quiz-centered-layout">
                <section className="quiz-main" aria-label="Your Claryeo conversation">
                    <div className="quiz-progress-top">
                        <span className="eyebrow" data-testid="quiz-step-label">
                            {String(step + 1).padStart(2, '0')} <span className="muted">/ {totalLabel}</span>
                        </span>
                        <span className="eyebrow" data-testid="quiz-progress-label">
                            {step === LAST_STEP ? 'LAST STEP' : 'ABOUT TWO MINUTES'}
                        </span>
                    </div>
                    <div
                        className="quiz-progress-track"
                        role="progressbar"
                        aria-label="Quiz progress"
                        aria-valuenow={step + 1}
                        aria-valuemin={0}
                        aria-valuemax={totalSteps}
                        data-testid="quiz-progress-bar"
                    >
                        <motion.div animate={{ width: `${((step + 1) / totalSteps) * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <AnimatePresence mode="wait">
                        {restored && (
                            <motion.div
                                key={step}
                                className="question-content"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.32 }}
                            >
                                <div className="conversation-speaker">
                                    <img src="/images/waitlist/claryeo-mark.svg" alt="" />
                                    <span data-testid={`quiz-reflection-${step}`}>{reflectionFor(step, LAST_STEP)}</span>
                                </div>
                                {question ? (
                                    <QuestionCard
                                        question={question}
                                        value={answers[question.id]}
                                        onChange={(value) => setAnswer(question.id, value)}
                                        onNext={goNext}
                                    />
                                ) : (
                                    <SignupForm
                                        contact={contact}
                                        setContact={setContact}
                                        onSubmit={submit}
                                        submitting={submitting}
                                        error={error}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="quiz-bottom">
                        <button
                            className="quiz-back"
                            data-testid="quiz-back"
                            disabled={submitting}
                            onClick={step === 0 ? () => go('/') : goBack}
                        >
                            <ArrowLeft size={14} />
                            {step === 0 ? 'Back to home' : 'Back'}
                        </button>
                        <span data-testid="quiz-saved-note">
                            <LockKeyhole size={11} /> Your answers are saved in this tab.
                        </span>
                    </div>
                </section>
            </main>
            <QuizFooter />
        </div>
    );
};
