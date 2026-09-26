import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Brand, JoinButton } from '@/waitlist/components/Brand';

const MOBILE_LINKS: [string, string][] = [
    ['why-claryeo', 'Why Claryeo'],
    ['how-it-works', 'How it works'],
    ['questions', 'A few answers'],
];

export const Header = () => {
    const [open, setOpen] = useState(false);
    return (
        <header className="site-header wrap">
            <Brand />
            <nav className="desktop-nav" aria-label="Main navigation">
                <a href="#why-claryeo" data-testid="nav-why">
                    Why Claryeo
                </a>
                <a href="#how-it-works" data-testid="nav-how">
                    How it works
                </a>
                <a href="#questions" data-testid="nav-faq">
                    A few answers
                </a>
            </nav>
            <div className="header-actions">
                <JoinButton id="header-join" className="nav-cta">
                    Join the waitlist
                </JoinButton>
                <button
                    data-testid="mobile-menu-toggle"
                    className="mobile-menu-button"
                    onClick={() => setOpen(!open)}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                >
                    {open ? <X /> : <Menu />}
                </button>
            </div>
            {open && (
                <nav className="mobile-nav" aria-label="Mobile navigation">
                    {MOBILE_LINKS.map(([id, label]) => (
                        <a href={`#${id}`} key={id} data-testid={`mobile-nav-${id}`} onClick={() => setOpen(false)}>
                            {label}
                            <ArrowUpRight size={18} />
                        </a>
                    ))}
                </nav>
            )}
        </header>
    );
};
