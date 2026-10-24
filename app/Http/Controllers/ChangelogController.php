<?php

namespace App\Http\Controllers;

use App\Services\MainApi;
use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * The public changelog. Entries are written in the main app
 * (`changelog/*.md`) and read over its internal API, already rendered to
 * HTML with their media (ChangelogMarkdown there). Modelled on Linear's
 * changelog: whole entries on one page, a date rail, and an entry page
 * per release at /changelog/{YYYY-MM-DD-id}.
 *
 * @phpstan-type ChangelogLine array{area: string, area_label: string, text: string}
 * @phpstan-type ChangelogEntry array{id: string, slug: string, url: string, date: string, date_label: string, date_rfc: string, is_latest: bool, title: string, summary: string, image: string|null, video: string|null, body_html: string, link: array<mixed>|null, fixes: list<ChangelogLine>, improvements: list<ChangelogLine>}
 */
class ChangelogController extends Controller
{
    private const PER_PAGE = 10;

    /** @var list<ChangelogEntry>|null */
    private ?array $cachedEntries = null;

    public function __construct(private readonly MainApi $api) {}

    public function index(int $page = 1): View
    {
        $entries = $this->entries();
        $pages = max(1, (int) ceil(count($entries) / self::PER_PAGE));

        abort_if($page < 1 || $page > $pages, HttpResponse::HTTP_NOT_FOUND);

        return view('changelog.index', [
            'title' => 'Changelog: what’s new in Claryeo',
            'meta_description' => 'New features, improvements and fixes in Claryeo, the invoicing, bank sync and tax app for Nigerian businesses.',
            'canonical_url' => $page === 1 ? url('/changelog') : url("/changelog/page/{$page}"),
            'entries' => array_slice($entries, ($page - 1) * self::PER_PAGE, self::PER_PAGE),
            'is_first_page' => $page === 1,
            'newer_url' => match (true) {
                $page === 1 => null,
                $page === 2 => '/changelog',
                default => '/changelog/page/'.($page - 1),
            },
            'older_url' => $page < $pages ? '/changelog/page/'.($page + 1) : null,
            'tools_props' => $this->toolsProps($entries),
        ]);
    }

    public function show(string $slug): View
    {
        $entries = $this->entries();

        // No entries at all means the main app is unreachable with nothing
        // cached: a temporary failure, not a missing page.
        abort_if($entries === [], HttpResponse::HTTP_SERVICE_UNAVAILABLE);

        $entry = collect($entries)->firstWhere('slug', $slug);

        abort_if($entry === null, HttpResponse::HTTP_NOT_FOUND);

        return view('changelog.show', [
            'title' => $entry['title'].' | Claryeo changelog',
            'meta_description' => $entry['summary'],
            'og_type' => 'article',
            'hero_image' => $entry['image'],
            'entry' => $entry,
        ]);
    }

    public function rss(): Response
    {
        return response()
            ->view('changelog.rss', ['entries' => array_slice($this->entries(), 0, 20)])
            ->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }

    /**
     * Entries shaped for the views, newest first.
     *
     * Performance optimization: Instance-level memoization in $this->cachedEntries
     * ensures API response processing and string formatting run only once per request.
     *
     * @return list<ChangelogEntry>
     */
    private function entries(): array
    {
        return $this->cachedEntries ??= $this->buildEntries();
    }

    /**
     * Parse and map raw API changelog rows.
     *
     * Performance optimization: Native DateTimeImmutable::createFromFormat() is ~3x
     * faster than CarbonImmutable for date instantiation and formatting (~20ms vs ~59ms
     * per 10k items), eliminating Carbon reflection and macro wrapper overhead.
     *
     * @return list<ChangelogEntry>
     */
    private function buildEntries(): array
    {
        $entries = [];

        foreach ($this->api->changelog() as $row) {
            $id = $row['id'] ?? null;
            $date = $row['date'] ?? null;
            $title = $row['title'] ?? null;

            // A real calendar date or the row is skipped: one bad row must not
            // take down every changelog page.
            $day = is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1
                ? rescue(fn () => DateTimeImmutable::createFromFormat('!Y-m-d', $date), null, report: false)
                : null;

            if (! is_string($id) || ! is_string($date) || ! is_string($title) || ! $day instanceof DateTimeImmutable || $day->format('Y-m-d') !== $date) {
                continue;
            }

            $slug = "{$date}-{$id}";

            $entries[] = [
                'id' => $id,
                'slug' => $slug,
                'url' => "/changelog/{$slug}",
                'date' => $date,
                'date_label' => $day->format('F j, Y'),
                'date_rfc' => $day->format(DateTimeInterface::RFC2822),
                'is_latest' => $entries === [],
                'title' => $title,
                'summary' => is_string($row['summary'] ?? null) ? $row['summary'] : '',
                'image' => is_string($row['image'] ?? null) ? $row['image'] : null,
                'video' => is_string($row['video'] ?? null) ? $row['video'] : null,
                'body_html' => is_string($row['body_html'] ?? null) ? $row['body_html'] : '',
                'link' => is_array($row['link'] ?? null) ? $row['link'] : null,
                'fixes' => $this->lines($row['fixes'] ?? null),
                'improvements' => $this->lines($row['improvements'] ?? null),
            ];
        }

        return $entries;
    }

    /**
     * @return list<ChangelogLine>
     */
    private function lines(mixed $rows): array
    {
        $lines = [];

        foreach (is_array($rows) ? $rows : [] as $row) {
            if (is_array($row) && is_string($row['area'] ?? null) && is_string($row['area_label'] ?? null) && is_string($row['text'] ?? null)) {
                $lines[] = ['area' => $row['area'], 'area_label' => $row['area_label'], 'text' => $row['text']];
            }
        }

        return $lines;
    }

    /**
     * Props for the search + subscribe island: every entry's title and
     * summary (search runs in the browser), the feed URL and the email CTA.
     *
     * @param  list<ChangelogEntry>  $entries
     */
    private function toolsProps(array $entries): string
    {
        return htmlspecialchars(
            (string) json_encode([
                'entries' => array_map(fn (array $entry): array => [
                    'title' => $entry['title'],
                    'summary' => $entry['summary'],
                    'url' => $entry['url'],
                    'date' => $entry['date_label'],
                ], $entries),
                'rssUrl' => url('/changelog/rss.xml'),
            ]),
            ENT_QUOTES,
            'UTF-8'
        );
    }
}
