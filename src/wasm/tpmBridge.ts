export interface PqcTpmModule extends WebAssembly.Instance {
  cwrap: (ident: string, returnType: string, argTypes: string[]) => any
  ccall: (ident: string, returnType: string, argTypes: string[], args: any[]) => any
  getValue: (ptr: number, type: string) => number
  setValue: (ptr: number, value: number, type: string) => void
  UTF8ToString: (ptr: number) => string
  stringToUTF8: (str: string, outPtr: number, maxBytesToWrite: number) => void
  lengthBytesUTF8: (str: string) => number
  HEAPU8: Uint8Array
  _malloc: (size: number) => number
  _free: (ptr: number) => void
}

let tpmInstance: PqcTpmModule | null = null
let tpmReadyPromise: Promise<void> | null = null

// Capture the last printErr message so failures are visible in the UI
let _lastTpmErr = ''
export function getLastTpmErr(): string {
  return _lastTpmErr
}
export function clearLastTpmErr(): void {
  _lastTpmErr = ''
}

// Build stamp used for cache-busting — updated each deploy
const WASM_BUILD = '20260503-2031'

export async function initTpm(): Promise<void> {
  if (tpmReadyPromise) return tpmReadyPromise

  tpmReadyPromise = new Promise(async (resolve, reject) => {
    try {
      // Load the Emscripten JS glue code
      const script = document.createElement('script')
      script.src = `/wasm/pqctpm.js?v=${WASM_BUILD}`

      script.onload = async () => {
        try {
          // The JS file defines a global function PqcTpmModule
          // @ts-ignore
          const module = await window.PqcTpmModule({
            locateFile: (path: string) => {
              if (path.endsWith('.wasm')) return `/wasm/pqctpm.wasm?v=${WASM_BUILD}`
              return path
            },
            print: (text: string) => console.log('TPM: ' + text),
            printErr: (text: string) => {
              _lastTpmErr = text
              console.error('TPM ERR: ' + text)
            },
          })

          tpmInstance = module

          // Initialize the TPM
          const startup = module.cwrap('tpm_wasm_startup', 'number', ['string'])
          // Pass empty string so TPMLIB_SetProfile is skipped (avoids the 0x9 profile parse error)
          const rc = startup('')
          if (rc !== 0) {
            reject(new Error(`Failed to initialize TPM WASM: ${rc}`))
            return
          }

          console.log('PQC TPM Successfully Initialized!')
          resolve()
        } catch (e) {
          reject(e)
        }
      }

      script.onerror = () => {
        reject(new Error('Failed to load pqctpm.js'))
      }

      document.body.appendChild(script)
    } catch (e) {
      reject(e)
    }
  })

  return tpmReadyPromise
}

/**
 * Execute a raw TPM command buffer and return the response buffer.
 */
export async function executeTpmCommand(command: Uint8Array): Promise<Uint8Array> {
  if (!tpmInstance) {
    throw new Error('TPM is not initialized')
  }

  const processCmd = tpmInstance.cwrap('tpm_wasm_process', 'number', [
    'number',
    'number',
    'number',
    'number',
  ])

  // Allocate memory for the command
  const cmdPtr = tpmInstance._malloc(command.length)
  tpmInstance.HEAPU8.set(command, cmdPtr)

  // Allocate a 4096-byte buffer for the response
  const MAX_RESP_SIZE = 4096
  const respBufPtr = tpmInstance._malloc(MAX_RESP_SIZE)

  try {
    const rc = processCmd(cmdPtr, command.length, respBufPtr, MAX_RESP_SIZE)

    // tpm_wasm_process returns the number of bytes written, or -1 on error
    if (rc === -1) {
      throw new Error(`TPMLIB_Process failed internally within the WASM emulator.`)
    }

    // Copy the response buffer of length 'rc'
    const response = new Uint8Array(tpmInstance.HEAPU8.buffer, respBufPtr, rc)
    const result = new Uint8Array(response) // Deep copy to prevent memory corruption

    return result
  } finally {
    // Cleanup
    tpmInstance._free(cmdPtr)
    tpmInstance._free(respBufPtr)
  }
}
