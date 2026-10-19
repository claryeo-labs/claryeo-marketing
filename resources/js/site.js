// Behavior analytics: one init gives autocapture (every click with element
// context), heatmaps, scroll depth, session replay, and pageview/pageleave
// (time on page). Enable "Record user sessions" in the PostHog project
// settings; everything else is on by default.
// Config comes from meta tags the shell emits server-side (the Docker assets
// stage gets no VITE_* vars, so import.meta.env is empty in prod bundles).
// Inert when POSTHOG_KEY is unset, so local dev sends nothing.
// posthog-js is ~250 kB, so it is a dynamic import: as a static one it lands in
// the shared site bundle every page has to download before anything else.
const phKey = document.querySelector('meta[name="ph-key"]')?.content;
if (phKey) {
    const apiHost =
        document.querySelector('meta[name="ph-host"]')?.content ||
        "https://eu.i.posthog.com";

    void import("posthog-js").then(({ default: posthog }) => {
        posthog.init(phKey, { api_host: apiHost, defaults: "2025-05-24" });
    });
}

// Changelog films ship with preload="none" and data-autoplay: nothing downloads
// until a film scrolls into view, it plays while visible and pauses when it
// leaves. With reduced motion on they wait for the reader to press play.
const lazyVideos = document.querySelectorAll("video[data-autoplay]");
if (
    lazyVideos.length &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
    const observer = new IntersectionObserver(
        (entries) => {
            for (const { target, isIntersecting } of entries) {
                if (isIntersecting) {
                    target.play().catch(() => {});
                } else {
                    target.pause();
                }
            }
        },
        { threshold: 0.4 },
    );
    lazyVideos.forEach((video) => observer.observe(video));
}
