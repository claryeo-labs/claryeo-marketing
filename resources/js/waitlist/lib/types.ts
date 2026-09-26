/**
 * Shapes shared with the main app's waitlist API. Copied from
 * claryeo-waitlist/packages/contracts (types.ts, questions.ts, constants.ts);
 * the questions themselves now come from GET /waitlist/quiz, so option ids
 * are plain strings here rather than literals derived from QUESTIONS.
 */

/** One selectable answer. `icon` names a FeatureIcon, not an asset path. */
export interface QuestionOption {
    readonly id: string;
    readonly label: string;
    readonly detail: string;
    readonly icon: string;
}

/** A quiz step. `max_choices` is present iff `multiple` is true. */
export interface Question {
    readonly id: QuestionId;
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly multiple: boolean;
    readonly max_choices?: number;
    readonly options: readonly QuestionOption[];
}

export type QuestionId = 'role' | 'pain' | 'tools' | 'goal';

/** `pain` is ranked: the array order is the visitor's priority order. */
export interface Answers {
    role: string;
    pain: string[];
    tools: string;
    goal: string;
}

export type FeatureId = 'invoicing' | 'banking' | 'taxes' | 'reports';

export interface Feature {
    id: FeatureId;
    title: string;
    description: string;
    label: string;
    icon: string;
}

export interface Profile {
    title: string;
    subtitle: string;
    role: string;
    tool_note: string;
    /** Always the top 3. */
    features: Feature[];
    priorities: string[];
}

/** POST /waitlist. The status code is 200 for both outcomes. */
export interface WaitlistResponse {
    status: 'joined' | 'already-joined';
    name: string;
    profile: Profile;
    answers: Answers;
}

/** The only questions whose distributions are ever published, in order. */
export const COMMUNITY_CATEGORIES = ['pain', 'goal'] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export interface CommunityOption {
    id: string;
    label: string;
    icon: string;
    count: number;
    percentage: number;
}

/** Empty object while `ready` is false. */
export type CommunityCategories = {
    [C in CommunityCategory]?: CommunityOption[];
};

/** GET /waitlist/community. Aggregate only. */
export interface CommunityStats {
    /** Consenting quiz respondents: the only rows the percentages are built from. */
    total: number;
    /** Everyone on the waitlist, including people who joined before the quiz. */
    signups?: number;
    ready: boolean;
    min_responses: number;
    categories: CommunityCategories;
    updated_at: string;
}

/** GET /waitlist/quiz. */
export interface QuizResponse {
    questions: readonly Question[];
}
