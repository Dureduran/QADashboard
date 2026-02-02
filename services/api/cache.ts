/**
 * Simple In-Memory Cache with TTL
 * Reduces API calls and handles rate limiting
 */

import { CacheEntry } from '../../types/api';

class APICache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private accessLog: Map<string, number[]> = new Map();
    private hitCount = 0;
    private missCount = 0;

    /**
     * Get cached data if valid
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            this.missCount++;
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.missCount++;
            return null;
        }

        this.hitCount++;
        return entry.data as T;
    }

    /**
     * Store data in cache
     */
    set<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Remove specific key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getStats(): { size: number; keys: string[]; hits: number; misses: number } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            hits: this.hitCount,
            misses: this.missCount,
        };
    }

    /**
     * Rate limiting: Track API calls
     */
    trackCall(api: string): void {
        const now = Date.now();
        const calls = this.accessLog.get(api) || [];
        calls.push(now);
        // Keep only last hour of calls
        const oneHourAgo = now - 60 * 60 * 1000;
        this.accessLog.set(api, calls.filter(t => t > oneHourAgo));
    }

    /**
     * Check if we're within rate limits
     */
    canMakeCall(api: string, maxPerMinute: number): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const calls = this.accessLog.get(api) || [];
        const recentCalls = calls.filter(t => t > oneMinuteAgo);
        return recentCalls.length < maxPerMinute;
    }

    /**
     * Get remaining quota estimate
     */
    getRemainingQuota(api: string, maxPerMinute: number): number {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const calls = this.accessLog.get(api) || [];
        const recentCalls = calls.filter(t => t > oneMinuteAgo);
        return Math.max(0, maxPerMinute - recentCalls.length);
    }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Decorator function for cached API calls
 */
export async function withCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
    // Check cache first
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
        return { data: cached, cached: true };
    }

    // Fetch fresh data
    const data = await fetchFn();
    apiCache.set(key, data, ttl);
    return { data, cached: false };
}
