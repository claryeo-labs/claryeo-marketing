<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BlogPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_index_lists_published_posts(): void
    {
        $this->get('/blog')
            ->assertOk()
            ->assertSee('Latest')
            ->assertSee('Most read')
            ->assertSee('VAT for Nigerian small businesses')
            ->assertSee('5 invoicing mistakes that delay your payments');
    }

    public function test_index_renders_category_filter_chips(): void
    {
        $this->get('/blog')
            ->assertOk()
            ->assertSee('/blog/category/invoicing', false)
            ->assertSee('Invoicing')
            ->assertSee('/blog/category/tax', false);
    }

    public function test_category_filters_to_matching_posts(): void
    {
        $response = $this->get('/blog/category/invoicing');

        $response->assertOk()
            ->assertSee('5 invoicing mistakes that delay your payments')
            ->assertDontSee('VAT for Nigerian small businesses');
    }

    public function test_unknown_category_is_not_found(): void
    {
        $this->get('/blog/category/does-not-exist')->assertNotFound();
    }

    public function test_invalid_or_oversized_category_parameter_is_not_found(): void
    {
        $oversizedCategory = str_repeat('a', 70);

        $this->get('/blog/category/invalid%20category!')->assertNotFound();
        $this->get('/blog/category/<script>alert(1)</script>')->assertNotFound();
        $this->get("/blog/category/{$oversizedCategory}")->assertNotFound();
    }

    public function test_single_post_renders_content(): void
    {
        $this->get('/blog/vat-for-nigerian-small-businesses')
            ->assertOk()
            ->assertSee('VAT for Nigerian small businesses')
            ->assertSee('Journal')
            // markdown body rendered to HTML
            ->assertSee('Do you even need to charge VAT?');
    }

    public function test_unknown_post_is_not_found(): void
    {
        $this->get('/blog/nope')->assertNotFound();
    }

    public function test_recording_a_view_increments_the_counter(): void
    {
        $this->post('/blog/blog-vat-nigerian-small-businesses/view')
            ->assertNoContent();

        $this->assertDatabaseHas('post_views', [
            'entry_id' => 'blog-vat-nigerian-small-businesses',
            'views' => 1,
        ]);
    }

    public function test_a_repeat_view_in_the_same_session_is_not_counted(): void
    {
        $this->withSession(['blog_viewed_blog-vat-nigerian-small-businesses' => true])
            ->post('/blog/blog-vat-nigerian-small-businesses/view')
            ->assertNoContent();

        $this->assertDatabaseMissing('post_views', [
            'entry_id' => 'blog-vat-nigerian-small-businesses',
        ]);
    }

    public function test_views_are_not_recorded_for_unknown_entries(): void
    {
        $this->post('/blog/not-a-real-entry/view')->assertNoContent();

        $this->assertDatabaseMissing('post_views', ['entry_id' => 'not-a-real-entry']);
    }

    public function test_views_are_not_recorded_for_invalid_or_oversized_entry_ids(): void
    {
        $oversizedId = str_repeat('a', 150);

        $this->post('/blog/invalid%20entry!/view')->assertNoContent();
        $this->post("/blog/{$oversizedId}/view")->assertNoContent();

        $this->assertDatabaseMissing('post_views', ['entry_id' => 'invalid entry!']);
        $this->assertDatabaseMissing('post_views', ['entry_id' => $oversizedId]);
    }

    public function test_view_tracking_can_be_disabled_via_config(): void
    {
        config(['marketing.view_tracking' => false]);

        $this->post('/blog/blog-vat-nigerian-small-businesses/view')
            ->assertNoContent();

        $this->assertDatabaseMissing('post_views', [
            'entry_id' => 'blog-vat-nigerian-small-businesses',
        ]);
    }

    public function test_top_reads_are_ranked_by_view_count(): void
    {
        // Give the OLDEST post the most views; without ranking it would never
        // appear in the Most read section.
        DB::table('post_views')->insert([
            ['entry_id' => 'blog-bank-sync-vs-manual-bookkeeping', 'views' => 100, 'last_viewed_at' => now()],
            ['entry_id' => 'blog-vat-nigerian-small-businesses', 'views' => 50, 'last_viewed_at' => now()],
            ['entry_id' => 'blog-invoicing-mistakes-delay-payments', 'views' => 25, 'last_viewed_at' => now()],
        ]);

        $this->get('/blog')
            ->assertOk()
            ->assertSeeInOrder([
                'Most read',
                'Bank sync vs. manual bookkeeping',
            ]);
    }

    public function test_top_reads_fall_back_to_recent_posts_without_views(): void
    {
        $this->get('/blog')
            ->assertOk()
            ->assertSee('Most read')
            // With no recorded views, the block fills with recent posts.
            ->assertSeeInOrder([
                'Most read',
                'Search posts',
            ]);
    }

    public function test_related_posts_are_filtered_by_category(): void
    {
        // VAT post is in the "tax" category. Related should show a tax sibling
        // and never an invoicing-only post.
        $this->get('/blog/vat-for-nigerian-small-businesses')
            ->assertOk()
            ->assertSee('Keep reading')
            ->assertSee('Separate but Equal')
            ->assertDontSee('5 invoicing mistakes that delay your payments');
    }
}
