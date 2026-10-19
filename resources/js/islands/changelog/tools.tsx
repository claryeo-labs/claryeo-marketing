import { Bell, Check, Copy, Rss, Search, Slack } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Entry = { title: string; summary: string; url: string; date: string };

type ChangelogToolsProps = {
    entries: Entry[];
    rssUrl: string;
};

const SubscribeTab = { Rss: 'rss', Slack: 'slack' } as const;
type SubscribeTab = (typeof SubscribeTab)[keyof typeof SubscribeTab];

const overlay =
    'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0';
const panel =
    'fixed top-[12vh] left-1/2 z-50 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] focus:outline-none';

/** Copies a value and confirms in place for two seconds. */
function CopyField({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5">
            <code className="t-mono min-w-0 flex-1 truncate text-[13px] text-foreground">
                {value}
            </code>
            <button
                type="button"
                aria-label={copied ? 'Copied' : 'Copy'}
                onClick={() =>
                    navigator.clipboard?.writeText(value).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    })
                }
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
                {copied ? (
                    <Check className="size-4 text-primary" />
                ) : (
                    <Copy className="size-4" />
                )}
            </button>
        </div>
    );
}

function SubscribeDialog({ rssUrl }: { rssUrl: string }) {
    const [tab, setTab] = useState<SubscribeTab>(SubscribeTab.Rss);
    const tabs: Record<SubscribeTab, { label: string; icon: ReactNode }> = {
        [SubscribeTab.Rss]: {
            label: 'RSS',
            icon: <Rss className="size-3.5" />,
        },
        [SubscribeTab.Slack]: {
            label: 'Slack',
            icon: <Slack className="size-3.5" />,
        },
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger
                aria-label="Subscribe to changelog updates"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
                <Bell className="size-4" />
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className={overlay} />
                <Dialog.Content className={cn(panel, 'p-6')}>
                    <Dialog.Title className="t-ui-title">
                        Subscribe to changelog updates
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                        Follow new Claryeo releases in a feed reader or a Slack
                        channel.
                    </Dialog.Description>
                    <div
                        role="tablist"
                        className="mt-5 flex gap-5 border-b border-border"
                    >
                        {Object.values(SubscribeTab).map((value) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={tab === value}
                                onClick={() => setTab(value)}
                                className={cn(
                                    '-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2.5 text-sm transition-colors',
                                    tab === value
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tabs[value].icon}
                                {tabs[value].label}
                            </button>
                        ))}
                    </div>
                    <div role="tabpanel" className="pt-5 text-sm">
                        {tab === SubscribeTab.Rss ? (
                            <>
                                <p className="text-muted-foreground">
                                    Add this feed to your favourite RSS reader.
                                </p>
                                <CopyField value={rssUrl} />
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground">
                                    Paste this into any Slack channel to get
                                    each release there.
                                </p>
                                <CopyField
                                    value={`/feed subscribe ${rssUrl}`}
                                />
                            </>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

/** Title and summary matches, titles first, at most eight. */
function useMatches(entries: Entry[], query: string): Entry[] {
    return useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) {
            return entries.slice(0, 8);
        }

        const inTitle = entries.filter((entry) =>
            entry.title.toLowerCase().includes(needle),
        );
        const inSummary = entries.filter(
            (entry) =>
                !inTitle.includes(entry) &&
                entry.summary.toLowerCase().includes(needle),
        );

        return [...inTitle, ...inSummary].slice(0, 8);
    }, [entries, query]);
}

function SearchDialog({ entries }: { entries: Entry[] }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const matches = useMatches(entries, query);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setOpen((value) => !value);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const go = (entry: Entry | undefined) => {
        if (entry) {
            window.location.href = entry.url;
        }
    };

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                setQuery('');
                setActive(0);
            }}
        >
            <Dialog.Trigger className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                <Search className="size-4 shrink-0" />
                <span className="flex-1 text-left">Search the changelog</span>
                <kbd className="t-mono hidden rounded border border-border px-1.5 text-[11px] md:inline">
                    ⌘K
                </kbd>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className={overlay} />
                <Dialog.Content className={panel}>
                    <Dialog.Title className="sr-only">
                        Search the changelog
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                        Type to find a release, then press Enter to open it.
                    </Dialog.Description>
                    <div className="flex items-center gap-3 border-b border-border px-4">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setActive(0);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowDown') {
                                    event.preventDefault();
                                    setActive((index) =>
                                        Math.min(index + 1, matches.length - 1),
                                    );
                                } else if (event.key === 'ArrowUp') {
                                    event.preventDefault();
                                    setActive((index) =>
                                        Math.max(index - 1, 0),
                                    );
                                } else if (event.key === 'Enter') {
                                    go(matches[active]);
                                }
                            }}
                            placeholder="Search releases…"
                            aria-label="Search releases"
                            className="h-12 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                    </div>
                    <ul
                        className="max-h-[50vh] overflow-y-auto p-2"
                        role="listbox"
                    >
                        {matches.map((entry, index) => (
                            <li
                                key={entry.url}
                                role="option"
                                aria-selected={index === active}
                            >
                                <a
                                    href={entry.url}
                                    onMouseEnter={() => setActive(index)}
                                    className={cn(
                                        'grid gap-0.5 rounded-lg px-3 py-2.5 transition-colors',
                                        index === active && 'bg-muted',
                                    )}
                                >
                                    <span className="flex items-baseline justify-between gap-4">
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {entry.title}
                                        </span>
                                        <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                                            {entry.date}
                                        </span>
                                    </span>
                                    <span className="line-clamp-1 text-[13px] text-muted-foreground">
                                        {entry.summary}
                                    </span>
                                </a>
                            </li>
                        ))}
                        {matches.length === 0 ? (
                            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No release matches “{query.trim()}”.
                            </li>
                        ) : null}
                    </ul>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

/**
 * The changelog header's search (a ⌘K palette over every release) and
 * subscribe bell (RSS, or a Slack channel via /feed).
 */
export default function ChangelogTools({
    entries,
    rssUrl,
}: ChangelogToolsProps) {
    return (
        <div className="flex items-center gap-2">
            <SearchDialog entries={entries} />
            <SubscribeDialog rssUrl={rssUrl} />
        </div>
    );
}
