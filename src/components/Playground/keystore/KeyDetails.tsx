import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Key as KeyIcon, FileText, Code, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import type { Key } from '../../../types'
import { bytesToHex } from '../../../utils/dataInputUtils'

interface KeyDetailsProps {
  selectedKey: Key
}

// Helper to format key value
const formatValue = (key: Key, mode: 'hex' | 'ascii') => {
  if (!key.data) return key.value // Fallback for mock keys

  // If data is CryptoKey, use the pre-formatted hex value stored in key.value
  if (key.dataType === 'cryptokey' || !(key.data instanceof Uint8Array)) {
    if (mode === 'hex') return key.value

    // ASCII Mode for CryptoKey (Hex -> ASCII)
    try {
      const hex = key.value
      const match = hex.match(/.{1,2}/g)
      if (!match) return 'Invalid Hex'

      return match
        .map((byteHex) => {
          const byte = parseInt(byteHex, 16)
          return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.'
        })
        .join('')
    } catch {
      return 'Error converting to ASCII'
    }
  }

  if (mode === 'hex') {
    return bytesToHex(key.data)
  } else {
    // Best effort ASCII - replace non-printable with .
    return Array.from(key.data)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('')
  }
}

// Helper to simulate PKCS8 (wrapping in PEM)
const formatPkcs8 = (key: Key, mode: 'hex' | 'ascii') => {
  if (!key.data) return 'PKCS#8 not available in Mock mode'

  // If data is CryptoKey, we can't easily convert to PKCS8 synchronously here
  // So we'll return a placeholder or the raw value
  if (key.dataType === 'cryptokey' || !(key.data instanceof Uint8Array)) {
    if (mode === 'hex') return key.value

    // Convert Hex to Base64 (PEM body)
    try {
      // key.value is Hex string
      const hex = key.value
      // Convert hex to bytes
      const match = hex.match(/.{1,2}/g)
      if (!match) return 'Invalid Hex'
      const bytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)))

      // Convert bytes to binary string
      let binary = ''
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        // eslint-disable-next-line security/detect-object-injection
        binary += String.fromCharCode(bytes[i])
      }

      // Convert to Base64
      const b64 = window.btoa(binary)
      const label = key.type === 'private' ? 'PRIVATE KEY' : 'PUBLIC KEY'
      const header = `-----BEGIN ${label}-----`
      const footer = `-----END ${label}-----`

      // Split into lines of 64 chars
      const lines = b64.match(/.{1,64}/g) || []
      return `${header}\n${lines.join('\n')}\n${footer}`
    } catch {
      return 'Error converting to PEM'
    }
  }

  const label = key.type === 'private' ? 'PRIVATE KEY' : 'PUBLIC KEY'
  const header = `-----BEGIN ${label}-----`
  const footer = `-----END ${label}-----`

  // In a real app, we would wrap the raw key in ASN.1 structure here.
  // For this demo, we'll just base64 encode the raw bytes for "ASCII" (PEM-like)
  // or show Hex for "HEX".

  if (mode === 'ascii') {
    // Convert to Base64 (PEM body)
    let binary = ''
    const len = key.data.byteLength
    for (let i = 0; i < len; i++) {
      // eslint-disable-next-line security/detect-object-injection
      binary += String.fromCharCode(key.data[i])
    }
    const b64 = window.btoa(binary)
    // Split into lines of 64 chars
    const lines = b64.match(/.{1,64}/g) || []
    return `${header}\n${lines.join('\n')}\n${footer}`
  } else {
    // Just show hex with header/footer for structure visualization
    return `${header}\n(ASN.1 Structure Omitted)\n${bytesToHex(key.data)}\n${footer}`
  }
}

export const KeyDetails: React.FC<KeyDetailsProps> = ({ selectedKey }) => {
  // View Modes
  const [rawValueMode, setRawValueMode] = useState<'hex' | 'ascii'>('hex')
  const [pkcs8ValueMode, setPkcs8ValueMode] = useState<'hex' | 'ascii'>('hex')
  const [copiedRaw, setCopiedRaw] = useState(false)
  const [copiedPkcs8, setCopiedPkcs8] = useState(false)

  const ruler = '0123456789'.repeat(13).substring(0, 128)

  // Derived values
  const formattedRaw = React.useMemo(
    () => formatValue(selectedKey, rawValueMode),
    [selectedKey, rawValueMode]
  )
  const formattedPkcs8 = React.useMemo(
    () => formatPkcs8(selectedKey, pkcs8ValueMode),
    [selectedKey, pkcs8ValueMode]
  )

  // Local overrides (reset when key or mode changes)
  const [rawOverride, setRawOverride] = useState<string | null>(null)
  const [pkcs8Override, setPkcs8Override] = useState<string | null>(null)

  const displayRaw = rawOverride ?? formattedRaw
  const displayPkcs8 = pkcs8Override ?? formattedPkcs8

  const copyToClipboard = async (text: string, type: 'raw' | 'pkcs8') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'raw') {
        setCopiedRaw(true)
        setTimeout(() => setCopiedRaw(false), 2000)
      } else {
        setCopiedPkcs8(true)
        setTimeout(() => setCopiedPkcs8(false), 2000)
      }
    } catch {
      // Silent failure - clipboard API may not be available
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={selectedKey.id}
      className="bg-card border border-border rounded-xl p-6 space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div
          className={clsx(
            'p-2 rounded-lg',
            selectedKey.type === 'public'
              ? 'bg-primary/20 text-primary'
              : 'bg-secondary/20 text-secondary'
          )}
        >
          <KeyIcon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{selectedKey.name}</h3>
          <div className="flex gap-4 text-xs text-muted-foreground font-mono mt-1">
            <span>ID: {selectedKey.id}</span>
            <span>•</span>
            <span>{selectedKey.algorithm}</span>
            <span>•</span>
            <span>
              {selectedKey.data
                ? selectedKey.data instanceof Uint8Array
                  ? `${selectedKey.data.length} bytes`
                  : 'CryptoKey Object'
                : 'Mock Data'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Raw Value */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="raw-value-input"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
            >
              <FileText size={14} /> Raw Value
            </label>
            <div className="flex gap-2">
              <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => setRawValueMode('hex')}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    rawValueMode === 'hex'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  HEX
                </button>
                <button
                  onClick={() => setRawValueMode('ascii')}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    rawValueMode === 'ascii'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  ASCII
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(displayRaw, 'raw')}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy to clipboard"
              >
                {copiedRaw ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="relative group flex flex-col">
            <div className="w-full">
              <textarea
                readOnly
                rows={1}
                value={ruler}
                className="w-full bg-muted/30 border-x border-t border-border rounded-t-lg p-3 text-[11px] text-muted-foreground/50 resize-none focus:outline-none overflow-hidden whitespace-pre select-none block font-mono leading-relaxed"
              />
            </div>
            <div className="w-full">
              <textarea
                id="raw-value-input"
                rows={8}
                value={displayRaw}
                onChange={(e) => setRawOverride(e.target.value)}
                className="w-full bg-muted/20 border border-border rounded-b-lg p-3 text-[11px] text-muted-foreground resize-none focus:outline-none focus:border-primary/50 break-all -mt-[1px] block font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* PKCS8 Preview */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="pkcs8-preview-input"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
            >
              <Code size={14} /> PKCS#8 Preview
            </label>
            <div className="flex gap-2">
              <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => setPkcs8ValueMode('hex')}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    pkcs8ValueMode === 'hex'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  HEX
                </button>
                <button
                  onClick={() => setPkcs8ValueMode('ascii')}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    pkcs8ValueMode === 'ascii'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  PEM
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(displayPkcs8, 'pkcs8')}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy to clipboard"
              >
                {' '}
                {copiedPkcs8 ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="relative group flex flex-col">
            <div className="w-full">
              <textarea
                readOnly
                rows={1}
                value={ruler}
                className="w-full bg-muted/30 border-x border-t border-border rounded-t-lg p-3 text-[11px] text-muted-foreground/50 resize-none focus:outline-none overflow-hidden whitespace-pre select-none block font-mono leading-relaxed"
              />
            </div>
            <div className="w-full">
              <textarea
                id="pkcs8-preview-input"
                rows={8}
                value={displayPkcs8}
                onChange={(e) => setPkcs8Override(e.target.value)}
                className="w-full bg-muted/20 border border-border rounded-b-lg p-3 text-[11px] text-muted-foreground resize-none focus:outline-none focus:border-primary/50 break-all -mt-[1px] block font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
