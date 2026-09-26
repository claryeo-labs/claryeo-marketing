import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@/hooks/use-appearance';

type IslandLoader = () => Promise<{
    default: ComponentType<Record<string, unknown>>;
}>;

/**
 * Registry of engineer-owned interactive React "islands" mounted into
 * Statamic-rendered pages. A page includes:
 *
 *   <div data-island="pricing" data-props="{{ props_json }}"></div>
 *
 * and this script hydrates it with the matching component + JSON props.
 *
 * Entries are dynamic imports so each island (and its own deps — recharts,
 * gsap, animejs) is a separate chunk: a page downloads only the islands it
 * actually mounts, not the whole site. Keep them as inline `import()` calls —
 * Vite needs the literal specifier to split the graph.
 */
const registry = {
    pricing: () => import('./islands/pricing/page'),
    'contact-form': () => import('./islands/contact/page'),
    'tax-calculator': () => import('./islands/tax-calculator/page'),
    'appearance-toggle': () => import('./islands/appearance-toggle'),
    'site-nav': () => import('./islands/site-nav/page'),
    about: () => import('./islands/about/page'),
    landing: () => import('./islands/landing/page'),
    features: () => import('./islands/features/page'),
    feature: () => import('./islands/feature/page'),
    'get-started': () => import('./islands/get-started/page'),
    'legal-document': () => import('./islands/legal/document'),
    'legal-versions': () => import('./islands/legal/versions'),
    'site-cta': () => import('./components/site-cta'),
    // Waitlist mode (views/waitlist/*, ported from claryeo-waitlist).
    'waitlist-landing': () => import('./islands/waitlist/landing'),
    'waitlist-quiz': () => import('./islands/waitlist/quiz'),
    'waitlist-result': () => import('./islands/waitlist/result'),
} as unknown as Record<string, IslandLoader>;

function mountIslands(): void {
    document.querySelectorAll<HTMLElement>('[data-island]').forEach((el) => {
        const name = el.dataset.island;

        if (!name || el.dataset.mounted === 'true') {
            return;
        }

        const load = registry[name];

        if (!load) {
            console.warn(`[islands] no component registered for "${name}"`);
            return;
        }

        let props: Record<string, unknown> = {};

        if (el.dataset.props) {
            try {
                props = JSON.parse(el.dataset.props) as Record<string, unknown>;
            } catch (error) {
                console.error(`[islands] invalid props JSON for "${name}"`, error);
            }
        }

        // Remaining data attributes become props too, so a template can hand
        // over a string without composing JSON server-side (the shell's
        // data-theme, the copy on partials/cta). They win over data-props,
        // which is the shared blob; an empty attribute is ignored.
        for (const [key, value] of Object.entries(el.dataset)) {
            if (
                !value ||
                key === 'island' ||
                key === 'props' ||
                key === 'mounted'
            ) {
                continue;
            }

            props[key] = value;
        }

        // Claimed before the await so a second mountIslands() pass can't
        // double-mount the same node while its chunk is still in flight.
        el.dataset.mounted = 'true';

        void load()
            .then(({ default: Component }) => {
                // Reveals the container: site.css keeps an un-hydrated island's
                // children hidden so the SSR fallback can't flash.
                el.dataset.hydrated = 'true';
                createRoot(el).render(
                    <StrictMode>
                        <Component {...props} />
                    </StrictMode>,
                );
            })
            .catch((error: unknown) => {
                delete el.dataset.mounted;
                document.documentElement.classList.remove('js');
                console.error(`[islands] failed to load "${name}"`, error);
            });
    });
}

// Sync the stored light/dark/system preference (and listen for OS changes).
// A blocking inline script in the shell <head> already applied the initial
// class to avoid a flash; this wires up reactivity for the toggle.
initializeTheme();

if (document.readyState !== 'loading') {
    mountIslands();
} else {
    document.addEventListener('DOMContentLoaded', mountIslands);
}
