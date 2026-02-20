/* eslint-disable security/detect-object-injection */
import React, { useEffect } from 'react'
import { Info } from 'lucide-react'
import { useOpenSSLStore } from '../../store'

// --- ASN.1 / PEM Helpers ---

// Helper to construct DER Length
const encodeLen = (len: number): number[] => {
  if (len < 128) return [len]
  const hex = len.toString(16)
  if (hex.length % 2 !== 0) hex.padStart(hex.length + 1, '0') // Ensure even
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16))
  return [0x80 | bytes.length, ...bytes]
}

// Helper to wrap LMS keys in ASN.1
const toSPKI = (pubKey: Uint8Array): string => {
  // OID: 2.16.840.1.101.3.7.2.1 (id-alg-hss-lms-hashsig)
  const oid = [0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x07, 0x02, 0x01]
  const algoId = [0x30, ...encodeLen(oid.length), ...oid] // Sequence(OID)

  // BitString: 0x03, Len, 0x00 (padding), KeyBytes
  const bitString = [0x03, ...encodeLen(pubKey.length + 1), 0x00, ...Array.from(pubKey)]

  // SPKI: Sequence(AlgoId, BitString)
  const spki = [0x30, ...encodeLen(algoId.length + bitString.length), ...algoId, ...bitString]

  const b64 = btoa(String.fromCharCode(...spki))
  return `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`
}

const toPKCS8 = (privKey: Uint8Array): string => {
  // Version: 0 (Integer)
  const version = [0x02, 0x01, 0x00]

  // AlgoId: Same as SPKI
  const oid = [0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x07, 0x02, 0x01]
  const algoId = [0x30, ...encodeLen(oid.length), ...oid]

  // PrivateKey: OctetString(KeyBytes)
  const privOctet = [0x04, ...encodeLen(privKey.length), ...Array.from(privKey)]

  // PKCS8: Sequence(Version, AlgoId, PrivateKey)
  const pkcs8 = [
    0x30,
    ...encodeLen(version.length + algoId.length + privOctet.length),
    ...version,
    ...algoId,
    ...privOctet,
  ]

  const b64 = btoa(String.fromCharCode(...pkcs8))
  return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`
}

const fromPEM = (pem: string | Uint8Array): Uint8Array => {
  if (typeof pem !== 'string') {
    // If it's already binary and NOT PEM (starts with 0x30...), straightforward check?
    // But files content in store could be Uint8Array (binary) or string (text).
    // If it was saved as 'text', it is string.
    // If it is 'binary', it is Uint8Array.
    // If Uint8Array, check if it looks like PEM (ascii bytes for -----)?
    // Or assume raw if Uint8Array?
    // Previous files were raw Uint8Array. New files are PEM string.
    // If we receive Uint8Array, assume it is RAW key bytes (legacy support or raw).
    return pem
  }

  // Strip headers
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const binStr = atob(b64)
  const bytes = new Uint8Array(binStr.length)

  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)

  // Parse ASN.1 to find Key
  // Simple scanner:
  // Outer Seq (30)
  //   Inner Seq (30) - AlgoId -> Skip
  //   Next Element:
  //     If Public (SPKI): BitString (03)
  //     If Private (PKCS8): OctetString (04) - but might be wrapped in Version etc.
  //     Actually PKCS8: Version(02), AlgoId(30), PrivateKey(04)

  let offset = 0
  if (bytes[offset++] !== 0x30) throw new Error('Invalid ASN.1: Not a Sequence')

  // Skip Length
  const len = bytes[offset++]
  if (len & 0x80) {
    const nBytes = len & 0x7f
    offset += nBytes
  }

  // We are inside Outer Seq.
  // Check next tag.
  const tag1 = bytes[offset]
  if (tag1 === 0x02) {
    // Integer (Version) -> PKCS8
    // Skip Version
    offset++ // Tag
    offset++ // Len (assume 1 for version 0)
    offset++ // Value (00)

    // Next: AlgoId (30) -> Skip
    if (bytes[offset] !== 0x30) throw new Error('Invalid PKCS8: Expected AlgoId')
    offset = skipElement(bytes, offset)

    // Next: Private Key (04)
    if (bytes[offset] !== 0x04) throw new Error('Invalid PKCS8: Expected OctetString')
    // Extract content
    return extractContent(bytes, offset)
  } else if (tag1 === 0x30) {
    // Sequence (AlgoId) -> SPKI or raw Seq?
    // Skip AlgoId
    offset = skipElement(bytes, offset)

    // Next: BitString (03) -> Public Key
    if (bytes[offset] !== 0x03) throw new Error('Invalid SPKI: Expected BitString')
    const keyWithPad = extractContent(bytes, offset)
    // Remove padding byte (first byte of BitString value is unused bits count, usually 0)
    return keyWithPad.slice(1)
  } else {
    throw new Error('Unknown PEM structure tag: ' + tag1.toString(16))
  }
}

const skipElement = (bytes: Uint8Array, offset: number): number => {
  // Returns new offset after skipping element at current offset
  offset++ // Tag
  let len = bytes[offset++]
  if (len & 0x80) {
    const nBytes = len & 0x7f
    len = 0
    for (let i = 0; i < nBytes; i++) {
      len = (len << 8) | bytes[offset++]
    }
  }
  return offset + len
}

const extractContent = (bytes: Uint8Array, offset: number): Uint8Array => {
  offset++ // Tag
  let len = bytes[offset++]
  if (len & 0x80) {
    const nBytes = len & 0x7f
    len = 0
    for (let i = 0; i < nBytes; i++) {
      len = (len << 8) | bytes[offset++]
    }
  }
  return bytes.slice(offset, offset + len)
}

interface LmsConfigProps {
  mode: 'generate' | 'sign' | 'verify'
  setMode: (value: 'generate' | 'sign' | 'verify') => void
  lmsKeyFile: string
  setLmsKeyFile: (value: string) => void
  lmsSigFile: string
  setLmsSigFile: (value: string) => void
  lmsDataFile: string
  setLmsDataFile: (value: string) => void
}

const LMS_TYPES = [
  { name: 'LMS_SHA256_M32_H5', value: 0x05, description: 'Height 5 (Merkle Tree)', slug: 'h5' },
  {
    name: 'LMS_SHA256_M32_H10',
    value: 0x06,
    description: 'Height 10 (Merkle Tree) - Default',
    slug: 'h10',
  },
  { name: 'LMS_SHA256_M32_H15', value: 0x07, description: 'Height 15 (Merkle Tree)', slug: 'h15' },
  { name: 'LMS_SHA256_M32_H20', value: 0x08, description: 'Height 20 (Merkle Tree)', slug: 'h20' },
  { name: 'LMS_SHA256_M32_H25', value: 0x09, description: 'Height 25 (Merkle Tree)', slug: 'h25' },
]

const LMOTS_TYPES = [
  { name: 'LMOTS_SHA256_N32_W1', value: 0x01, description: 'Winternitz Width 1', slug: 'w1' },
  { name: 'LMOTS_SHA256_N32_W2', value: 0x02, description: 'Winternitz Width 2', slug: 'w2' },
  { name: 'LMOTS_SHA256_N32_W4', value: 0x03, description: 'Winternitz Width 4', slug: 'w4' },
  {
    name: 'LMOTS_SHA256_N32_W8',
    value: 0x04,
    description: 'Winternitz Width 8 - Default',
    slug: 'w8',
  },
]

export const LmsConfig: React.FC<LmsConfigProps> = ({
  mode,
  setMode,
  lmsKeyFile,
  setLmsKeyFile,
  lmsSigFile,
  setLmsSigFile,
  lmsDataFile,
  setLmsDataFile,
}) => {
  const { files, addFile, addLog } = useOpenSSLStore()
  const [lmsType, setLmsType] = React.useState<number>(0x06) // Default H10
  const [lmotsType, setLmotsType] = React.useState<number>(0x04) // Default W8

  // Auto-select files if only one option exists and nothing selected
  useEffect(() => {
    let currentKey = lmsKeyFile

    // Enforce key type matches mode
    if (mode === 'sign' && currentKey && !currentKey.endsWith('.key')) {
      // If we have a non-private key in sign mode, clear it so we can select a proper one
      // However, we can't call setLmsKeyFile here directly if we want to use the new value immediately in this effect pass?
      // Actually we should perform the set and let the next render handle auto-select?
      // Or just check 'if (currentKey is invalid) treat as empty'
      currentKey = ''
      // corresponding setLmsKeyFile('') will be handled by the logic below if we don't find a replacement?
      // No, we should explicitly clear it if we don't find a replacement, or find a replacement and set it.
    }

    // Mode-aware key selection
    if (mode === 'verify') {
      // For verification, prefer public key (.pub) over private key (.key)
      const pubFiles = files.filter((f: { name: string }) => f.name.endsWith('.pub'))
      const pemFiles = files.filter((f: { name: string }) => f.name.endsWith('.pem'))

      // If currently have a private key selected, switch to corresponding public key
      if (currentKey && currentKey.endsWith('.key')) {
        const correspondingPub = currentKey.replace('.key', '.pub')
        const hasPub = files.some((f: { name: string }) => f.name === correspondingPub)
        if (hasPub) {
          setLmsKeyFile(correspondingPub)
          currentKey = correspondingPub
        } else {
          // No corresponding pub, try to find any pub file
          const lmsPub = pubFiles.find((f: { name: string }) =>
            f.name.toLowerCase().includes('lms')
          )
          if (lmsPub) {
            setLmsKeyFile(lmsPub.name)
            currentKey = lmsPub.name
          }
        }
      } else if (!currentKey) {
        // No key selected, try to find a public key
        const lmsPub = pubFiles.find((f: { name: string }) => f.name.toLowerCase().includes('lms'))
        if (lmsPub) {
          setLmsKeyFile(lmsPub.name)
        } else {
          const lmsPem = pemFiles.find((f: { name: string }) =>
            f.name.toLowerCase().includes('lms')
          )
          if (lmsPem) setLmsKeyFile(lmsPem.name)
        }
      }
    } else if (mode === 'sign') {
      // For signing, we need a private key
      const privFiles = files.filter((f: { name: string; size: number }) => f.name.endsWith('.key'))

      // If current is invalid or empty, try to find a private key
      if (!currentKey && privFiles.length > 0) {
        const lmsPriv = privFiles.find((f: { name: string }) =>
          f.name.toLowerCase().includes('lms')
        )
        if (lmsPriv) {
          setLmsKeyFile(lmsPriv.name)
        } else if (lmsKeyFile && !lmsKeyFile.endsWith('.key')) {
          // If we couldn't find a better one, but the current one is definitely WRONG, clear it
          setLmsKeyFile('')
        }
      } else if (currentKey && !currentKey.endsWith('.key')) {
        // Current is invalid and we have no priv files? Clear it.
        setLmsKeyFile('')
      }
    }

    const sigFiles = files.filter(
      (f: { name: string }) => f.name.endsWith('.sig') || f.name.endsWith('.bin')
    )
    if (!lmsSigFile && sigFiles.length > 0) {
      const lmsSig = sigFiles.find(
        (f: { name: string }) =>
          f.name.toLowerCase().includes('lms') && f.name.toLowerCase().includes('sig')
      )
      if (lmsSig) setLmsSigFile(lmsSig.name)
    }
  }, [files, lmsKeyFile, lmsSigFile, setLmsKeyFile, setLmsSigFile, mode])

  const handleLoadSamples = async () => {
    try {
      const samples = [
        { path: '/lms-sample/lms-public.pem', name: 'lms-public.pem', type: 'key' },
        { path: '/lms-sample/lms-signature.bin', name: 'lms-signature.bin', type: 'binary' },
        { path: '/lms-sample/lms-message.txt', name: 'lms-message.txt', type: 'binary' },
      ]

      let loadedCount = 0

      for await (const sample of samples as Array<{ path: string; name: string; type: string }>) {
        if (files.some((f) => f.name === sample.name)) continue

        const response = await fetch(sample.path)
        if (!response.ok) throw new Error(`Failed to fetch ${sample.name}`)
        const blob = await response.blob()
        const content = new Uint8Array(await blob.arrayBuffer())

        addFile({
          name: sample.name,
          type: sample.type as 'text' | 'binary',
          content,
          size: content.length,
          timestamp: Date.now(),
        })
        loadedCount++
      }

      // Auto-select based on mode
      if (mode === 'verify') {
        setLmsKeyFile('lms-public.pem')
        setLmsSigFile('lms-signature.bin')
      }
      // For sign mode samples we don't have a private key usually, but data is same
      setLmsDataFile('lms-message.txt')

      if (loadedCount > 0) addLog('info', `Loaded ${loadedCount} LMS sample files.`)
    } catch (error) {
      console.error('Failed to load samples:', error)
      addLog('error', 'Failed to load LMS sample files.')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      {/* Mode Toggle Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          data-testid="lms-mode-generate"
          onClick={() => setMode('generate')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
            mode === 'generate'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Generate
        </button>
        <button
          data-testid="lms-mode-sign"
          onClick={() => setMode('sign')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
            mode === 'sign'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign
        </button>
        <button
          data-testid="lms-mode-verify"
          onClick={() => setMode('verify')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
            mode === 'verify'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Verify
        </button>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex gap-2 text-blue-400 mb-1">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span className="text-sm font-bold">LMS / HSS (Stateful Hash-Based Signatures)</span>
        </div>
        <p className="text-xs text-muted-foreground pl-6 mb-3">
          LMS uses WebAssembly for key generation and signing. OpenSSL 3.6.0 CLI supports
          verification only.
        </p>
        <button
          onClick={handleLoadSamples}
          className="ml-6 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded border border-blue-500/30 transition-colors"
        >
          Load Sample Data
        </button>
      </div>

      {/* Key Generation Section (only in generate mode) */}
      {mode === 'generate' && (
        <div className="space-y-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
              Generator
            </span>
          </div>

          {/* Custom Parameters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="lms-height-select"
                className="text-xs text-muted-foreground block mb-1"
              >
                LMS Algorithm (Height)
              </label>
              <select
                value={lmsType}
                onChange={(e) => setLmsType(Number(e.target.value))}
                className="w-full bg-background border border-input rounded text-xs px-2 py-1"
              >
                {LMS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="lms-width-select"
                className="text-xs text-muted-foreground block mb-1"
              >
                LM-OTS Algorithm (Width)
              </label>
              <select
                value={lmotsType}
                onChange={(e) => setLmotsType(Number(e.target.value))}
                className="w-full bg-background border border-input rounded text-xs px-2 py-1"
              >
                {LMOTS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground">
            Naming convention:{' '}
            <code className="bg-muted px-1 rounded">
              lms_&lt;height&gt;_&lt;ots&gt;_&lt;timestamp&gt;.key
            </code>
          </div>

          <button
            onClick={async () => {
              try {
                const lmsInfo = LMS_TYPES.find((t) => t.value === lmsType)
                const lmotsInfo = LMOTS_TYPES.find((t) => t.value === lmotsType)

                addLog('info', `Generating LMS Keypair...`)
                // Import dynamically
                const { lmsService } = await import('../../../../wasm/LmsService')

                const { publicKey, privateKey } = await lmsService.generateKeypair(
                  lmsType,
                  lmotsType
                )

                // Save as PEM
                const pubPem = toSPKI(publicKey)
                const privPem = toPKCS8(privateKey)

                const timestamp = Date.now()
                // Convention: lms_h10_w8_1700000000
                const baseName = `lms_${lmsInfo?.slug}_${lmotsInfo?.slug}_${timestamp}`

                addFile({
                  name: `${baseName}.key`,
                  type: 'text', // PEM is text
                  content: privPem,
                  size: privPem.length,
                  timestamp,
                })
                addFile({
                  name: `${baseName}.pub`,
                  type: 'text',
                  content: pubPem,
                  size: pubPem.length,
                  timestamp,
                })

                // Select the private key file for potential signing next
                setLmsKeyFile(`${baseName}.key`)
                addLog('info', `LMS Keypair generated: ${baseName}.key / .pub`)
              } catch (e: unknown) {
                console.error(e)
                addLog(
                  'error',
                  'Key generation failed: ' + (e instanceof Error ? e.message : String(e))
                )
              }
            }}
            className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded border border-green-500/30 transition-colors uppercase tracking-wider"
          >
            Generate New LMS Keypair
          </button>
        </div>
      )}

      {/* Signer Section (Only in Sign Mode) */}
      {mode === 'sign' && (
        <div className="space-y-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Signer</span>
          </div>

          {/* Private Key Selection */}
          <div className="space-y-3">
            <label htmlFor="lms-priv-select" className="text-xs text-muted-foreground block">
              Signing Key (Private Key)
            </label>
            <select
              id="lms-priv-select"
              value={lmsKeyFile}
              onChange={(e) => setLmsKeyFile(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Select a private key...</option>
              {files
                .filter((f: { name: string }) => f.name.endsWith('.key'))
                .map((f: { name: string; size: number }) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.size} bytes)
                  </option>
                ))}
            </select>
            {!lmsKeyFile && (
              <div className="text-[10px] text-amber-500">
                Please generate or select a private key.
              </div>
            )}
          </div>

          <button
            disabled={!lmsDataFile || !lmsKeyFile}
            onClick={async () => {
              try {
                addLog('info', 'Signing message... (This may take a moment)')
                const { lmsService } = await import('../../../../wasm/LmsService')

                // Find private key
                const privKeyFile = files.find((f) => f.name === lmsKeyFile)

                if (!privKeyFile) {
                  throw new Error(`Private key file ${lmsKeyFile} not found.`)
                }

                const dataFile = files.find((f) => f.name === lmsDataFile)
                if (!dataFile) {
                  throw new Error('Selected data file not found.')
                }
                // Helper to ensure Uint8Array
                const toUint8 = (content: string | Uint8Array) => {
                  if (typeof content === 'string') {
                    return new TextEncoder().encode(content)
                  }
                  return content
                }

                // Decode Private Key from PEM
                const privRaw = fromPEM(privKeyFile.content)

                const { signature, updatedPrivateKey } = await lmsService.sign(
                  privRaw,
                  toUint8(dataFile.content)
                )

                const sigName = `${lmsKeyFile.replace('.key', '')}_${Date.now()}.sig`
                addFile({
                  name: sigName,
                  type: 'binary',
                  content: signature,
                  size: signature.length,
                  timestamp: Date.now(),
                })

                // Update Private Key State (Wrap in PEM)
                const updatedPrivPem = toPKCS8(updatedPrivateKey)
                addFile({
                  name: privKeyFile.name, // Overwrite existing
                  type: 'text',
                  content: updatedPrivPem,
                  size: updatedPrivPem.length,
                  timestamp: Date.now(),
                })

                setLmsSigFile(sigName)
                addLog('info', `Message signed! Saved ${sigName}`)
                addLog(
                  'info',
                  `WARNING: LMS Private Key State Updated (${privKeyFile.name}). Do not revert to old key state!`
                )
              } catch (e: unknown) {
                console.error(e)
                addLog(
                  'error',
                  'LMS Signing failed: ' + (e instanceof Error ? e.message : String(e))
                )
              }
            }}
            className={`w-full py-2 text-xs font-bold rounded border transition-colors uppercase tracking-wider ${
              lmsDataFile && lmsKeyFile
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
            }`}
          >
            Sign Selected Data File
          </button>
          {!lmsDataFile && (
            <p className="text-[10px] text-amber-500 text-center">
              Select a Data File below to sign.
            </p>
          )}
        </div>
      )}

      {/* Verifier Section (Only in Verify Mode) */}
      {mode === 'verify' && (
        <div className="space-y-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Verifier
            </span>
          </div>
          <button
            disabled={!lmsKeyFile || !lmsSigFile || !lmsDataFile}
            onClick={async () => {
              try {
                addLog('info', 'Verifying signature...')
                const { lmsService } = await import('../../../../wasm/LmsService')

                const keyFile = files.find((f) => f.name === lmsKeyFile)
                const sigFile = files.find((f) => f.name === lmsSigFile)
                const dataFile = files.find((f) => f.name === lmsDataFile)

                if (!keyFile || !sigFile || !dataFile) {
                  throw new Error('Missing selected files.')
                }

                const toUint8 = (content: string | Uint8Array) => {
                  if (typeof content === 'string') return new TextEncoder().encode(content)
                  return content
                }

                const pubRaw = fromPEM(keyFile.content)

                const msgBytes = toUint8(dataFile.content)
                const sigBytes = toUint8(sigFile.content)

                const valid = await lmsService.verify(pubRaw, msgBytes, sigBytes)

                if (valid) {
                  addLog('info', 'SUCCESS: Signature is VALID!')
                } else {
                  addLog('error', 'FAILURE: Signature is INVALID.')
                }
              } catch (e: unknown) {
                console.error(e)
                addLog(
                  'error',
                  'Verification failed: ' + (e instanceof Error ? e.message : String(e))
                )
              }
            }}
            className={`w-full py-2 text-xs font-bold rounded border transition-colors uppercase tracking-wider ${
              lmsKeyFile && lmsSigFile && lmsDataFile
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30'
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
            }`}
          >
            Verify (WASM)
          </button>
          {(!lmsKeyFile || !lmsSigFile || !lmsDataFile) && (
            <p className="text-[10px] text-amber-500 text-center">
              Select Key, Signature, and Data below.
            </p>
          )}
        </div>
      )}

      {/* Public Key Selection (Only in Verify Mode) */}
      {mode === 'verify' && (
        <div className="space-y-3">
          <label htmlFor="lms-key-select" className="text-xs text-muted-foreground block">
            Public Key File (.pem, .pub)
          </label>
          <select
            id="lms-key-select"
            value={lmsKeyFile}
            onChange={(e) => setLmsKeyFile(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Select a public key file...</option>
            {files
              .filter(
                (f: { name: string; size: number }) =>
                  f.name.endsWith('.pem') || f.name.endsWith('.pub')
              )
              .map((f: { name: string; size: number }) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.size} bytes)
                </option>
              ))}
          </select>
          {files.length === 0 && (
            <div className="text-[10px] text-amber-500">
              No files available. Use "Files" tab to import or create files.
            </div>
          )}
        </div>
      )}

      {/* Signature File Selection (Only in Verify Mode) */}
      {mode === 'verify' && (
        <div className="space-y-3">
          <label htmlFor="lms-sig-select" className="text-xs text-muted-foreground block">
            Signature File (.sig, .bin)
          </label>
          <select
            id="lms-sig-select"
            value={lmsSigFile}
            onChange={(e) => setLmsSigFile(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Select a signature file...</option>
            {files
              .filter(
                (f: { name: string; size: number }) =>
                  f.name.endsWith('.sig') || f.name.endsWith('.bin')
              )
              .map((f: { name: string; size: number }) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.size} bytes)
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Data File Selection */}
      <div className="space-y-3">
        <label htmlFor="lms-data-select" className="text-xs text-muted-foreground block">
          Data File to {mode === 'sign' ? 'Sign' : 'Verify'}
        </label>
        <select
          id="lms-data-select"
          value={lmsDataFile}
          onChange={(e) => setLmsDataFile(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Select a data file...</option>
          {files
            .filter((f: { name: string; size: number }) => {
              const n = f.name.toLowerCase()
              // Exclude common crypto artifacts from being selected as "data"
              return (
                !n.endsWith('.key') &&
                !n.endsWith('.pub') &&
                !n.endsWith('.pem') &&
                !n.endsWith('.sig') &&
                !n.endsWith('.crt') &&
                !n.endsWith('.csr') &&
                !n.endsWith('.p12')
              )
            })
            .map((f: { name: string; size: number }) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.size} bytes)
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}
