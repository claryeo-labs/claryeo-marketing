import type { CommunityStats } from '@/waitlist/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchCommunity } from '@/waitlist/lib/api';

const POLL_MS = 30_000;

export interface Community {
    stats: CommunityStats | null;
    loading: boolean;
    error: boolean;
    refresh: () => void;
}

/**
 * Live aggregate totals, polled client-side. Deliberately not fetched on the server: the
 * numbers change with every signup, so any cache — Next's included — would show a stale
 * picture, and the page that uses them is per-session anyway.
 *
 * A failed refresh keeps the last good `stats` and raises `error`, which is what lets the
 * result page show a "showing the last available responses" notice instead of blanking.
 */
export const useCommunity = (enabled: boolean): Community => {
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const busy = useRef(false);
    const alive = useRef(false);

    const refresh = useCallback(async () => {
        if (busy.current || !enabled) return;
        busy.current = true;
        setLoading(true);
        try {
            const response = await fetchCommunity();
            if (alive.current) {
                setStats(response);
                setError(false);
            }
        } catch {
            if (alive.current) setError(true);
        } finally {
            busy.current = false;
            if (alive.current) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        alive.current = true;
        if (!enabled) {
            setLoading(false);
            return () => {
                alive.current = false;
            };
        }
        void refresh();
        const updateWhenVisible = () => {
            if (!document.hidden) void refresh();
        };
        const interval = setInterval(updateWhenVisible, POLL_MS);
        window.addEventListener('focus', updateWhenVisible);
        return () => {
            alive.current = false;
            clearInterval(interval);
            window.removeEventListener('focus', updateWhenVisible);
        };
    }, [enabled, refresh]);

    return { stats, loading, error, refresh: () => void refresh() };
};
