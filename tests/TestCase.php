<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-07-01');

        // Every page view asks the main app for the waitlist switch (see
        // App\Support\SiteMode). Unfaked calls fail fast instead of hitting
        // the network, so SiteMode falls back to config('marketing.waitlist_mode').
        Http::preventStrayRequests();
    }
}
