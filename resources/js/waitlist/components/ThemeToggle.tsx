import { animate } from 'animejs';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** What the visitor chose. `system` defers to the OS and keeps following it. */
export type ThemeMode = 'dark' | 'light' | 'system';
/** What actually gets painted. */
type Theme = 'dark' | 'light';

/** Read by the inline script in the root layout too — keep the two in step. */
export const THEME_STORAGE_KEY = 'claryeo-theme';

/** Must match the hold animation on the view-transition pseudo-elements in index.css. */
const WIPE_MS = 620;

/** The button cycles in this order. */
const CYCLE: ThemeMode[] = ['dark', 'light', 'system'];

const ICONS: Record<ThemeMode, typeof Sun> = { dark: Moon, light: Sun, system: Monitor };
const LABELS: Record<ThemeMode, string> = { dark: 'Dark', light: 'Light', system: 'System' };

type ViewTransitionDocument = Document & {
    startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

const systemQuery = () => window.matchMedia('(prefers-color-scheme: light)');

const resolveTheme = (mode: ThemeMode): Theme =>
    mode === 'system' ? (systemQuery().matches ? 'light' : 'dark') : mode;

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Distance from the origin to the furthest viewport corner — how far the circle must grow. */
const radiusToCover = (x: number, y: number) =>
    Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

const storedMode = (): ThemeMode => {
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY);
        return raw === 'dark' || raw === 'light' ? raw : 'system';
    } catch {
        return 'system';
    }
};

/**
 * Inverts the whole page rather than maintaining a second palette: the button sets
 * `data-theme` on <html>, and one CSS filter does the rest. See index.css.
 *
 * It sits outside the inverted surface, which is what lets it be `position: fixed` — a
 * filtered ancestor becomes the containing block for fixed descendants, so anything inside
 * the surface would scroll instead of sticking.
 */
export const ThemeToggle = () => {
    const [mode, setMode] = useState<ThemeMode>('system');
    const [busy, setBusy] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const iconRef = useRef<HTMLSpanElement>(null);

    // The inline script has already resolved the theme by first paint; adopt its decision
    // rather than making it again, or the button would show the wrong icon until first click.
    useEffect(() => setMode(storedMode()), []);

    // Only while following the OS: a theme change out there has to land here too.
    useEffect(() => {
        if (mode !== 'system') return;
        const query = systemQuery();
        // No wipe — the visitor did not press anything, so an animation would come from nowhere.
        const onChange = () => {
            document.documentElement.dataset.theme = resolveTheme('system');
        };
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, [mode]);

    const persist = (next: ThemeMode) => {
        document.documentElement.dataset.theme = resolveTheme(next);
        setMode(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Private browsing, or storage disabled. The choice still applies for this page view.
        }
    };

    const cycle = () => {
        if (busy) return;
        const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length] as ThemeMode;
        const button = buttonRef.current;
        const icon = iconRef.current;
        const { startViewTransition } = document as ViewTransitionDocument;

        if (icon && !prefersReducedMotion()) {
            // The icon turns on every press, including the ones that do not repaint the page —
            // stepping from light to system on a light machine still has to feel like something.
            animate(icon, { rotate: [0, 180], scale: [1, 0.7, 1], duration: 460, ease: 'outBack' });
        }

        const current: Theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

        // Light -> System on a light machine paints the same pixels; wiping between two identical
        // frames is a wasted 620ms.
        if (!button || !startViewTransition || prefersReducedMotion() || resolveTheme(next) === current) {
            persist(next);
            return;
        }

        const { left, top, width, height } = button.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const root = document.documentElement;
        root.style.setProperty('--theme-wipe-x', `${x}px`);
        root.style.setProperty('--theme-wipe-y', `${y}px`);
        root.style.setProperty('--theme-wipe-r', '0px');

        setBusy(true);
        // The browser paints a snapshot of the page before the swap and one after, and the disc
        // clips the second over the first. That is what a filtered overlay could not do: it
        // inverts whatever is behind it, photographs included, so faces arrived as negatives and
        // only corrected once the swap landed. These snapshots are the real page in each theme.
        const transition = startViewTransition.call(document, () => persist(next));

        void transition.ready.then(() => {
            // The pseudo-elements carry a no-op CSS animation only to hold the transition open.
            // The radius it reads is driven here, so the easing lives with the rest of the motion.
            const disc = { r: 0 };
            animate(disc, {
                r: radiusToCover(x, y),
                duration: WIPE_MS,
                ease: 'outQuart',
                onUpdate: () => root.style.setProperty('--theme-wipe-r', `${disc.r}px`),
            });
        });

        void transition.finished.finally(() => {
            for (const property of ['--theme-wipe-x', '--theme-wipe-y', '--theme-wipe-r']) {
                root.style.removeProperty(property);
            }
            setBusy(false);
        });
    };

    const Icon = ICONS[mode];
    return (
        <button
            ref={buttonRef}
            type="button"
            className="theme-toggle"
            data-testid="theme-toggle"
            data-mode={mode}
            onClick={cycle}
            title={`Theme: ${LABELS[mode]}`}
            aria-label={`Theme: ${LABELS[mode]}. Switch to ${LABELS[CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length] as ThemeMode]}`}
        >
            <span ref={iconRef} className="theme-toggle-icon">
                <Icon size={17} />
            </span>
        </button>
    );
};
