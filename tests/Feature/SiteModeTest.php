<?php

namespace Tests\Feature;

use App\Support\SiteMode;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SiteModeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.main_api.url', 'http://web.test');
        config()->set('services.main_api.token', 'secret');
    }

    public function test_main_app_switch_is_used_when_available(): void
    {
        config()->set('marketing.waitlist_mode', false);
        Http::fake(['web.test/api/internal/site' => Http::response(['waitlist_mode' => true])]);

        $this->assertTrue(app(SiteMode::class)->waitlist());
        Http::assertSent(fn (Request $request): bool => $request->url() === 'http://web.test/api/internal/site'
            && $request->hasHeader('X-Internal-Token', 'secret'));
    }

    public function test_main_app_off_overrides_local_config_on(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake(['web.test/api/internal/site' => Http::response(['waitlist_mode' => false])]);

        $this->assertFalse(app(SiteMode::class)->waitlist());
    }

    public function test_switch_is_cached_briefly(): void
    {
        Http::fake(['web.test/api/internal/site' => Http::response(['waitlist_mode' => true])]);

        app(SiteMode::class)->waitlist();
        app(SiteMode::class)->waitlist();

        Http::assertSentCount(1);
    }

    public function test_falls_back_to_config_when_the_api_fails(): void
    {
        Http::fake(['web.test/api/internal/site' => Http::response('', 500)]);

        config()->set('marketing.waitlist_mode', true);
        $this->assertTrue(app(SiteMode::class)->waitlist());

        config()->set('marketing.waitlist_mode', false);
        $this->assertFalse(app(SiteMode::class)->waitlist());
    }

    public function test_falls_back_to_config_when_the_body_is_malformed(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake(['web.test/api/internal/site' => Http::response(['waitlist_mode' => 'yes'])]);

        $this->assertTrue(app(SiteMode::class)->waitlist());
    }

    public function test_a_failure_backs_off_instead_of_retrying_every_request(): void
    {
        config()->set('marketing.waitlist_mode', false);
        Http::fake(['web.test/api/internal/site' => Http::response('', 500)]);

        app(SiteMode::class)->waitlist();
        app(SiteMode::class)->waitlist();
        app(SiteMode::class)->waitlist();

        Http::assertSentCount(1);
    }
}
