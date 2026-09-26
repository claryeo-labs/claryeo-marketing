<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LegalPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config()->set('services.main_api.url', 'http://web.test');
        config()->set('services.main_api.token', 'secret');
    }

    public function test_privacy_page_renders_document_island_from_api(): void
    {
        Http::fake([
            'web.test/api/internal/legal/privacy/versions' => Http::response(['data' => [
                'currentVersion' => '2.1.1',
                'versions' => [['version' => '2.1.1', 'effective_date' => '2026-03-19', 'status' => 'active']],
            ]]),
            'web.test/api/internal/legal/privacy' => Http::response(['data' => [
                'body' => "## Section one\n\nHello from the policy.",
                'meta' => ['effective_date' => '2026-03-19', 'status' => 'active'],
                'version' => '2.1.1',
            ]]),
        ]);

        $response = $this->get('/privacy');

        $response->assertOk();
        $response->assertSee('data-island="legal-document"', false);

        $props = $this->decodeIslandProps($response->getContent(), 'legal-document');
        $this->assertSame('privacy', $props['slug']);
        $this->assertSame('Privacy Policy', $props['title']);
        $this->assertStringContainsString('Hello from the policy.', $props['body']);
        $this->assertSame('2.1.1', $props['version']);
        $this->assertSame('2.1.1', $props['currentVersion']);
    }

    public function test_versions_page_renders_versions_island_from_api(): void
    {
        Http::fake([
            'web.test/api/internal/legal/terms/versions' => Http::response(['data' => [
                'currentVersion' => '2.0.0',
                'versions' => [
                    ['version' => '2.0.0', 'effective_date' => '2026-01-10', 'status' => 'active'],
                    ['version' => '1.0.0', 'effective_date' => '2024-01-01', 'status' => 'archived'],
                ],
            ]]),
        ]);

        $response = $this->get('/terms/versions');

        $response->assertOk();
        $response->assertSee('data-island="legal-versions"', false);

        $props = $this->decodeIslandProps($response->getContent(), 'legal-versions');
        $this->assertSame('2.0.0', $props['currentVersion']);
        $this->assertCount(2, $props['versions']);
        $this->assertSame('/terms', $props['versions'][0]['url']);
        $this->assertSame('/terms/1.0.0', $props['versions'][1]['url']);
    }

    /**
     * Decode the HTML-escaped JSON from a single island's data-props attribute.
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

    public function test_unknown_legal_slug_is_not_found(): void
    {
        $this->get('/totally-unknown-page')->assertNotFound();
    }

    public function test_api_failure_renders_not_found(): void
    {
        Http::fake(['web.test/api/internal/legal/privacy' => Http::response('', 500)]);

        $this->get('/privacy')->assertNotFound();
    }

    public function test_invalid_version_format_returns_not_found_without_hitting_api(): void
    {
        Http::fake();

        $this->get('/privacy/..%2F..%2Fadmin')->assertNotFound();
        $this->get('/privacy/invalid@version')->assertNotFound();

        // Only the site-mode lookup (App\Support\SiteMode) may go out.
        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), '/legal/'));
    }
}
