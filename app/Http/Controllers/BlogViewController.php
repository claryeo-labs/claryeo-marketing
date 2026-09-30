<?php

namespace App\Http\Controllers;

use App\Services\PostViews;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Statamic\Entries\Entry as EntryItem;
use Statamic\Facades\Entry;

class BlogViewController extends Controller
{
    /**
     * Record a (session-deduped) view for a blog entry. Called by a small
     * client-side beacon on the post page. Always returns 204 so the beacon
     * stays silent regardless of outcome.
     */
    public function __invoke(Request $request, string $id, PostViews $views): Response
    {
        if (! config('marketing.view_tracking')) {
            return response()->noContent();
        }

        // Validate $id length and character set to prevent session pollution or untrusted input processing
        if (strlen($id) > 128 || preg_match('/^[a-zA-Z0-9\-_]+$/', $id) !== 1) {
            return response()->noContent();
        }

        $key = 'blog_viewed_'.$id;

        if ($request->session()->has($key)) {
            return response()->noContent();
        }

        $entry = Entry::find($id);

        if ($entry instanceof EntryItem && $entry->collectionHandle() === 'blog' && $entry->published()) {
            $views->record($entry->id());
            $request->session()->put($key, true);
        }

        return response()->noContent();
    }
}
