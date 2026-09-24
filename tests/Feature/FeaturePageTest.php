<?php

namespace Tests\Feature;

use Tests\TestCase;

class FeaturePageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_index_lists_feature_cards(): void
    {
        $response = $this->get('/features');

        $response->assertOk();
        $response->assertSee('data-island="features"', false);

        preg_match('/data-island="features"\s+data-props="([^"]*)"/', $response->getContent(), $matches);
        $props = json_decode(html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8'), true);
        $this->assertCount(4, $props['features']);
        $this->assertSame('/features/invoicing', $props['features'][0]['href']);
    }

    public function test_feature_page_renders_island_with_content(): void
    {
        $response = $this->get('/features/bank-sync');

        $response->assertOk();
        $response->assertSee('data-island="feature"', false);

        preg_match('/data-island="feature"\s+data-props="([^"]*)"/', $response->getContent(), $matches);
        $props = json_decode(html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8'), true);
        $this->assertSame('bank-sync', $props['feature']['slug']);
        $this->assertSame('New', $props['feature']['badge']);
        $this->assertNotEmpty($props['feature']['faqs']);
        $this->assertSame('Get started', $props['cta']['label']);
    }

    public function test_unknown_feature_is_not_found(): void
    {
        $this->get('/features/does-not-exist')->assertNotFound();
    }

    public function test_nested_dot_notation_slug_returns_not_found(): void
    {
        $this->get('/features/invoicing.highlights')->assertNotFound();
    }
}
