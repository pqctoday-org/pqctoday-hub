// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Key as KeyIcon, FileText, Code, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import type { Key } from '../../../types'
import { bytesToHex, hexToBytes, isHex } from '../../../utils/dataInputUtils'
import { Button } from '@/components/ui/button'
import { withEducationNoticeComment } from '@/data/educationNotice'

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

// A reversible view of already-stored bytes, not a key-format encoder/parser.
const formatStoredBytes = (key: Key, mode: 'hex' | 'base64') => {
  if (!key.data) return 'Stored-byte view unavailable in mock mode'
  const bytes = key.data instanceof Uint8Array ? key.data : null
  if (mode === 'hex') return bytes ? bytesToHex(bytes) : key.value
  if (!bytes && (!key.value || !isHex(key.value)))
    return 'Stored byte export unavailable: no complete hexadecimal byte representation'
  const stored = bytes ?? hexToBytes(key.value)
  return window.btoa(Array.from(stored, (byte) => String.fromCharCode(byte)).join(''))
}

interface DisplayEdit {
  keyId: string
  sourceValue: string
  sourceData: Key['data']
  mode: string
  text: string
}

export const KeyDetails: React.FC<KeyDetailsProps> = ({ selectedKey }) => {
  // View Modes
  const [rawValueMode, setRawValueMode] = useState<'hex' | 'ascii'>('hex')
  const [previewValueMode, setPreviewValueMode] = useState<'hex' | 'base64'>('hex')
  const [copiedRaw, setCopiedRaw] = useState(false)
  const [copiedPreview, setCopiedPreview] = useState(false)

  const ruler = '0123456789'.repeat(13).substring(0, 128)

  // Derived values
  const formattedRaw = React.useMemo(
    () => formatValue(selectedKey, rawValueMode),
    [selectedKey, rawValueMode]
  )
  const formattedPreview = React.useMemo(
    () => formatStoredBytes(selectedKey, previewValueMode),
    [selectedKey, previewValueMode]
  )

  // Edits are display-only and belong to this exact stored source and view.
  const [rawOverride, setRawOverride] = useState<DisplayEdit | null>(null)
  const [previewOverride, setPreviewOverride] = useState<DisplayEdit | null>(null)
  const isCurrentEdit = (edit: DisplayEdit | null, mode: string) =>
    edit?.keyId === selectedKey.id &&
    edit.sourceValue === selectedKey.value &&
    edit.sourceData === selectedKey.data &&
    edit.mode === mode
  const displayRaw = isCurrentEdit(rawOverride, rawValueMode) ? rawOverride!.text : formattedRaw
  const displayPreview = isCurrentEdit(previewOverride, previewValueMode)
    ? previewOverride!.text
    : formattedPreview
  const edited =
    isCurrentEdit(rawOverride, rawValueMode) || isCurrentEdit(previewOverride, previewValueMode)
  const edit = (mode: string, text: string): DisplayEdit => ({
    keyId: selectedKey.id,
    sourceValue: selectedKey.value,
    sourceData: selectedKey.data,
    mode,
    text,
  })
  const [editSource, setEditSource] = useState({
    id: selectedKey.id,
    value: selectedKey.value,
    data: selectedKey.data,
  })
  if (
    editSource.id !== selectedKey.id ||
    editSource.value !== selectedKey.value ||
    editSource.data !== selectedKey.data
  ) {
    setEditSource({ id: selectedKey.id, value: selectedKey.value, data: selectedKey.data })
    setRawOverride(null)
    setPreviewOverride(null)
    setCopiedRaw(false)
    setCopiedPreview(false)
  }

  const copyToClipboard = async (text: string, type: 'raw' | 'preview') => {
    try {
      // The notice travels with the key material: once these bytes are on a
      // clipboard they are indistinguishable from a real key
      // (education-notice remediation 2026-09-26).
      const qualified =
        type === 'preview'
          ? '# Stored-byte illustration; no PKCS#8/SPKI encoding or format validation performed.\n' +
            text
          : text
      await navigator.clipboard.writeText(withEducationNoticeComment(qualified, '#'))
      if (type === 'raw') {
        setCopiedRaw(true)
        setTimeout(() => setCopiedRaw(false), 2000)
      } else {
        setCopiedPreview(true)
        setTimeout(() => setCopiedPreview(false), 2000)
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

      <p role="note" className="text-sm text-muted-foreground">
        These are stored-byte views, not a PKCS#8/SPKI encoder or format check. Depending on its
        origin, the source may contain raw key bytes, serialized container bytes or existing file
        text. Use an appropriate encoder and compatible inspection tool for production
        import/export.
      </p>
      {edited && (
        <p role="status" className="text-sm text-muted-foreground">
          Edited display only; the stored key is unchanged.
        </p>
      )}
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
              <div className="flex bg-muted rounded-lg p-0.5 border border-border">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRawValueMode('hex')
                    setRawOverride(null)
                  }}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    rawValueMode === 'hex'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  HEX
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRawValueMode('ascii')
                    setRawOverride(null)
                  }}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    rawValueMode === 'ascii'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  ASCII
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => copyToClipboard(displayRaw, 'raw')}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy to clipboard"
              >
                {copiedRaw ? (
                  <Check size={14} className="text-status-success" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
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
                onChange={(e) => setRawOverride(edit(rawValueMode, e.target.value))}
                className="w-full bg-muted/20 border border-border rounded-b-lg p-3 text-[11px] text-muted-foreground resize-none focus:outline-none focus:border-primary/50 break-all -mt-[1px] block font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Stored-byte representation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="stored-bytes-preview-input"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
            >
              <Code size={14} /> Stored-byte representation
            </label>
            <div className="flex gap-2">
              <div className="flex bg-muted rounded-lg p-0.5 border border-border">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreviewValueMode('hex')
                    setPreviewOverride(null)
                  }}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    previewValueMode === 'hex'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  HEX
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreviewValueMode('base64')
                    setPreviewOverride(null)
                  }}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-colors',
                    previewValueMode === 'base64'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Base64
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => copyToClipboard(displayPreview, 'preview')}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy to clipboard"
              >
                {' '}
                {copiedPreview ? (
                  <Check size={14} className="text-status-success" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
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
                id="stored-bytes-preview-input"
                rows={8}
                value={displayPreview}
                onChange={(e) => setPreviewOverride(edit(previewValueMode, e.target.value))}
                className="w-full bg-muted/20 border border-border rounded-b-lg p-3 text-[11px] text-muted-foreground resize-none focus:outline-none focus:border-primary/50 break-all -mt-[1px] block font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
