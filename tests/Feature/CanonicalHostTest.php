<?php

namespace Tests\Feature;

use Tests\TestCase;

class CanonicalHostTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_www_redirects_permanently_to_the_bare_host(): void
    {
        $this->get('https://www.claryeo.com/')
            ->assertStatus(301)
            ->assertRedirect('https://claryeo.com/');
    }

    public function test_www_redirect_preserves_path_and_query(): void
    {
        $this->get('https://www.claryeo.com/guides/paye-tax-nigeria?utm_source=x&page=2')
            ->assertStatus(301)
            ->assertRedirect('https://claryeo.com/guides/paye-tax-nigeria?utm_source=x&page=2');
    }

    public function test_www_redirect_preserves_query_params_containing_www(): void
    {
        $this->get('https://www.claryeo.com/about?ref=https://www.external.com')
            ->assertStatus(301)
            ->assertRedirect('https://claryeo.com/about?ref=https://www.external.com');
    }

    public function test_bare_host_is_served_and_not_redirected(): void
    {
        $this->get('https://claryeo.com/')->assertOk();
    }

    /**
     * The redirect keys off the www. prefix, not a hardcoded domain, so it has
     * to hold for staging's host too.
     */
    public function test_www_redirect_applies_to_any_domain(): void
    {
        $this->get('https://www.staging.claryeo.com/about')
            ->assertStatus(301)
            ->assertRedirect('https://staging.claryeo.com/about');
    }

    /**
     * Guards the CORS bug this middleware exists to prevent: a host containing
     * "www" elsewhere must not be rewritten, or the redirect would mangle it.
     */
    public function test_host_merely_containing_www_is_untouched(): void
    {
        $this->get('https://wwwx.claryeo.com/')->assertOk();
    }
}
