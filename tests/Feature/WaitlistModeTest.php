<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * App\Http\Middleware\WaitlistTakeover: the global allowlist in waitlist mode,
 * and the marketing site (plus the waitlist-page redirects) when it is off.
 */
class WaitlistModeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config()->set('services.main_api.url', 'http://web.test');
        config()->set('services.main_api.token', 'secret');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function redirectedInWaitlistMode(): array
    {
        return [
            'pricing' => ['/pricing'],
            'get-started' => ['/get-started'],
            'about' => ['/about'],
            'features' => ['/features'],
            'feature page' => ['/features/invoicing'],
            'blog' => ['/blog'],
            'blog post' => ['/blog/vat-for-nigerian-small-businesses'],
            'guides' => ['/guides'],
            'glossary' => ['/glossary'],
            'contact' => ['/contact'],
            'tax calculator' => ['/tax-calculator'],
            'old waitlist page' => ['/waitlist'],
            'unknown url' => ['/totally-unknown-page'],
        ];
    }

    #[DataProvider('redirectedInWaitlistMode')]
    public function test_waitlist_mode_redirects_everything_off_the_allowlist_to_home(string $path): void
    {
        config()->set('marketing.waitlist_mode', true);

        $this->get($path)->assertStatus(302)->assertRedirect('/');
    }

    public function test_waitlist_mode_redirect_keeps_https_behind_the_edge_proxy(): void
    {
        config()->set('marketing.waitlist_mode', true);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->withHeaders(['X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'claryeo.com'])
            ->get('http://claryeo.com/pricing');

        $response->assertStatus(302);
        $this->assertStringStartsWith('https://', (string) $response->headers->get('Location'));
    }

    public function test_waitlist_mode_redirect_keeps_the_query_string_for_attribution(): void
    {
        config()->set('marketing.waitlist_mode', true);

        $this->get('/pricing?utm_source=newsletter&utm_campaign=launch')
            ->assertRedirect('/?utm_campaign=launch&utm_source=newsletter');
    }

    public function test_waitlist_mode_serves_the_waitlist_landing_at_home(): void
    {
        config()->set('marketing.waitlist_mode', true);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('data-island="waitlist-landing"', false);
        $response->assertDontSee('data-island="landing"', false);
        $response->assertDontSee('data-island="site-nav"', false);
        $response->assertSee('<meta name="csrf-token"', false);
        $response->assertSee('<meta property="og:title"', false);
    }

    public function test_waitlist_mode_serves_the_quiz_with_server_fetched_questions(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake(['web.test/api/internal/waitlist/quiz' => Http::response(['questions' => [['id' => 'role']]])]);

        $response = $this->get('/quiz');

        $response->assertOk();
        preg_match('/data-island="waitlist-quiz"\s+data-props="([^"]*)"/', $response->getContent() ?: '', $matches);
        $props = json_decode(html_entity_decode($matches[1] ?? '', ENT_QUOTES, 'UTF-8'), true);
        $this->assertSame([['id' => 'role']], $props['questions']);
    }

    public function test_waitlist_mode_quiz_still_renders_when_the_api_is_down(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake(['web.test/api/internal/waitlist/quiz' => Http::response('', 500)]);

        $this->get('/quiz')->assertOk()->assertSee('data-island="waitlist-quiz"', false);
    }

    public function test_waitlist_mode_serves_a_noindexed_result_page(): void
    {
        config()->set('marketing.waitlist_mode', true);

        $this->get('/result')
            ->assertOk()
            ->assertSee('data-island="waitlist-result"', false)
            ->assertSee('<meta name="robots" content="noindex, follow">', false);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function allowedInWaitlistMode(): array
    {
        return [
            'robots' => ['/robots.txt'],
            'sitemap' => ['/sitemap.xml'],
            'llms' => ['/llms.txt'],
            'health' => ['/up'],
        ];
    }

    #[DataProvider('allowedInWaitlistMode')]
    public function test_waitlist_mode_lets_allowlisted_routes_through(string $path): void
    {
        config()->set('marketing.waitlist_mode', true);

        $this->get($path)->assertOk();
    }

    public function test_waitlist_mode_lets_legal_pages_through(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake([
            'web.test/api/internal/legal/privacy/versions' => Http::response(['data' => ['currentVersion' => '1.0.0', 'versions' => []]]),
            'web.test/api/internal/legal/privacy' => Http::response(['data' => ['body' => '# Privacy', 'version' => '1.0.0']]),
        ]);

        $this->get('/privacy')->assertOk()->assertSee('data-island="legal-document"', false);
        $this->get('/privacy/versions')->assertOk();
    }

    public function test_waitlist_mode_lets_the_proxy_endpoints_and_control_panel_through(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake([
            'web.test/api/internal/waitlist/quiz' => Http::response(['questions' => []]),
            'web.test/api/internal/waitlist/community' => Http::response(['total' => 0]),
        ]);

        $this->getJson('/waitlist/quiz')->assertOk();
        $this->getJson('/waitlist/community')->assertOk();
        // The CP redirects to its own login rather than to the waitlist.
        $this->assertStringContainsString('/cp', (string) $this->get('/cp')->headers->get('Location'));
    }

    public function test_waitlist_mode_does_not_redirect_non_get_requests(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake(['web.test/api/internal/contact' => Http::response(['data' => ['id' => 1]], 201)]);

        $this->postJson('/contact', [
            'email' => 'ada@example.com',
            'message' => 'Hello team, I would like help with my account.',
        ])->assertCreated();
    }

    /**
     * @return array<string, array{string}>
     */
    public static function waitlistPages(): array
    {
        return [
            'quiz' => ['/quiz'],
            'result' => ['/result'],
            'old waitlist page' => ['/waitlist'],
        ];
    }

    #[DataProvider('waitlistPages')]
    public function test_waitlist_pages_redirect_to_get_started_when_waitlist_mode_is_off(string $path): void
    {
        config()->set('marketing.waitlist_mode', false);

        $this->get($path)->assertStatus(302)->assertRedirect('/get-started');
    }

    public function test_marketing_site_is_unchanged_when_waitlist_mode_is_off(): void
    {
        config()->set('marketing.waitlist_mode', false);
        Http::fake(['web.test/api/internal/pricing' => Http::response(['data' => ['plans' => []]])]);

        $this->get('/')->assertOk()->assertSee('data-island="landing"', false);
        $this->get('/pricing')->assertOk();
        $this->get('/get-started')->assertOk();
        $this->get('/about')->assertOk()->assertSee('Get started', false);
        $this->get('/totally-unknown-page')->assertNotFound();
    }

    public function test_main_app_switch_wins_over_local_config(): void
    {
        config()->set('marketing.waitlist_mode', false);
        Http::fake(['web.test/api/internal/site' => Http::response(['waitlist_mode' => true])]);

        $this->get('/about')->assertRedirect('/');
    }

    public function test_legal_page_nav_points_at_the_quiz_in_waitlist_mode(): void
    {
        config()->set('marketing.waitlist_mode', true);
        Http::fake([
            'web.test/api/internal/legal/terms/versions' => Http::response(['data' => ['currentVersion' => '1.0.0', 'versions' => []]]),
            'web.test/api/internal/legal/terms' => Http::response(['data' => ['body' => '# Terms', 'version' => '1.0.0']]),
        ]);

        $response = $this->get('/terms');

        $response->assertOk();
        $response->assertSee('Join the waitlist', false);
        $response->assertSee('&quot;waitlistMode&quot;:true', false);
        $response->assertSee('href="/quiz"', false);
    }
}
