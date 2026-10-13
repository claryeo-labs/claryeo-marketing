import { ArrowUpRight } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { memo } from 'react';

import AtmosphereCanvas from '@/components/landing/atmosphere-canvas';
import { cn } from '@/lib/utils';

type CtaLink = { label: string; href: string };

type SiteCtaProps = {
    /** Plain string when the CTA is mounted as an island (props come from JSON). */
    heading: ReactNode;
    eyebrow?: string;
    body?: string;
    primary?: CtaLink;
    secondary?: CtaLink | null;
    variant?: 'dawn' | 'dusk';
    /** `bookend` is the landing page's closing moment; interior pages use `compact`. */
    size?: 'bookend' | 'compact';
    id?: string;
};

/**
 * Performance optimization: Wrap static closing CTA with React.memo() to prevent
 * unnecessary re-renders of the CTA section and its child AtmosphereCanvas element.
 * Bypasses redundant canvas draw loops and IntersectionObserver re-bindings when
 * consumed inside interactive parent pages.
 */
const SiteCta: FC<SiteCtaProps> = memo(({
    heading,
    eyebrow = 'Ready when you are',
    body,
    primary = { label: 'Get started free', href: '/get-started' },
    secondary,
    variant = 'dusk',
    size = 'compact',
    id = 'cta',
}) => (
    <section id={id} className="relative overflow-hidden bg-ink">
        <AtmosphereCanvas variant={variant} />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-transparent to-transparent" />

        <div
            className={cn(
                'relative mx-auto flex w-full max-w-[1180px] flex-col items-center px-4 text-center',
                size === 'bookend' ? 'py-24 md:py-32' : 'py-16 md:py-20',
            )}
        >
            <span className="t-eyebrow text-mist">{eyebrow}</span>
            <h2
                className={cn(
                    'mt-4 max-w-2xl text-paper',
                    size === 'bookend' ? 't-display-1' : 't-display-2',
                )}
            >
                {heading}
            </h2>
            {body && <p className="t-lead mt-5 max-w-lg text-mist">{body}</p>}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <a
                    href={primary.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink shadow-lg transition-transform hover:scale-[1.02]"
                >
                    {primary.label}
                    <ArrowUpRight className="size-4" />
                </a>
                {secondary && (
                    <a
                        href={secondary.href}
                        className="rounded-full border border-paper/20 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-paper/10"
                    >
                        {secondary.label}
                    </a>
                )}
            </div>
        </div>
    </section>
));

SiteCta.displayName = 'SiteCta';

export default SiteCta;
