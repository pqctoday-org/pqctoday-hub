// SPDX-License-Identifier: GPL-3.0-only
import type { AppSnapshot } from '../services/storage/snapshotTypes'
import type { EmbedConfig } from './embedContext'

export interface IEmbedPersistenceService {
  loadSnapshot(userId: string): Promise<AppSnapshot | null>
  saveSnapshot(userId: string, snapshot: AppSnapshot): Promise<void>
  sendEvents(userId: string, events: unknown[]): Promise<void>
}

export class PostMessagePersistence implements IEmbedPersistenceService {
  private allowedOrigins: string[]
  private targetOrigin: string

  constructor(allowedOrigins: string[]) {
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.parent === window) {
      console.warn(
        '[PQC Embed] PostMessagePersistence created outside iframe context — messages will self-deliver'
      )
    }
    this.allowedOrigins = allowedOrigins
    // Use specific origin for postMessage target — never broadcast sensitive data with wildcard
    // unless the certificate explicitly grants wildcard access.
    this.targetOrigin = allowedOrigins.includes('*') ? '*' : (allowedOrigins[0] ?? '*')
  }

  private isAllowedOrigin(origin: string) {
    return this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin)
  }

  async loadSnapshot(userId: string): Promise<AppSnapshot | null> {
    return new Promise((resolve) => {
      let resolved = false

      const handler = (event: MessageEvent) => {
        if (!this.isAllowedOrigin(event.origin)) return

        const data = event.data as Record<string, unknown>
        if (data && data.type === 'pqc:loadResponse') {
          if (resolved) return
          resolved = true
          window.removeEventListener('message', handler)
          resolve((data.snapshot as AppSnapshot) || null)
        }
      }
      window.addEventListener('message', handler)
      window.parent.postMessage({ type: 'pqc:load', userId }, this.targetOrigin)

      // Fallback timeout in case parent doesn't respond
      setTimeout(() => {
        if (resolved) return
        resolved = true
        window.removeEventListener('message', handler)
        resolve(null)
      }, 5000)
    })
  }

  async saveSnapshot(userId: string, snapshot: AppSnapshot): Promise<void> {
    window.parent.postMessage({ type: 'pqc:save', userId, snapshot }, this.targetOrigin)
  }

  async sendEvents(userId: string, events: unknown[]): Promise<void> {
    if (events.length > 0) {
      window.parent.postMessage({ type: 'pqc:event', userId, events }, this.targetOrigin)
    }
  }
}

export class NoPersistence implements IEmbedPersistenceService {
  async loadSnapshot(): Promise<AppSnapshot | null> {
    return null
  }
  async saveSnapshot(): Promise<void> {}
  async sendEvents(): Promise<void> {}
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create the appropriate persistence adapter based on the configured mode.
 * Async to support lazy-loaded adapters (Capacitor) without bundling them in web builds.
 * For sync adapters (postMessage, none), returns via resolved promise.
 */
export async function createPersistenceService(
  mode: EmbedConfig['persistMode'],
  allowedOrigins: string[]
): Promise<IEmbedPersistenceService> {
  switch (mode) {
    case 'postMessage':
      return new PostMessagePersistence(allowedOrigins)
    case 'capacitor': {
      // Lazy-import to avoid bundling Capacitor modules in web builds
      const { CapacitorPersistence } = await import('./CapacitorPersistence')
      return new CapacitorPersistence()
    }
    case 'none':
    default:
      return new NoPersistence()
  }
}
