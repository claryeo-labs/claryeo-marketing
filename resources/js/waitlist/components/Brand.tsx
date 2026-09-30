import {
    ArrowUpRight,
    ArrowRight,
    PenTool,
    Store,
    Users,
    Sprout,
    ReceiptText,
    Landmark,
    ShieldCheck,
    ChartNoAxesCombined,
    Table2,
    Layers,
    Monitor,
    Brain,
    Clock3,
    Sun,
    type LucideProps,
} from 'lucide-react';

import { Button } from '@/waitlist/components/ui/button';

// No 'use client' here on purpose: none of these need state, so they render on the server
// wherever the page they sit in is a server component.

export const Brand = ({ suffix = 'nav' }: { suffix?: string }) => (
    <a href="/" className="brand" aria-label="Claryeo home" data-testid={`brand-${suffix}`}>
        <img src="/images/waitlist/claryeo-mark.svg" alt="" />
        <span>
            claryeo<span className="brand-period">.</span>
        </span>
    </a>
);

/** `icon` in the quiz content names one of these, not an asset path. */
const ICONS: Record<string, React.ComponentType<LucideProps>> = {
    pen: PenTool,
    store: Store,
    users: Users,
    sprout: Sprout,
    receipt: ReceiptText,
    bank: Landmark,
    shield: ShieldCheck,
    chart: ChartNoAxesCombined,
    table: Table2,
    layers: Layers,
    monitor: Monitor,
    brain: Brain,
    clock: Clock3,
    sun: Sun,
};

export const FeatureIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const Icon = ICONS[name] ?? Sun;
    return <Icon {...props} strokeWidth={1.5} />;
};

export const JoinButton = ({
    children = 'Find my clarity',
    id,
    className = '',
}: {
    children?: React.ReactNode;
    id?: string;
    className?: string;
}) => (
    <Button asChild className={`pill-button ${className}`}>
        <a href="/quiz" data-testid={id}>
            {children}
            <span className="button-arrow">
                <ArrowUpRight size={18} />
            </span>
        </a>
    </Button>
);

export const Footer = () => (
    <footer className="footer wrap">
        <Brand suffix="footer" />
        <span data-testid="footer-copyright">© {new Date().getFullYear()} JLA Technologies Ltd. Claryeo is a product of JLA Technologies Ltd.</span>
        <div>
            <a href="/privacy" data-testid="footer-privacy">
                Privacy
            </a>
            <a href="/contact" data-testid="footer-contact">
                Say hello <ArrowUpRight size={13} />
            </a>
        </div>
    </footer>
);

export const TextLink = ({
    children,
    href,
    id,
}: {
    children: React.ReactNode;
    href: string;
    id?: string;
}) => (
    <a href={href} className="text-link" data-testid={id}>
        {children}
        <ArrowRight size={16} />
    </a>
);
