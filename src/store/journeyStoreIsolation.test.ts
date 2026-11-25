// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static scan of fixed source paths */
/**
 * The journey and My work stores stay on the device (owner decision 25 Nov 2026: "Keep it out of
 * Drive sync"; design note 5.1, section 10). This test proves it three ways against the real sync
 * and snapshot code: the watch lists, the Google Drive document the sync hook builds, and the
 * embed and backup snapshot. A learner's goal text is the marker: it must appear in none of them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  WATCHED_STORES,
  CLOUD_SYNC_WATCHED_STORES,
  EMBED_WATCHED_STORES,
} from './syncWatchedStores'
import { useJourneyStore, JOURNEY_STORE_KEY } from './useJourneyStore'
import { useCloudSyncStore } from './useCloudSyncStore'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { buildPreview } from '@/services/journey/objectiveBuilder'

const MARKER = 'PRIVATE-GOAL-MARKER about a quantum safe TLS migration'

const written: unknown[] = []
vi.mock('@/services/CloudSyncService', () => ({
  fetchFromDrive: vi.fn(async () => null),
  fetchFileMetadata: vi.fn(async () => ({ modifiedTime: new Date().toISOString() })),
  writeToDrive: vi.fn(async (_token: string, doc: unknown) => {
    written.push(doc)
    return 'file-1'
  }),
}))

function saveObjective() {
  useJourneyStore
    .getState()
    .createObjective(
      buildPreview({ goal: MARKER, persona: 'architect', existing: [], isDone: () => false })
    )
}

beforeEach(() => {
  localStorage.clear()
  written.length = 0
  useJourneyStore.setState({
    objectives: {},
    order: [],
    focus: {},
    completions: {},
    roleSwitch: null,
  })
})
afterEach(() => vi.useRealTimers())

describe('the journey store is not watched for sync or embed saves', () => {
  it('is in neither watch list, by key or by the key it persists under', () => {
    const names = WATCHED_STORES.map((e) => {
      const persist = (e.store as { persist?: { getOptions?: () => { name?: string } } }).persist
      return persist?.getOptions?.().name
    })
    for (const key of WATCHED_STORES.map((e) => e.key))
      expect(key).not.toMatch(/journey|mywork|my-work/i)
    for (const name of names) expect(name ?? '').not.toMatch(/journey|my-?work/i)
    expect(names).not.toContain(JOURNEY_STORE_KEY)
    expect(WATCHED_STORES.some((e) => e.store === (useJourneyStore as never))).toBe(false)
  })

  it('does not wake any cloud-sync or embed subscriber when the journey changes', () => {
    const calls: string[] = []
    const unsubs = [...new Set([...CLOUD_SYNC_WATCHED_STORES, ...EMBED_WATCHED_STORES])].map((s) =>
      s.subscribe(() => calls.push('x'))
    )
    saveObjective()
    useJourneyStore.getState().noteRoleSwitch('architect', 'executive')
    unsubs.forEach((u) => u())
    expect(calls).toEqual([])
  })
})

describe('what leaves the device', () => {
  it('the Google Drive document the sync hook builds holds no journey state', async () => {
    const { useSyncEffect } = await import('@/hooks/useSyncEffect')
    saveObjective()
    useCloudSyncStore.setState({ accessToken: 'token', isSignedIn: true, driveFileId: null })
    renderHook(() => useSyncEffect())
    await waitFor(() => expect(written.length).toBeGreaterThan(0))
    const doc = JSON.stringify(written[0])
    expect(doc).not.toContain('PRIVATE-GOAL-MARKER')
    expect(doc).not.toMatch(/journey/i)
    // and the document really was the full one, not an empty stand-in
    expect(doc).toContain('personaStore')
    await act(async () => {
      await Promise.resolve()
    })
    useCloudSyncStore.setState({ accessToken: null, isSignedIn: false })
  })

  it('the embed and backup snapshot holds no journey state', () => {
    saveObjective()
    const snapshot = JSON.stringify(UnifiedStorageService.exportSnapshot())
    expect(snapshot).not.toContain('PRIVATE-GOAL-MARKER')
    expect(snapshot).not.toMatch(/journey/i)
    expect(snapshot).toContain('stores')
  })

  it('restoring a snapshot leaves the journey as it was', () => {
    saveObjective()
    const before = JSON.stringify(useJourneyStore.getState().objectives)
    const snapshot = UnifiedStorageService.exportSnapshot()
    UnifiedStorageService.restoreSnapshot(snapshot)
    expect(JSON.stringify(useJourneyStore.getState().objectives)).toBe(before)
  })
})

describe('the sync and snapshot code never names the journey stores', () => {
  const files = [
    'src/hooks/useSyncEffect.ts',
    'src/embed/useEmbedPersistence.ts',
    'src/store/syncWatchedStores.ts',
    'src/services/storage/UnifiedStorageService.ts',
    'src/services/storage/GoogleDriveService.ts',
    'src/services/CloudSyncService.ts',
    'src/components/PKILearning/SaveRestorePanel.tsx',
  ]
  it.each(files.map((f) => [f] as const))('%s', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    expect(source).not.toMatch(/useJourneyStore|pqc-journey|useMyWorkStore|pqc-my-work/)
  })
})
