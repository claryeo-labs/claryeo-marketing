import type { FC } from 'react';
import { memo } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
    {
        quote: 'Claryeo has transformed the way I manage invoicing and tax. Invoicing, expenses, and FIRS-ready summaries in one place. A game-changer for freelancers in Nigeria.',
        author: 'Shekinah T.',
        role: 'Freelance Designer',
        fallback: 'ST',
        featured: true,
    },
    {
        quote: 'Clean, simple, and tax-ready. Exactly what our small business needed. We’re rolling it out to the whole team.',
        author: 'Jonathan Y.',
        role: 'Small Business Owner',
        fallback: 'JY',
        featured: false,
    },
    {
        quote: 'Great work on the tax summaries. One of the best tools I’ve seen for Nigerian freelancers.',
        author: 'Yucel F.',
        role: 'Software Engineer',
        fallback: 'YF',
        featured: false,
    },
    {
        quote: 'Expense tracking and reports are a game-changer. Join the waitlist if you haven’t already.',
        author: 'Rodrigo A.',
        role: 'Freelancer',
        fallback: 'RA',
        featured: false,
    },
];

const avatarClass = 'size-11 border border-paper/20 bg-paper/10 font-medium text-paper';

const gradients = [
    'from-dawn/40 via-violet-bright/30 to-transparent',
    'from-violet-bright/35 via-dusk/25 to-transparent',
    'from-dusk/35 via-dawn/25 to-transparent',
];

/**
 * Performance optimization: Wrap static testimonials grid with React.memo()
 * to prevent unnecessary re-evaluations of this presentation tree during parent state
 * updates or interactivity in adjacent landing section islands.
 */
const LandingTestimonials: FC = memo(function LandingTestimonials() {
    return (
        <section id="testimonials" className="bg-ink py-16 transition-colors duration-300 md:py-32">
            <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-4 text-center">
                    <span className="t-eyebrow text-mist">
                        Testimonials
                    </span>
                    <h2 className="t-display-2 text-paper">
                        <em>Loved</em> by those who hate bookkeeping
                    </h2>
                    <p className="text-mist">
                        Claryeo brings together invoicing, expenses, and tax summaries so you can
                        focus on what you do best.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {testimonials.map((t, i) => (
                        <div
                            key={t.author}
                            className={`relative overflow-hidden rounded-2xl border border-ink-border bg-linear-to-br p-6 ${gradients[i % gradients.length]} ${i === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''}`}
                        >
                            <div className="relative flex h-full flex-col justify-between gap-8">
                                <p
                                    className={`text-paper ${i === 0 ? 'text-xl font-medium' : 'text-base'}`}
                                >
                                    {t.quote}
                                </p>
                                <div className="flex items-center gap-3">
                                    <Avatar className={avatarClass}>
                                        <AvatarFallback className="bg-transparent text-paper">
                                            {t.fallback}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="block text-sm font-medium text-paper not-italic">
                                            {t.author}
                                        </cite>
                                        <span className="block text-sm text-mist">{t.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

LandingTestimonials.displayName = 'LandingTestimonials';

export default LandingTestimonials;
