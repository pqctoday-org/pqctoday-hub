// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useCallback } from 'react'
import { useOpenSSLStore } from '../store'
import type { WorkerMessage, WorkerResponse } from '../worker/types'
import { parseOpensslArgs } from '../worker/commandParser'
import { lookupCkr } from '../../../wasm/pkcs11Inspect'

/** One object really resident on the PKCS#11 token, as reported by a live
 *  C_FindObjects sweep (not by what this UI thinks it created). */
export interface TokenObject {
  handle: number
  cls: number
  keyType: number
  label: string
}

interface PendingRun {
  resolve: (result: { stdout: string }) => void
  reject: (error: Error) => void
  stdout: string[]
  /** stderr-stream LOG lines only — the real openssl error text (e.g.
   * "Module initialization failed!"), kept separate from stdout/debug
   * noise so a rejection can surface it directly. */
  stderr: string[]
}

// The worker forwards genuine openssl print()/printErr() output as a plain
// `message: text` LOG event — but it ALSO narrates its own internal steps
// ("[Debug] Selecting strategy...", "Executing: openssl ...", etc.) through
// that exact same LOG message shape, with no separate flag to tell them
// apart at the source. A lesson step's runCommand() result (and a failed
// command's surfaced error) should only ever contain what openssl itself
// printed — not the worker's own narration — or the Learn tab's inline
// "detail" text reads as a garbled transcript instead of the actual output.
const WORKER_NARRATION_PREFIXES = [
  '[Debug]',
  '[VFS]',
  'Executing: openssl',
  '💡',
  'Failed to',
  'Warning:',
  'OpenSSL Execution Error:',
  'SIMULATION_RESULT:',
  'CMP_SIMULATION_RESULT:',
  'CA_ROOT_RESULT:',
  'SKEY OPERATION',
]
const isWorkerNarration = (message: string): boolean =>
  WORKER_NARRATION_PREFIXES.some((p) => message.trimStart().startsWith(p))

export const useOpenSSL = () => {
  const workerRef = useRef<Worker | null>(null)
  const {
    addLog,
    clearTerminalLogs,
    setIsProcessing,
    isProcessing,
    addFile,
    command: currentCommand,
    setLastExecutionTime,
    addStructuredLog,
    setIsReady,
    setLoadError,
    addPkcs11LogEntry,
  } = useOpenSSLStore()

  const startTimeRef = useRef<number | null>(null)
  const commandRef = useRef<string>('')
  // Learn tab's promise-based runner (runCommand below) — keyed by requestId,
  // separate from the fire-and-forget Workbench flow above it.
  const pendingRunsRef = useRef<Map<string, PendingRun>>(new Map())
  /** In-flight HSM_KEYGEN requests, settled by HSM_KEY_CREATED / ERROR. */
  const pendingKeygenRef = useRef<
    Map<string, { resolve: (r: { uri: string }) => void; reject: (e: Error) => void }>
  >(new Map())
  /** In-flight HSM_LIST_OBJECTS requests, settled by HSM_OBJECTS / ERROR. */
  const pendingListRef = useRef<
    Map<string, { resolve: (r: TokenObject[]) => void; reject: (e: Error) => void }>
  >(new Map())

  useEffect(() => {
    // Track if this effect instance is active
    let active = true

    // Initialize Worker
    const worker = new Worker(new URL('../worker/openssl.worker.ts', import.meta.url), {
      type: 'classic',
    })

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (!active) return

      const { type } = event.data

      switch (type) {
        case 'LOG':
          // The Terminal tab wants the FULL verbose trace (debug narration
          // included) — addLog always gets everything, unfiltered.
          addLog(event.data.stream === 'stderr' ? 'error' : 'info', event.data.message)
          if (event.data.requestId && !isWorkerNarration(event.data.message)) {
            const pending = pendingRunsRef.current.get(event.data.requestId)
            pending?.stdout.push(event.data.message)
            if (pending && event.data.stream === 'stderr') pending.stderr.push(event.data.message)
          }
          break
        case 'HSM_OBJECTS': {
          setIsProcessing(false)
          if (event.data.requestId) {
            const pending = pendingListRef.current.get(event.data.requestId)
            pendingListRef.current.delete(event.data.requestId)
            pending?.resolve(event.data.objects)
          }
          break
        }
        case 'P11CALL': {
          // A real C_* call the worker made against the linked engine. `ok`
          // is derived from the actual CK_RV — never assumed — so a rejected
          // call can't render as a success (the failure mode this panel
          // exists to make visible).
          const { name } = lookupCkr(event.data.rv)
          addPkcs11LogEntry({
            fn: event.data.fn,
            args: event.data.args,
            rvHex: `0x${event.data.rv.toString(16).padStart(8, '0')}`,
            rvName: name,
            ms: event.data.ms,
            ok: event.data.rv === 0,
          })
          break
        }
        case 'FILE_CREATED':
          addFile({
            name: event.data.name,
            type: event.data.name.endsWith('.key')
              ? 'key'
              : event.data.name.endsWith('.csr')
                ? 'csr'
                : event.data.name.endsWith('.enc')
                  ? 'binary'
                  : 'text',
            content: event.data.data,
            size: event.data.data.byteLength,
            timestamp: Date.now(),
            executionTime: startTimeRef.current
              ? performance.now() - startTimeRef.current
              : undefined,
          })
          addLog('info', `File created: ${event.data.name} `)
          break
        case 'HSM_KEY_CREATED': {
          setIsProcessing(false)
          const pending = event.data.requestId
            ? pendingKeygenRef.current.get(event.data.requestId)
            : undefined
          if (pending && event.data.requestId) {
            pendingKeygenRef.current.delete(event.data.requestId)
            pending.resolve({ uri: event.data.uri })
          }
          break
        }
        case 'READY':
          addLog('info', 'OpenSSL System Ready')
          setIsReady(true)
          setLoadError(null)
          break
        case 'ERROR':
          addLog('error', `System Error: ${event.data.error} `)
          setIsProcessing(false)
          // Only mark service as not-ready for global/init-level errors (no requestId).
          // Per-command errors (with requestId) are normal failures — the worker stays alive.
          if (!event.data.requestId) {
            setIsReady(false)
            setLoadError(event.data.error || 'Failed to load the OpenSSL WASM module.')
          }
          if (event.data.requestId && pendingKeygenRef.current.has(event.data.requestId)) {
            const pk = pendingKeygenRef.current.get(event.data.requestId)!
            pendingKeygenRef.current.delete(event.data.requestId)
            pk.reject(new Error(event.data.error || 'HSM key generation failed'))
          }
          // Must reject here too, or a failed sweep leaves the caller's promise
          // pending forever and the Refresh button stuck mid-flight.
          if (event.data.requestId && pendingListRef.current.has(event.data.requestId)) {
            const pl = pendingListRef.current.get(event.data.requestId)!
            pendingListRef.current.delete(event.data.requestId)
            pl.reject(new Error(event.data.error || 'Listing token objects failed'))
          }
          if (event.data.requestId && pendingRunsRef.current.has(event.data.requestId)) {
            const pending = pendingRunsRef.current.get(event.data.requestId)!
            pendingRunsRef.current.delete(event.data.requestId)
            // The worker's own ERROR text (e.g. "OpenSSL exited with status 1")
            // is a generic exit-code summary — the REAL stderr (e.g. "Module
            // initialization failed!") already streamed in as LOG messages
            // and was captured separately in pending.stderr. Callers relying
            // on the real error text (the Algorithm Explorer's provider
            // probe, Learn tab refusal steps) need the actual reason, not
            // just a status code.
            const realError = pending.stderr.join('\n').trim()
            const message = realError || event.data.error || 'Command failed'
            pending.reject(new Error(message))
          }
          break
        case 'DONE':
          setIsProcessing(false)
          if (event.data.requestId && pendingRunsRef.current.has(event.data.requestId)) {
            const pending = pendingRunsRef.current.get(event.data.requestId)!
            pendingRunsRef.current.delete(event.data.requestId)
            pending.resolve({ stdout: pending.stdout.join('\n') })
          }
          if (startTimeRef.current) {
            const duration = performance.now() - startTimeRef.current
            setLastExecutionTime(duration)

            // --- Structured Logging Logic ---
            const cmd = commandRef.current.trim()
            let opType: 'Key Gen' | 'Sign' | 'Verify' | 'Cert Gen' | 'Other' = 'Other'
            let details = ''
            let fileName: string | undefined
            let fileSize: number | undefined

            // Attempt to extract output filename
            const outMatch = cmd.match(/-out\s+([^\s]+)/)
            if (outMatch) {
              fileName = outMatch[1]
              // Access latest files state directly to avoid stale closures or dependency loops
              const file = useOpenSSLStore.getState().files.find((f) => f.name === fileName)
              if (file) {
                fileSize = file.size
              }
            }

            if (cmd.includes('genpkey') || cmd.includes('genrsa') || cmd.includes('ecparam')) {
              opType = 'Key Gen'
              if (cmd.includes('RSA')) details = 'Algorithm: RSA'
              else if (cmd.includes('EC')) details = 'Algorithm: EC'
              else if (cmd.includes('ED25519')) details = 'Algorithm: Ed25519'
              else if (cmd.includes('ML-KEM')) details = 'Algorithm: ML-KEM (PQC)'
              else if (cmd.includes('ML-DSA')) details = 'Algorithm: ML-DSA (PQC)'
              else if (cmd.includes('SLH-DSA')) details = 'Algorithm: SLH-DSA (PQC)'
              else details = 'Algorithm: Unknown'
            } else if (cmd.includes('req') && cmd.includes('-x509')) {
              opType = 'Cert Gen'
              details = 'Self-signed Certificate'
            } else if (cmd.includes('dgst') && cmd.includes('-sign')) {
              opType = 'Sign'
              details = 'Digital Signature'
            } else if (cmd.includes('dgst') && cmd.includes('-verify')) {
              opType = 'Verify'
              details = 'Signature Verification'
            } else if (cmd.includes('pkeyutl')) {
              if (cmd.includes('-sign')) {
                opType = 'Sign'
                details = 'PQC Signature'
              } else if (cmd.includes('-verify')) {
                opType = 'Verify'
                details = 'PQC Verification'
              }
            }

            addStructuredLog({
              command: cmd,
              operationType: opType,
              details,
              fileName,
              fileSize,
              executionTime: duration,
            })

            startTimeRef.current = null
          }
          break
      }
    }

    workerRef.current = worker

    // Signal load
    setLoadError(null)
    worker.postMessage({ type: 'LOAD', url: '/wasm/openssl.js' })

    return () => {
      active = false
      worker.terminate()
      setIsReady(false)
    }
  }, [
    addLog,
    addFile,
    setIsProcessing,
    addStructuredLog,
    setLastExecutionTime,
    setIsReady,
    setLoadError,
  ])

  /** Re-send the LOAD message on the existing worker after a load failure. */
  const retryLoad = useCallback(() => {
    if (!workerRef.current) return
    setLoadError(null)
    addLog('info', 'Retrying OpenSSL WASM load...')
    workerRef.current.postMessage({ type: 'LOAD', url: '/wasm/openssl.js' })
  }, [addLog, setLoadError])

  const executeCommand = useCallback(
    async (cmdOverride?: string) => {
      const commandToExecute = cmdOverride || currentCommand
      if (!commandToExecute || isProcessing) return

      // The command runner below is a whitespace-splitting parser with no
      // shell semantics — it has no concept of pipes, so `A | B` gets split
      // into literal positional args of A rather than piping A's output into
      // B. Refuse up front with a clear message instead of silently
      // mis-parsing (this is what let both the `echo | dgst` and
      // `list | grep` presets fail with no explanation).
      if (/\|/.test(commandToExecute.replace(/"[^"]*"/g, ''))) {
        addLog(
          'error',
          "This command uses a shell pipe ( | ), which the Studio's in-browser runner does not support (no real shell — just a single OpenSSL binary). Copy it and run it in a real terminal with OpenSSL 3.5+ installed instead."
        )
        return
      }

      commandRef.current = commandToExecute
      setIsProcessing(true)
      setLastExecutionTime(null)
      startTimeRef.current = performance.now()
      clearTerminalLogs() // Auto-clear logs on new run
      addLog('info', `$ ${commandToExecute}`)

      const args = parseOpensslArgs(commandToExecute)
      const cmd = args.shift() || ''

      if (workerRef.current) {
        // Generate unique request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        // Read fresh from the store rather than the closed-over `files` —
        // see runCommand's comment below for why a stale snapshot is a real
        // bug, not just theoretical, when commands run back-to-back.
        const currentFiles = useOpenSSLStore.getState().files
        // Send command AND files in one message to ensure they are written to the fresh module
        // Convert all file content to Uint8Array to prevent "Unsupported data type" errors
        const filesAsUint8Array = currentFiles.map((f) => ({
          name: f.name,
          data:
            f.content instanceof Uint8Array
              ? f.content
              : new TextEncoder().encode(
                  typeof f.content === 'string' ? f.content : JSON.stringify(f.content)
                ),
        }))

        workerRef.current.postMessage({
          type: 'COMMAND',
          command: cmd,
          args,
          files: filesAsUint8Array,
          // The Studio's Zustand store is its filesystem source of truth and
          // is re-sent in full on every command — clear the worker's
          // persistent VFS so files deleted from the store don't linger as
          // ghosts in the worker.
          replaceVfs: true,
          requestId,
        } as WorkerMessage)
      }
    },
    [currentCommand, isProcessing, setIsProcessing, clearTerminalLogs, addLog, setLastExecutionTime]
  )

  /**
   * Promise-based command runner for the Learn tab's lesson steps — the
   * SAME worker + shared VFS as executeCommand (so a key generated in a
   * lesson is immediately visible in the Workbench's File Manager), but
   * resolves/rejects on that one command's own DONE/ERROR rather than
   * updating `currentCommand`/store state for a UI-driven Run button.
   * Rejects with the real stderr on nonzero exit — lesson steps that
   * `expect: 'refusal'` rely on this throwing.
   */
  const runCommand = useCallback(
    (cmd: string): Promise<{ stdout: string }> => {
      if (/\|/.test(cmd.replace(/"[^"]*"/g, ''))) {
        return Promise.reject(new Error('Learn tab commands may not use shell pipes.'))
      }
      if (!workerRef.current) {
        return Promise.reject(new Error('OpenSSL WASM engine is not ready yet.'))
      }

      const args = parseOpensslArgs(cmd)
      const subcommand = args.shift() || ''
      const requestId = `learn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      commandRef.current = cmd
      setIsProcessing(true)
      startTimeRef.current = performance.now()

      // Read the CURRENT store state, not the `files` this callback closed
      // over — a lesson's runAll() calls this same function reference
      // repeatedly in a tight sequential loop, each step's FILE_CREATED
      // landing in the store between calls. Closing over `files` (even
      // with it in the deps array) captures a snapshot from whenever this
      // callback was last recreated, which is stale by the second step:
      // the file the PREVIOUS step in the same run just created would be
      // missing from the message sent to the worker. getState() always
      // reflects what's true right now, regardless of render timing.
      const currentFiles = useOpenSSLStore.getState().files
      const filesAsUint8Array = currentFiles.map((f) => ({
        name: f.name,
        data:
          f.content instanceof Uint8Array
            ? f.content
            : new TextEncoder().encode(
                typeof f.content === 'string' ? f.content : JSON.stringify(f.content)
              ),
      }))

      return new Promise((resolve, reject) => {
        pendingRunsRef.current.set(requestId, { resolve, reject, stdout: [], stderr: [] })
        workerRef.current!.postMessage({
          type: 'COMMAND',
          command: subcommand,
          args,
          files: filesAsUint8Array,
          replaceVfs: true,
          requestId,
        } as WorkerMessage)
      })
    },
    [setIsProcessing]
  )

  /**
   * Generate a keypair INSIDE the PKCS#11 token, resolving with the
   * `pkcs11:` URI that addresses it.
   *
   * Not expressible as a CLI command: `genpkey -out pkcs11:...` routes
   * through a BIO and writes a PEM into the WASM filesystem, so the key
   * never reaches the token and later `pkcs11:object=<id>` lookups fail.
   * The worker calls C_GenerateKeyPair directly with CKA_TOKEN=TRUE.
   */
  const hsmKeygen = useCallback(
    (algorithm: string, keyId: string): Promise<{ uri: string }> => {
      if (!workerRef.current) {
        return Promise.reject(new Error('OpenSSL WASM engine is not ready yet.'))
      }
      const requestId = `hsm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      setIsProcessing(true)
      return new Promise((resolve, reject) => {
        pendingKeygenRef.current.set(requestId, { resolve, reject })
        workerRef.current!.postMessage({
          type: 'HSM_KEYGEN',
          algorithm,
          keyId,
          requestId,
        } as WorkerMessage)
      })
    },
    [setIsProcessing]
  )

  /**
   * Ask the token what it actually holds, via a real C_FindObjects sweep.
   * Distinct from the Studio's own `pkcs11Keys` list, which only ever knew
   * about keys this session created.
   */
  const hsmListObjects = useCallback((): Promise<TokenObject[]> => {
    if (!workerRef.current) {
      return Promise.reject(new Error('OpenSSL WASM engine is not ready yet.'))
    }
    const requestId = `hsmls_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    setIsProcessing(true)
    return new Promise((resolve, reject) => {
      pendingListRef.current.set(requestId, { resolve, reject })
      workerRef.current!.postMessage({
        type: 'HSM_LIST_OBJECTS',
        requestId,
      } as WorkerMessage)
    })
  }, [setIsProcessing])

  const executeSkey = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (opType: 'create' | 'derive', params: Record<string, any>) => {
      if (!workerRef.current) return

      setIsProcessing(true)
      setLastExecutionTime(null)
      startTimeRef.current = performance.now()
      clearTerminalLogs()
      addLog('info', `Executing SKEY ${opType.toUpperCase()}...`)

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      workerRef.current.postMessage({
        type: 'SKEY_OPERATION',
        opType,
        params,
        requestId,
      } as WorkerMessage)
    },
    [setIsProcessing, clearTerminalLogs, addLog, setLastExecutionTime]
  )

  return { executeCommand, executeSkey, runCommand, retryLoad, hsmKeygen, hsmListObjects }
}
