// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import {
  MODEL_FILES_CLEANUP_DONE_KEY,
  MODEL_FILES_TRIES_KEY,
  OLD_CHAT_STORAGE_KEYS,
  removeOldChatStorage,
  removeOldModelFiles,
} from './legacyChatCleanup'

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

describe('removeOldChatStorage', () => {
  it('removes a valid old entry and the old switch, and leaves other keys alone', () => {
    const s = memoryStorage({
      'pqc-chat-storage': JSON.stringify({ state: { apiKey: 'k' }, version: 14 }),
      'pqc-feature-model-assistant': '1',
      'pqc-learn-storage': '{"state":{},"version":3}',
    })
    removeOldChatStorage(s)
    expect([...s.data.keys()]).toEqual(['pqc-learn-storage'])
  })

  it('removes an entry that is not valid JSON', () => {
    const s = memoryStorage({ 'pqc-chat-storage': '{not json' })
    removeOldChatStorage(s)
    expect(s.data.size).toBe(0)
  })

  it('removes an entry with no version, and one that is not an object', () => {
    for (const raw of ['{"state":{"apiKey":"k"}}', '"just a string"', 'null', '[]']) {
      const s = memoryStorage({ 'pqc-chat-storage': raw })
      removeOldChatStorage(s)
      expect(s.data.size, raw).toBe(0)
    }
  })

  it('does nothing and does not throw when the entries are absent', () => {
    const s = memoryStorage()
    expect(() => removeOldChatStorage(s)).not.toThrow()
  })

  it('does not throw when storage throws, and still tries every key', () => {
    const removeItem = vi.fn<(key: string) => void>(() => {
      throw new Error('blocked')
    })
    expect(() => removeOldChatStorage({ removeItem })).not.toThrow()
    expect(removeItem.mock.calls.map((c) => c[0])).toEqual([...OLD_CHAT_STORAGE_KEYS])
  })

  it('uses the real localStorage by default', () => {
    localStorage.setItem('pqc-chat-storage', '{bad')
    localStorage.setItem('pqc-feature-model-assistant', '1')
    removeOldChatStorage()
    expect(localStorage.getItem('pqc-chat-storage')).toBeNull()
    expect(localStorage.getItem('pqc-feature-model-assistant')).toBeNull()
  })
})

/** A fake origin-private file system: folders as nested maps. */
type Dir = Map<string, Dir>
const notFound = () => Object.assign(new Error('missing'), { name: 'NotFoundError' })
const fakeDir = (dir: Dir, log: string[], path = ''): never =>
  ({
    getDirectoryHandle: async (name: string) => {
      const child = dir.get(name)
      if (!child) throw notFound()
      return fakeDir(child, log, `${path}/${name}`)
    },
    removeEntry: async (name: string, opts?: { recursive?: boolean }) => {
      const child = dir.get(name)
      if (!child) throw notFound()
      if (child.size > 0 && !opts?.recursive) {
        throw Object.assign(new Error('not empty'), { name: 'InvalidModificationError' })
      }
      log.push(`${path}/${name}`)
      dir.delete(name)
    },
  }) as never

const fakeCaches = (names: string[], log: string[] = []) => {
  const set = new Set(names)
  return {
    set,
    delete: async (n: string) => {
      log.push(n)
      return set.delete(n)
    },
  }
}

describe('removeOldModelFiles', () => {
  const builtRoot = (): Dir =>
    new Map([
      [
        'tvmjs-opfs-store',
        new Map([
          ['webllm', new Map([['model', new Map()]])],
          ['someone-else', new Map()],
        ]),
      ],
      ['hub-own-folder', new Map()],
    ])

  it('deletes exactly the named caches and the one folder, and nothing else', async () => {
    const c = fakeCaches([
      'webllm/model',
      'webllm/config',
      'webllm/wasm',
      'transformers-cache',
      'data-cache',
      'wasm-cache',
      'workbox-precache-v2',
    ])
    const root = builtRoot()
    const rootLog: string[] = []
    const storage = memoryStorage()
    const done = await removeOldModelFiles({
      caches: c,
      getOpfsRoot: async () => fakeDir(root, rootLog),
      storage,
    })
    expect(done).toBe(true)
    expect([...c.set].sort()).toEqual([
      'data-cache',
      'transformers-cache',
      'wasm-cache',
      'workbox-precache-v2',
    ])
    expect(rootLog).toEqual(['/tvmjs-opfs-store/webllm'])
    expect([...root.keys()].sort()).toEqual(['hub-own-folder', 'tvmjs-opfs-store'])
    expect([...root.get('tvmjs-opfs-store')!.keys()]).toEqual(['someone-else'])
    expect(storage.data.get(MODEL_FILES_CLEANUP_DONE_KEY)).toBe('1')
  })

  it('also removes the now-empty download folder', async () => {
    const root: Dir = new Map([['tvmjs-opfs-store', new Map([['webllm', new Map()]])]])
    await removeOldModelFiles({
      getOpfsRoot: async () => fakeDir(root, []),
      storage: memoryStorage(),
    })
    expect(root.size).toBe(0)
  })

  it('does nothing when it has already run', async () => {
    const del = vi.fn(async () => true)
    const getOpfsRoot = vi.fn()
    const done = await removeOldModelFiles({
      caches: { delete: del },
      getOpfsRoot,
      storage: memoryStorage({ [MODEL_FILES_CLEANUP_DONE_KEY]: '1' }),
    })
    expect(done).toBe(true)
    expect(del).not.toHaveBeenCalled()
    expect(getOpfsRoot).not.toHaveBeenCalled()
  })

  it('treats a browser with neither interface as finished and records it', async () => {
    const storage = memoryStorage()
    expect(await removeOldModelFiles({ storage })).toBe(true)
    expect(storage.data.get(MODEL_FILES_CLEANUP_DONE_KEY)).toBe('1')
  })

  it('treats files that were never there as finished', async () => {
    const storage = memoryStorage()
    const done = await removeOldModelFiles({
      caches: fakeCaches([]),
      getOpfsRoot: async () => fakeDir(new Map(), []),
      storage,
    })
    expect(done).toBe(true)
    expect(storage.data.get(MODEL_FILES_CLEANUP_DONE_KEY)).toBe('1')
  })

  it('survives a rejecting cache call, still deletes the rest, and tries again next visit', async () => {
    const log: string[] = []
    const c = {
      delete: async (n: string) => {
        log.push(n)
        if (n === 'webllm/model') throw new Error('boom')
        return true
      },
    }
    const root = builtRoot()
    const storage = memoryStorage()
    const done = await removeOldModelFiles({
      caches: c,
      getOpfsRoot: async () => fakeDir(root, []),
      storage,
    })
    expect(done).toBe(false)
    expect(log).toEqual(['webllm/model', 'webllm/config', 'webllm/wasm'])
    expect(root.get('tvmjs-opfs-store')!.has('webllm')).toBe(false)
    expect(storage.data.has(MODEL_FILES_CLEANUP_DONE_KEY)).toBe(false)
  })

  it.each(['SecurityError', 'NotAllowedError', 'TypeError'])(
    'a browser that will never let us look (%s) counts as nothing to delete and records it',
    async (name) => {
      const storage = memoryStorage()
      const c = fakeCaches(['webllm/model'])
      const done = await removeOldModelFiles({
        caches: c,
        getOpfsRoot: async () => {
          throw Object.assign(new Error('denied'), { name })
        },
        storage,
      })
      expect(done).toBe(true)
      expect(c.set.size).toBe(0)
      expect(storage.data.get(MODEL_FILES_CLEANUP_DONE_KEY)).toBe('1')
    }
  )

  it('a cache call that is refused for security reasons also counts as nothing to delete', async () => {
    const storage = memoryStorage()
    const done = await removeOldModelFiles({
      caches: {
        delete: async () => {
          throw Object.assign(new Error('insecure'), { name: 'SecurityError' })
        },
      },
      storage,
    })
    expect(done).toBe(true)
    expect(storage.data.get(MODEL_FILES_CLEANUP_DONE_KEY)).toBe('1')
  })

  it('a transient failure is retried on later visits, at most 3 times in all, then recorded', async () => {
    const storage = memoryStorage()
    const env = () => ({
      getOpfsRoot: async () => {
        throw Object.assign(new Error('locked'), { name: 'NoModificationAllowedError' })
      },
      storage,
    })
    expect(await removeOldModelFiles(env())).toBe(false)
    expect(storage.data.has(MODEL_FILES_CLEANUP_DONE_KEY)).toBe(false)
    expect(await removeOldModelFiles(env())).toBe(false)
    expect(storage.data.has(MODEL_FILES_CLEANUP_DONE_KEY)).toBe(false)
    expect(await removeOldModelFiles(env())).toBe(false)
    expect(storage.data.get(MODEL_FILES_CLEANUP_DONE_KEY)).toBe('1')
    // A fourth visit does nothing at all.
    const getOpfsRoot = vi.fn()
    expect(await removeOldModelFiles({ getOpfsRoot, storage })).toBe(true)
    expect(getOpfsRoot).not.toHaveBeenCalled()
  })

  it('a damaged try counter does not stop the clean-up from being recorded eventually', async () => {
    const storage = memoryStorage({ [MODEL_FILES_TRIES_KEY]: 'banana' })
    const env = {
      getOpfsRoot: async () => {
        throw new Error('odd')
      },
      storage,
    }
    await removeOldModelFiles(env)
    expect(storage.data.get(MODEL_FILES_TRIES_KEY)).toBe('1')
  })

  it('survives storage that throws', async () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    await expect(
      removeOldModelFiles({ caches: fakeCaches(['webllm/wasm']), storage })
    ).resolves.toBe(true)
  })
})

describe('removeOldModelFiles with the real browser environment', () => {
  it('still deletes the old caches when localStorage cannot be read, and records nothing', async () => {
    const deleted: string[] = []
    vi.stubGlobal('caches', {
      delete: async (n: string) => {
        deleted.push(n)
        return true
      },
    })
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      await expect(removeOldModelFiles()).resolves.toBe(true)
      expect(deleted).toEqual(['webllm/model', 'webllm/config', 'webllm/wasm'])
    } finally {
      spy.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})
