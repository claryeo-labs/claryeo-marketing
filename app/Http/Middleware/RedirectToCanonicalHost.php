<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends www.<domain> to the bare <domain> with a 301.
 *
 * This is not only an SEO nicety. ASSET_URL is a single absolute origin
 * (https://claryeo.com), so a page served from www.claryeo.com requests its
 * Vite bundles cross-origin — and module scripts are fetched in CORS mode, so
 * the browser blocks every one of them with "No 'Access-Control-Allow-Origin'
 * header". The page renders unstyled and dead. Serving one canonical host is
 * what keeps assets same-origin; adding CORS headers to the asset origin would
 * paper over a split-brain we do not actually want.
 *
 * Deliberately host-shape based rather than comparing against APP_URL: it must
 * behave the same in every environment, and staging's canonical host differs.
 */
class RedirectToCanonicalHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();

        if (! str_starts_with($host, 'www.')) {
            return $next($request);
        }

        // Isolate host rewriting to the domain to avoid mangling or altering
        // query string parameters or paths that contain "://www.".
        $canonicalHost = substr($host, 4);
        $target = $request->getScheme().'://'.$canonicalHost.$request->getRequestUri();

        // 301: permanent, so browsers and crawlers stop asking. Safe here —
        // the bare host is the canonical one in every environment.
        return redirect()->away($target, 301);
    }
}
