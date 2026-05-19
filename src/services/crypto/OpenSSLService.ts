// SPDX-License-Identifier: GPL-3.0-only
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
        // Use Vite's worker import to load the TypeScript source directly
        this.worker = new Worker(
          new URL('../../components/OpenSSLStudio/worker/openssl.worker.ts', import.meta.url),
          { type: 'classic' }
        )

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
        ;(
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
        ;(this as unknown as { _resolveInit: () => void })._resolveInit()
        ;(this as unknown as { _resolveInit: undefined })._resolveInit = undefined
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
          console.log(
            `[OpenSSL] ✓ ${cmd} ${args.slice(0, 3).join(' ')}${args.length > 3 ? '...' : ''}`
          )
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          const errorMsg = error instanceof Error ? error.message : String(error)

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

  public async simulateTLS(
    clientConfig: string,
    serverConfig: string,
    files: { name: string; data: Uint8Array }[] = [],
    commands: string[] = []
  ): Promise<string> {
    try {
      await this.init()
    } catch (error) {
      throw new Error(`OpenSSL Service not available: ${error}`)
    }

    if (!this.worker) throw new Error('Worker not initialized')

    const requestId = `req_tls_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`TLS Simulation timed out after ${this.EXEC_TIMEOUT}ms`))
      }, this.EXEC_TIMEOUT)

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeoutId)
          // Parse stdout to find the result JSON
          const lines = result.stdout.split('\n')
          const resultLine = lines.find((line) => line.startsWith('SIMULATION_RESULT:'))

          if (resultLine) {
            resolve(resultLine.replace('SIMULATION_RESULT:', ''))
          } else {
            // Fallback: If no structured result, return full stdout (might be an error log)
            // But check stderr too
            if (result.stderr && result.stderr.length > 0) {
              reject(new Error(result.stderr))
            } else {
              resolve(result.stdout)
            }
          }
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
        result: { stdout: '', stderr: '', error: '', files: [] },
      })

      this.worker!.postMessage({
        type: 'TLS_SIMULATE',
        clientConfig,
        serverConfig,
        files,
        commands,
        requestId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    })
  }

  public async simulateCmp(args: {
    eeKeyPath: string
    subjectDn: string
    reference: string
    secret: string
    caCertPath: string
    caKeyPath: string
    outCertPath: string
    files: { name: string; data: Uint8Array }[]
  }): Promise<{
    ok: boolean
    error?: string
    transcript: { side: string; event: string; detail: string }[]
    certPem?: Uint8Array
    certPath?: string
    rawJson: string
  }> {
    try {
      await this.init()
    } catch (error) {
      throw new Error(`OpenSSL Service not available: ${error}`)
    }
    if (!this.worker) throw new Error('Worker not initialized')

    const requestId = `req_cmp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`CMP simulation timed out after ${this.EXEC_TIMEOUT}ms`))
      }, this.EXEC_TIMEOUT)

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeoutId)
          const line = result.stdout.split('\n').find((l) => l.startsWith('CMP_SIMULATION_RESULT:'))
          if (!line) {
            reject(new Error('CMP simulation produced no result line. stderr:\n' + result.stderr))
            return
          }
          const rawJson = line.replace('CMP_SIMULATION_RESULT:', '')
          let parsed: {
            ok: boolean
            error?: string
            transcript?: { side: string; event: string; detail: string }[]
            certPath?: string
          }
          try {
            parsed = JSON.parse(rawJson)
          } catch {
            reject(new Error(`CMP simulation result was not valid JSON: ${rawJson}`))
            return
          }
          const certFile = parsed.certPath
            ? result.files.find((f) => '/' + f.name === parsed.certPath)
            : undefined
          resolve({
            ok: parsed.ok,
            error: parsed.error,
            transcript: parsed.transcript || [],
            certPem: certFile?.data,
            certPath: parsed.certPath,
            rawJson,
          })
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
        result: { stdout: '', stderr: '', error: '', files: [] },
      })

      this.worker!.postMessage({
        type: 'CMP_SIMULATE',
        eeKeyPath: args.eeKeyPath,
        subjectDn: args.subjectDn,
        reference: args.reference,
        secret: args.secret,
        caCertPath: args.caCertPath,
        caKeyPath: args.caKeyPath,
        outCertPath: args.outCertPath,
        files: args.files,
        requestId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    })
  }

  public async generateCaRoot(args: {
    algorithm: string
    subjectDn: string
    keyOutPath: string
    certOutPath: string
    days: number
  }): Promise<{ ok: boolean; error?: string; keyPem?: Uint8Array; certPem?: Uint8Array }> {
    try {
      await this.init()
    } catch (error) {
      throw new Error(`OpenSSL Service not available: ${error}`)
    }
    if (!this.worker) throw new Error('Worker not initialized')

    const requestId = `req_genca_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`CA root generation timed out after ${this.EXEC_TIMEOUT}ms`))
      }, this.EXEC_TIMEOUT)

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeoutId)
          const line = result.stdout.split('\n').find((l) => l.startsWith('CA_ROOT_RESULT:'))
          if (!line) {
            reject(
              new Error('CA root generation produced no result line. stderr:\n' + result.stderr)
            )
            return
          }
          let parsed: { ok: boolean; error?: string }
          try {
            parsed = JSON.parse(line.replace('CA_ROOT_RESULT:', ''))
          } catch {
            reject(new Error(`CA root result was not valid JSON: ${line}`))
            return
          }
          const keyFile = result.files.find((f) => '/' + f.name === args.keyOutPath)
          const certFile = result.files.find((f) => '/' + f.name === args.certOutPath)
          resolve({
            ok: parsed.ok,
            error: parsed.error,
            keyPem: keyFile?.data,
            certPem: certFile?.data,
          })
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
        result: { stdout: '', stderr: '', error: '', files: [] },
      })

      this.worker!.postMessage({
        type: 'GEN_CA_ROOT',
        algorithm: args.algorithm,
        subjectDn: args.subjectDn,
        keyOutPath: args.keyOutPath,
        certOutPath: args.certOutPath,
        days: args.days,
        requestId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    })
  }

  public async executeSkey(
    opType: 'create' | 'derive',
    params: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.init()
    } catch (error) {
      throw new Error(`OpenSSL Service not available: ${error}`)
    }

    if (!this.worker) throw new Error('Worker not initialized')

    const requestId = `req_skey_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`SKEY Operation timed out`))
      }, this.EXEC_TIMEOUT)

      this.pendingRequests.set(requestId, {
        resolve: () => {
          clearTimeout(timeoutId)
          resolve()
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
        result: { stdout: '', stderr: '', error: '', files: [] },
      })

      this.worker!.postMessage({
        type: 'SKEY_OPERATION',
        opType,
        params,
        requestId,
      } as WorkerMessage)
    })
  }

  public terminate() {
    this.resetState()
  }
}

export const openSSLService = new OpenSSLService()
