import { CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react';
import type { FC } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InvoiceOverviewCardProps {
    invoiceCount: number;
    paidCount: number;
    overdueCount: number;
    pendingCount: number;
    outstanding: number;
    loading?: boolean;
    className?: string;
}

function CollectionBar({ rate }: { rate: number }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Collection Rate
                </span>
                <span className="font-mono text-[11px] font-bold text-foreground">
                    {rate}%
                </span>
            </div>
            <div
                role="progressbar"
                aria-label="Collection rate"
                aria-valuenow={rate}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full overflow-hidden rounded-full bg-border/80 ring-1 ring-border ring-inset"
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        rate >= 75
                            ? 'bg-green-500'
                            : rate >= 50
                              ? 'bg-orange-500'
                              : 'bg-destructive',
                    )}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                />
            </div>
        </div>
    );
}

const InvoiceOverviewCard: FC<InvoiceOverviewCardProps> = ({
    invoiceCount,
    paidCount,
    overdueCount,
    pendingCount,
    outstanding: _outstanding,
    loading = false,
    className,
}) => {
    const collectionRate =
        invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 100) : 0;

    if (loading) {
        return (
            <Card className={cn('h-full min-w-0', className)}>
                <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-4 h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="mb-6 h-10 w-20 animate-pulse rounded bg-muted" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-3 w-full animate-pulse rounded bg-muted"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('h-full min-w-0', className)}>
            <CardContent className="flex h-full flex-col p-5">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                        Invoices
                    </h2>
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                </div>

                {/* Big Number */}
                <div className="mb-1">
                    <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
                        {invoiceCount}
                    </span>
                </div>
                <p className="mb-5 text-xs text-muted-foreground">
                    Total invoices issued
                </p>

                {/* Status Breakdown */}
                <div className="mb-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-sm text-muted-foreground">
                                Paid
                            </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-foreground">
                            {paidCount}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-sm text-muted-foreground">
                                Pending
                            </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-foreground">
                            {pendingCount}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-sm text-muted-foreground">
                                Overdue
                            </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-destructive">
                            {overdueCount}
                        </span>
                    </div>
                </div>

                {/* Collection Rate Bar — pushed to bottom */}
                <div className="mt-auto">
                    <CollectionBar rate={collectionRate} />
                </div>
            </CardContent>
        </Card>
    );
};

export default InvoiceOverviewCard;
