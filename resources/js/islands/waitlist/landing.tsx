import { Landing } from '@/waitlist/components/landing/Landing';
import { WaitlistFrame } from '@/waitlist/components/WaitlistFrame';

/** Waitlist landing page, served at / in waitlist mode (views/waitlist/landing). */
export default function WaitlistLanding() {
    return (
        <WaitlistFrame>
            <Landing />
        </WaitlistFrame>
    );
}
