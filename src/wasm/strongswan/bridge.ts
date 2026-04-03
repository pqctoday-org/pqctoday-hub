// SPDX-License-Identifier: GPL-3.0-only
export interface StrongSwanLog {
  level: 'info' | 'error'
  text: string
}

export type StrongSwanState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'RUNNING' | 'ERROR'

export class StrongSwanEngine {
  private worker: Worker | null = null
  private onLog?: (log: StrongSwanLog) => void
  private onStateChange?: (state: StrongSwanState) => void
  private state: StrongSwanState = 'UNINITIALIZED'

  constructor() {}

  private setState(s: StrongSwanState) {
    this.state = s
    this.onStateChange?.(s)
  }

  public init(
    onLog?: (log: StrongSwanLog) => void,
    onStateChange?: (state: StrongSwanState) => void
  ) {
    if (this.worker) return

    this.onLog = onLog
    this.onStateChange = onStateChange
    this.setState('LOADING')

    // @vite-ignore
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

    this.worker.onmessage = (e) => {
      const { type, payload } = e.data
      switch (type) {
        case 'LOG':
          this.onLog?.(payload as StrongSwanLog)
          break
        case 'READY':
          this.setState('READY')
          break
        case 'ERROR':
          this.setState('ERROR')
          this.onLog?.({ level: 'error', text: payload })
          break
      }
    }

    this.worker.postMessage({ type: 'INIT' })
  }

  public startDaemon(configs?: { [filename: string]: string }) {
    if (this.state === 'READY') {
      this.setState('RUNNING')
      this.worker?.postMessage({ type: 'START_DAEMON', payload: configs })
    }
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.setState('UNINITIALIZED')
  }
}

export const strongSwanEngine = new StrongSwanEngine()
