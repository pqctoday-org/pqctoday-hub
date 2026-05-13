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
const WASM_BUILD = '20260513-v0p7'

// V2.7 RC1 provisioning status, captured after registerPqcBridge runs.
// Indexes: 0=ML-KEM-512, 1=ML-KEM-768, 2=ML-KEM-1024,
//          3=ML-DSA-44,   4=ML-DSA-65,  5=ML-DSA-87
// Values: 0=untried, 1=ok, 2=fail
let _v2p7Status: number[] | null = null
let _v2p7Log = ''

export function getV2p7Status(): number[] | null {
  return _v2p7Status
}
export function getV2p7Log(): string {
  return _v2p7Log
}

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

          // Issue #9: Register the softhsm-wasm PQC bridge so that
          // CryptMlKem/CryptMlDsa operations use real crypto instead of
          // 0xCC/0xDD/0xEE placeholders.
          try {
            const { registerPqcBridge } = await import('./pqcCryptoBridge')
            await registerPqcBridge(module)
            console.log('PQC Crypto Bridge registered — real ML-KEM/ML-DSA active')
          } catch (bridgeErr) {
            // Non-fatal: compliance suite will fall back to placeholder bytes
            console.warn(
              'PQC Bridge registration failed (falling back to placeholders):',
              bridgeErr
            )
          }

          // V2.7 RC1 EK + cert NV provisioning (pqctoday-tpm v0.7.0).
          // Idempotent: subsequent reloads hit already-persistent EK handles +
          // already-defined NV slots; the C side logs + continues. The bridge
          // MUST be registered first so the 6 EK CreatePrimary calls produce
          // real ML-KEM/ML-DSA pubkeys (else OpenSSL refuses the cert build).
          try {
            const provision = module.cwrap('tpm_wasm_provision_v2p7', 'number', [])
            const provisionRc = provision()

            // Read back the 6-byte status array + tail log for diagnostics.
            const statusPtr = module._malloc(6)
            const getStatus = module.cwrap('tpm_wasm_get_v2p7_status', 'number', [
              'number',
              'number',
            ])
            if (getStatus(statusPtr, 6) === 6) {
              _v2p7Status = Array.from(module.HEAPU8.subarray(statusPtr, statusPtr + 6))
            }
            module._free(statusPtr)

            const logPtr = module._malloc(2048)
            const getLog = module.cwrap('tpm_wasm_get_v2p7_log', 'number', ['number', 'number'])
            if (getLog(logPtr, 2048) >= 0) {
              _v2p7Log = module.UTF8ToString(logPtr)
            }
            module._free(logPtr)

            const okCount = (_v2p7Status || []).filter((s) => s === 1).length
            console.log(`V2.7 EK provisioning: ${okCount}/6 slots OK (rc=${provisionRc})`)
            if (_v2p7Log) console.log(_v2p7Log)
          } catch (provErr) {
            console.warn('V2.7 EK provisioning threw:', provErr)
          }

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

/**
 * Execute a TPM command with a caller-chosen response buffer size.
 * Required for TPM2_ReadPublic on ML-DSA-87 EKs and TPM2_Quote/Certify
 * with ML-DSA-87 AKs, whose responses exceed the 4 KB default. Returns
 * the raw response Uint8Array.
 */
export async function executeTpmCommandLarge(
  command: Uint8Array,
  maxResp: number
): Promise<Uint8Array> {
  if (!tpmInstance) throw new Error('TPM is not initialized')
  const processCmd = tpmInstance.cwrap('tpm_wasm_process', 'number', [
    'number',
    'number',
    'number',
    'number',
  ])
  const cmdPtr = tpmInstance._malloc(command.length)
  tpmInstance.HEAPU8.set(command, cmdPtr)
  const respPtr = tpmInstance._malloc(maxResp)
  try {
    const rc = processCmd(cmdPtr, command.length, respPtr, maxResp)
    if (rc === -1) throw new Error('TPMLIB_Process failed inside WASM')
    return new Uint8Array(new Uint8Array(tpmInstance.HEAPU8.buffer, respPtr, rc))
  } finally {
    tpmInstance._free(cmdPtr)
    tpmInstance._free(respPtr)
  }
}

/* ─── Big-endian helpers for raw TPM command construction ────────────────── */

function u16be(v: number): [number, number] {
  return [(v >>> 8) & 0xff, v & 0xff]
}
function u32be(v: number): [number, number, number, number] {
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]
}

/**
 * TPM2_ReadPublic — V1.85 Part 3 §12.4 Table 80.
 * Returns the raw TPM2B_PUBLIC bytes (size prefix stripped — just the
 * TPMT_PUBLIC payload). Caller parses fields from the byte stream.
 *
 * Wire: TPM_ST_NO_SESSIONS, size=14, TPM_CC_ReadPublic(0x00000173),
 *       objectHandle(4).
 */
export async function readPublic(handle: number): Promise<Uint8Array> {
  const cmd = new Uint8Array([
    ...u16be(0x8001), // TPM_ST_NO_SESSIONS
    ...u32be(14), // commandSize
    ...u32be(0x00000173), // TPM_CC_ReadPublic
    ...u32be(handle),
  ])
  const resp = await executeTpmCommandLarge(cmd, 8192)
  if (resp.length < 10) throw new Error('ReadPublic: response too short')
  const rc = (resp[6] << 24) | (resp[7] << 16) | (resp[8] << 8) | resp[9]
  if (rc !== 0) {
    throw new Error(`ReadPublic 0x${handle.toString(16)} returned TPM rc 0x${rc.toString(16)}`)
  }
  // Body layout after the 10-byte header:
  //   outPublic   = TPM2B_PUBLIC  { size(2), TPMT_PUBLIC bytes }
  //   name        = TPM2B_NAME    { size(2), bytes }
  //   qualifiedName = TPM2B_NAME  { size(2), bytes }
  const off = 10
  if (resp.length < off + 2) throw new Error('ReadPublic: missing outPublic.size')
  const outPubSize = (resp[off] << 8) | resp[off + 1]
  if (resp.length < off + 2 + outPubSize) throw new Error('ReadPublic: outPublic truncated')
  return resp.slice(off + 2, off + 2 + outPubSize)
}

/**
 * TPM2_NV_ReadPublic — V1.85 Part 3 §31.6.
 * Returns the TPMS_NV_PUBLIC bytes (size prefix stripped). Caller reads
 * dataSize from offset 12 (4-byte index + 2-byte nameAlg + 4-byte attrs +
 * 2-byte authPolicy.size + bytes... but for our slots authPolicy is empty).
 *
 * Wire: TPM_ST_NO_SESSIONS, size=14, TPM_CC_NV_ReadPublic(0x00000169),
 *       nvIndex(4).
 */
export async function nvReadPublic(nvIndex: number): Promise<Uint8Array> {
  const cmd = new Uint8Array([
    ...u16be(0x8001),
    ...u32be(14),
    ...u32be(0x00000169),
    ...u32be(nvIndex),
  ])
  const resp = await executeTpmCommandLarge(cmd, 1024)
  if (resp.length < 10) throw new Error('NV_ReadPublic: response too short')
  const rc = (resp[6] << 24) | (resp[7] << 16) | (resp[8] << 8) | resp[9]
  if (rc !== 0) {
    throw new Error(`NV_ReadPublic 0x${nvIndex.toString(16)} returned TPM rc 0x${rc.toString(16)}`)
  }
  const off = 10
  const nvPubSize = (resp[off] << 8) | resp[off + 1]
  return resp.slice(off + 2, off + 2 + nvPubSize)
}

/**
 * Parse dataSize (uint16, BE) out of a TPMS_NV_PUBLIC blob returned by
 * nvReadPublic. Layout: nvIndex(4) + nameAlg(2) + attributes(4) +
 * authPolicy.size(2) + authPolicy(...) + dataSize(2).
 */
export function parseNvDataSize(nvPub: Uint8Array): number {
  if (nvPub.length < 12) throw new Error('NV public too short')
  const authPolicySize = (nvPub[10] << 8) | nvPub[11]
  const dsOff = 12 + authPolicySize
  if (nvPub.length < dsOff + 2) throw new Error('NV public: dataSize truncated')
  return (nvPub[dsOff] << 8) | nvPub[dsOff + 1]
}

/**
 * Chunked TPM2_NV_Read — V1.85 Part 3 §31.13. Reads the entire NV slot
 * in MAX_NV_BUFFER_SIZE-sized chunks (1024 B by default on this build).
 * Uses an empty-password session, which works for slots with TPMA_NV_AUTHREAD
 * set (the case for the V2.7 §5.3.1 EK cert slots).
 */
export async function nvReadAll(nvIndex: number): Promise<Uint8Array> {
  const nvPub = await nvReadPublic(nvIndex)
  const dataSize = parseNvDataSize(nvPub)
  const CHUNK = 1024
  const out = new Uint8Array(dataSize)
  let off = 0
  while (off < dataSize) {
    const want = Math.min(CHUNK, dataSize - off)
    // Empty-password session frame: handle(4)=TPM_RS_PW(0x40000009),
    // nonce.size(2)=0, sessionAttributes(1)=0, hmac.size(2)=0 → 9 bytes.
    const sessionFrame = [...u32be(0x40000009), ...u16be(0), 0, ...u16be(0)]
    const cmd = new Uint8Array([
      ...u16be(0x8002), // TPM_ST_SESSIONS
      ...u32be(10 + 4 + 4 + 4 + sessionFrame.length + 2 + 2), // size
      ...u32be(0x0000014e), // TPM_CC_NV_Read
      ...u32be(nvIndex), // authHandle (= nvIndex; AUTHREAD)
      ...u32be(nvIndex), // nvIndex
      ...u32be(sessionFrame.length), // authBlock length
      ...sessionFrame,
      ...u16be(want), // size
      ...u16be(off), // offset
    ])
    const resp = await executeTpmCommandLarge(cmd, 2048)
    if (resp.length < 10) throw new Error('NV_Read: response too short')
    const rc = (resp[6] << 24) | (resp[7] << 16) | (resp[8] << 8) | resp[9]
    if (rc !== 0) {
      throw new Error(
        `NV_Read 0x${nvIndex.toString(16)} @ off ${off} returned TPM rc 0x${rc.toString(16)}`
      )
    }
    // Body: parameterSize(4 — present because tag=TPM_ST_SESSIONS),
    //       TPM2B_MAX_NV_BUFFER { size(2), bytes }
    const bodyOff = 10 + 4
    if (resp.length < bodyOff + 2) throw new Error('NV_Read: truncated parameter')
    const got = (resp[bodyOff] << 8) | resp[bodyOff + 1]
    if (resp.length < bodyOff + 2 + got) throw new Error('NV_Read: truncated data')
    out.set(resp.slice(bodyOff + 2, bodyOff + 2 + got), off)
    off += got
    if (got === 0) break
  }
  return out
}
