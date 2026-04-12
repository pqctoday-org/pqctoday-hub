// SPDX-License-Identifier: GPL-3.0-only
import type { AppSnapshot } from '../services/storage/snapshotTypes'
import type { IEmbedPersistenceService } from './EmbedPersistenceService'

const MAX_EVENTS = 1000

/**
 * Persistence adapter for Capacitor native shell.
 * Uses @capacitor/preferences for state snapshots and event buffering.
 * Lazy-imports Capacitor modules to avoid bundling in web builds.
 */
export class CapacitorPersistence implements IEmbedPersistenceService {
  private async getPreferences() {
    const { Preferences } = await import(/* @vite-ignore */ '@capacitor/preferences')
    return Preferences
  }

  async loadSnapshot(userId: string): Promise<AppSnapshot | null> {
    try {
      const Preferences = await this.getPreferences()
      const result = await Preferences.get({ key: `pqc-snapshot-${userId}` })
      if (!result.value) return null
      return JSON.parse(result.value) as AppSnapshot
    } catch (err) {
      console.warn('[PQC Mobile] Failed to load snapshot:', err)
      return null
    }
  }

  async saveSnapshot(userId: string, snapshot: AppSnapshot): Promise<void> {
    try {
      const Preferences = await this.getPreferences()
      await Preferences.set({
        key: `pqc-snapshot-${userId}`,
        value: JSON.stringify(snapshot),
      })
    } catch (err) {
      console.warn('[PQC Mobile] Failed to save snapshot:', err)
    }
  }

  async sendEvents(userId: string, events: unknown[]): Promise<void> {
    if (events.length === 0) return
    try {
      const Preferences = await this.getPreferences()
      const existing = await Preferences.get({ key: `pqc-events-${userId}` })
      let buffer: unknown[] = []
      if (existing.value) {
        try {
          buffer = JSON.parse(existing.value) as unknown[]
        } catch {
          buffer = []
        }
      }
      buffer.push(...events)
      // FIFO eviction — keep only the most recent MAX_EVENTS
      if (buffer.length > MAX_EVENTS) {
        buffer = buffer.slice(buffer.length - MAX_EVENTS)
      }
      await Preferences.set({
        key: `pqc-events-${userId}`,
        value: JSON.stringify(buffer),
      })
    } catch (err) {
      console.warn('[PQC Mobile] Failed to buffer events:', err)
    }
  }
}
