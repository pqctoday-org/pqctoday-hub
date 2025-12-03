import { useEffect, useRef, useCallback } from 'react'
import { useOpenSSLStore } from '../store'
import type { WorkerMessage, WorkerResponse } from '../worker/types'

export const useOpenSSL = () => {
  const workerRef = useRef<Worker | null>(null)
  const {
    addLog,
    clearTerminalLogs,
    setIsProcessing,
    addFile,
    files,
    command: currentCommand,
    setLastExecutionTime,
    addStructuredLog,
  } = useOpenSSLStore()

  const startTimeRef = useRef<number | null>(null)
  const commandRef = useRef<string>('')

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
          addLog(event.data.stream === 'stderr' ? 'error' : 'info', event.data.message)
          break
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
        case 'READY':
          addLog('info', 'OpenSSL System Ready')
          break
        case 'ERROR':
          addLog('error', `System Error: ${event.data.error} `)
          setIsProcessing(false)
          break
        case 'DONE':
          setIsProcessing(false)
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
    worker.postMessage({ type: 'LOAD', url: '/wasm/openssl.js' })

    return () => {
      active = false
      worker.terminate()
    }
  }, [addLog, addFile, setIsProcessing, addStructuredLog, setLastExecutionTime])

  const executeCommand = useCallback(
    async (cmdOverride?: string) => {
      const commandToExecute = cmdOverride || currentCommand
      if (!commandToExecute) return

      commandRef.current = commandToExecute
      setIsProcessing(true)
      setLastExecutionTime(null)
      startTimeRef.current = performance.now()
      clearTerminalLogs() // Auto-clear logs on new run
      addLog('info', `$ ${commandToExecute}`)

      // Parse command string to args, respecting quotes
      const args: string[] = []
      let match
      const regex = /[^\s"]+|"([^"]*)"/g

      // Skip 'openssl' if present
      const cmdStr = commandToExecute.startsWith('openssl ')
        ? commandToExecute.slice(8)
        : commandToExecute

      while ((match = regex.exec(cmdStr)) !== null) {
        // If it was a quoted string (group 1), use that. Otherwise use the whole match.
        args.push(match[1] ? match[1] : match[0])
      }

      const cmd = args.shift() || ''

      if (workerRef.current) {
        // Generate unique request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        // Send command AND files in one message to ensure they are written to the fresh module
        workerRef.current.postMessage({
          type: 'COMMAND',
          command: cmd,
          args,
          files: files.map((f) => ({ name: f.name, data: f.content })),
          requestId,
        } as WorkerMessage)
      }
    },
    [currentCommand, setIsProcessing, clearTerminalLogs, addLog, files, setLastExecutionTime]
  )

  return { executeCommand }
}
