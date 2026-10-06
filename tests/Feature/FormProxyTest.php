<?php

namespace Tests\Feature;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FormProxyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config()->set('services.main_api.url', 'http://web.test');
        config()->set('services.main_api.token', 'secret');
        config()->set('services.claryeo_app.url', 'https://app-staging.claryeo.com');
    }

    public function test_contact_page_renders_island(): void
    {
        $this->get('/contact')->assertOk()->assertSee('data-island="contact-form"', false);
    }

    public function test_contact_store_proxies_and_relays_success(): void
    {
        Http::fake(['web.test/api/internal/contact' => Http::response(['data' => ['id' => 7]], 201)]);

        $response = $this->postJson('/contact', [
            'email' => 'ada@example.com',
            'message' => 'Hello team, I would like help with my account.',
        ]);

        $response->assertCreated()->assertJsonPath('data.id', 7);

        Http::assertSent(fn (Request $request): bool => $request['email'] === 'ada@example.com'
            && $request->hasHeader('X-Internal-Token', 'secret')
            && $request['client_ip'] !== null);
    }

    public function test_contact_store_truncates_oversized_user_agent(): void
    {
        Http::fake(['web.test/api/internal/contact' => Http::response(['data' => ['id' => 8]], 201)]);

        $longUserAgent = str_repeat('A', 600);

        $response = $this
            ->withHeader('User-Agent', $longUserAgent)
            ->postJson('/contact', [
                'email' => 'ada@example.com',
                'message' => 'Hello team, I would like help with my account.',
            ]);

        $response->assertCreated();

        Http::assertSent(fn (Request $request): bool => strlen((string) $request['client_user_agent']) === 512
            && $request['client_user_agent'] === str_repeat('A', 512));
    }

    public function test_contact_store_relays_validation_errors(): void
    {
        Http::fake(['web.test/api/internal/contact' => Http::response([
            'message' => 'The email field must be a valid email address.',
            'errors' => ['email' => ['The email field must be a valid email address.']],
        ], 422)]);

        $this->postJson('/contact', ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'The email field must be a valid email address.');
    }

    public function test_contact_store_answers_503_when_api_unreachable(): void
    {
        Http::fake(['web.test/api/internal/contact' => fn () => throw new ConnectionException('Connection failed')]);

        $this->postJson('/contact', [
            'email' => 'ada@example.com',
            'message' => 'Hello team, I would like help with my account.',
        ])
            ->assertStatus(503)
            ->assertJsonPath('detail', 'We couldn’t reach Claryeo. Please try again in a moment.');
    }

    public function test_get_started_renders_island_with_plans_and_app_handoff(): void
    {
        Http::fake([
            'web.test/api/internal/pricing' => Http::response(['data' => [
                'plans' => [
                    ['key' => 'free', 'name' => 'Free', 'priceLabel' => 'NGN 0'],
                    ['key' => 'growth', 'name' => 'Growth', 'priceLabel' => 'NGN 5,000'],
                ],
                'comparisonMatrix' => [],
                'comparisonAddOns' => [],
            ]]),
        ]);

        $response = $this->get('/get-started?plan=growth&billing_interval=annual');

        $response->assertOk();
        $response->assertSee('data-island="get-started"', false);

        $props = $this->decodeIslandProps($response->getContent(), 'get-started');
        $this->assertSame('https://app-staging.claryeo.com', $props['appUrl']);
        $this->assertSame('growth', $props['initialPlan']);
        $this->assertSame('annual', $props['initialInterval']);
        $this->assertCount(2, $props['plans']);
    }

    public function test_get_started_renders_when_api_unavailable(): void
    {
        Http::fake(['web.test/api/internal/pricing' => Http::response('', 500)]);

        $response = $this->get('/get-started');

        $response->assertOk();
        $response->assertSee('data-island="get-started"', false);

        $props = $this->decodeIslandProps($response->getContent(), 'get-started');
        $this->assertSame([], $props['plans']);
        $this->assertNull($props['initialPlan']);
    }

    public function test_get_started_sanitizes_invalid_query_parameters(): void
    {
        Http::fake(['web.test/api/internal/pricing' => Http::response(['data' => ['plans' => []]])]);

        $response = $this->get('/get-started?plan=<script>alert(1)</script>&billing_interval=invalid');

        $response->assertOk();
        $props = $this->decodeIslandProps($response->getContent(), 'get-started');
        $this->assertNull($props['initialPlan']);
        $this->assertNull($props['initialInterval']);
    }

    /**
     * Decode the HTML-escaped JSON from a named island's data-props attribute.
     *
     * @return array<string, mixed>
     */
    private function decodeIslandProps(string $html, string $island): array
    {
        $pattern = '/data-island="'.preg_quote($island, '/').'"\s+data-props="([^"]*)"/';
        $this->assertMatchesRegularExpression($pattern, $html);
        preg_match($pattern, $html, $matches);

        return json_decode(html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8'), true);
    }
}
