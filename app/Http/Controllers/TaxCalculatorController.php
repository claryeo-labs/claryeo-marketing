<?php

namespace App\Http\Controllers;

use App\Http\Middleware\CaptureUtmParameters;
use App\Services\MainApi;
use App\Support\Faqs;
use App\Support\SalaryPages;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TaxCalculatorController extends Controller
{
    public function __construct(private readonly MainApi $api) {}

    public function show(): View
    {
        return view('tax-calculator', [
            'title' => 'Nigerian Tax Calculator 2026: PAYE, PIT & CIT | Claryeo',
            'meta_description' => 'Estimate your Nigerian PAYE or business tax in seconds on the 2026 tax bands, then email yourself the full breakdown. Free, no signup.',
            // Server-rendered fallback content + FAQPage schema.
            'faqs' => Faqs::get('taxCalculator'),
            'salary_pages' => SalaryPages::all(),
        ]);
    }

    /**
     * "Tax on ₦X monthly salary" landing page. Figures are precomputed by
     * scripts/generate-salary-pages.ts from the same engine the calculator
     * island uses, so these pages cannot drift from the product.
     */
    public function salary(string $slug): View
    {
        $page = SalaryPages::find($slug);

        abort_if($page === null, Response::HTTP_NOT_FOUND);

        $str = static fn (mixed $value): string => is_string($value) ? $value : '';

        $label = $str($page['label'] ?? null);
        $taxYear = $str($page['tax_year'] ?? null);

        return view('tax-pages.salary', [
            'title' => "Tax on {$label} Monthly Salary in Nigeria ({$taxYear}) | Claryeo",
            'meta_description' => ($page['is_exempt'] ?? false) === true
                ? "A {$label} monthly salary in Nigeria pays no PAYE under the {$taxYear} tax bands: it sits within the tax-free band. See the full breakdown."
                : sprintf(
                    'PAYE on a %s monthly salary in Nigeria is %s a month, leaving %s take-home. Full %s band breakdown.',
                    $label,
                    $str($page['monthly_tax_label'] ?? null),
                    $str($page['monthly_net_label'] ?? null),
                    $taxYear,
                ),
            'page' => $page,
            'all_pages' => SalaryPages::all(),
        ]);
    }

    /**
     * Proxy the (client-computed) estimate to the main app's internal API,
     * which emails the breakdown and stores the lead. Adds attribution.
     */
    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'consent_contact' => ['required', 'accepted'],
            'consent_marketing' => ['nullable', 'boolean'],
            'document_type' => ['nullable', 'string', 'max:255'],
            'payload' => ['required', 'array', 'max:50'],
        ]);

        $payload = [
            ...$validated,
            ...CaptureUtmParameters::resolve($request),
            'client_ip' => $request->ip(),
            'client_user_agent' => $request->userAgent(),
        ];

        $response = $this->api->submitTaxReport($payload);

        return response()->json($response->json() ?? [], $response->status());
    }
}
