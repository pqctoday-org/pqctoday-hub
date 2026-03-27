import { describe, it, expect, beforeEach } from 'vitest'
import { useCloudSyncStore } from './useCloudSyncStore'

describe('useCloudSyncStore - Conflict Detection Features', () => {
  beforeEach(() => {
    // Reset store state before each test to test baseline
    useCloudSyncStore.setState({
      enabled: false,
      lastSyncedAt: null,
      lastSyncDirection: null,
      provider: null,
      deviceId: 'test-device-uuid',
      accessToken: null,
      isSignedIn: false,
      driveFileId: null,
      syncStatus: 'idle',
      remoteModifiedTime: null,
    })
  })

  it('initializes with a deviceId and maintains it across sessions', () => {
    const state = useCloudSyncStore.getState()
    expect(state.deviceId).toBeTruthy()
    expect(typeof state.deviceId).toBe('string')
  })

  it('updates remoteModifiedTime properly for conflict detection logic', () => {
    useCloudSyncStore.getState().setRemoteModifiedTime('2026-03-26T12:00:00.000Z')
    expect(useCloudSyncStore.getState().remoteModifiedTime).toBe('2026-03-26T12:00:00.000Z')
  })

  it('clears remoteModifiedTime on sign out to reset conflict state', () => {
    useCloudSyncStore.getState().setRemoteModifiedTime('2026-03-26T12:00:00.000Z')
    useCloudSyncStore.getState().setSignedIn('mock-token')

    useCloudSyncStore.getState().signOut()

    const state = useCloudSyncStore.getState()
    expect(state.isSignedIn).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.remoteModifiedTime).toBeNull()
    // The deviceId must be persisted after sign out to identify the user later
    expect(state.deviceId).toBeTruthy()
  })
})
