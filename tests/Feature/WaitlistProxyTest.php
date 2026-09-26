<?php

namespace Tests\Feature;

use App\Http\Middleware\CaptureUtmParameters;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Same-origin proxies the waitlist UI calls (WaitlistController), relaying
 * the main app's internal waitlist API.
 */
class WaitlistProxyTest extends TestCase
{
    /** @var array<string, mixed> */
    private array $signup = [
        'name' => 'Ada Okafor',
        'email' => 'ada@example.com',
        'company' => 'Okafor Studio',
        'answers' => ['role' => 'freelancer', 'pain' => ['payments', 'tax'], 'tools' => 'spreadsheets', 'goal' => 'time'],
        'consent' => true,
        'website' => '',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.main_api.url', 'http://web.test');
        config()->set('services.main_api.token', 'secret');
        config()->set('marketing.waitlist_mode', true);
    }

    public function test_store_forwards_the_signup_with_attribution_and_client_details(): void
    {
        Http::fake(['web.test/api/internal/waitlist' => Http::response([
            'status' => 'joined',
            'name' => 'Ada Okafor',
            'profile' => ['title' => 'T', 'features' => []],
            'answers' => $this->signup['answers'],
        ])]);

        $response = $this
            ->withSession([CaptureUtmParameters::SESSION_KEY => ['utm_source' => 'newsletter', 'gclid' => 'abc']])
            ->withHeader('User-Agent', 'TestAgent/1.0')
            ->postJson('/waitlist', $this->signup);

        $response->assertOk()->assertJsonPath('status', 'joined');

        Http::assertSent(function (Request $request): bool {
            $data = $request->data();

            return $request->url() === 'http://web.test/api/internal/waitlist'
                && $request->method() === 'POST'
                && $request->hasHeader('X-Internal-Token', 'secret')
                && $data['name'] === 'Ada Okafor'
                && $data['email'] === 'ada@example.com'
                && $data['company'] === 'Okafor Studio'
                && $data['answers'] === $this->signup['answers']
                && $data['consent'] === true
                && $data['utm_source'] === 'newsletter'
                && $data['gclid'] === 'abc'
                && $data['client_ip'] === '127.0.0.1'
                && $data['client_user_agent'] === 'TestAgent/1.0'
                // The honeypot is checked here and never forwarded.
                && ! array_key_exists('website', $data);
        });
    }

    public function test_store_rejects_a_filled_honeypot_without_calling_the_api(): void
    {
        Http::fake();

        $this->postJson('/waitlist', [...$this->signup, 'website' => 'https://spam.example'])
            ->assertStatus(422)
            ->assertExactJson(['detail' => 'Please try again.']);

        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), '/waitlist'));
    }

    public function test_store_relays_validation_errors_unchanged(): void
    {
        Http::fake(['web.test/api/internal/waitlist' => Http::response(['detail' => 'Please provide a valid email address.'], 422)]);

        $this->postJson('/waitlist', [...$this->signup, 'email' => 'nope'])
            ->assertStatus(422)
            ->assertExactJson(['detail' => 'Please provide a valid email address.']);
    }

    public function test_store_relays_the_already_joined_outcome_as_200(): void
    {
        Http::fake(['web.test/api/internal/waitlist' => Http::response(['status' => 'already-joined', 'name' => 'Ada'])]);

        $this->postJson('/waitlist', $this->signup)->assertOk()->assertJsonPath('status', 'already-joined');
    }

    public function test_store_answers_503_with_detail_when_the_api_is_unreachable(): void
    {
        Http::fake(['web.test/api/internal/waitlist' => fn () => throw new ConnectionException('down')]);

        $this->postJson('/waitlist', $this->signup)
            ->assertStatus(503)
            ->assertJsonStructure(['detail']);
    }

    public function test_store_is_throttled(): void
    {
        Http::fake(['web.test/api/internal/waitlist' => Http::response(['status' => 'joined'])]);

        foreach (range(1, 6) as $_) {
            $this->postJson('/waitlist', $this->signup)->assertOk();
        }

        $this->postJson('/waitlist', $this->signup)->assertStatus(429);
    }

    public function test_store_requires_a_csrf_token_outside_tests(): void
    {
        // The web group's CSRF middleware covers the route (it is skipped
        // under unit tests, so assert the route is in the web group).
        $route = app('router')->getRoutes()->getByName('waitlist.store');

        $this->assertNotNull($route);
        $this->assertContains('web', $route->gatherMiddleware());
        $this->assertContains('throttle:6,1', $route->gatherMiddleware());
    }

    public function test_quiz_proxies_the_questions(): void
    {
        Http::fake(['web.test/api/internal/waitlist/quiz' => Http::response(['questions' => [['id' => 'role']]])]);

        $this->getJson('/waitlist/quiz')->assertOk()->assertExactJson(['questions' => [['id' => 'role']]]);
    }

    public function test_quiz_answers_503_with_detail_when_the_api_fails(): void
    {
        Http::fake(['web.test/api/internal/waitlist/quiz' => Http::response('', 500)]);

        $this->getJson('/waitlist/quiz')->assertStatus(503)->assertJsonStructure(['detail']);
    }

    public function test_community_relays_the_stats_and_is_never_cached(): void
    {
        $stats = ['total' => 2, 'ready' => false, 'min_responses' => 5, 'categories' => [], 'updated_at' => '2026-07-01T00:00:00Z'];
        Http::fake(['web.test/api/internal/waitlist/community' => Http::response($stats)]);

        $response = $this->getJson('/waitlist/community');

        $response->assertOk()->assertExactJson($stats);
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_community_relays_upstream_errors(): void
    {
        Http::fake(['web.test/api/internal/waitlist/community' => Http::response(['detail' => 'Down for a moment.'], 503)]);

        $response = $this->getJson('/waitlist/community');

        $response->assertStatus(503)->assertExactJson(['detail' => 'Down for a moment.']);
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }
}
