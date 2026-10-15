import type { FC } from 'react';
import { memo } from 'react';

/**
 * Performance optimization: Wrap static tax education content with React.memo()
 * to prevent unnecessary re-renders of this large static DOM tree during high-frequency
 * keystrokes and option toggles on TaxCalculatorPage.
 */
const TaxEducationContent: FC = memo(() => (
    <div className="mx-auto mt-16 max-w-4xl space-y-12 px-4 text-foreground">
        <section>
            <h2 className="t-display-3">
                Understanding Nigerian Tax
            </h2>
            <p className="t-body mt-4 text-muted-foreground">
                Nigeria operates a multi-layered tax system administered by the
                Federal Inland Revenue Service (FIRS) at the federal level and
                State Internal Revenue Services (SIRS) at the state level. The
                two main taxes that affect individuals and businesses are{' '}
                <strong className="text-foreground">
                    Personal Income Tax (PIT)
                </strong>
                , commonly collected through the Pay-As-You-Earn (PAYE) system
                for employees, and{' '}
                <strong className="text-foreground">
                    Companies Income Tax (CIT)
                </strong>{' '}
                for registered businesses.
            </p>
            <p className="t-body mt-3 text-muted-foreground">
                Freelancers and self-employed individuals are assessed under PIT
                using the same progressive tax bands as PAYE employees, but they
                file directly with their state tax authority. Understanding
                which tax applies to you is the first step toward staying
                compliant and avoiding penalties.
            </p>
        </section>

        <section>
            <h2 className="t-display-3">
                PAYE Tax Bands in Nigeria (2026)
            </h2>
            <p className="t-body mt-4 text-muted-foreground">
                Nigeria uses a progressive tax system under the Personal Income
                Tax Act (PITA). After deducting the Consolidated Relief
                Allowance (CRA) and other allowable reliefs, your taxable income
                is applied across the following bands:
            </p>
            <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th scope="col" className="px-4 py-3 text-left font-semibold">
                                Band
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">
                                Taxable Income (₦)
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">
                                Rate
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">1</td>
                            <td className="px-4 py-3">First 800,000</td>
                            <td className="px-4 py-3">0%</td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">2</td>
                            <td className="px-4 py-3">Next 2,200,000</td>
                            <td className="px-4 py-3">15%</td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">3</td>
                            <td className="px-4 py-3">Next 9,000,000</td>
                            <td className="px-4 py-3">18%</td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">4</td>
                            <td className="px-4 py-3">Next 13,000,000</td>
                            <td className="px-4 py-3">21%</td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">5</td>
                            <td className="px-4 py-3">Next 25,000,000</td>
                            <td className="px-4 py-3">23%</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3">6</td>
                            <td className="px-4 py-3">Above 50,000,000</td>
                            <td className="px-4 py-3">25%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                Employees earning at or below the national minimum wage
                (₦70,000/month or ₦840,000/year) are exempt from PAYE.
            </p>
        </section>

        <section>
            <h2 className="t-display-3">
                Company Income Tax (CIT) Rates
            </h2>
            <p className="t-body mt-4 text-muted-foreground">
                Companies registered in Nigeria are subject to CIT on their
                worldwide profits. The rate depends on company size, measured by
                annual turnover:
            </p>
            <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th scope="col" className="px-4 py-3 text-left font-semibold">
                                Company Size
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">
                                Annual Turnover
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">
                                CIT Rate
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">Small</td>
                            <td className="px-4 py-3">
                                ≤ ₦50,000,000 (with fixed assets ≤ ₦250,000,000)
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                                0%
                            </td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="px-4 py-3">Medium</td>
                            <td className="px-4 py-3">
                                ₦50,000,001 – ₦100,000,000
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                                20%
                            </td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3">Large</td>
                            <td className="px-4 py-3">&gt; ₦100,000,000</td>
                            <td className="px-4 py-3 font-medium text-foreground">
                                30%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                Professional service companies do not qualify for the small
                company 0% exemption. A 4% Development Levy applies to eligible
                companies. VAT is charged at 7.5% on taxable goods and services.
            </p>
        </section>

        <section>
            <h2 className="t-display-3">
                Tax Relief &amp; Deductions
            </h2>
            <p className="t-body mt-4 text-muted-foreground">
                Nigerian tax law provides several reliefs and deductions that
                reduce your taxable income:
            </p>
            <ul className="mt-4 space-y-3 text-base text-muted-foreground">
                <li className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                        <strong className="text-foreground">
                            Consolidated Relief Allowance (CRA):
                        </strong>{' '}
                        ₦200,000 or 1% of gross income (whichever is higher),
                        plus 20% of gross income. This is automatically deducted
                        before applying tax bands.
                    </span>
                </li>
                <li className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                        <strong className="text-foreground">
                            Pension Contribution:
                        </strong>{' '}
                        Employee contribution (typically 8% of basic, housing,
                        and transport) is tax-deductible under the Pension
                        Reform Act 2014.
                    </span>
                </li>
                <li className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                        <strong className="text-foreground">
                            National Housing Fund (NHF):
                        </strong>{' '}
                        2.5% of basic salary contributed by employees earning
                        above the national minimum wage.
                    </span>
                </li>
                <li className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                        <strong className="text-foreground">
                            Rent Relief:
                        </strong>{' '}
                        20% of annual rent paid, subject to conditions, up to
                        ₦500,000 per year.
                    </span>
                </li>
            </ul>
            <p className="mt-6 text-base text-muted-foreground">
                Want to learn more?{' '}
                <a
                    href="/guides/paye-tax-nigeria"
                    className="rounded-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Read our complete PAYE tax guide
                </a>{' '}
                or{' '}
                <a
                    href="/guides/freelancer-tax-nigeria"
                    className="rounded-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    see how freelancers handle tax in Nigeria
                </a>
                .
            </p>
        </section>
    </div>
));

TaxEducationContent.displayName = 'TaxEducationContent';

export default TaxEducationContent;
