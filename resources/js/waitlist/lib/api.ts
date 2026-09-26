import type { Answers, CommunityStats, Question, QuizResponse, WaitlistResponse } from '@/waitlist/lib/types';

/*
 * Same-origin proxies on the marketing site (WaitlistController), which relay
 * the main app's internal waitlist API. Errors carry `{ detail }`, a finished
 * human sentence the UI shows verbatim.
 */

/** The body could not be read, or did not match the contract. Same sentence either way. */
const UNREACHABLE = 'We couldn’t reach Claryeo. Please try again in a moment.';
/** A 4xx with no usable `detail`. */
const BAD_REQUEST = 'Please check your details and try again.';
/** Laravel's throttle (6/min) answers without a `detail`. */
const THROTTLED = 'That’s a few too many tries. Please wait a minute and try again.';

const TIMEOUT_MS = 15_000;

/** Returns the value when it matches the contract, otherwise null. */
type Guard<T> = (value: unknown) => value is T;

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isQuestion = (value: unknown): value is Question =>
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.multiple === 'boolean' &&
    Array.isArray(value.options) &&
    value.options.length > 0 &&
    value.options.every((option) => isObject(option) && typeof option.id === 'string' && typeof option.label === 'string');

const isQuizResponse: Guard<QuizResponse> = (value): value is QuizResponse =>
    isObject(value) && Array.isArray(value.questions) && value.questions.length > 0 && value.questions.every(isQuestion);

/** Mirrors the contract's suppression rule: `ready` is only true at `min_responses` or more. */
const isCommunityStats: Guard<CommunityStats> = (value): value is CommunityStats =>
    isObject(value) &&
    typeof value.total === 'number' &&
    (value.signups === undefined || typeof value.signups === 'number') &&
    typeof value.ready === 'boolean' &&
    typeof value.min_responses === 'number' &&
    isObject(value.categories) &&
    typeof value.updated_at === 'string' &&
    value.ready === value.total >= value.min_responses;

const isWaitlistResponse: Guard<WaitlistResponse> = (value): value is WaitlistResponse =>
    isObject(value) &&
    (value.status === 'joined' || value.status === 'already-joined') &&
    typeof value.name === 'string' &&
    isObject(value.profile) &&
    Array.isArray(value.profile.features) &&
    value.profile.features.length > 0 &&
    isObject(value.answers);

/** The API's error shape is `{ detail }` and the sentence is already human-readable. */
const detailOf = (data: unknown): string | null =>
    isObject(data) && typeof data.detail === 'string' ? data.detail : null;

const csrfToken = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

/**
 * One request. Responses are checked against the contract rather than trusted:
 * a shape the UI cannot render is a failure, not a crash halfway down the tree.
 *
 * Network failures and the 15s timeout reject with the underlying error —
 * callers read `error.name === 'TimeoutError'` to tell an abort from a refusal.
 */
const request = async <T>(path: string, guard: Guard<T>, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            // Laravel's CSRF middleware reads this on the POST.
            'X-CSRF-TOKEN': csrfToken(),
            ...options.headers,
        },
        credentials: 'same-origin',
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        throw new Error(UNREACHABLE);
    }

    if (!response.ok) {
        throw new Error(detailOf(data) ?? (response.status === 429 ? THROTTLED : BAD_REQUEST));
    }

    if (!guard(data)) throw new Error(UNREACHABLE);

    return data;
};

/** Everything the signup form collects, before the API validates it. */
export interface WaitlistRequest {
    name: string;
    email: string;
    company: string;
    consent: boolean;
    /** Honeypot: a real person never sees this field, so anything in it is a bot. */
    website: string;
    answers: Partial<Answers>;
}

export const joinWaitlist = (body: WaitlistRequest): Promise<WaitlistResponse> =>
    request('/waitlist', isWaitlistResponse, { method: 'POST', body: JSON.stringify(body) });

/** Live data: never cached, at any layer. */
export const fetchCommunity = (): Promise<CommunityStats> =>
    request('/waitlist/community', isCommunityStats, { cache: 'no-store' });

export const fetchQuiz = (): Promise<QuizResponse> => request('/waitlist/quiz', isQuizResponse);

/** For server-provided island props: the same contract check as a fetched quiz. */
export const validQuestions = (value: unknown): readonly Question[] | null =>
    isQuizResponse({ questions: value }) ? (value as readonly Question[]) : null;
