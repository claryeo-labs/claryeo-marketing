import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { ThemeToggle } from '@/waitlist/components/ThemeToggle';

/**
 * What the source's root layout wrapped every page in. Everything inside
 * .theme-surface is what light mode inverts. The toggle and the toaster stay
 * outside it: both are position:fixed, and a filtered ancestor would become
 * their containing block and leave them scrolling with the page.
 */
export const WaitlistFrame = ({ children }: { children: ReactNode }) => (
    <>
        <div className="theme-surface">
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </div>
        <ThemeToggle />
        <Toaster position="bottom-center" richColors />
    </>
);
