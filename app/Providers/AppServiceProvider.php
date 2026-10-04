<?php

namespace App\Providers;

use App\Http\View\Composers\BlogIndexComposer;
use App\Services\MainApi;
use App\Support\SiteMode;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /** @var array<int, array<string, mixed>> */
    private array $modeViewData = [];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MainApi::class, function ($app): MainApi {
            $config = $app['config'];

            return new MainApi(
                (string) $config->get('services.main_api.url'),
                (string) $config->get('services.main_api.token'),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $appUrl = Config::string('services.claryeo_app.url');
        /** @var array{
         *     primary?: list<array{label: string, href: string}>,
         *     resources?: mixed,
         *     footer?: array<int, array{group: string, items: array<int, array{title: string, href: string}>}>,
         *     social?: mixed,
         * } $nav
         */
        $nav = Config::array('marketing_nav');

        // Features mega-menu, built from the individual feature pages.
        /** @var array<string, array<string, mixed>> $featurePages */
        $featurePages = Config::array('feature_pages', []);
        $str = static fn (mixed $v): string => is_string($v) ? $v : '';
        $featureItems = collect($featurePages)
            // Nullish reads on purpose: this runs in boot() for every request,
            // so a feature entry missing a key degrades one menu row instead of
            // 500-ing the whole site.
            ->map(fn (array $f): array => [
                'eyebrow' => $str($f['eyebrow'] ?? null),
                'title' => $str($f['title'] ?? null),
                'tagline' => $str($f['tagline'] ?? null),
                'slug' => $str($f['slug'] ?? null),
                'badge' => $f['badge'] ?? null,
            ])
            ->filter(fn (array $f): bool => $f['title'] !== '' && $f['slug'] !== '')
            ->map(fn (array $f): array => [
                ...$f,
                'href' => '/features/'.$f['slug'],
            ])
            ->values()
            ->all();
        $features = [
            'lead' => ['label' => 'All features', 'href' => '/features'],
            'items' => $featureItems,
        ];

        // @vitejs/plugin-react needs its dev preamble before islands.tsx loads;
        // Statamic's {{ vite }} tag doesn't emit it. Empty string in prod.
        View::share('vite_react_refresh', (string) Vite::reactRefresh());

        // SEO defaults: self-canonical (pages can override with canonical_url)
        // and a site-wide OG image once public/og.png exists (1200x630).
        // page_url is resolved per render, not here: boot() runs before the
        // route is dispatched under some runtimes (and only once per worker
        // under any persistent one), which would freeze every canonical to
        // whichever URL booted the app.
        View::composer('*', static function ($view): void {
            $request = request();
            $page = $request->query('page');

            // Paginated lists must self-canonicalise per page, or pages 2..n
            // tell Google to drop them in favour of page 1.
            $view->with('page_url', is_scalar($page) && (string) $page !== '' && (string) $page !== '1'
                ? $request->url().'?page='.rawurlencode((string) $page)
                : $request->url());
        });
        View::share('site_root', url('/'));
        View::share('og_image', file_exists(public_path('og.png')) ? url('/og.png') : null);

        // Analytics config for the shell; server-injected (see config/services.php).
        View::share('ga4_id', config('services.ga4.measurement_id'));
        View::share('posthog_key', config('services.posthog.key'));
        View::share('posthog_host', config('services.posthog.host'));

        View::share('claryeo_app_url', $appUrl);
        // Header chrome: 'dark' lets a page sit the header over a full-bleed
        // dark hero (landing only); everything else keeps the solid header.
        View::share('nav_theme', 'light');

        // Nav, CTA and footer data depend on waitlist mode, which is resolved
        // per request (App\Support\SiteMode reads the main app's switch), so
        // it is attached at render time rather than frozen into boot().
        View::composer('*', function ($view) use ($appUrl, $nav, $features): void {
            $view->with($this->modeViewData($appUrl, $nav, $features));
        });
        View::share('footer_socials', $nav['social'] ?? []);

        // Blog category chips. Antlers can't iterate an associative array as
        // key/value pairs, so expose a list of {key, value} entries.
        $blogCategories = [];
        foreach (Config::array('marketing.blog_categories', []) as $slug => $title) {
            $blogCategories[] = ['key' => $slug, 'value' => $title];
        }
        View::share('blog_categories', $blogCategories);

        // Popularity-ranked "Top Reads" for the blog index.
        View::composer('blog.index', BlogIndexComposer::class);
    }

    /**
     * View data that varies with waitlist mode, memoised per mode and request.
     *
     * @param  array{primary?: list<array{label: string, href: string}>, resources?: mixed, footer?: array<int, array{group: string, items: array<int, array{title: string, href: string}>}>, social?: mixed}  $nav
     * @param  array<string, mixed>  $features
     * @return array<string, mixed>
     */
    private function modeViewData(string $appUrl, array $nav, array $features): array
    {
        // Performance optimization: Memoize waitlist mode resolution per HTTP request.
        // View::composer('*') fires on every view partial rendered during a request.
        // Re-using the resolved waitlist mode avoids resolving SiteMode and querying
        // the cache driver on every partial render (~20x reduction in cache calls).
        static $cachedRequest = null;
        static $waitlistMode = null;

        $request = request();

        if ($cachedRequest !== $request || $waitlistMode === null) {
            $cachedRequest = $request;
            $waitlistMode = $this->app->make(SiteMode::class)->waitlist();
        }

        return $this->modeViewData[$waitlistMode ? 1 : 0] ??= $this->buildModeViewData($waitlistMode, $appUrl, $nav, $features);
    }

    /**
     * @param  array{primary?: list<array{label: string, href: string}>, resources?: mixed, footer?: array<int, array{group: string, items: array<int, array{title: string, href: string}>}>, social?: mixed}  $nav
     * @param  array<string, mixed>  $features
     * @return array<string, mixed>
     */
    private function buildModeViewData(bool $waitlistMode, string $appUrl, array $nav, array $features): array
    {
        $primaryCta = $waitlistMode
            ? ['label' => 'Join the waitlist', 'href' => '/quiz']
            : ['label' => 'Get started', 'href' => '/get-started'];

        // In waitlist mode, pricing/get-started are hidden everywhere.
        $hidden = $waitlistMode ? ['/pricing', '/get-started'] : [];
        $primaryLinks = array_values(array_filter(
            $nav['primary'] ?? [],
            static fn (array $link): bool => ! in_array($link['href'], $hidden, true),
        ));

        return [
            'waitlist_mode' => $waitlistMode,
            'primary_cta' => $primaryCta,

            // JSON props for the header island (Features + Resources mega-menus).
            'nav_props' => htmlspecialchars(
                (string) json_encode([
                    'appUrl' => $appUrl,
                    'primary' => $primaryLinks,
                    'features' => $features,
                    'resources' => $nav['resources'] ?? [],
                    'waitlistMode' => $waitlistMode,
                    'cta' => $primaryCta,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),

            // JSON props for the closing-CTA island (partials/cta). Copy is passed
            // as data attributes by the partial; only the links come from here.
            'cta_props' => htmlspecialchars(
                (string) json_encode([
                    'primary' => $primaryCta,
                    'secondary' => null,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),

            // Arrays for the server-rendered Antlers footer + nav fallback.
            'nav_primary' => $primaryLinks,
            'footer_groups' => $this->footerGroups($nav['footer'] ?? [], $waitlistMode),
        ];
    }

    /**
     * Footer link groups, with pricing/get-started swapped for the waitlist when
     * waitlist mode is on.
     *
     * @param  array<int, array{group: string, items: array<int, array{title: string, href: string}>}>  $groups
     * @return array<int, array{group: string, items: array<int, array{title: string, href: string}>}>
     */
    private function footerGroups(array $groups, bool $waitlistMode): array
    {
        if (! $waitlistMode) {
            return $groups;
        }

        return array_map(function (array $group): array {
            $items = array_values(array_filter(
                $group['items'],
                static fn (array $item): bool => ! in_array($item['href'], ['/pricing', '/get-started'], true),
            ));

            if ($group['group'] === 'Product') {
                array_unshift($items, ['title' => 'Join the waitlist', 'href' => '/quiz']);
            }

            $group['items'] = $items;

            return $group;
        }, $groups);
    }
}
