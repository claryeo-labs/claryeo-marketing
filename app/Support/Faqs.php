<?php

namespace App\Support;

/**
 * Reads the FAQ bank shared with the frontend (resources/data/faqs.json) so
 * Antlers templates can render the same questions server-side, both as
 * fallback markup and as FAQPage JSON-LD.
 */
class Faqs
{
    /** @var array<string, list<array{question: string, answer: string}>>|null */
    private static ?array $cache = null;

    /**
     * @return list<array{question: string, answer: string}>
     */
    public static function get(string $key): array
    {
        self::$cache ??= self::load();

        return self::$cache[$key] ?? [];
    }

    /**
     * Load and parse FAQ sets from disk.
     *
     * Performance optimization: Static in-memory caching in self::$cache ensures
     * faqs.json is read from disk (file_get_contents) and JSON decoded only once per
     * process lifetime, eliminating redundant file I/O and parsing on every Faqs::get()
     * call across controllers and Antlers tags.
     *
     * @return array<string, list<array{question: string, answer: string}>>
     */
    private static function load(): array
    {
        $path = resource_path('data/faqs.json');

        if (! file_exists($path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (! is_array($decoded)) {
            return [];
        }

        $sets = [];

        foreach ($decoded as $key => $items) {
            if (! is_string($key) || ! is_array($items)) {
                continue;
            }

            $set = [];

            foreach ($items as $item) {
                if (is_array($item) && is_string($item['question'] ?? null) && is_string($item['answer'] ?? null)) {
                    $set[] = ['question' => $item['question'], 'answer' => $item['answer']];
                }
            }

            $sets[$key] = $set;
        }

        return $sets;
    }
}
