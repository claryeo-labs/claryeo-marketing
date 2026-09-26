<?php

namespace Tests\Unit;

use App\Http\Middleware\CaptureUtmParameters;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CaptureUtmParametersTest extends TestCase
{
    public function test_extracts_and_normalizes_utm_parameters_from_query(): void
    {
        $request = Request::create('/?utm_source=Google&utm_medium=CPC&other=ignore', 'GET');
        $request->setLaravelSession($this->app['session']->driver('array'));

        $middleware = new CaptureUtmParameters;
        $middleware->handle($request, fn (Request $req): Response => new Response);

        $resolved = CaptureUtmParameters::resolve($request);

        $this->assertEquals([
            'utm_source' => 'google',
            'utm_medium' => 'cpc',
        ], $resolved);
    }

    public function test_returns_empty_array_when_no_query_parameters_exist(): void
    {
        $request = Request::create('/', 'GET');
        $request->setLaravelSession($this->app['session']->driver('array'));

        $middleware = new CaptureUtmParameters;
        $middleware->handle($request, fn (Request $req): Response => new Response);

        $resolved = CaptureUtmParameters::resolve($request);

        $this->assertEmpty($resolved);
    }

    public function test_ignores_non_tracked_query_parameters(): void
    {
        $request = Request::create('/?foo=bar&baz=qux', 'GET');
        $request->setLaravelSession($this->app['session']->driver('array'));

        $middleware = new CaptureUtmParameters;
        $middleware->handle($request, fn (Request $req): Response => new Response);

        $resolved = CaptureUtmParameters::resolve($request);

        $this->assertEmpty($resolved);
    }

    public function test_skips_processing_if_session_already_has_utm_parameters(): void
    {
        $session = $this->app['session']->driver('array');
        $session->put(CaptureUtmParameters::SESSION_KEY, ['utm_source' => 'facebook']);

        $request = Request::create('/?utm_source=google', 'GET');
        $request->setLaravelSession($session);

        $middleware = new CaptureUtmParameters;
        $middleware->handle($request, fn (Request $req): Response => new Response);

        $resolved = CaptureUtmParameters::resolve($request);

        // Session parameter 'facebook' takes precedence over request query 'google'
        $this->assertEquals([
            'utm_source' => 'facebook',
        ], $resolved);
    }
}
