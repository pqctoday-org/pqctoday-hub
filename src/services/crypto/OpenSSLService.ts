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
      reject: (reason?: unknown) => void
      result: OpenSSLCommandResult
    }
  > = new Map()
  private isReady: boolean = false
  private readyPromise: Promise<void> | null = null
  private readonly INIT_TIMEOUT = 30000 // 30 seconds
  private readonly EXEC_TIMEOUT = 60000 // 60 seconds

  constructor() {
    // Lazy initialization in init()
  }

  public async init(): Promise<void> {
    if (this.isReady) return
    if (this.readyPromise) return this.readyPromise

    this.readyPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.resetState()
        reject(new Error('OpenSSL initialization timed out'))
      }, this.INIT_TIMEOUT)

      try {
        // Use absolute path to the static worker file in public/wasm/
        // This bypasses path resolution issues and works on all routes
        this.worker = new Worker('/wasm/openssl-worker.js')

        this.worker.onmessage = (event) => {
          // If we get an error during init (before ready), reject
          if (event.data.type === 'ERROR' && !this.isReady && !event.data.requestId) {
            clearTimeout(timeoutId)
            this.resetState()
            reject(new Error(event.data.error || 'Initialization failed'))
            return
          }
          this.handleMessage(event)
        }

        this.worker.onerror = (error: unknown) => {
          clearTimeout(timeoutId)
          this.resetState()
          // Extract meaningful message
          const msg = (error as Error)?.message || String(error)
          console.error('OpenSSL Worker Error:', msg, error)
          reject(new Error(msg))
        }

        // Initialize the worker
        this.worker.postMessage({ type: 'LOAD', url: '/wasm/openssl.js' })

          // Store the resolve function to be called by handleMessage
          ; (
            this as unknown as { _resolveInit: (value: void | PromiseLike<void>) => void }
          )._resolveInit = () => {
            clearTimeout(timeoutId)
            resolve()
          }
      } catch (_error) {
        clearTimeout(timeoutId)
        this.resetState()
        reject(_error)
      }
    })

    return this.readyPromise
  }

  private resetState() {
    this.isReady = false
    this.readyPromise = null
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    // Clean up any pending requests
    for (const request of this.pendingRequests.values()) {
      request.reject(new Error('OpenSSL service reset'))
    }
    this.pendingRequests.clear()
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { type, requestId } = event.data

    if (type === 'READY') {
      this.isReady = true
      if ((this as unknown as { _resolveInit: () => void })._resolveInit) {
        ; (this as unknown as { _resolveInit: () => void })._resolveInit()
          ; (this as unknown as { _resolveInit: undefined })._resolveInit = undefined
      }
      return
    }

    if (!requestId || !this.pendingRequests.has(requestId)) {
      return
    }

    const request = this.pendingRequests.get(requestId)!

    switch (type) {
      case 'LOG':
        if (event.data.stream === 'stdout') {
          // Filter out debug messages and execution logs
          const msg = event.data.message.trim()
          if (!msg.startsWith('[Debug]') && !msg.startsWith('Executing:')) {
            request.result.stdout += event.data.message + '\n'
          }
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
    try {
      await this.init()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('OpenSSL Init Error:', error)
      throw new Error(
        `OpenSSL Service not available: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (!this.worker) throw new Error('Worker not initialized')

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Parse command string to args
    const args: string[] = []
    let match
    const regex = /[^\s"]+|"([^"]*)"/g

    const cmdStr = command.trim().startsWith('openssl ') ? command.trim().slice(8) : command.trim()

    while ((match = regex.exec(cmdStr)) !== null) {
      args.push(match[1] ? match[1] : match[0])
    }

    const cmd = args.shift() || ''

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`OpenSSL command timed out after ${this.EXEC_TIMEOUT}ms: ${command}`))
      }, this.EXEC_TIMEOUT)

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeoutId)
          // Log successful crypto operations
          // eslint-disable-next-line no-console
          console.log(`[OpenSSL] ✓ ${cmd} ${args.slice(0, 3).join(' ')}${args.length > 3 ? '...' : ''}`)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          const errorMsg = error instanceof Error ? error.message : String(error)
          // eslint-disable-next-line no-console
          console.error(`[OpenSSL] ✗ ${cmd} - ${errorMsg}`)
          reject(error)
        },
        result: { stdout: '', stderr: '', error: '', files: [] },
      })

      // Log the command being executed
      // eslint-disable-next-line no-console
      console.log(`[OpenSSL] → ${cmd} ${args.slice(0, 3).join(' ')}${args.length > 3 ? '...' : ''}`)

      this.worker!.postMessage({
        type: 'COMMAND',
        command: cmd,
        args,
        files,
        requestId,
      } as WorkerMessage)
    })
  }

  public async deleteFile(filename: string): Promise<void> {
    try {
      await this.init()
    } catch {
      // If init fails, we can't delete, which is fine
      return
    }

    if (!this.worker) return

    const requestId = `req_del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    return new Promise((resolve) => {
      // Short timeout for deletion
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        // Resolve anyway, cleanup shouldn't block or crash app
        resolve()
      }, 5000)

      this.pendingRequests.set(requestId, {
        resolve: () => {
          clearTimeout(timeoutId)
          resolve()
        },
        reject: (err) => {
          clearTimeout(timeoutId)
          console.warn('[OpenSSLService] Delete failed:', err)
          resolve() // Resolve anyway
        },
        result: { stdout: '', stderr: '', files: [] },
      })

      this.worker!.postMessage({
        type: 'DELETE_FILE',
        name: filename,
        requestId,
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    })
  }

  public terminate() {
    this.resetState()
  }
}

export const openSSLService = new OpenSSLService()
