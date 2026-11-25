// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static-analysis test that reads the repo's own src/ tree */
/**
 * Owner decision "Keep it out of Drive sync": the learner's own work (My work and update receipts) never goes to
 * Google Drive, an embed snapshot or a backup. This pins it three ways: the sync code does not name these
 * stores, a change to them wakes no sync or auto-save watcher, and a real snapshot built from stores that hold
 * learner text carries none of it.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import {
  WATCHED_STORES,
  CLOUD_SYNC_WATCHED_STORES,
  EMBED_WATCHED_STORES,
} from './syncWatchedStores'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { useMyWorkStore, MY_WORK_KEY, EMPTY_MY_WORK } from './useMyWorkStore'
import { useUpdatesStore, UPDATES_KEY } from './useUpdatesStore'

const SRC = join(process.cwd(), 'src')
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8')

/** Everything that moves data to Drive, to an embed host or into a backup file. */
const SYNC_AND_SNAPSHOT_FILES = [
  'store/syncWatchedStores.ts',
  'hooks/useSyncEffect.ts',
  'embed/useEmbedPersistence.ts',
  'services/CloudSyncService.ts',
  'services/storage/UnifiedStorageService.ts',
  'services/storage/GoogleDriveService.ts',
  'services/storage/snapshotTypes.ts',
  'services/storage/ProgressService.ts',
  'services/exportBundle.ts',
]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

describe('My work and update receipts stay out of Drive sync, embed snapshots and backups', () => {
  it('the watch lists hold neither store', () => {
    const keys = WATCHED_STORES.map((e) => e.key)
    expect(keys.filter((k) => /MyWork|Updates|Journey/i.test(k))).toEqual([])
    expect(WATCHED_STORES.length).toBe(18)
  })

  it.each(SYNC_AND_SNAPSHOT_FILES)('%s does not name the stores or their storage keys', (rel) => {
    const text = read(rel)
    expect(text).not.toMatch(
      /useMyWorkStore|useUpdatesStore|pqc-my-work|pqc-updates|MY_WORK_KEY|UPDATES_KEY/
    )
  })

  it('no file in the sync, embed or storage code imports the stores', () => {
    const offenders = walk(SRC)
      .filter(
        (f) =>
          /\/(services\/storage|embed)\//.test(f) ||
          /syncWatchedStores|useSyncEffect|CloudSync/.test(f)
      )
      .filter((f) => !/\.test\.tsx?$/.test(f))
      .filter((f) => /useMyWorkStore|useUpdatesStore/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  describe('behaviour', () => {
    beforeEach(() => {
      localStorage.clear()
      useMyWorkStore.setState({ ...EMPTY_MY_WORK })
    })

    it('a change to My work wakes no sync or auto-save watcher', () => {
      let woken = 0
      const off = [...new Set([...CLOUD_SYNC_WATCHED_STORES, ...EMBED_WATCHED_STORES])].map((s) =>
        s.subscribe(() => woken++)
      )
      const api = useMyWorkStore.getState()
      api.addComment({ id: 'w1', tag: 'LM-008', body: 'watch me' })
      api.editComment('w1', 'watch me again')
      api.saveAnswer({
        id: 'a1',
        question: 'q',
        savedAt: '2026-11-25T10:00:00.000Z',
        payload: { answerText: 'x' },
      })
      api.saveReference({
        tag: 'GL:ml-kem',
        title: 'ML-KEM',
        kind: 'glossary term',
        savedFrom: 'page',
      })
      api.deleteComment('w1')
      useUpdatesStore.getState().markReleaseSeen('4.225.0')
      off.forEach((o) => o())
      expect(woken).toBe(0)
    })

    it('a backup or embed snapshot built while the stores hold learner text carries none of it', () => {
      const marker = 'LEARNER-WROTE-THIS-9f3a'
      const api = useMyWorkStore.getState()
      api.addComment({ id: 's1', tag: 'LM-008/s:handshake', body: `comment ${marker}` })
      api.saveAnswer({
        id: 'a2',
        question: `question ${marker}`,
        savedAt: '2026-11-25T11:00:00.000Z',
        payload: { answerText: `answer ${marker}`, note: 'n' },
      })
      useUpdatesStore.getState().noteEngaged({
        'LM-008': { version: 17, moduleId: 'tls-basics', title: marker, takeFirst: [] },
      })
      // The text really is on the device...
      expect(localStorage.getItem(MY_WORK_KEY)).toContain(marker)
      expect(localStorage.getItem(UPDATES_KEY)).toContain(marker)
      // ...and in none of the places that leave it.
      const snapshot = UnifiedStorageService.exportSnapshot('google-drive')
      const text = UnifiedStorageService.serializeSnapshot(snapshot)
      expect(text).not.toContain(marker)
      expect(text).not.toContain('pqc-my-work')
      expect(Object.keys(snapshot.stores).join(',')).not.toMatch(/work|update|journey/i)
    })
  })
})
