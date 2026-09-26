<?php

namespace Tests\Feature;

use Tests\TestCase;

class SitemapTest extends TestCase
{
    public function test_sitemap_lists_the_public_marketing_surface(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $this->assertStringContainsString('application/xml', (string) $response->headers->get('Content-Type'));

        $body = $response->getContent() ?: '';

        $this->assertStringContainsString('<urlset', $body);
        $this->assertStringContainsString('/features</loc>', $body);
        $this->assertStringContainsString('/features/invoicing</loc>', $body);
        $this->assertStringContainsString('/guides/paye-tax-nigeria</loc>', $body);
        $this->assertStringContainsString('/blog/category/tax</loc>', $body);
        $this->assertStringContainsString('/privacy</loc>', $body);

        // Published posts are pulled in via the Statamic blog collection tag.
        $this->assertStringContainsString('/blog/vat-for-nigerian-small-businesses</loc>', $body);
    }

    public function test_sitemap_lists_pricing_and_get_started_outside_waitlist_mode(): void
    {
        config()->set('marketing.waitlist_mode', false);

        $body = $this->get('/sitemap.xml')->getContent() ?: '';

        $this->assertStringContainsString('/pricing</loc>', $body);
        $this->assertStringContainsString('/get-started</loc>', $body);
        $this->assertStringNotContainsString('/quiz</loc>', $body);
    }

    public function test_sitemap_lists_only_home_and_legal_pages_in_waitlist_mode(): void
    {
        config()->set('marketing.waitlist_mode', true);

        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        preg_match_all('#<loc>([^<]+)</loc>#', $response->getContent() ?: '', $matches);

        $this->assertSame(
            [url('/'), url('/privacy'), url('/terms'), url('/cookies')],
            $matches[1],
        );
    }

    public function test_robots_disallows_crawlers_outside_production(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk();
        $this->assertStringContainsString('Disallow: /', (string) $response->getContent());
    }

    public function test_robots_invites_crawlers_and_advertises_sitemap_in_production(): void
    {
        $this->app['env'] = 'production';

        $body = (string) $this->get('/robots.txt')->getContent();

        $this->assertStringContainsString('Allow: /', $body);
        $this->assertStringContainsString('Sitemap: ', $body);
        $this->assertStringContainsString('/sitemap.xml', $body);
    }
}
