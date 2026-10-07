<?php

namespace App\Support;

use App\Services\MainApi;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * The one place that answers "is the site in waitlist mode?".
 *
 * The switch is owned by the main app (GET /api/internal/site, cached ~60s
 * by MainApi). If that call fails, marketing keeps the last answer the main
 * app gave, so a brief outage never flips the site; only with no answer ever
 * seen does it fall back to its own `marketing.waitlist_mode` config (off
 * unless set). A failed lookup also opens a short
 * backoff window so an outage costs one slow request, not one per request:
 * this is read by a global middleware on every page view.
 */
class SiteMode
{
    private const BACKOFF_KEY = 'marketing:site:backoff';

    private const BACKOFF_SECONDS = 30;

    private const LAST_KNOWN_KEY = 'marketing:site:waitlist_mode:last';

    /**
     * Performance optimization: Cache resolved waitlist mode in memory per request.
     * Prevents redundant cache/store operations when waitlist() is invoked multiple
     * times per request (e.g. in WaitlistTakeover middleware and view composers).
     */
    private ?bool $cachedWaitlist = null;

    public function __construct(private readonly MainApi $api) {}

    public function waitlist(): bool
    {
        if ($this->cachedWaitlist !== null) {
            return $this->cachedWaitlist;
        }

        $remote = $this->remoteWaitlistMode();

        if ($remote !== null) {
            return $this->cachedWaitlist = $remote;
        }

        $lastKnown = Cache::get(self::LAST_KNOWN_KEY);

        return $this->cachedWaitlist = (is_bool($lastKnown) ? $lastKnown : Config::boolean('marketing.waitlist_mode'));
    }

    /**
     * Flush the in-memory waitlist mode cache (primarily for unit tests).
     */
    public function flushCache(): void
    {
        $this->cachedWaitlist = null;
    }

    private function remoteWaitlistMode(): ?bool
    {
        if (Cache::has(self::BACKOFF_KEY)) {
            return null;
        }

        $site = $this->api->site();

        if (is_array($site) && is_bool($site['waitlist_mode'] ?? null)) {
            Cache::forever(self::LAST_KNOWN_KEY, $site['waitlist_mode']);

            return $site['waitlist_mode'];
        }

        Cache::put(self::BACKOFF_KEY, true, self::BACKOFF_SECONDS);

        return null;
    }
}
