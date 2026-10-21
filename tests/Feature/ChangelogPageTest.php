<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChangelogPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Cache::flush();
        config()->set('services.main_api.url', 'http://web.test');
        config()->set('services.main_api.token', 'secret');
    }

    /**
     * @param  int  $count  entries, newest first, one day apart from 2026-10-08
     */
    private function fakeChangelog(int $count = 2): void
    {
        $entries = [];
        for ($i = 0; $i < $count; $i++) {
            $entries[] = [
                'id' => "release-{$i}",
                'date' => date('Y-m-d', strtotime("2026-10-08 -{$i} days")),
                'kind' => 'new',
                'title' => "Release {$i}",
                'summary' => "Summary {$i}",
                'link' => ['label' => 'Open the Inbox', 'href' => 'https://app.test/inbox'],
                'image' => $i === 0 ? 'https://app.test/changelog/release-0/hero.png' : null,
                'video' => $i === 1 ? 'https://app.test/changelog/release-1/hero.mp4' : null,
                'body_html' => "<p>Body {$i}</p><figure class=\"changelog-media\"><img src=\"https://app.test/a.png\" alt=\"A\"><figcaption>Caption {$i}</figcaption></figure>",
                'fixes' => [['area' => 'invoices', 'area_label' => 'Invoices', 'text' => "Fixed thing {$i}."]],
                'improvements' => [],
            ];
        }

        Http::fake(['web.test/api/internal/changelog' => Http::response(['data' => $entries])]);
    }

    public function test_list_renders_whole_releases_with_media_and_fixes(): void
    {
        $this->fakeChangelog();

        $this->get('/changelog')
            ->assertOk()
            ->assertSee('October 8, 2026')
            ->assertSee('<a href="/changelog/2026-10-08-release-0"', false)
            ->assertSee('<figcaption>Caption 0</figcaption>', false)
            ->assertSee('src="https://app.test/changelog/release-0/hero.png" alt="Release 0" fetchpriority="high"', false)
            ->assertSee('data-area="invoices"', false)
            ->assertSee('Fixed thing 1.')
            ->assertSee('changelog-dot is-latest', false)
            ->assertSee('data-island="changelog-tools"', false)
            ->assertSee('data-autoplay muted loop playsinline controls preload="none"', false)
            ->assertDontSee(' autoplay ', false);
    }

    public function test_list_pages_by_ten_and_404s_past_the_end(): void
    {
        $this->fakeChangelog(12);

        $this->get('/changelog')->assertOk()->assertSee('Release 9')->assertDontSee('>Release 10<', false)->assertSee('/changelog/page/2');
        $this->get('/changelog/page/2')->assertOk()->assertSee('>Release 11<', false)->assertDontSee('>Release 0<', false);
        $this->get('/changelog/page/3')->assertNotFound();
    }

    public function test_entry_page_shows_one_release_with_its_og_image(): void
    {
        $this->fakeChangelog();

        $this->get('/changelog/2026-10-08-release-0')
            ->assertOk()
            ->assertSee('<h1 class="changelog-title-lg text-foreground">Release 0</h1>', false)
            ->assertSee('<meta property="og:image" content="https://app.test/changelog/release-0/hero.png">', false)
            ->assertSee('href="https://app.test/inbox"', false)
            ->assertDontSee('Release 1');
    }

    public function test_unknown_or_misdated_entries_are_not_found(): void
    {
        $this->fakeChangelog();

        $this->get('/changelog/2026-10-08-nope')->assertNotFound();
        $this->get('/changelog/2026-01-01-release-0')->assertNotFound();
    }

    public function test_oversized_changelog_slug_returns_not_found(): void
    {
        $this->fakeChangelog();

        $oversizedSlug = '2026-10-08-'.str_repeat('a', 200);
        $this->get('/changelog/'.$oversizedSlug)->assertNotFound();
    }

    public function test_rss_feed_lists_releases(): void
    {
        $this->fakeChangelog();

        $response = $this->get('/changelog/rss.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/rss+xml; charset=UTF-8');

        $xml = simplexml_load_string((string) $response->getContent());
        $this->assertNotFalse($xml);
        $this->assertCount(2, $xml->channel->item);
        $this->assertSame('Release 0', (string) $xml->channel->item[0]->title);
        $this->assertStringEndsWith('/changelog/2026-10-08-release-0', (string) $xml->channel->item[0]->link);
    }

    public function test_api_failure_shows_a_calm_empty_state(): void
    {
        Http::fake(['web.test/api/internal/changelog' => Http::response([], 500)]);

        $this->get('/changelog')->assertOk()->assertSee('can’t be loaded right now');
    }

    public function test_a_row_with_an_impossible_date_is_skipped_and_the_next_is_latest(): void
    {
        Http::fake(['web.test/api/internal/changelog' => Http::response(['data' => [
            ['id' => 'broken', 'date' => '2026-13-45', 'title' => 'Broken', 'summary' => '', 'body_html' => ''],
            ['id' => 'good', 'date' => '2026-10-01', 'title' => 'Good release', 'summary' => '', 'body_html' => ''],
        ]])]);

        $this->get('/changelog')
            ->assertOk()
            ->assertSee('Good release')
            ->assertDontSee('>Broken<', false)
            ->assertSee('changelog-dot is-latest', false);
    }

    public function test_an_absurd_page_number_is_not_found(): void
    {
        $this->fakeChangelog();

        $this->get('/changelog/page/99999999999999999999')->assertNotFound();
    }

    public function test_entry_page_is_unavailable_and_rss_empty_when_the_api_is_down(): void
    {
        Http::fake(['web.test/api/internal/changelog' => Http::response([], 500)]);

        $this->get('/changelog/2026-10-08-release-0')->assertServiceUnavailable();

        $xml = simplexml_load_string((string) $this->get('/changelog/rss.xml')->assertOk()->getContent());
        $this->assertNotFalse($xml);
        $this->assertCount(0, $xml->channel->item);
    }

    public function test_the_changelog_stays_public_in_waitlist_mode(): void
    {
        config()->set('marketing.waitlist_mode', true);
        $this->fakeChangelog();

        $this->get('/changelog')->assertOk()->assertSee('Release 0');
        $this->get('/changelog/2026-10-08-release-0')->assertOk();
        $this->get('/changelog/rss.xml')->assertOk();
    }
}
