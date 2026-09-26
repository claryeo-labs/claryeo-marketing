<?php

use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\CaptureUtmParameters;
use App\Http\Middleware\RedirectToCanonicalHost;
use App\Http\Middleware\WaitlistTakeover;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Railway terminates TLS at its edge and forwards to the container over
        // HTTP with X-Forwarded-Proto: https. Trust the proxy so Laravel detects
        // the original HTTPS scheme and generates https:// URLs — otherwise the
        // CP (and other absolute URLs) emit http://, which browsers block as
        // mixed content. Railway's proxy IPs are dynamic, hence trusting all.
        $middleware->trustProxies(at: '*');

        // Prepended so www is redirected before any session or CSRF work is done
        // for a request that is only going to be thrown away. It lives in the web
        // group rather than the global stack so it runs *after* trustProxies above
        // — otherwise the detected scheme is http and it would 301 to an http URL.
        $middleware->web(prepend: [
            RedirectToCanonicalHost::class,
        ]);

        $middleware->web(append: [
            CaptureUtmParameters::class,
            AddSecurityHeaders::class,
        ]);

        // Waitlist mode (see App\Support\SiteMode): global rather than in the
        // web group so unmatched URLs are redirected too, not 404'd.
        $middleware->append(WaitlistTakeover::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
