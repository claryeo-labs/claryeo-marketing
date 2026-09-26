import { QuizExperience } from '@/waitlist/components/quiz/QuizExperience';
import { WaitlistFrame } from '@/waitlist/components/WaitlistFrame';

/** /quiz in waitlist mode (views/waitlist/quiz). `questions` is server-provided. */
export default function WaitlistQuiz({ questions }: { questions?: unknown }) {
    return (
        <WaitlistFrame>
            <QuizExperience questions={questions} />
        </WaitlistFrame>
    );
}
