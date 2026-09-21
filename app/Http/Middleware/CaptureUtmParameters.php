<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Captures UTM and ad-click-ID parameters on first touch so they can be
 * forwarded to the main app's internal API when a lead is submitted. Ported
 * from the main Claryeo app — both apps need attribution capture.
 */
class CaptureUtmParameters
{
    public const SESSION_KEY = 'utm_parameters';

    /** @var list<string> */
    public const ALL_KEYS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'gclid',
        'fbclid',
        'ttclid',
    ];

    /**
     * Performance optimization: Cache the flipped key lookup map in memory.
     * Avoids re-flipping $ALL_KEYS array on every request executing this middleware.
     *
     * @var array<string, int>|null
     */
    private static ?array $flippedKeys = null;

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->session()->has(self::SESSION_KEY)) {
            return $next($request);
        }

        $params = self::extractAndNormalize($request->query->all());

        if ($params !== []) {
            $request->session()->put(self::SESSION_KEY, $params);
        }

        return $next($request);
    }

    /**
     * Resolve parameters with session-first, request-query fallback.
     *
     * @return array<string, string>
     */
    public static function resolve(Request $request): array
    {
        $sessionParams = $request->session()->get(self::SESSION_KEY, []);

        if (is_array($sessionParams)) {
            $stringKeyed = [];
            foreach ($sessionParams as $key => $value) {
                if (is_string($key)) {
                    $stringKeyed[$key] = $value;
                }
            }

            $fromSession = self::extractAndNormalize($stringKeyed);

            if ($fromSession !== []) {
                return $fromSession;
            }
        }

        return self::extractAndNormalize($request->query->all());
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, string>
     */
    private static function extractAndNormalize(array $values): array
    {
        // Performance optimization: Reuse static flipped array map to avoid
        // allocating and flipping self::ALL_KEYS on every middleware pass.
        self::$flippedKeys ??= array_flip(self::ALL_KEYS);

        $tracked = array_intersect_key($values, self::$flippedKeys);

        $normalized = [];

        foreach ($tracked as $key => $value) {
            if (! is_string($value) || $value === '') {
                continue;
            }

            $clean = Str::limit(trim(Str::lower($value)), 255, '');

            if ($clean !== '') {
                $normalized[$key] = $clean;
            }
        }

        return $normalized;
    }
}
