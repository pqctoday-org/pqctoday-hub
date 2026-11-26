// SPDX-License-Identifier: AGPL-3.0-only

/**
 * One-time clean-up of what the old model chat left in a returning visitor's browser.
 *
 * The old chat is gone. Two things it saved are removed on every page load, early and quietly:
 * the stored chat entry (conversations, provider and model settings, any key a visitor had typed in)
 * and the switch that turned the old chat on. Nothing in the Hub reads or writes either of them any
 * more.
 *
 * The in-browser model also downloaded several gigabytes of model files. Those are deleted once,
 * best effort, from exactly the places the downloader wrote to and nowhere else:
 *   - Cache API caches named `webllm/model`, `webllm/config` and `webllm/wasm` (the downloader's
 *     default store, used by every earlier version of the old chat);
 *   - the folder `webllm` inside the origin-private file system folder `tvmjs-opfs-store` (the
 *     store the last versions of the old chat chose for the large model files).
 * The Hub's own caches, the search embedding model cache and the service worker caches are never
 * touched. A visitor whose browser lacks these interfaces, or where a call fails, is simply left
 * alone; the page never waits for any of this.
 */

/** Browser-storage entries the old chat wrote; both are removed on every load. */
export const OLD_CHAT_STORAGE_KEYS = ['pqc-chat-storage', 'pqc-feature-model-assistant'] as const

/** Cache API caches the old model downloader created. */
export const OLD_MODEL_CACHE_NAMES = ['webllm/model', 'webllm/config', 'webllm/wasm'] as const

/** Origin-private file system: the downloader's root folder and the one folder in it that is deleted. */
export const OLD_MODEL_OPFS_ROOT = 'tvmjs-opfs-store'
export const OLD_MODEL_OPFS_FOLDER = 'webllm'

/** Written once the model-file clean-up has finished, so it does not repeat. */
export const MODEL_FILES_CLEANUP_DONE_KEY = 'pqc-old-model-files-removed'

/** Removes the old chat's stored entries. Never throws, whatever the stored value looks like. */
export function removeOldChatStorage(storage?: Pick<Storage, 'removeItem'>): void {
  for (const key of OLD_CHAT_STORAGE_KEYS) {
    try {
      ;(storage ?? localStorage).removeItem(key)
    } catch {
      // Storage unavailable or blocked: nothing to remove, nothing to report.
    }
  }
}

interface DirectoryLike {
  getDirectoryHandle(name: string): Promise<DirectoryLike>
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
}

export interface ModelFileCleanupEnv {
  caches?: Pick<CacheStorage, 'delete'>
  getOpfsRoot?: () => Promise<DirectoryLike>
  storage?: Pick<Storage, 'getItem' | 'setItem'>
}

const errorName = (e: unknown): string =>
  typeof e === 'object' && e !== null && 'name' in e ? String((e as { name: unknown }).name) : ''

function defaultEnv(): ModelFileCleanupEnv {
  return {
    caches: typeof caches === 'undefined' ? undefined : caches,
    getOpfsRoot:
      typeof navigator !== 'undefined' && typeof navigator.storage?.getDirectory === 'function'
        ? () => navigator.storage.getDirectory() as unknown as Promise<DirectoryLike>
        : undefined,
    storage: localStorage,
  }
}

/**
 * Deletes the old model's downloaded files, once. Resolves to true when the clean-up finished (the
 * files are gone or were never there) and to false when it was skipped or a step failed and will be
 * tried again on a later visit. Never throws.
 */
export async function removeOldModelFiles(env?: ModelFileCleanupEnv): Promise<boolean> {
  let e: ModelFileCleanupEnv
  try {
    e = env ?? defaultEnv()
  } catch {
    return false
  }
  try {
    if (e.storage?.getItem(MODEL_FILES_CLEANUP_DONE_KEY)) return true
  } catch {
    // Unreadable marker: carry on, the deletes below are harmless to repeat.
  }

  let complete = true

  if (e.caches) {
    for (const name of OLD_MODEL_CACHE_NAMES) {
      try {
        await e.caches.delete(name)
      } catch {
        complete = false
      }
    }
  }

  if (e.getOpfsRoot) {
    try {
      const root = await e.getOpfsRoot()
      const store = await root.getDirectoryHandle(OLD_MODEL_OPFS_ROOT)
      await store.removeEntry(OLD_MODEL_OPFS_FOLDER, { recursive: true })
      try {
        // Only succeeds when nothing else is left in the folder.
        await root.removeEntry(OLD_MODEL_OPFS_ROOT)
      } catch {
        // Not empty, or already gone: leave it.
      }
    } catch (err) {
      // Never created, or already deleted: nothing to remove. Anything else is retried later.
      if (errorName(err) !== 'NotFoundError') complete = false
    }
  }

  if (complete) {
    try {
      e.storage?.setItem(MODEL_FILES_CLEANUP_DONE_KEY, '1')
    } catch {
      // Cannot record it: the clean-up simply runs again next time.
    }
  }
  return complete
}

/** Page-load entry: removes the stored entries now and the downloaded model files when idle. */
export function runLegacyChatCleanup(): void {
  removeOldChatStorage()
  try {
    const run = () => void removeOldModelFiles()
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 10_000 })
    else setTimeout(run, 2_000)
  } catch {
    // Scheduling failed: skip it this visit.
  }
}
