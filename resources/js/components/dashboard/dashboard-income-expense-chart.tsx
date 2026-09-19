'use client';

import { useId, useMemo } from 'react';
import type { FC } from 'react';
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';

import type { DashboardIncomeExpenseChartProps } from './dashboard-income-expense-chart.types';

const chartConfig = {
    income: {
        label: 'Income',
        color: 'var(--chart-income)',
    },
    incomeArea: {
        label: 'Income',
        color: 'var(--chart-income)',
    },
    expenses: {
        label: 'Expenses',
        color: 'var(--chart-expense)',
    },
} satisfies ChartConfig;

// Module-level cache to eliminate repeated Date object instantiations and
// toLocaleDateString calls for identical month key strings ("YYYY-MM").
const monthLabelCache = new Map<string, string>();

function formatMonthLabel(monthKey: string): string {
    const cached = monthLabelCache.get(monthKey);
    if (cached !== undefined) {
        return cached;
    }

    const [y, m] = monthKey.split('-');
    const date = new Date(Number(y), Number(m) - 1);
    const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
    });
    monthLabelCache.set(monthKey, formatted);
    return formatted;
}

interface TooltipPayload {
    dataKey: string;
    value: number;
    color: string;
    payload: { month: string; income: number; expenses: number };
}

interface IncomeExpenseTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}

const IncomeExpenseTooltip: FC<IncomeExpenseTooltipProps> = ({
    active,
    payload,
}) => {
    if (!active || !payload?.length) {
        return null;
    }

    const filtered = payload.filter((p) => p.dataKey !== 'incomeArea');
    const item = payload[0]?.payload;
    const monthLabel = item?.month ? formatMonthLabel(item.month) : '';

    return (
        <div className="min-w-[180px] rounded-lg border bg-popover p-3 shadow-sm shadow-black/5">
            <div className="mb-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {monthLabel}
            </div>
            <div className="space-y-2">
                {filtered.map((entry) => {
                    const config =
                        chartConfig[entry.dataKey as keyof typeof chartConfig];
                    return (
                        <div
                            key={entry.dataKey}
                            className="flex items-center justify-between gap-4 text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="size-3 rounded-sm border-2 border-background"
                                    style={{
                                        backgroundColor: entry.color,
                                    }}
                                />
                                <span className="text-muted-foreground">
                                    {config?.label ?? entry.dataKey}
                                </span>
                            </div>
                            <span className="font-semibold text-popover-foreground tabular-nums">
                                {formatCurrency(entry.value, 'NGN')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DashboardIncomeExpenseChart: FC<DashboardIncomeExpenseChartProps> = ({
    config,
}) => {
    const { data } = config;
    // Per-instance: a document-global id would collide the moment two of
    // these render on one page, and the second chart would silently pick up
    // the first one's <defs>.
    const gradientId = useId();

    // Memoize chartData transformation to prevent redundant array object allocations
    // and Date formatting on re-renders (e.g. parent state updates or hover interactions).
    const chartData = useMemo(() => {
        return data.map((d) => ({
            ...d,
            monthLabel: formatMonthLabel(d.month),
            incomeArea: d.income,
        }));
    }, [data]);

    // Memoize yDomain calculation to avoid recalculating max bounds on every render.
    const yDomain = useMemo<[number, number]>(() => {
        if (chartData.length === 0) {
            return [0, 1];
        }

        const maxValue = Math.max(
            ...chartData.flatMap((d) => [d.income, d.expenses]),
            1,
        );
        const padding = Math.ceil(maxValue * 0.1);
        return [0, maxValue + padding];
    }, [chartData]);

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">
                        Income & expense
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No data available for the selected period.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="min-h-auto border-0 pt-6 pb-4">
                <CardTitle className="text-base font-semibold">
                    Income & expense
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-2.5">
                <ChartContainer
                    config={chartConfig}
                    className="[&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial h-[240px] w-full sm:h-[280px] md:h-[350px]"
                >
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 15,
                            left: 5,
                            bottom: 5,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id={gradientId}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={chartConfig.income.color}
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={chartConfig.income.color}
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="var(--input)"
                            strokeOpacity={1}
                            horizontal={true}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="monthLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 10,
                                className: 'text-muted-foreground',
                            }}
                            dy={5}
                            tickMargin={8}
                            interval="preserveStartEnd"
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 10,
                                className: 'text-muted-foreground',
                            }}
                            tickFormatter={(value) =>
                                formatCurrency(value, 'NGN', { compact: true })
                            }
                            domain={yDomain}
                            tickMargin={8}
                            width={50}
                        />

                        <ChartTooltip
                            content={<IncomeExpenseTooltip />}
                            cursor={{
                                stroke: 'var(--input)',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="incomeArea"
                            stroke="transparent"
                            fill={`url(#${gradientId})`}
                            strokeWidth={0}
                            dot={false}
                        />

                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke={chartConfig.income.color}
                            strokeWidth={2}
                            dot={{
                                fill: 'var(--background)',
                                strokeWidth: 2,
                                r: 4,
                                stroke: chartConfig.income.color,
                            }}
                        />

                        <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke={chartConfig.expenses.color}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{
                                fill: 'var(--background)',
                                strokeWidth: 2,
                                r: 4,
                                stroke: chartConfig.expenses.color,
                            }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export default DashboardIncomeExpenseChart;
