<?php

namespace App\Http\Controllers;

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
        $str = static fn (mixed $v): string => is_string($v) ? $v : '';

        // Nullish reads: a malformed config entry should drop one card, not
        // take down /features (see AppServiceProvider::boot for the same rule).
        $features = collect($featurePages)
            ->map(fn (array $f): array => [
                'slug' => $str($f['slug'] ?? null),
                'title' => $str($f['title'] ?? null),
                'eyebrow' => $str($f['eyebrow'] ?? null),
                'tagline' => $str($f['tagline'] ?? null),
                'body' => $str($f['heroParagraph'] ?? null),
                'highlight' => $this->firstHighlight($f['highlights'] ?? null),
                'badge' => $f['badge'] ?? null,
            ])
            ->filter(fn (array $f): bool => $f['slug'] !== '' && $f['title'] !== '')
            ->map(fn (array $f): array => [
                ...$f,
                'href' => '/features/'.$f['slug'],
            ])
            ->values()
            ->all();

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
    public function show(string $slug): View
    {
        /** @var array<string, mixed> $featurePages */
        $featurePages = Config::array('feature_pages', []);

        abort_unless(array_key_exists($slug, $featurePages), Response::HTTP_NOT_FOUND);

        $feature = $featurePages[$slug];

        abort_if(! is_array($feature), Response::HTTP_NOT_FOUND);
        /** @var array{title: string, heroParagraph: string, slug: string} $feature */
        $waitlistMode = (bool) config('marketing.waitlist_mode');
        $cta = $waitlistMode
            ? ['label' => 'Join the waitlist', 'href' => '/waitlist']
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
