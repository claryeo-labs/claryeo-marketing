<?php

namespace App\Support;

use App\Services\MainApi;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * The one place that answers "is the site in waitlist mode?".
 *
 * The switch is owned by the main app (GET /api/internal/site, cached ~60s
 * by MainApi). If that call fails, marketing falls back to its own
 * `marketing.waitlist_mode` config. A failed lookup also opens a short
 * backoff window so an outage costs one slow request, not one per request:
 * this is read by a global middleware on every page view.
 */
class SiteMode
{
    private const BACKOFF_KEY = 'marketing:site:backoff';

    private const BACKOFF_SECONDS = 30;

    public function __construct(private readonly MainApi $api) {}

    public function waitlist(): bool
    {
        $remote = $this->remoteWaitlistMode();

        return $remote ?? Config::boolean('marketing.waitlist_mode');
    }

    private function remoteWaitlistMode(): ?bool
    {
        if (Cache::has(self::BACKOFF_KEY)) {
            return null;
        }

        $site = $this->api->site();

        if (is_array($site) && is_bool($site['waitlist_mode'] ?? null)) {
            return $site['waitlist_mode'];
        }

        Cache::put(self::BACKOFF_KEY, true, self::BACKOFF_SECONDS);

        return null;
    }
}
