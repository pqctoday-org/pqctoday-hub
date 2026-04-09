// SPDX-License-Identifier: MIT
// PQC Today Embedded Vendor SDK
// Drop-in wrapper for bridging React UI states across the iFrame postMessage API.

export interface PQCInitOptions {
  /** The PQC Today base URL, normally https://pqctoday.com */
  pqcOrigin: string
  /** The reference to the embedded iframe element */
  iframe: HTMLIFrameElement
  /** Auth token generator used if 'api' or 'postMessage' is used with an auth wall */
  getToken?: () => Promise<string>
  /** Database sync responder */
  onLoadSnapshot?: (userId: string) => Promise<Record<string, unknown> | null>
  /** Database sync sender */
  onSaveSnapshot?: (userId: string, snapshot: Record<string, unknown>) => Promise<void>
  /** Activity event listener */
  onEvents?: (userId: string, events: unknown[]) => Promise<void>
  /** Height resize responder (can be used to autoscale iframe) */
  onResize?: (height: number) => void
}

export class PQCEmbed {
  private origin: string
  private iframe: HTMLIFrameElement
  private options: PQCInitOptions
  private boundHandleMessage: (event: MessageEvent) => void

  constructor(options: PQCInitOptions) {
    this.options = options
    this.origin = new URL(options.pqcOrigin).origin
    this.iframe = options.iframe
    this.boundHandleMessage = this.handleMessage.bind(this)

    window.addEventListener('message', this.boundHandleMessage)
  }

  private post(message: Record<string, unknown>) {
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, this.origin)
    }
  }

  private async handleMessage(event: MessageEvent) {
    if (event.origin !== this.origin) return
    const msg = event.data
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return

    try {
      switch (msg.type) {
        case 'pqc:ready':
          if (this.options.getToken) {
            const token = await this.options.getToken()
            this.post({ type: 'pqc:auth', token })
          }
          break
        case 'pqc:authExpired':
          if (this.options.getToken) {
            const newToken = await this.options.getToken()
            this.post({ type: 'pqc:auth', token: newToken })
          }
          break
        case 'pqc:load':
          if (this.options.onLoadSnapshot) {
            const snapshot = await this.options.onLoadSnapshot(msg.userId as string)
            this.post({ type: 'pqc:loadResponse', snapshot })
          }
          break
        case 'pqc:save':
          if (this.options.onSaveSnapshot) {
            await this.options.onSaveSnapshot(
              msg.userId as string,
              msg.snapshot as Record<string, unknown>
            )
          }
          break
        case 'pqc:event':
          if (this.options.onEvents) {
            await this.options.onEvents(msg.userId as string, msg.events as unknown[])
          }
          break
        case 'pqc:resize':
          if (this.options.onResize && typeof msg.height === 'number') {
            this.options.onResize(msg.height)
          }
          break
      }
    } catch (err) {
      console.error('[PQC Embed Error]', err)
    }
  }

  public destroy() {
    window.removeEventListener('message', this.boundHandleMessage)
  }
}
