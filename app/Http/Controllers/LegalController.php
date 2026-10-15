<?php

namespace App\Http\Controllers;

use App\Services\MainApi;
use Illuminate\Contracts\View\View;
use Symfony\Component\HttpFoundation\Response;

class LegalController extends Controller
{
    /**
     * Public slug => display title. Mirrors the main app's LegalDocumentType.
     */
    private const TITLES = [
        'privacy' => 'Privacy Policy',
        'terms' => 'Terms of Service',
        'cookies' => 'Cookie Policy',
    ];

    public function __construct(private readonly MainApi $api) {}

    /**
     * Render the current (or a specific archived) version of a legal document.
     * Content is authored on, and versioned by, the main Claryeo app; the
     * island renders the raw markdown and derives its own table of contents.
     */
    public function show(string $slug, ?string $version = null): View
    {
        abort_unless(isset(self::TITLES[$slug]), Response::HTTP_NOT_FOUND);

        if ($version !== null) {
            // Defense in depth against path traversal or malicious input forwarding to internal API
            abort_unless(strlen($version) <= 64 && preg_match('/^[a-zA-Z0-9\.\-]+$/', $version) === 1, Response::HTTP_NOT_FOUND);
        }

        $document = $version !== null
            ? $this->api->legalDocumentVersion($slug, $version)
            : $this->api->legalDocument($slug);

        abort_if($document === null, Response::HTTP_NOT_FOUND);

        $resolvedVersion = is_string($document['version'] ?? null) ? $document['version'] : '';
        $body = is_string($document['body'] ?? null) ? $document['body'] : '';

        $versionData = $this->api->legalVersions($slug);
        $currentVersion = is_array($versionData) && is_string($versionData['currentVersion'] ?? null)
            ? $versionData['currentVersion']
            : null;

        return view('legal.document', [
            'title' => self::TITLES[$slug],
            'island_props' => htmlspecialchars(
                (string) json_encode([
                    'slug' => $slug,
                    'title' => self::TITLES[$slug],
                    'body' => $body,
                    'meta' => $document['meta'] ?? [],
                    'version' => $resolvedVersion,
                    'currentVersion' => $currentVersion,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),
        ]);
    }

    /**
     * Render the version history for a legal document.
     */
    public function versions(string $slug): View
    {
        abort_unless(isset(self::TITLES[$slug]), Response::HTTP_NOT_FOUND);

        $data = $this->api->legalVersions($slug);

        abort_if($data === null, Response::HTTP_NOT_FOUND);

        $current = $data['currentVersion'] ?? null;

        /** @var array<int, array{version?: string}&array<string, mixed>> $versionData */
        $versionData = $data['versions'] ?? [];

        $versions = collect($versionData)
            ->map(function (array $entry) use ($slug, $current): array {
                $entry['url'] = ($entry['version'] ?? null) === $current
                    ? "/{$slug}"
                    : "/{$slug}/".($entry['version'] ?? '');

                return $entry;
            })
            ->values()
            ->all();

        return view('legal.versions', [
            'title' => self::TITLES[$slug],
            'island_props' => htmlspecialchars(
                (string) json_encode([
                    'slug' => $slug,
                    'title' => self::TITLES[$slug],
                    'versions' => $versions,
                    'currentVersion' => $current,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),
        ]);
    }
}
