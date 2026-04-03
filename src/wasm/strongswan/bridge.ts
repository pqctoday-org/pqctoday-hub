// SPDX-License-Identifier: GPL-3.0-only

export interface StrongSwanLog {
  level: 'info' | 'error'
  text: string
}

export type StrongSwanState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'RUNNING' | 'ERROR'

export class StrongSwanEngine {
  private worker: Worker | null = null
  private logListeners = new Set<(log: StrongSwanLog) => void>()
  private stateListeners = new Set<(state: StrongSwanState) => void>()
  private state: StrongSwanState = 'UNINITIALIZED'

  constructor() {}

  public addLogListener(fn: (log: StrongSwanLog) => void) {
    this.logListeners.add(fn)
  }

  public removeLogListener(fn: (log: StrongSwanLog) => void) {
    this.logListeners.delete(fn)
  }

  public addStateListener(fn: (state: StrongSwanState) => void) {
    this.stateListeners.add(fn)
    // Immediately emit current state to new listener
    fn(this.state)
  }

  public removeStateListener(fn: (state: StrongSwanState) => void) {
    this.stateListeners.delete(fn)
  }

  private setState(s: StrongSwanState) {
    this.state = s
    this.stateListeners.forEach((fn) => fn(s))
  }

  private dispatchLog(log: StrongSwanLog) {
    this.logListeners.forEach((fn) => fn(log))
  }

  public init() {
    if (this.worker) return

    this.setState('LOADING')

    this.worker = new Worker('/wasm/strongswan_worker.js')

    this.worker.onmessage = (e) => {
      const { type, payload } = e.data
      switch (type) {
        case 'LOG':
          this.dispatchLog(payload as StrongSwanLog)
          break
        case 'READY':
          this.setState('READY')
          break
        case 'ERROR':
          this.setState('ERROR')
          this.dispatchLog({ level: 'error', text: payload })
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
