import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';

import AppearanceToggle from '@/islands/appearance-toggle';
import { cn } from '@/lib/utils';

type NavLink = { label: string; href: string };
type ResourceColumn = { title: string; links: NavLink[] };
type SupportLink = { label: string; href: string; desc?: string };
type FeatureItem = {
    eyebrow: string;
    title: string;
    tagline: string;
    href: string;
    badge?: string | null;
};

type SiteNavProps = {
    appUrl?: string;
    primary?: NavLink[];
    features?: { lead?: NavLink; items?: FeatureItem[] };
    resources?: {
        lead?: NavLink;
        columns?: ResourceColumn[];
        support?: SupportLink[];
    };
    waitlistMode?: boolean;
    cta?: { label: string; href: string };
    /** 'dark' sits the header over a full-bleed dark hero (landing only): transparent at the top, glass once scrolled. */
    theme?: 'light' | 'dark';
};

type MenuKey = 'features' | 'resources';

const LIGHT_HEADER_CLASS =
    'sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur transition-colors duration-300 supports-backdrop-filter:bg-background/60';

const SiteNav: FC<SiteNavProps> = ({
    appUrl = '',
    primary = [],
    features = {},
    resources = {},
    waitlistMode = false,
    cta = { label: 'Get started', href: '/get-started' },
    theme = 'light',
}) => {
    const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark';

    const linkClass = isDark
        ? 'text-sm text-paper/80 transition-colors hover:text-paper'
        : 'text-sm text-muted-foreground transition-colors hover:text-foreground';

    // In waitlist mode, pricing/get-started links are removed from the menus.
    const hidden = waitlistMode ? ['/pricing', '/get-started'] : [];
    const visible = (href: string): boolean => !hidden.includes(href);

    const featureItems = features.items ?? [];
    const featureLead = features.lead;
    const columns = (resources.columns ?? []).map((col) => ({
        ...col,
        links: col.links.filter((l) => visible(l.href)),
    }));
    const support = (resources.support ?? []).filter((s) => visible(s.href));
    const resourcesLead = resources.lead;
    const loginHref = `${appUrl}/login`;

    // Close any open menu on Escape; close the mobile sheet when crossing to md.
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                setOpenMenu(null);
                setMobileOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);

        const mq = window.matchMedia('(min-width: 768px)');
        const onChange = (): void => {
            if (mq.matches) {
                setMobileOpen(false);
            }
        };
        mq.addEventListener('change', onChange);

        return () => {
            document.removeEventListener('keydown', onKey);
            mq.removeEventListener('change', onChange);
        };
    }, []);

    // Lock body scroll while the mobile sheet is open.
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    // Dark-hero pages (landing): header starts transparent over the hero
    // atmosphere and picks up a glass backdrop once scrolled past it.
    useEffect(() => {
        if (!isDark) return;

        const onScroll = (): void => setScrolled(window.scrollY > 32);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isDark]);

    // The header's own background/border live on the <header> ancestor
    // (server-rendered in the Antlers shell); this island takes over that
    // styling once mounted so it can react to theme + scroll.
    useEffect(() => {
        const header = rootRef.current?.closest('header');
        if (!header) return;

        // An open drawer makes the header opaque ink so bar and panel read as
        // one surface; otherwise transparent over the hero until scrolled.
        header.className = isDark
            ? cn(
                  'sticky top-0 z-50 -mb-14 w-full transition-colors duration-300',
                  openMenu || mobileOpen
                      ? 'border-b border-transparent bg-ink'
                      : scrolled
                        ? 'border-b border-paper/10 bg-ink/80 backdrop-blur-md'
                        : 'border-b border-transparent bg-transparent',
              )
            : LIGHT_HEADER_CLASS;
    }, [isDark, scrolled, openMenu, mobileOpen]);

    const open = (key: MenuKey): void => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
        }
        setOpenMenu(key);
    };

    const scheduleClose = (): void => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
        }
        closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
    };

    // ponytail: ink/paper tokens flip with the appearance, so the dark-theme
    // drawer just reuses bg-ink — the same surface the header sits on.
    const panelClass = cn(
        'absolute inset-x-0 top-full hidden border-b shadow-xl md:block',
        isDark
            ? 'border-ink-border bg-ink'
            : 'border-border bg-background/98 backdrop-blur',
    );

    const trigger = (key: MenuKey, label: string) => (
        <div
            className="flex items-center"
            onMouseEnter={() => open(key)}
            onMouseLeave={scheduleClose}
        >
            <button
                type="button"
                aria-expanded={openMenu === key}
                aria-controls={`site-nav-panel-${key}`}
                onClick={() => setOpenMenu((v) => (v === key ? null : key))}
                className={cn(
                    'flex items-center gap-1 text-sm transition-colors',
                    isDark
                        ? openMenu === key
                            ? 'text-paper'
                            : 'text-paper/80 hover:text-paper'
                        : openMenu === key
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                )}
            >
                {label}
                <ChevronDown
                    className={cn(
                        'size-4 transition-transform',
                        openMenu === key && 'rotate-180',
                    )}
                />
            </button>
        </div>
    );

    return (
        <div ref={rootRef} className="w-full">
            <nav className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-4 md:px-0">
                <a
                    href="/"
                    className="flex items-center gap-3 transition-opacity hover:opacity-90"
                >
                    <img
                        src="/favicon.svg"
                        alt="Claryeo"
                        className="h-7 w-auto dark:invert"
                    />
                    <span
                        className={cn(
                            'text-lg font-semibold tracking-tight',
                            isDark ? 'text-paper' : 'text-foreground',
                        )}
                    >
                        Claryeo
                    </span>
                </a>

                <div className="hidden items-center gap-8 md:flex">
                    {featureItems.length > 0 && trigger('features', 'Features')}
                    {primary.map((item) => (
                        <a key={item.label} href={item.href} className={linkClass}>
                            {item.label}
                        </a>
                    ))}
                    {columns.length > 0 && trigger('resources', 'Resources')}
                </div>

                <div className="flex items-center gap-2">
                    <AppearanceToggle className={cn('shrink-0', isDark && 'text-paper')} />
                    <div className="hidden items-center gap-2 md:flex">
                        {!waitlistMode && (
                            <a
                                href={loginHref}
                                className={cn(
                                    'rounded-full px-4 py-2 text-sm transition-colors',
                                    isDark
                                        ? 'text-paper/80 hover:bg-paper/10 hover:text-paper'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                Log in
                            </a>
                        )}
                        <a
                            href={cta.href}
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-opacity hover:opacity-90',
                                isDark
                                    ? 'bg-paper text-ink'
                                    : 'bg-gradient-primary text-primary-foreground',
                            )}
                        >
                            {cta.label}
                        </a>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-expanded={mobileOpen}
                        aria-controls="site-nav-mobile-menu"
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        className={cn(
                            'inline-flex items-center justify-center rounded-full border p-2.5 transition-colors md:hidden',
                            isDark
                                ? 'border-paper/15 bg-paper/5 text-paper hover:bg-paper/10'
                                : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted/70',
                        )}
                    >
                        {mobileOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Features mega-menu */}
            {openMenu === 'features' && featureItems.length > 0 && (
                <div
                    id="site-nav-panel-features"
                    role="region"
                    aria-label="Features navigation"
                    className={panelClass}
                    onMouseEnter={() => open('features')}
                    onMouseLeave={scheduleClose}
                >
                    <div className="mx-auto w-full max-w-[1180px] px-4 py-9 md:px-0">
                        {featureLead && (
                            <a
                                href={featureLead.href}
                                className="t-eyebrow group inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {featureLead.label}
                                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        )}
                        <div className="mt-5 grid gap-x-10 sm:grid-cols-2">
                            {featureItems.map((item, i) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'group flex items-start justify-between gap-4 border-border py-5',
                                        i >= 2 && 'border-t',
                                    )}
                                >
                                    <div className="min-w-0">
                                        <span className="t-label text-muted-foreground">
                                            {item.eyebrow}
                                        </span>
                                        <div className="mt-1.5 flex items-baseline gap-2">
                                            <span className="t-display-4 text-foreground">
                                                {item.title}
                                            </span>
                                            {item.badge && (
                                                <span className="t-label rounded-full bg-primary-surface px-2 py-0.5 text-primary-surface-foreground">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1.5 text-sm text-muted-foreground">
                                            {item.tagline}
                                        </p>
                                    </div>
                                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Resources mega-menu */}
            {openMenu === 'resources' && columns.length > 0 && (
                <div
                    id="site-nav-panel-resources"
                    role="region"
                    aria-label="Resources navigation"
                    className={panelClass}
                    onMouseEnter={() => open('resources')}
                    onMouseLeave={scheduleClose}
                >
                    <div className="mx-auto w-full max-w-[1180px] px-4 py-9 md:px-0">
                        {resourcesLead && (
                            <a
                                href={resourcesLead.href}
                                className="t-eyebrow group inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {resourcesLead.label}
                                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        )}

                        <div className="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {columns.map((col) => (
                                <div key={col.title}>
                                    <p className="t-label text-muted-foreground">
                                        {col.title}
                                    </p>
                                    <ul className="mt-3 flex flex-col gap-2.5">
                                        {col.links.map((link) => (
                                            <li key={link.label}>
                                                <a
                                                    href={link.href}
                                                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                                >
                                                    {link.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {support.length > 0 && (
                            <div className="mt-8 border-t border-border pt-6">
                                <p className="t-label text-muted-foreground">
                                    Support
                                </p>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {support.map((item) => (
                                        <a
                                            key={item.label}
                                            href={item.href}
                                            className="flex min-w-52 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent"
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary-surface text-primary-surface-foreground">
                                                <ArrowUpRight className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {item.label}
                                                </p>
                                                {item.desc && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.desc}
                                                    </p>
                                                )}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile sheet */}
            {mobileOpen && (
                <div
                    id="site-nav-mobile-menu"
                    role="region"
                    aria-label="Mobile navigation menu"
                    className={cn(
                        'absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b px-4 pb-8 shadow-2xl md:hidden',
                        isDark
                            ? 'border-ink-border bg-ink'
                            : 'border-border bg-background',
                    )}
                >
                    <div className="flex flex-col gap-6 py-6">
                        <div className="flex flex-col gap-4">
                            {primary.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="text-base font-medium text-foreground"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        {featureItems.length > 0 && (
                            <div>
                                <p className="t-eyebrow text-muted-foreground">
                                    Features
                                </p>
                                <ul className="mt-3 flex flex-col gap-3">
                                    {featureItems.map((item) => (
                                        <li key={item.href}>
                                            <a
                                                href={item.href}
                                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                            >
                                                {item.title}
                                                {item.badge && (
                                                    <span className="t-label rounded-full bg-primary-surface px-2 py-0.5 text-primary-surface-foreground">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {columns.map((col) => (
                            <div key={col.title}>
                                <p className="t-eyebrow text-muted-foreground">
                                    {col.title}
                                </p>
                                <ul className="mt-3 flex flex-col gap-3">
                                    {col.links.map((link) => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                className="text-sm text-muted-foreground"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        <div className="flex flex-col gap-3 border-t border-border pt-6">
                            {!waitlistMode && (
                                <a
                                    href={loginHref}
                                    className="text-center text-base font-medium text-foreground"
                                >
                                    Log in
                                </a>
                            )}
                            <a
                                href={cta.href}
                                className="bg-gradient-primary rounded-xl px-6 py-3 text-center text-sm font-medium text-primary-foreground shadow-sm"
                            >
                                {cta.label}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteNav;
