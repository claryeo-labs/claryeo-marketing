import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Mail, Phone, Send } from 'lucide-react';
import type { FC, FormEvent, ReactNode } from 'react';
import { useState } from 'react';

import { FaqAccordion } from '@/components/faq';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { contactFaqs } from '@/lib/faqs';
import { cn } from '@/lib/utils';
import { socialLinks } from '@/lib/social-links';
import { submitJson } from '@/lib/submit';

type ContactProps = {
    storeUrl?: string;
    thankYouUrl?: string;
};

const PHONE = '+234 704 351 9121';
const MESSAGE_MAX = 1000;
const ASK_EMAIL = 'hello@claryeo.com';

const CHANNELS = [
    {
        label: 'Customer support',
        body: 'Product or account questions, Monday to Friday, 9:00 AM – 5:00 PM WAT.',
    },
    {
        label: 'Feedback & ideas',
        body: 'Tell us what would make Claryeo work better for how you run your business.',
    },
    {
        label: 'Media & partnerships',
        body: 'Press, podcasts and partnership enquiries reach the founding team directly.',
    },
];


/** Leading icon inside a field; the input carries the matching pl-10. */
const WithIcon: FC<{
    icon: LucideIcon;
    className?: string;
    children: ReactNode;
}> = ({ icon: Icon, className, children }) => (
    <div className={cn('relative', className)}>
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
    </div>
);

/**
 * Faithful port of the main app's contact page (resources/js/pages/contact).
 * The Inertia <Form> is replaced with a fetch submit to the marketing proxy
 * route, which forwards to the main app's internal API; on success we navigate
 * to the thank-you page (mirroring the server redirect).
 */
const Contact: FC<ContactProps> = ({
    storeUrl = '/contact',
    thankYouUrl = '/contact/thank-you',
}) => {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    // Its own state, not the form's: both boxes are on screen at once, so
    // sharing one value let the FAQ box silently overwrite an address the
    // user had already typed into the form above.
    const [faqEmail, setFaqEmail] = useState('');

    // FAQ email box: hand the question straight to the visitor's mail client.
    // Their typed address rides along in the body, since the From: their client
    // sends from is not necessarily the one they want the reply on.
    // encodeURIComponent, not URLSearchParams: the latter encodes spaces as "+",
    // which mail clients paste literally into the subject line.
    const askHref = ((): string => {
        const query = [`subject=${encodeURIComponent('Question for Claryeo')}`];

        if (faqEmail) {
            query.push(`body=${encodeURIComponent(`\n\nReply to: ${faqEmail}`)}`);
        }

        return `mailto:${ASK_EMAIL}?${query.join('&')}`;
    })();

    const onSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const body = Object.fromEntries(
            new FormData(event.currentTarget).entries(),
        );
        const result = await submitJson(storeUrl, body);

        if (result.ok) {
            window.location.href = thankYouUrl;
            return;
        }

        setProcessing(false);

        if (result.status === 422) {
            setErrors(result.errors);
            return;
        }

        setErrors({
            message: ['Something went wrong. Please try again in a moment.'],
        });
    };

    return (
        <>
            <section className="relative overflow-hidden border-b border-border/60 bg-primary/[0.06]">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-violet-bright/10 blur-3xl" />
                    <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-bright/10 blur-3xl" />
                </div>

                <div className="relative mx-auto grid w-full max-w-[1180px] items-start gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1fr_27rem] lg:gap-16">
                    <div>
                        <p className="t-eyebrow text-primary">Contact</p>
                        <h1 className="t-display-1 mt-4">Contact Us</h1>
                        <p className="t-lead mt-5 max-w-xl text-muted-foreground">
                            Email us, or complete the form to learn how Claryeo
                            can support your invoicing, expense tracking, and
                            tax workflows.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                            <a
                                href="mailto:hello@claryeo.com"
                                className="group inline-flex items-center gap-1.5 text-lg font-medium text-foreground underline-offset-4 hover:underline"
                            >
                                hello@claryeo.com
                                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                            <a
                                href={`tel:${PHONE.replace(/\s/g, '')}`}
                                className="inline-flex items-center gap-2 text-lg font-medium text-foreground underline-offset-4 hover:underline"
                            >
                                <Phone className="size-4 text-muted-foreground" />
                                {PHONE}
                            </a>
                            <span className="text-sm text-muted-foreground">
                                Replies within one business day
                            </span>
                        </div>

                        <div className="mt-12 grid gap-8 text-sm sm:grid-cols-3">
                            {CHANNELS.map((channel) => (
                                <div
                                    key={channel.label}
                                    className="border-t border-border pt-5"
                                >
                                    <h2 className="t-eyebrow text-foreground">
                                        {channel.label}
                                    </h2>
                                    <p className="mt-3 text-muted-foreground">
                                        {channel.body}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Claryeo on ${social.label}`}
                                    className="rounded-full border border-border/70 bg-card p-2.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                                >
                                    <svg
                                        className="size-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            fill="currentColor"
                                            d={social.path}
                                        />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-xl shadow-primary/5 md:p-8 lg:sticky lg:top-20">
                        <h2 className="t-display-3">Get in Touch</h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            You can reach us any time.
                        </p>

                        <form
                            onSubmit={onSubmit}
                            className="mt-8 flex flex-col gap-5"
                            noValidate
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="first_name"
                                        className="text-sm font-medium text-foreground"
                                    >
                                        First name
                                    </label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        placeholder="Jane"
                                        autoComplete="given-name"
                                        className="h-11 rounded-xl border-border bg-background"
                                    />
                                    <InputError
                                        message={errors.first_name?.[0]}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="last_name"
                                        className="text-sm font-medium text-foreground"
                                    >
                                        Last name
                                    </label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        placeholder="Doe"
                                        autoComplete="family-name"
                                        className="h-11 rounded-xl border-border bg-background"
                                    />
                                    <InputError
                                        message={errors.last_name?.[0]}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Email
                                    <span className="text-primary"> *</span>
                                </label>
                                <WithIcon icon={Mail}>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@company.com"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="h-11 rounded-xl border-border bg-background pl-10"
                                    />
                                </WithIcon>
                                <InputError message={errors.email?.[0]} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Phone
                                    <span className="text-muted-foreground">
                                        {' '}
                                        (optional)
                                    </span>
                                </label>
                                <WithIcon icon={Phone}>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="+234 800 000 0000"
                                        autoComplete="tel"
                                        className="h-11 rounded-xl border-border bg-background pl-10"
                                    />
                                </WithIcon>
                                <InputError message={errors.phone?.[0]} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="message"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Message
                                    <span className="text-primary"> *</span>
                                </label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="How can we help?"
                                    required
                                    maxLength={MESSAGE_MAX}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    aria-describedby="message-counter"
                                    className="min-h-36 resize-none rounded-xl border-border bg-background"
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <InputError message={errors.message?.[0]} />
                                    <span
                                        id="message-counter"
                                        aria-live="polite"
                                        className="t-mono ml-auto shrink-0 text-xs text-muted-foreground"
                                    >
                                        {message.length}/{MESSAGE_MAX}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                                className="bg-gradient-primary mt-1 h-11 w-full rounded-xl text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        Send message
                                        <Send className="size-4" />
                                    </>
                                )}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                                By contacting us, you agree to our{' '}
                                <a
                                    href="/terms"
                                    className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
                                >
                                    Terms of service
                                </a>{' '}
                                and{' '}
                                <a
                                    href="/privacy"
                                    className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
                                >
                                    Privacy policy
                                </a>
                                .
                            </p>
                        </form>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 md:px-6 md:py-24">
                <div className="mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
                    <div>
                        <p className="t-eyebrow text-muted-foreground">FAQ</p>
                        <h2 className="t-display-3 mt-3 text-balance">
                            Do you have any <em>questions</em> for us?
                        </h2>
                        <p className="mt-4 text-muted-foreground">
                            If there is something you want to ask, leave your
                            email and we will answer it.
                        </p>

                        {/* ponytail: no second endpoint. Ask opens the visitor's
                            own mail client, so the reply thread lives in their
                            inbox rather than a form they cannot follow up on. */}
                        <div className="mt-6 flex max-w-md items-center gap-3">
                            <WithIcon icon={Mail} className="flex-1">
                                <Input
                                    type="email"
                                    value={faqEmail}
                                    onChange={(e) => setFaqEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    aria-label="Your email"
                                    className="h-11 w-full rounded-full border-border bg-background pr-5 pl-10"
                                />
                            </WithIcon>
                            <Button
                                asChild
                                className="bg-gradient-primary h-11 shrink-0 rounded-full px-6 text-sm font-medium text-primary-foreground"
                            >
                                <a href={askHref}>Ask</a>
                            </Button>
                        </div>
                    </div>

                    <FaqAccordion items={contactFaqs} />
                </div>
            </section>
        </>
    );
};

export default Contact;
