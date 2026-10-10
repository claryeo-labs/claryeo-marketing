import { ArrowUpRight, Bell, Mail, MessageCircle } from 'lucide-react';
import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import DashboardIncomeExpenseChart from '@/components/dashboard/dashboard-income-expense-chart';
import InvoiceOverviewCard from '@/components/dashboard/invoice-overview-card';
import { formatCurrency } from '@/lib/utils';

type BentoCardProps = {
    eyebrow: string;
    title: string;
    description: string;
    href?: string;
    className?: string;
    children: ReactNode;
};

/**
 * One card, one frame. The preview inside is separated by a rule rather than
 * a second border -- a card holding another bordered card is the thing that
 * makes feature grids read as filler.
 */
const BentoCard: FC<BentoCardProps> = ({
    eyebrow,
    title,
    description,
    href,
    className = '',
    children,
}) => {
    const Wrapper = href ? 'a' : 'div';

    return (
        <Wrapper
            {...(href ? { href } : {})}
            className={`group relative flex flex-col overflow-hidden rounded-xl border border-ink-border bg-ink-raised p-6 transition-colors duration-300 md:p-8 ${href ? 'hover:border-dawn/40' : ''} ${className}`}
        >
            <span className="t-label text-mist">
                {eyebrow}
            </span>
            <h3 className="t-display-3 mt-3 max-w-sm text-paper">
                {title}
            </h3>
            <p className="t-body-sm mt-2 max-w-sm text-mist">{description}</p>
            <div className="mt-6 border-t border-ink-border pt-6">{children}</div>
            {href && (
                <ArrowUpRight className="absolute top-6 right-6 size-4 text-mist transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-dawn" />
            )}
        </Wrapper>
    );
};

/** A ruled ledger row: label left, figure right, both aligned on the rule. */
function Row({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-ink-border py-2.5 last:border-b-0">
            <span className="flex items-center gap-2 text-sm text-mist">
                {icon}
                {label}
            </span>
            <span className="t-mono text-sm text-paper">{value}</span>
        </div>
    );
}

const INCOME_EXPENSE_DATA = [
    { month: '2026-03', income: 1_120_000, expenses: 640_000 },
    { month: '2026-04', income: 980_000, expenses: 710_000 },
    { month: '2026-05', income: 1_340_000, expenses: 690_000 },
    { month: '2026-06', income: 1_260_000, expenses: 820_000 },
    { month: '2026-07', income: 1_580_000, expenses: 760_000 },
    { month: '2026-08', income: 1_720_000, expenses: 890_000 },
];

function TaxPanel() {
    return (
        <div>
            <Row label="Estimated PIT" value={formatCurrency(212_400, 'NGN', { compact: true })} />
            <Row label="VAT payable" value={formatCurrency(58_900, 'NGN', { compact: true })} />
            <p className="mt-4 text-xs text-mist">
                Calculated from income and expenses already synced from your bank.
            </p>
        </div>
    );
}

function NotificationsPanel() {
    const items = [
        { icon: Mail, label: 'Invoice #014 delivered', time: '2m', unread: true },
        { icon: MessageCircle, label: 'Payment reminder sent · WhatsApp', time: '1h', unread: true },
        { icon: Bell, label: 'Payment matched to invoice #014', time: '3h', unread: false },
    ];

    return (
        <div>
            {items.map(({ icon: Icon, label, time, unread }) => (
                <div
                    key={label}
                    className="flex items-center gap-3 border-b border-ink-border py-3 last:border-b-0"
                >
                    <Icon className={`size-3.5 shrink-0 ${unread ? 'text-dawn' : 'text-mist'}`} />
                    <span className="min-w-0 flex-1 truncate text-sm text-paper">{label}</span>
                    <span className="shrink-0 t-mono text-[10px] text-mist">{time}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * Performance optimization: Wrap static ProductBento grid with React.memo()
 * to prevent unnecessary re-renders of heavy sub-trees (including DashboardIncomeExpenseChart
 * and InvoiceOverviewCard) during landing page parent re-renders.
 */
const ProductBento: FC = memo(function ProductBento() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <BentoCard
                eyebrow="Invoices & documents"
                title="Send it, track it, get paid for it"
                description="This is the actual invoice card from your dashboard: same numbers, same layout, once you're in."
                href="/features/invoicing"
            >
                <InvoiceOverviewCard invoiceCount={23} paidCount={18} pendingCount={4} overdueCount={1} outstanding={0} />
            </BentoCard>

            <BentoCard
                eyebrow="Bank sync"
                title="Every account, one balance"
                description="Transactions land the moment they clear your bank, plotted on the same chart you'll see after signup."
                className="md:col-span-2"
            >
                <DashboardIncomeExpenseChart config={{ data: INCOME_EXPENSE_DATA }} />
            </BentoCard>

            <BentoCard
                eyebrow="Tax"
                title="Know what you owe"
                description="PIT, VAT and CIT estimates that update as your books do."
                href="/tax-calculator"
            >
                <TaxPanel />
            </BentoCard>

            <BentoCard
                eyebrow="Notifications"
                title="Updates where you already look"
                description="In-app, email or WhatsApp: you pick where invoice and payment news lands."
                className="md:col-span-2"
            >
                <NotificationsPanel />
            </BentoCard>
        </div>
    );
});

ProductBento.displayName = 'ProductBento';

export default ProductBento;
