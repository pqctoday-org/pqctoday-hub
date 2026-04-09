// SPDX-License-Identifier: GPL-3.0-only
import type { AppSnapshot } from '../services/storage/snapshotTypes'

export interface IEmbedPersistenceService {
  loadSnapshot(userId: string): Promise<AppSnapshot | null>
  saveSnapshot(userId: string, snapshot: AppSnapshot): Promise<void>
  sendEvents(userId: string, events: unknown[]): Promise<void>
}

export class ApiPersistence implements IEmbedPersistenceService {
  constructor(
    private readonly apiBase: string,
    private readonly getToken: () => string | null,
    private readonly triggerAuthRefresh: () => void
  ) {}

  private async fetchWithAuth(
    url: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<Response> {
    const token = this.getToken()
    if (!token) throw new Error('API persistence requires an auth token')

    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
      this.triggerAuthRefresh()
      throw new Error('Authentication expired')
    }

    if (!res.ok) {
      if (res.status >= 500 && attempt <= 3) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500))
        return this.fetchWithAuth(url, options, attempt + 1)
      }
      throw new Error(`API error: ${res.statusText}`)
    }

    return res
  }

  async loadSnapshot(userId: string): Promise<AppSnapshot | null> {
    try {
      const res = await this.fetchWithAuth(`${this.apiBase}/snapshot?userId=${userId}`)
      if (res.status === 204) return null
      return res.json()
    } catch {
      return null
    }
  }

  async saveSnapshot(userId: string, snapshot: AppSnapshot): Promise<void> {
    await this.fetchWithAuth(`${this.apiBase}/snapshot`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, snapshot }),
    })
  }

  async sendEvents(userId: string, events: unknown[]): Promise<void> {
    if (!events.length) return
    await this.fetchWithAuth(`${this.apiBase}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, events }),
    })
  }
}

export class PostMessagePersistence implements IEmbedPersistenceService {
  private allowedOrigins: string[]
  private targetOrigin: string

  constructor(allowedOrigins: string[]) {
    this.allowedOrigins = allowedOrigins
    // Use specific origin for postMessage target — never broadcast sensitive data with wildcard
    // unless the certificate explicitly grants wildcard access.
    this.targetOrigin = allowedOrigins.includes('*') ? '*' : (allowedOrigins[0] ?? '*')
  }

  private isAllowedOrigin(origin: string) {
    return this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin)
  }

  async loadSnapshot(userId: string): Promise<AppSnapshot | null> {
    if (window.parent === window) return null

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
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'pqc:save', userId, snapshot }, this.targetOrigin)
    }
  }

  async sendEvents(userId: string, events: unknown[]): Promise<void> {
    if (window.parent !== window && events.length > 0) {
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
