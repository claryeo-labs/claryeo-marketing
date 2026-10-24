import { Eye, EyeOff } from 'lucide-react';
import { type FC, useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AllocationItem {
    percentage: number;
    /** Short label under the ring (e.g. Rev, Exp). */
    label: string;
    /** Full name for hover / tooltips. */
    labelTitle?: string;
    color: string;
}

interface StatItem {
    label: string;
    value: string;
    subValue?: string;
    isPositive?: boolean;
    isNegative?: boolean;
}

function CircularProgress({
    percentage,
    color,
    label,
    labelTitle,
    size = 52,
}: {
    percentage: number;
    color: string;
    label: string;
    labelTitle?: string;
    size?: number;
}) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div
            role="progressbar"
            aria-label={labelTitle ?? label}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${percentage}%`}
            className="flex shrink-0 items-center gap-2"
        >
            <div
                className="relative shrink-0"
                style={{ width: size, height: size }}
            >
                <svg
                    aria-hidden="true"
                    className="-rotate-90 transform"
                    width={size}
                    height={size}
                >
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-muted/30"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="inline-flex items-baseline gap-0.5 font-mono text-2xl leading-none font-semibold text-foreground tabular-nums">
                    {percentage}
                    <span className="text-[0.55em] leading-none font-semibold text-muted-foreground">
                        %
                    </span>
                </span>
                <span
                    className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-xs"
                    title={labelTitle ?? label}
                >
                    {label}
                </span>
            </div>
        </div>
    );
}

function BusinessIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <rect x="2" y="7" width="20" height="14" rx="2" fill="#10B981" />
            <rect x="2" y="7" width="20" height="5" fill="#059669" />
            <path
                d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"
                stroke="#047857"
                strokeWidth="2"
            />
            <circle cx="12" cy="13" r="2" fill="#D1FAE5" />
        </svg>
    );
}

export interface BusinessBalanceCardProps {
    balance?: string;
    balanceTitle?: string;
    allocations?: AllocationItem[];
    stats?: StatItem[];
    className?: string;
}

const HIDDEN_BALANCE = '••••••';

function EyeToggle({
    visible,
    onToggle,
    controlsId,
}: {
    visible: boolean;
    onToggle: () => void;
    controlsId?: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="group relative shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={visible ? 'Hide balance' : 'Show balance'}
            aria-pressed={visible}
            aria-controls={controlsId}
            title={visible ? 'Hide balance' : 'Show balance'}
        >
            <span className="relative block h-4 w-4 overflow-hidden">
                <Eye
                    aria-hidden="true"
                    className={cn(
                        'absolute inset-0 h-4 w-4 transition-all duration-300 ease-out',
                        visible
                            ? 'translate-y-0 scale-100 opacity-100'
                            : '-translate-y-3 scale-75 opacity-0',
                    )}
                />
                <EyeOff
                    aria-hidden="true"
                    className={cn(
                        'absolute inset-0 h-4 w-4 transition-all duration-300 ease-out',
                        visible
                            ? 'translate-y-3 scale-75 opacity-0'
                            : 'translate-y-0 scale-100 opacity-100',
                    )}
                />
            </span>
        </button>
    );
}

const BusinessBalanceCard: FC<BusinessBalanceCardProps> = ({
    balance,
    balanceTitle,
    allocations = [
        {
            percentage: 55,
            label: 'Rev',
            labelTitle: 'Income',
            color: '#10B981',
        },
        {
            percentage: 30,
            label: 'Exp',
            labelTitle: 'Expense',
            color: '#EF4444',
        },
        {
            percentage: 15,
            label: 'Net',
            labelTitle: 'Profit',
            color: '#8B5CF6',
        },
    ],
    stats,
    className,
}) => {
    const [visible, setVisible] = useState(true);
    const [animating, setAnimating] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const handleToggle = () => {
        setAnimating(true);
        setVisible((v) => !v);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setAnimating(false), 350);
    };

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    return (
        <Card className={cn('min-w-0', className)}>
            <CardContent className="flex h-full min-h-0 min-w-0 flex-col">
                {/* Header Label */}
                <p className="shrink-0 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                    Estimated Balance
                </p>

                {/* Main Balance Section */}
                <div className="mt-5 flex min-w-0 shrink-0 items-center justify-between gap-6">
                    {/* Left: Icon + Balance + Eye */}
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-transparent">
                            <BusinessIcon className="h-10 w-10" />
                        </div>

                        {balance ? (
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                    id="business-balance-amount"
                                    className={cn(
                                        'block truncate font-mono text-4xl font-bold tracking-tight text-foreground transition-all duration-300 ease-out sm:text-5xl',
                                        animating && 'blur-[2px]',
                                        !visible &&
                                            'tracking-widest select-none',
                                    )}
                                    title={
                                        visible
                                            ? (balanceTitle ?? balance)
                                            : undefined
                                    }
                                >
                                    {visible ? balance : HIDDEN_BALANCE}
                                </span>
                                <EyeToggle
                                    visible={visible}
                                    onToggle={handleToggle}
                                    controlsId="business-balance-amount"
                                />
                            </div>
                        ) : (
                            <div className="h-12 w-56 animate-pulse rounded-lg bg-muted" />
                        )}
                    </div>

                    {/* Right: Allocation Circles */}
                    <div className="hidden shrink-0 items-center sm:flex">
                        {allocations.map((item, index) => (
                            <div
                                key={index}
                                className="flex shrink-0 items-center"
                            >
                                {index > 0 && (
                                    <div className="mx-3 h-10 w-px bg-border" />
                                )}
                                <CircularProgress
                                    percentage={item.percentage}
                                    color={item.color}
                                    label={item.label}
                                    labelTitle={item.labelTitle}
                                    size={65}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Spacer */}
                <div className="min-h-4 flex-1" aria-hidden />

                {/* Divider */}
                <div className="mb-5 h-px shrink-0 bg-linear-to-r from-transparent via-border to-transparent" />

                {/* Stats Row */}
                <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
                    {!stats
                        ? Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex flex-col gap-1.5">
                                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                              </div>
                          ))
                        : stats.map((stat, index) => (
                              <div
                                  key={index}
                                  className="flex min-w-0 flex-col"
                              >
                                  <span className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                      {stat.label}
                                  </span>
                                  <span
                                      className={cn(
                                          'truncate font-mono text-base leading-snug font-bold transition-all duration-300 ease-out',
                                          animating && 'blur-[1px]',
                                          stat.isPositive &&
                                              'text-green-600 dark:text-emerald-400',
                                          stat.isNegative &&
                                              'text-red-600 dark:text-red-400',
                                          !stat.isPositive &&
                                              !stat.isNegative &&
                                              'text-foreground',
                                          !visible &&
                                              'tracking-widest select-none',
                                      )}
                                      title={visible ? stat.value : undefined}
                                  >
                                      {visible ? stat.value : '••••'}
                                  </span>
                                  {stat.subValue && (
                                      <span className="mt-0.5 truncate text-xs text-muted-foreground">
                                          {stat.subValue}
                                      </span>
                                  )}
                              </div>
                          ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default BusinessBalanceCard;
