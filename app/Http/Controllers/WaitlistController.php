<?php

namespace App\Http\Controllers;

use App\Http\Middleware\CaptureUtmParameters;
use App\Services\MainApi;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response as ClientResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The waitlist experience (ported from claryeo-waitlist) and its same-origin
 * proxies to the main app's internal API. The pages are only reachable in
 * waitlist mode (App\Http\Middleware\WaitlistTakeover); data, scoring and
 * community stats all live in the main app.
 */
class WaitlistController extends Controller
{
    /** Shown verbatim by the UI, which reads `detail` off every error body. */
    private const UNREACHABLE = 'We couldn’t reach Claryeo. Please try again in a moment.';

    private const HONEYPOT = 'Please try again.';

    public function __construct(private readonly MainApi $api) {}

    /**
     * Waitlist landing page (served at / in waitlist mode).
     */
    public function landing(): View
    {
        return view('waitlist.landing', [
            'title' => 'Claryeo. Less admin. More life.',
            'meta_description' => 'You build. We handle the busywork. Find your Claryeo fit, meet a community that gets it, and join the early-access waitlist.',
        ]);
    }

    public function quiz(): View
    {
        $quiz = $this->api->waitlistQuiz();

        return view('waitlist.quiz', [
            'title' => 'Find your clarity | Claryeo',
            'meta_description' => 'A few short steps about your business, your busywork and what you want back. About two minutes.',
            // Server-provided so the first question paints without a round
            // trip; the island falls back to GET /waitlist/quiz when empty.
            'island_props' => $this->props(['questions' => $quiz['questions'] ?? []]),
        ]);
    }

    public function result(): View
    {
        return view('waitlist.result', [
            'title' => 'Your Claryeo fit | Claryeo',
            'meta_description' => 'Your place on the early-access list, the feature picked for your priorities, and how the waitlist answered.',
            // Nothing here is meaningful without the visitor's own session.
            'noindex' => true,
        ]);
    }

    /**
     * GET /waitlist/quiz: the quiz questions.
     */
    public function questions(): JsonResponse
    {
        $quiz = $this->api->waitlistQuiz();

        return $quiz === null
            ? response()->json(['detail' => self::UNREACHABLE], 503)
            : response()->json($quiz);
    }

    /**
     * GET /waitlist/community: live aggregate stats, never cached.
     */
    public function community(): JsonResponse
    {
        try {
            $response = $this->relay($this->api->waitlistCommunity());
        } catch (ConnectionException) {
            $response = response()->json(['detail' => self::UNREACHABLE], 503);
        }

        return $response->header('Cache-Control', 'no-store');
    }

    /**
     * POST /waitlist: check the honeypot, add attribution, proxy to the main
     * app and relay its status + body unchanged (validation lives there).
     */
    public function store(Request $request): JsonResponse
    {
        // A real person never sees `website`; anything in it is a bot. Same
        // generic 422 the main app uses, and the API is never called.
        $honeypot = $request->input('website');
        if (is_string($honeypot) ? trim($honeypot) !== '' : $honeypot !== null) {
            return response()->json(['detail' => self::HONEYPOT], 422);
        }

        $payload = [
            ...$request->only(['name', 'email', 'company', 'answers', 'consent']),
            ...CaptureUtmParameters::resolve($request),
            'client_ip' => $request->ip(),
            'client_user_agent' => $request->userAgent(),
        ];

        try {
            return $this->relay($this->api->submitWaitlist($payload));
        } catch (ConnectionException) {
            return response()->json(['detail' => self::UNREACHABLE], 503);
        }
    }

    private function relay(ClientResponse $response): JsonResponse
    {
        return response()->json($response->json() ?? [], $response->status());
    }

    /**
     * @param  array<string, mixed>  $props
     */
    private function props(array $props): string
    {
        return htmlspecialchars((string) json_encode($props), ENT_QUOTES, 'UTF-8');
    }
}
