// SPDX-License-Identifier: GPL-3.0-only

const DATA_CACHE_NAME = 'data-cache'

/**
 * Revalidate all entries in the Workbox data-cache by re-fetching from network.
 * Called when the app comes back online after Airplane Mode so that cached
 * JSON/CSV files are refreshed in the background. Fire-and-forget — failures
 * are silently ignored (Cache API may be unavailable in some contexts).
 */
export async function revalidateDataCache(): Promise<void> {
  try {
    if (!('caches' in window)) return
    const cache = await caches.open(DATA_CACHE_NAME)
    const keys = await cache.keys()
    await Promise.allSettled(
      keys.map(async (request) => {
        const response = await fetch(request.url, { cache: 'reload' })
        if (response.ok) {
          await cache.put(request, response)
        }
      })
    )
  } catch {
    // Cache API unavailable or network error — fail silently
  }
}
