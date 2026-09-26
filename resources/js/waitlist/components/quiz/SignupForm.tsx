import { ArrowUpRight, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useEffect, useRef, type ChangeEvent, type Dispatch, type SetStateAction, type SubmitEvent } from 'react';

import { Button } from '@/waitlist/components/ui/button';
import { Input } from '@/waitlist/components/ui/input';

/** The signup step's own state. `website` is the honeypot and must stay empty. */
export interface Contact {
    name: string;
    email: string;
    company: string;
    consent: boolean;
    website: string;
}

export const EMPTY_CONTACT: Contact = {
    name: '',
    email: '',
    company: '',
    consent: false,
    website: '',
};

export interface SignupFormProps {
    contact: Contact;
    setContact: Dispatch<SetStateAction<Contact>>;
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
    submitting: boolean;
    error: string;
}

export const SignupForm = ({ contact, setContact, onSubmit, submitting, error }: SignupFormProps) => {
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
    }, []);

    const update = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, checked } = e.target;
        setContact((c) => ({ ...c, [name]: type === 'checkbox' ? checked : value }));
    };

    const ready =
        contact.name.trim().length >= 2 &&
        contact.company.trim().length >= 2 &&
        !!contact.email.trim() &&
        contact.consent;

    return (
        <>
            <span className="question-eyebrow" data-testid="signup-eyebrow">
                LAST STEP
            </span>
            <h1 className="question-title signup-title" data-testid="signup-title" tabIndex={-1} ref={heading}>
                Where should we
                <br />
                send early access?
            </h1>
            <p className="question-description" data-testid="signup-description">
                Save your place. Then see how your answers compare with everyone else’s.
            </p>
            <form onSubmit={onSubmit} className="signup-form" data-testid="signup-form">
                <div className="form-field">
                    <label htmlFor="signup-name" data-testid="signup-name-label">
                        Name
                    </label>
                    <Input
                        id="signup-name"
                        name="name"
                        autoComplete="name"
                        placeholder="Your name"
                        value={contact.name}
                        onChange={update}
                        required
                        minLength={2}
                        maxLength={100}
                        disabled={submitting}
                        data-testid="signup-name"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="signup-email" data-testid="signup-email-label">
                        Email
                    </label>
                    <Input
                        id="signup-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@yourbusiness.com"
                        value={contact.email}
                        onChange={update}
                        required
                        maxLength={254}
                        disabled={submitting}
                        data-testid="signup-email"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="signup-company" data-testid="signup-company-label">
                        Business name
                    </label>
                    <Input
                        id="signup-company"
                        name="company"
                        autoComplete="organization"
                        placeholder="Your business"
                        value={contact.company}
                        onChange={update}
                        required
                        minLength={2}
                        maxLength={150}
                        disabled={submitting}
                        data-testid="signup-company"
                        aria-describedby="company-hint"
                    />
                    <p id="company-hint" data-testid="company-hint">
                        Freelancing? Your own name works.
                    </p>
                </div>
                {/* Honeypot: visually removed, not `display:none`, so bots still fill it in. */}
                <div className="honeypot" aria-hidden="true">
                    <label htmlFor="signup-website">Leave this empty</label>
                    <input
                        id="signup-website"
                        name="website"
                        value={contact.website}
                        onChange={update}
                        tabIndex={-1}
                        autoComplete="off"
                        data-testid="signup-website"
                    />
                </div>
                <label className="consent-label" data-testid="signup-consent-label">
                    <input
                        type="checkbox"
                        name="consent"
                        checked={contact.consent}
                        onChange={update}
                        required
                        disabled={submitting}
                        data-testid="signup-consent"
                    />
                    <span>
                        Email me about launch and early access. Here’s how we use your details:{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" data-testid="signup-privacy-link">
                            privacy notice
                        </a>
                        .
                    </span>
                </label>
                {error && (
                    <p role="alert" className="form-error" data-testid="signup-error">
                        {error}
                    </p>
                )}
                <Button
                    type="submit"
                    className="pill-button signup-submit"
                    disabled={!ready || submitting}
                    data-testid="signup-submit"
                >
                    {submitting ? (
                        <>
                            <LoaderCircle className="spin" size={17} /> Saving your place…
                        </>
                    ) : (
                        <>
                            Save my place and see results{' '}
                            <span className="button-arrow">
                                <ArrowUpRight size={18} />
                            </span>
                        </>
                    )}
                </Button>
                <div className="signup-security" data-testid="signup-security">
                    <LockKeyhole size={11} /> Your details stay private. Only anonymous totals are shared.
                </div>
            </form>
        </>
    );
};
