<?php

namespace App\Http\Controllers;

use App\Http\Middleware\CaptureUtmParameters;
use App\Services\MainApi;
use App\Support\Faqs;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContactController extends Controller
{
    public function __construct(private readonly MainApi $api) {}

    public function show(): View
    {
        return view('contact', [
            'title' => 'Contact the Claryeo Team | Invoicing & Tax Support',
            'meta_description' => 'Questions about invoicing, bank sync, or Nigerian tax in Claryeo? Message the team and get a reply within one business day.',
            // Server-rendered fallback content + FAQPage schema.
            'faqs' => Faqs::get('contact'),
        ]);
    }

    /**
     * Proxy the submission to the main app's internal API and relay its
     * response (201 on success, 422 with validation errors) to the island.
     */
    public function store(Request $request): JsonResponse
    {
        // Validated here as well as in the main app so the limits the form
        // enforces (the 1000-char counter, the optional phone) can't drift
        // from what gets proxied. Keep MESSAGE_MAX in the contact island and
        // the main app's ContactRequest in step with these rules.
        $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'message' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $payload = [
            ...$request->only(['first_name', 'last_name', 'email', 'phone', 'message']),
            ...CaptureUtmParameters::resolve($request),
            'client_ip' => $request->ip(),
            'client_user_agent' => Str::limit((string) $request->userAgent(), 512, ''),
        ];

        $response = $this->api->submitContact($payload);

        return response()->json($response->json() ?? [], $response->status());
    }
}
