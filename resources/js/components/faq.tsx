import type { FC, ReactNode } from 'react';
import { memo } from 'react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export type FaqItem = { question: string; answer: string };

/**
 * `ink` is the landing page's dark run (see the atmosphere palette in
 * site.css); every other page uses the light semantic tokens.
 */
export type FaqTone = 'light' | 'ink';

/**
 * The site's only FAQ accordion. `not-prose` is deliberate: guides and blog
 * posts render inside .prose-claryeo, which otherwise styles the <h3> Radix
 * wraps every trigger in and blows the list apart with heading margins.
 */
/**
 * Prevent unnecessary re-renders of the static FAQ accordion subtree during state updates
 * in parent components (e.g. interactive forms like TaxCalculatorPage).
 */
export const FaqAccordion: FC<{
    items: FaqItem[];
    className?: string;
    tone?: FaqTone;
}> = memo(({ items, className, tone = 'light' }) => (
    <Accordion
        type="single"
        collapsible
        className={cn('not-prose w-full', className)}
    >
        {items.map((item, index) => (
            <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className={tone === 'ink' ? 'border-ink-border' : undefined}
            >
                <AccordionTrigger
                    className={cn(
                        'cursor-pointer text-left text-base font-medium hover:no-underline',
                        tone === 'ink' ? 'text-paper' : 'text-foreground',
                    )}
                >
                    {item.question}
                </AccordionTrigger>
                <AccordionContent
                    className={cn(
                        'text-base',
                        tone === 'ink' ? 'text-mist' : 'text-muted-foreground',
                    )}
                >
                    {item.answer}
                </AccordionContent>
            </AccordionItem>
        ))}
    </Accordion>
));

FaqAccordion.displayName = 'FaqAccordion';

/** Standalone FAQ section: eyebrow, heading, blurb, accordion. */
const FaqSection: FC<{
    items: FaqItem[];
    eyebrow?: string;
    heading?: ReactNode;
    description?: ReactNode;
    id?: string;
    className?: string;
    tone?: FaqTone;
    children?: ReactNode;
}> = memo(({
    items,
    eyebrow = 'Questions',
    heading,
    description,
    id,
    className,
    tone = 'light',
    children,
}) => (
    <section
        id={id}
        className={cn(
            tone === 'ink'
                ? 'bg-ink'
                : 'border-t border-border bg-muted/20',
            className,
        )}
    >
        <div className="mx-auto w-full max-w-3xl px-4 py-16 md:px-6 md:py-24">
            <div className="text-center">
                <span
                    className={cn(
                        't-eyebrow',
                        tone === 'ink' ? 'text-mist' : 'text-muted-foreground',
                    )}
                >
                    {eyebrow}
                </span>
                <h2
                    className={cn(
                        't-display-2 mt-3',
                        tone === 'ink' ? 'text-paper' : 'text-foreground',
                    )}
                >
                    {heading ?? (
                        <>
                            <em>Answers</em>, before you ask
                        </>
                    )}
                </h2>
                {description && (
                    <p
                        className={cn(
                            'mx-auto mt-2 max-w-xl',
                            tone === 'ink' ? 'text-mist' : 'text-muted-foreground',
                        )}
                    >
                        {description}
                    </p>
                )}
            </div>
            <FaqAccordion items={items} tone={tone} className="mt-10" />
            {children}
        </div>
    </section>
));

FaqSection.displayName = 'FaqSection';

export default FaqSection;
