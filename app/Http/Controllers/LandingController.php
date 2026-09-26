<?php

namespace App\Http\Controllers;

use App\Services\MainApi;
use App\Support\Faqs;
use App\Support\SiteMode;
use Illuminate\Contracts\View\View;

class LandingController extends Controller
{
    public function __construct(
        private readonly MainApi $api,
        private readonly SiteMode $siteMode,
    ) {}

    /**
     * Home page. In waitlist mode the whole site is the waitlist, so / is its
     * landing page. Otherwise the marketing home: the plan catalog (for the
     * pricing showcase section) is owned by the main app and fetched
     * server-side via the internal API.
     */
    public function __invoke(WaitlistController $waitlist): View
    {
        if ($this->siteMode->waitlist()) {
            return $waitlist->landing();
        }

        $pricing = $this->api->pricing();

        return view('landing', [
            'title' => 'Claryeo | Invoicing, Bank Sync & Tax for Nigerian Freelancers',
            'meta_description' => 'Sync your bank, match payments to invoices, and know your PIT, CIT and VAT, automatically. Built for Nigerian freelancers and small businesses.',
            'nav_theme' => 'dark',
            // Server-rendered fallback content + FAQPage schema (see landing.antlers.html).
            // The hero CTA uses the shared primary_cta from AppServiceProvider::boot().
            'faqs' => Faqs::get('landing'),
            'island_props' => htmlspecialchars(
                (string) json_encode([
                    'plans' => $pricing['plans'] ?? [],
                    'waitlistMode' => false,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),
        ]);
    }
}
