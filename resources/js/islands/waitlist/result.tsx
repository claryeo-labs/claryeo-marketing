import { ResultView } from '@/waitlist/components/result/ResultView';
import { WaitlistFrame } from '@/waitlist/components/WaitlistFrame';

/** /result in waitlist mode (views/waitlist/result). Reads the quiz result from sessionStorage. */
export default function WaitlistResult() {
    return (
        <WaitlistFrame>
            <ResultView />
        </WaitlistFrame>
    );
}
