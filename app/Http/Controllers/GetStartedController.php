<?php

namespace App\Http\Controllers;

use App\Services\MainApi;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class GetStartedController extends Controller
{
    public function __construct(private readonly MainApi $api) {}

    /**
     * Plan-selection page. Plans come from the main app's internal API; the
     * island lets the visitor pick a plan/interval and then hands off to the
     * app's /start endpoint (cross-domain), which validates the choice, stores
     * it (PlanMemoryService), and routes into registration/billing. Marketing
     * keeps no plan state of its own.
     */
    public function __invoke(Request $request): View
    {
        $pricing = $this->api->pricing();

        $rawPlan = $request->query('plan');
        $rawInterval = $request->query('billing_interval');

        // Sanitize and validate query parameters before forwarding to island props
        $initialPlan = is_string($rawPlan) && preg_match('/^[a-zA-Z0-9_\-]{1,32}$/', $rawPlan) === 1
            ? $rawPlan
            : null;

        $initialInterval = is_string($rawInterval) && in_array($rawInterval, ['monthly', 'annual'], true)
            ? $rawInterval
            : null;

        return view('get-started', [
            'title' => 'Get Started | Claryeo',
            'meta_description' => 'Choose a plan and start managing your invoices, expenses, and taxes with Claryeo. Free and Pro plans available.',
            'island_props' => htmlspecialchars(
                (string) json_encode([
                    'plans' => $pricing['plans'] ?? [],
                    'appUrl' => rtrim(Config::string('services.claryeo_app.url'), '/'),
                    'contactUrl' => '/contact',
                    'initialPlan' => $initialPlan,
                    'initialInterval' => $initialInterval,
                ]),
                ENT_QUOTES,
                'UTF-8'
            ),
        ]);
    }
}
