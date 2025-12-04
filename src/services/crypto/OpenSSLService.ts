import type { WorkerMessage, WorkerResponse } from '../../components/OpenSSLStudio/worker/types'

export interface OpenSSLCommandResult {
  stdout: string
  stderr: string
  files: { name: string; data: Uint8Array }[]
  error?: string
}

class OpenSSLService {
  private worker: Worker | null = null
  private pendingRequests: Map<
    string,
    {
      resolve: (value: OpenSSLCommandResult) => void
      reject: (reason?: any) => void
      result: OpenSSLCommandResult
    }
  > = new Map()
  private isReady: boolean = false
  private readyPromise: Promise<void> | null = null

  constructor() {
    // Lazy initialization in init()
  }

  public async init(): Promise<void> {
    if (this.isReady) return
    if (this.readyPromise) return this.readyPromise

    this.readyPromise = new Promise((resolve, reject) => {
      try {
        // We need to use the same worker path as the Studio
        this.worker = new Worker(
          new URL('../../components/OpenSSLStudio/worker/openssl.worker.ts', import.meta.url),
          {
            type: 'classic',
          }
        )

        this.worker.onmessage = this.handleMessage.bind(this)

        // Initialize the worker
        this.worker.postMessage({ type: 'LOAD', url: '/wasm/openssl.js' })

        // We'll resolve this promise when we get the READY message
        // But we also need to handle the case where it fails immediately
        // For now, we'll let the handleMessage resolve it.

        // Store the resolve function to be called by handleMessage
        // This is a bit of a hack, but effective for the initial handshake
        ;(this as any)._resolveInit = resolve
      } catch (error) {
        reject(error)
      }
    })

    return this.readyPromise
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { type, requestId } = event.data

    if (type === 'READY') {
      this.isReady = true
      if ((this as any)._resolveInit) {
        ;(this as any)._resolveInit()
        ;(this as any)._resolveInit = undefined
      }
      return
    }

    if (!requestId || !this.pendingRequests.has(requestId)) {
      // Log or ignore messages without a request ID (unless it's global logs)
      // console.log('Received message without request ID:', event.data);
      return
    }

    const request = this.pendingRequests.get(requestId)!

    switch (type) {
      case 'LOG':
        if (event.data.stream === 'stdout') {
          request.result.stdout += event.data.message + '\n'
        } else {
          request.result.stderr += event.data.message + '\n'
        }
        break
      case 'FILE_CREATED':
        request.result.files.push({
          name: event.data.name,
          data: event.data.data,
        })
        break
      case 'ERROR':
        request.result.error = event.data.error
        // We don't reject immediately, we wait for DONE to return the full context
        break
      case 'DONE':
        this.pendingRequests.delete(requestId)
        if (request.result.error) {
          request.reject(new Error(request.result.error))
        } else {
          request.resolve(request.result)
        }
        break
    }
  }

  public async execute(
    command: string,
    files: { name: string; data: Uint8Array }[] = []
  ): Promise<OpenSSLCommandResult> {
    await this.init()

    if (!this.worker) throw new Error('Worker not initialized')

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Parse command string to args
    // Simple parser: split by spaces but respect quotes
    const args: string[] = []
    let match
    const regex = /[^\s"]+|"([^"]*)"/g

    // Remove 'openssl' prefix if present
    const cmdStr = command.trim().startsWith('openssl ') ? command.trim().slice(8) : command.trim()

    while ((match = regex.exec(cmdStr)) !== null) {
      args.push(match[1] ? match[1] : match[0])
    }

    const cmd = args.shift() || ''

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        result: { stdout: '', stderr: '', files: [] },
      })

      this.worker!.postMessage({
        type: 'COMMAND',
        command: cmd,
        args,
        files,
        requestId,
      } as WorkerMessage)
    })
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.isReady = false
      this.readyPromise = null
    }
  }
}

export const openSSLService = new OpenSSLService()
