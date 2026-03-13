// SPDX-License-Identifier: GPL-3.0-only
import type { ChatSourceRef } from '@/types/ChatTypes'

interface CacheEntry {
  content: string
  sourceIds: string[]
  sourceRefs: ChatSourceRef[]
  followUps: string[]
  timestamp: number
}

interface PersonaDimensions {
  persona?: string | null
  experienceLevel?: string | null
  industry?: string | null
  region?: string | null
}

const MAX_ENTRIES = 20
const TTL_MS = 5 * 60 * 1000 // 5 minutes

const cache = new Map<string, CacheEntry>()

function cacheKey(query: string, page: string, dims?: PersonaDimensions): string {
  return JSON.stringify([
    query.trim().toLowerCase(),
    page,
    dims?.persona ?? null,
    dims?.experienceLevel ?? null,
    dims?.industry ?? null,
    dims?.region ?? null,
  ])
}

export function getCached(
  query: string,
  page: string,
  dims?: PersonaDimensions
): CacheEntry | null {
  const key = cacheKey(query, page, dims)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  // LRU promotion: re-insert to move to end (most recently used)
  cache.delete(key)
  cache.set(key, entry)
  return entry
}

export function setCache(
  query: string,
  page: string,
  entry: Omit<CacheEntry, 'timestamp'>,
  dims?: PersonaDimensions
): void {
  const key = cacheKey(query, page, dims)

  // Evict least-recently-used (first key in Map = oldest accessed) if at capacity
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const lru = cache.keys().next().value
    if (lru !== undefined) cache.delete(lru)
  }

  cache.set(key, { ...entry, timestamp: Date.now() })
}

export function clearCache(): void {
  cache.clear()
}
