import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

import { cn } from '@/lib/utils';

export type LegalDocumentMeta = {
    document_type?: string;
    version?: string;
    status?: string;
    effective_date?: string | number;
    last_reviewed?: string | number;
    requires_reacceptance?: boolean;
    changelog?: string;
};

export type LegalDocumentTocItem = {
    id: string;
    label: string;
};

export type LegalDocumentPageProps = {
    slug: string;
    title: string;
    body: string;
    meta: LegalDocumentMeta;
    version: string;
    currentVersion: string | null;
};

const slugify = (text: string): string =>
    text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

const deriveToc = (body: string): LegalDocumentTocItem[] => {
    const items: LegalDocumentTocItem[] = [];
    const regex = /^##\s+(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(body)) !== null) {
        const label = match[1].trim();
        items.push({ id: slugify(label), label });
    }

    return items;
};

const formatDate = (d: string | number | undefined | null): string => {
    if (d === undefined || d === null || d === '') {
        return '';
    }

    let date: Date | null = null;
    const original = String(d);

    if (typeof d === 'number' || /^\d+$/.test(original)) {
        const rawTimestamp = Number(d);
        const timestampInMilliseconds =
            rawTimestamp > 9999999999 ? rawTimestamp : rawTimestamp * 1000;
        date = new Date(timestampInMilliseconds);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(original)) {
        date = new Date(`${original}T00:00:00Z`);
    } else {
        date = new Date(original);
    }

    return Number.isNaN(date.getTime())
        ? original
        : date.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
          });
};

const LegalDocumentPage: FC<LegalDocumentPageProps> = ({
    title,
    body,
    meta,
    slug,
    version,
    currentVersion,
}) => {
    // Performance optimization: Memoize table-of-contents extraction, content body cleaning,
    // and date formatting so regexes and parsing don't re-run on active section state changes during scrolling.
    const toc = useMemo(() => deriveToc(body), [body]);
    const isArchived = meta.status === 'archived';
    const effectiveDate = useMemo(() => formatDate(meta.effective_date), [meta.effective_date]);
    const lastReviewed = useMemo(() => formatDate(meta.last_reviewed), [meta.last_reviewed]);
    const [activeSectionId, setActiveSectionId] = useState<string>(
        toc[0]?.id ?? '',
    );
    const contentBody = useMemo(() => body.replace(/^#\s+.+\n+/u, ''), [body]);

    useEffect(() => {
        const html = document.documentElement;
        const prior = html.style.scrollBehavior;
        html.style.scrollBehavior = 'smooth';
        return () => {
            html.style.scrollBehavior = prior;
        };
    }, []);

    useEffect(() => {
        if (toc.length === 0) {
            return;
        }

        const sectionElements = toc
            .map((item) => document.getElementById(item.id))
            .filter((element): element is HTMLElement => element !== null);

        if (sectionElements.length === 0) {
            return;
        }

        const updateActiveSection = (): void => {
            const offset = 140;
            let nextActiveSectionId = sectionElements[0].id;

            for (const section of sectionElements) {
                if (section.getBoundingClientRect().top - offset <= 0) {
                    nextActiveSectionId = section.id;
                } else {
                    break;
                }
            }

            setActiveSectionId((previous) =>
                previous === nextActiveSectionId
                    ? previous
                    : nextActiveSectionId,
            );
        };

        const frameId = window.requestAnimationFrame(updateActiveSection);

        window.addEventListener('scroll', updateActiveSection, {
            passive: true,
        });
        window.addEventListener('resize', updateActiveSection);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('scroll', updateActiveSection);
            window.removeEventListener('resize', updateActiveSection);
        };
    }, [toc]);

    return (
        <>
            <div className="min-h-screen bg-background text-foreground">
                <div className="border-b border-border bg-muted/20 py-8 md:py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="t-eyebrow text-muted-foreground">
                            Legal Document
                        </p>
                        <h1 className="t-display-2 mt-3 text-foreground">
                            {title}
                        </h1>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {effectiveDate && (
                                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                    Effective: {effectiveDate}
                                </span>
                            )}
                            {lastReviewed && (
                                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                    Last reviewed: {lastReviewed}
                                </span>
                            )}
                            {version && (
                                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                    Version: {version}
                                </span>
                            )}
                        </div>
                        {isArchived && (
                            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                                This is an archived version. See the{' '}
                                <a
                                    href={`/${slug}`}
                                    className="underline hover:no-underline"
                                >
                                    current version
                                </a>
                                .
                            </p>
                        )}
                    </div>
                </div>

                <div className="w-full px-4 py-8 sm:px-6 md:py-12 lg:px-8">
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10">
                        {toc.length > 0 && (
                            <aside className="lg:sticky lg:top-24">
                                <nav
                                    aria-label="Sections"
                                    className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur"
                                >
                                    <p className="t-eyebrow px-2 text-muted-foreground">
                                        On this page
                                    </p>
                                    <ul className="mt-3 flex flex-col gap-1">
                                        {toc.map((item, index) => (
                                            <li key={item.id}>
                                                <a
                                                    href={`#${item.id}`}
                                                    aria-current={
                                                        activeSectionId ===
                                                        item.id
                                                            ? 'location'
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        'group flex items-start gap-3 rounded-lg px-2 py-2 text-sm leading-snug transition-colors',
                                                        activeSectionId ===
                                                            item.id
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                                                            activeSectionId ===
                                                                item.id
                                                                ? 'border-primary/30 bg-primary/20 text-primary'
                                                                : 'border-border text-muted-foreground group-hover:border-foreground/20',
                                                        )}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <span>{item.label}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 border-t border-border pt-4">
                                        <a
                                            href={`/${slug}/versions`}
                                            className="text-xs font-medium text-primary underline underline-offset-2 hover:no-underline"
                                        >
                                            View version history
                                        </a>
                                        {currentVersion && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Current: {currentVersion}
                                            </p>
                                        )}
                                    </div>
                                </nav>
                            </aside>
                        )}
                        <div className="min-w-0">
                            <article
                                className={cn(
                                    'prose-claryeo rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8 lg:px-10',
                                    'prose-h1:mt-2 prose-h1:mb-4 prose-h1:text-3xl sm:prose-h1:text-4xl',
                                    'prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:first:mt-0',
                                    'prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-lg',
                                    'prose-p:my-5 prose-p:leading-8 prose-p:text-foreground/90',
                                    'prose-ul:mt-4 prose-ul:mb-7 prose-ul:list-disc prose-ul:pl-6',
                                    'prose-ol:mt-4 prose-ol:mb-7 prose-ol:list-decimal prose-ol:pl-6',
                                    'prose-li:my-2 prose-li:leading-7',
                                    'prose-strong:font-semibold prose-strong:text-foreground',
                                    'prose-a:font-semibold prose-a:text-primary prose-a:decoration-primary/70 prose-a:underline prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:text-primary/80 hover:prose-a:decoration-primary',
                                    'prose-hr:border-border',
                                    '[&_section]:mt-12 [&_section]:scroll-mt-28 [&_section:first-of-type]:mt-8',
                                    '[&_ol+p]:mt-6 [&_p+ol]:mt-4 [&_p+ul]:mt-4 [&_ul+p]:mt-6',
                                    '[&>p:first-of-type]:mb-4 [&>p:first-of-type]:text-sm [&>p:first-of-type]:font-semibold [&>p:first-of-type]:tracking-wide [&>p:first-of-type]:text-muted-foreground [&>p:first-of-type]:uppercase',
                                    '[&>p:nth-of-type(2)]:mt-0 [&>p:nth-of-type(2)]:text-base [&>p:nth-of-type(2)]:font-medium [&>p:nth-of-type(2)]:text-foreground',
                                    '[&_a]:font-semibold [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4',
                                    '[&_p:has(strong:only-child)]:mt-7 [&_p:has(strong:only-child)]:mb-2 [&_p:has(strong:only-child)]:text-xs [&_p:has(strong:only-child)]:font-semibold [&_p:has(strong:only-child)]:tracking-[0.12em] [&_p:has(strong:only-child)]:text-foreground/80 [&_p:has(strong:only-child)]:uppercase',
                                )}
                            >
                                <ReactMarkdown
                                    rehypePlugins={[rehypeRaw, rehypeSlug]}
                                >
                                    {contentBody}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LegalDocumentPage;
