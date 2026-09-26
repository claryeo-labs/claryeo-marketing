<?php

use App\Http\Controllers\BlogViewController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\GetStartedController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\TaxCalculatorController;
use App\Http\Controllers\WaitlistController;
use App\Support\SalaryPages;
use App\Support\SiteMode;
use Illuminate\Support\Facades\Route;
use Statamic\Facades\Entry;
use Statamic\Stache\Query\EntryQueryBuilder;

Route::get('/', LandingController::class)->name('home');

Route::get('pricing', PricingController::class)->name('pricing');

Route::get('features', [FeatureController::class, 'index'])->name('features');
Route::get('features/{slug}', [FeatureController::class, 'show'])->name('features.show');

// Records a session-deduped view for the "Top Reads" ranking. Hit by a small
// client-side beacon on the post page; a distinct path from Statamic's native
// GET /blog/{slug} so there is no routing conflict.
Route::post('blog/{id}/view', BlogViewController::class)
    ->middleware('throttle:30,1')
    ->name('blog.view');

// Blog index + category filter. Individual posts (/blog/{slug}) are served
// natively by the Statamic `blog` collection route (template: blog/show).
Route::view('blog', 'blog.index', [
    'title' => 'Blog: Invoicing & Tax Guides for Nigerian Business | Claryeo',
    'meta_description' => 'Practical guides on invoicing, expenses, bank sync, and Nigerian tax for freelancers and small businesses. Written for the 2026 tax rules.',
    'activeCategory' => null,
])->name('blog');

Route::get('blog/category/{category}', function (string $category) {
    /** @var array<string, string> $categories */
    $categories = (array) config('marketing.blog_categories', []);

    abort_unless(array_key_exists($category, $categories), 404);

    return view('blog.index', [
        'title' => $categories[$category].' | Claryeo blog',
        'meta_description' => 'Claryeo blog posts on '.$categories[$category].'.',
        'activeCategory' => $category,
    ]);
})->name('blog.category');

Route::view('about', 'about', [
    'title' => 'About Claryeo: Business Finance Tools for Nigeria',
    'meta_description' => "Learn about Claryeo's mission to simplify invoicing, expenses, and tax for freelancers and small businesses, starting in Nigeria.",
])->name('about');

// Guides index. Individual guides (/guides/{slug}) are served natively by the
// Statamic `guides` collection route (template: guides/show).
Route::view('guides', 'guides.index', [
    'title' => 'Nigerian Tax & Invoicing Guides (2026) | Claryeo',
    'meta_description' => 'Long-form guides on PAYE, freelancer tax, small business tax (CIT and VAT), and invoicing in Nigeria. Written for the 2026 tax rules.',
])->name('guides');

// Glossary index. Individual terms (/glossary/{slug}) are served natively by
// the Statamic `glossary` collection route (template: glossary/show).
Route::view('glossary', 'glossary.index', [
    'title' => 'Nigerian Tax Glossary: PAYE, CIT, VAT & WHT | Claryeo',
    'meta_description' => 'Plain-English definitions of Nigerian tax terms: PAYE, PIT, CIT, VAT, WHT, TIN, rent relief and more, each with a worked example on the 2026 rules.',
])->name('glossary');

Route::get('get-started', GetStartedController::class)->name('get-started');

Route::get('tax-calculator', [TaxCalculatorController::class, 'show'])->name('taxCalculator');
Route::post('tax-calculator/report', [TaxCalculatorController::class, 'report'])->middleware('throttle:6,1')->name('taxCalculator.report.store');

// Precomputed "tax on ₦X salary" pages (see scripts/generate-salary-pages.ts).
// Constrained to the generated slugs so unknown values 404 rather than render.
Route::get('tax-calculator/{slug}', [TaxCalculatorController::class, 'salary'])
    ->where('slug', implode('|', SalaryPages::slugs()) ?: 'none')
    ->name('taxCalculator.salary');

Route::get('contact', [ContactController::class, 'show'])->name('contact');
Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:6,1')->name('contact.store');
Route::view('contact/thank-you', 'contact.thank-you', ['title' => 'Thank you | Claryeo'])->name('contact.thank-you');

/*
| Waitlist (ported from claryeo-waitlist). / serves its landing page in
| waitlist mode (LandingController). App\Http\Middleware\WaitlistTakeover
| redirects everything outside its allowlist to / while waitlist mode is on,
| and sends /quiz + /result to /get-started while it is off. The JSON routes
| are same-origin proxies to the main app's internal API.
*/
Route::get('quiz', [WaitlistController::class, 'quiz'])->name('waitlist.quiz');
Route::get('result', [WaitlistController::class, 'result'])->name('waitlist.result');
Route::get('waitlist/quiz', [WaitlistController::class, 'questions'])->name('waitlist.questions');
Route::get('waitlist/community', [WaitlistController::class, 'community'])->name('waitlist.community');
Route::post('waitlist', [WaitlistController::class, 'store'])->middleware('throttle:6,1')->name('waitlist.store');

/*
| Legal pages. Content + versioning are owned by the main Claryeo app and
| fetched via its internal API; these routes preserve the existing public
| slugs (/privacy, /terms, /cookies) so SEO and backlinks survive the split.
*/
foreach (['privacy', 'terms', 'cookies'] as $slug) {
    Route::get($slug.'/versions', [LegalController::class, 'versions'])
        ->defaults('slug', $slug)
        ->name($slug.'.versions');

    Route::get($slug, [LegalController::class, 'show'])
        ->defaults('slug', $slug)
        ->name($slug);

    Route::get($slug.'/{version}', [LegalController::class, 'show'])
        ->defaults('slug', $slug)
        ->where('version', '[a-zA-Z0-9\.\-]+')
        ->name($slug.'.version');
}

/*
| SEO: an XML sitemap of the public marketing surface (static slugs from config
| + published blog posts via the Statamic collection tag) and a host-aware
| robots.txt that only invites crawlers in production.
*/
Route::get('sitemap.xml', function (SiteMode $siteMode) {
    // Waitlist mode: every other page redirects to /, so only / and the legal
    // pages are real, indexable URLs.
    if ($siteMode->waitlist()) {
        return response()
            ->view('sitemap', [
                'urls' => array_map(fn (string $path): string => url($path), ['/', '/privacy', '/terms', '/cookies']),
                'include_collections' => false,
            ])
            ->header('Content-Type', 'application/xml');
    }

    $urls = ['/', '/features', '/about', '/tax-calculator', '/contact', '/blog', '/guides', '/glossary'];

    foreach (array_keys((array) config('feature_pages', [])) as $slug) {
        $urls[] = '/features/'.$slug;
    }

    foreach (array_keys((array) config('marketing.blog_categories', [])) as $category) {
        $urls[] = '/blog/category/'.$category;
    }

    foreach (SalaryPages::slugs() as $slug) {
        $urls[] = '/tax-calculator/'.$slug;
    }

    foreach (['privacy', 'terms', 'cookies'] as $slug) {
        $urls[] = '/'.$slug;
    }

    $urls[] = '/pricing';
    $urls[] = '/get-started';

    return response()
        ->view('sitemap', [
            'urls' => array_map(fn (string $path): string => url($path), $urls),
            'include_collections' => true,
        ])
        ->header('Content-Type', 'application/xml');
})->name('sitemap');

/*
| llms.txt (llmstxt.org): a plain-markdown site overview for AI assistants and
| agents. Non-Google engines (ChatGPT, Claude, Perplexity) parse it. Built from
| the same configs and collections as the sitemap so the two can't drift.
*/
Route::get('llms.txt', function () {
    $lines = [
        '# Claryeo',
        '',
        '> Invoicing, bank sync, expenses and tax software for Nigerian freelancers and small businesses. Sync your bank, match payments to invoices, and know your PIT, CIT and VAT automatically, using the 2026 Nigeria Tax Act rules. Rolling out in Nigeria first.',
        '',
        '## Product',
        '- [Features]('.url('/features').'): invoicing & receipts, bank sync, tax reports, AI assistant',
    ];

    foreach ((array) config('feature_pages', []) as $slug => $page) {
        $lines[] = '- ['.($page['title'] ?? $slug).']('.url('/features/'.$slug).')';
    }

    $lines[] = '- [Nigerian tax calculator]('.url('/tax-calculator').'): free PIT/PAYE and small-business tax calculator on the 2026 bands';
    $lines[] = '';
    $lines[] = '## Tax by salary';
    $lines[] = 'PAYE, take-home pay and the band-by-band breakdown for common Nigerian salaries, on the 2026 bands.';

    foreach (SalaryPages::all() as $page) {
        $lines[] = '- [Tax on '.$page['label'].' a month]('.url('/tax-calculator/'.$page['slug']).'): '
            .($page['is_exempt']
                ? 'no PAYE due'
                : $page['monthly_tax_label'].'/month PAYE, '.$page['monthly_net_label'].' take-home, '.$page['effective_rate_label'].' effective rate');
    }

    $lines[] = '';
    $lines[] = '## Guides';

    /** @var EntryQueryBuilder $guidesQuery */
    $guidesQuery = Entry::query()->where('collection', 'guides');
    foreach ($guidesQuery->whereStatus('published')->get() as $guide) {
        $lines[] = '- ['.$guide->get('title').']('.$guide->absoluteUrl().'): '.$guide->get('description');
    }

    $lines[] = '';
    $lines[] = '## Glossary';
    $lines[] = 'Plain-English definitions of Nigerian tax terms, each with a worked example.';

    /** @var EntryQueryBuilder $glossaryQuery */
    $glossaryQuery = Entry::query()->where('collection', 'glossary');
    foreach ($glossaryQuery->whereStatus('published')->get() as $term) {
        $lines[] = '- ['.$term->get('title').']('.$term->absoluteUrl().'): '.$term->get('definition');
    }

    $lines[] = '';
    $lines[] = '## Resources';
    $lines[] = '- [Blog]('.url('/blog').'): practical guides on invoicing, VAT, bank sync and Nigerian tax';
    $lines[] = '- [All guides]('.url('/guides').')';
    $lines[] = '- [Glossary]('.url('/glossary').')';
    $lines[] = '- [About]('.url('/about').')';
    $lines[] = '- [Contact]('.url('/contact').')';

    return response(implode("\n", $lines)."\n")->header('Content-Type', 'text/plain; charset=UTF-8');
})->name('llms');

Route::get('robots.txt', function () {
    $lines = app()->environment('production')
        ? ['User-agent: *', 'Allow: /', '', 'Sitemap: '.url('/sitemap.xml')]
        : ['User-agent: *', 'Disallow: /'];

    return response(implode("\n", $lines)."\n")->header('Content-Type', 'text/plain');
})->name('robots');
