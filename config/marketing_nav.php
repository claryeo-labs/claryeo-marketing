<?php

/*
|--------------------------------------------------------------------------
| Marketing navigation
|--------------------------------------------------------------------------
| Single source of truth for the public nav + footer. Rendered into the
| header island (Resources mega-menu) and the Antlers footer. Kept as config
| for now; this is the seam to swap for a Statamic-managed navigation once the
| blog collection exists (marketers edit it in the control panel).
*/

return [
    // Top-level header links (between the Features and Resources mega-menus).
    'primary' => [
        ['label' => 'Pricing', 'href' => '/pricing'],
        ['label' => 'Tax calculator', 'href' => '/tax-calculator'],
    ],

    // Resources mega-menu: a lead link, content columns, and support tiles.
    'resources' => [
        'lead' => ['label' => 'Blog', 'href' => '/blog'],
        'columns' => [
            [
                'title' => 'Blog',
                'links' => [
                    ['label' => 'Tax & compliance', 'href' => '/blog/category/tax'],
                    ['label' => 'Invoicing', 'href' => '/blog/category/invoicing'],
                    ['label' => 'Expenses', 'href' => '/blog/category/expenses'],
                    ['label' => 'Running a business', 'href' => '/blog/category/business'],
                    ['label' => 'Product updates', 'href' => '/blog/category/product'],
                    ['label' => 'Changelog', 'href' => '/changelog'],
                ],
            ],
            [
                'title' => 'Guides',
                'links' => [
                    ['label' => 'All guides', 'href' => '/guides'],
                    ['label' => 'PAYE tax in Nigeria', 'href' => '/guides/paye-tax-nigeria'],
                    ['label' => 'Small business tax', 'href' => '/guides/small-business-tax-nigeria'],
                    ['label' => 'Freelancer tax', 'href' => '/guides/freelancer-tax-nigeria'],
                    ['label' => 'Invoice guide', 'href' => '/guides/invoice-guide-nigeria'],
                ],
            ],
            [
                'title' => 'Tools',
                'links' => [
                    ['label' => 'Nigerian tax calculator', 'href' => '/tax-calculator'],
                    ['label' => 'Pricing & plans', 'href' => '/pricing'],
                ],
            ],
        ],
        'support' => [
            ['label' => 'Contact us', 'href' => '/contact', 'desc' => 'Talk to our team'],
            ['label' => 'Get started', 'href' => '/get-started', 'desc' => 'Pick a plan'],
        ],
    ],

    // Footer link groups (rendered server-side in Antlers).
    'footer' => [
        ['group' => 'Product', 'items' => [
            ['title' => 'Features', 'href' => '/features'],
            ['title' => 'Pricing', 'href' => '/pricing'],
            ['title' => 'Changelog', 'href' => '/changelog'],
            ['title' => 'Get started', 'href' => '/get-started'],
        ]],
        ['group' => 'Resources', 'items' => [
            ['title' => 'Blog', 'href' => '/blog'],
            ['title' => 'Guides', 'href' => '/guides'],
            ['title' => 'Tax calculator', 'href' => '/tax-calculator'],
            ['title' => 'PAYE Tax Guide', 'href' => '/guides/paye-tax-nigeria'],
            ['title' => 'Business Tax Guide', 'href' => '/guides/small-business-tax-nigeria'],
            ['title' => 'Freelancer Tax Guide', 'href' => '/guides/freelancer-tax-nigeria'],
            ['title' => 'Invoice Guide', 'href' => '/guides/invoice-guide-nigeria'],
        ]],
        ['group' => 'Company', 'items' => [
            ['title' => 'About', 'href' => '/about'],
            ['title' => 'Contact', 'href' => '/contact'],
        ]],
        ['group' => 'Legal', 'items' => [
            ['title' => 'Privacy', 'href' => '/privacy'],
            ['title' => 'Terms', 'href' => '/terms'],
            ['title' => 'Cookies', 'href' => '/cookies'],
        ]],
    ],

    // Social links (label + SVG path), mirrors resources/js/lib/social-links.ts.
    'social' => [
        ['label' => 'X/Twitter', 'href' => 'https://x.com/claryeoofficial', 'path' => 'M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z'],
        ['label' => 'LinkedIn', 'href' => 'https://www.linkedin.com/company/claryeo/', 'path' => 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z'],
        ['label' => 'Instagram', 'href' => 'https://instagram.com/claryeoofficial', 'path' => 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3'],
    ],
];
