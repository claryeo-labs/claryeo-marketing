<?php

namespace Tests\Unit;

use App\Http\Middleware\CaptureUtmParameters;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CaptureUtmParametersTest extends TestCase
{
    public function test_captures_utm_parameters_from_query_and_stores_in_session(): void
    {
        $middleware = new CaptureUtmParameters;
        $request = Request::create('/?utm_source=Google&utm_medium=CPC&ignored_param=123', 'GET');
        $request->setLaravelSession($this->app['session']->driver());

        $response = $middleware->handle($request, fn ($req): Response => response('OK'));

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertTrue($request->session()->has(CaptureUtmParameters::SESSION_KEY));
        $this->assertEquals([
            'utm_source' => 'google',
            'utm_medium' => 'cpc',
        ], $request->session()->get(CaptureUtmParameters::SESSION_KEY));
    }

    public function test_resolves_utm_parameters_from_session_first(): void
    {
        $request = Request::create('/?utm_source=Twitter', 'GET');
        $request->setLaravelSession($this->app['session']->driver());
        $request->session()->put(CaptureUtmParameters::SESSION_KEY, [
            'utm_source' => 'facebook',
            'utm_campaign' => 'spring_sale',
        ]);

        $resolved = CaptureUtmParameters::resolve($request);

        $this->assertEquals([
            'utm_source' => 'facebook',
            'utm_campaign' => 'spring_sale',
        ], $resolved);
    }

    public function test_resolves_from_query_when_session_is_empty(): void
    {
        $request = Request::create('/?gclid=XYZ123&fbclid=ABC456', 'GET');
        $request->setLaravelSession($this->app['session']->driver());

        $resolved = CaptureUtmParameters::resolve($request);

        $this->assertEquals([
            'gclid' => 'xyz123',
            'fbclid' => 'abc456',
        ], $resolved);
    }
}
