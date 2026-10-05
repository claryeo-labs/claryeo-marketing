<?php

namespace App\Http\Middleware;

use App\Support\SiteMode;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

/**
 * Global switch between the two faces of the site.
 *
 * Waitlist mode ON: the public site *is* the waitlist (/ landing, /quiz,
 * /result). Every other GET is 302'd to / (query string kept, so UTMs still
 * land on the page that captures them) unless it is on the allowlist below:
 * legal pages, SEO files, health, static assets, the Statamic CP and the
 * waitlist's own proxy endpoints.
 *
 * Waitlist mode OFF: the marketing site is untouched, except the waitlist's
 * pages (/quiz, /result, /waitlist) send visitors to /get-started.
 *
 * Registered globally (not in the web group) so it also covers URLs that
 * would otherwise fall through to Statamic's catch-all or a 404.
 */
class WaitlistTakeover
{
    /**
     * Paths reachable while waitlist mode is on. Request::is() patterns.
     *
     * @var list<string>
     */
    public const ALLOWLIST = [
        '/',
        'quiz',
        'result',
        'waitlist/quiz',
        'waitlist/community',
        'privacy', 'privacy/*',
        'terms', 'terms/*',
        'cookies', 'cookies/*',
        'contact', 'contact/*',
        'sitemap.xml',
        'robots.txt',
        'llms.txt',
        'up',
        // Built/static assets. Normally served by the web server before PHP,
        // listed so `artisan serve` and misrouted requests behave the same.
        'build/*',
        'assets/*',
        'vendor/*',
        'images/*',
        'favicon.ico',
        'favicon.svg',
        'og.png',
        'theme-init.js',
        // Statamic: Glide images and front-end actions.
        'img/*',
        '!/*',
    ];

    /**
     * The waitlist's own pages, which have nothing to show outside waitlist mode.
     *
     * @var list<string>
     */
    public const WAITLIST_PAGES = ['quiz', 'result', 'waitlist'];

    /** @var array<string, true>|null */
    private static ?array $exactAllowlist = null;

    /** @var array<string, true>|null */
    private static ?array $exactWaitlistPages = null;

    public function __construct(private readonly SiteMode $siteMode) {}

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('GET') && ! $request->isMethod('HEAD')) {
            return $next($request);
        }

        if ($this->siteMode->waitlist()) {
            return $this->isAllowed($request) ? $next($request) : $this->redirectTo('/', $request);
        }

        // Performance optimization: Check exact waitlist page paths via O(1) hash map lookup
        // instead of unrolling arrays and running string/regex comparisons on every request.
        self::$exactWaitlistPages ??= array_fill_keys(self::WAITLIST_PAGES, true);

        return isset(self::$exactWaitlistPages[$request->path()])
            ? $this->redirectTo('/get-started', $request)
            : $next($request);
    }

    private function isAllowed(Request $request): bool
    {
        // Performance optimization: Automatically derive an O(1) hash map of exact paths
        // from ALLOWLIST on initial load to avoid array scanning and regex matching on exact hits,
        // maintaining ALLOWLIST as the single source of truth.
        if (self::$exactAllowlist === null) {
            $exacts = array_filter(
                self::ALLOWLIST,
                fn (string $pattern): bool => ! str_contains($pattern, '*') && ! str_contains($pattern, '!'),
            );
            self::$exactAllowlist = array_fill_keys($exacts, true);
        }

        if (isset(self::$exactAllowlist[$request->path()])) {
            return true;
        }

        $cp = trim(Config::string('statamic.cp.route', 'cp'), '/');

        return $request->is(...self::ALLOWLIST) || $request->is($cp, $cp.'/*');
    }

    private function redirectTo(string $path, Request $request): Response
    {
        $query = $request->getQueryString();

        // Built from the request, not the URL generator: in production the
        // generator can hold an http scheme cached before TrustProxies ran, which
        // sent every takeover redirect through an extra http:// hop.
        $url = $request->getSchemeAndHttpHost().rtrim($path, '/');

        return redirect()->away($query ? $url.'?'.$query : $url);
    }
}
