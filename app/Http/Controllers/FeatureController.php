<?php

namespace App\Http\Controllers;

use App\Support\SiteMode;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class FeatureController extends Controller
{
    /**
     * Features overview: a card per feature linking to its dedicated page.
     */
    public function index(): View
    {
        /** @var array<string, array<string, mixed>> $featurePages */
        $featurePages = Config::array('feature_pages', []);
        $features = [];

        // Performance optimization: Parse feature pages in a single-pass foreach loop instead of
        // instantiating Laravel Collection objects with multi-stage map/filter/values pipelines.
        // Bypasses wrapper allocations and closure dispatch overhead on /features page renders.
        foreach ($featurePages as $f) {
            $slug = is_string($f['slug'] ?? null) ? $f['slug'] : '';
            $title = is_string($f['title'] ?? null) ? $f['title'] : '';

            if ($slug === '' || $title === '') {
                continue;
            }

            $features[] = [
                'slug' => $slug,
                'title' => $title,
                'eyebrow' => is_string($f['eyebrow'] ?? null) ? $f['eyebrow'] : '',
                'tagline' => is_string($f['tagline'] ?? null) ? $f['tagline'] : '',
                'body' => is_string($f['heroParagraph'] ?? null) ? $f['heroParagraph'] : '',
                'highlight' => $this->firstHighlight($f['highlights'] ?? null),
                'badge' => $f['badge'] ?? null,
                'href' => '/features/'.$slug,
            ];
        }

        return view('features', [
            'title' => 'Features: Invoicing, Bank Sync & Tax Software | Claryeo',
            'meta_description' => 'Invoicing, bank sync, tax & reports, and an AI assistant: everything you need to run your business, in one place.',
            // Raw array for the server-rendered fallback markup; JSON blob for the island.
            'features' => $features,
            'island_props' => htmlspecialchars(
                (string) json_encode(['features' => $features]),
                ENT_QUOTES,
                'UTF-8'
            ),
        ]);
    }

    /**
     * "12k invoices sent" style stat from the first highlight, or null when the
     * entry has no usable highlights.
     */
    private function firstHighlight(mixed $highlights): ?string
    {
        if (! is_array($highlights) || ! is_array($highlights[0] ?? null)) {
            return null;
        }

        $value = $highlights[0]['value'] ?? null;
        $label = $highlights[0]['label'] ?? null;

        return is_string($value) && is_string($label) ? $value.' '.$label : null;
    }

    /**
     * Render an individual feature page from config/feature_pages.php via the
     * shared feature-page island. The CTA honours waitlist mode.
     */
    public function show(SiteMode $siteMode, string $slug): View
    {
        // Validate $slug length and format before querying configuration
        abort_if(strlen($slug) > 64 || preg_match('/^[a-zA-Z0-9\-_]+$/', $slug) !== 1, Response::HTTP_NOT_FOUND);

        /** @var array<string, array<string, mixed>> $featurePages */
        $featurePages = Config::array('feature_pages', []);

        abort_unless(array_key_exists($slug, $featurePages), Response::HTTP_NOT_FOUND);

        $feature = $featurePages[$slug];
        /** @var array{title: string, heroParagraph: string, slug: string} $feature */
        $waitlistMode = $siteMode->waitlist();
        $cta = $waitlistMode
            ? ['label' => 'Join the waitlist', 'href' => '/quiz']
            : ['label' => 'Get started', 'href' => '/get-started'];

        return view('feature', [
            'title' => $feature['title'].' | Claryeo',
            'meta_description' => $feature['heroParagraph'],
            // Raw array for the server-rendered fallback markup; JSON blob for the island.
            'feature' => $feature,
            'cta' => $cta,
            'island_props' => htmlspecialchars(
                (string) json_encode([
                    'feature' => $feature,
                    'waitlistMode' => $waitlistMode,
                    'cta' => $cta,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),
        ]);
    }
}
