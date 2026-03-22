// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Hash, Loader2, Plus, X, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  CKM_SHA256,
  CKM_SHA384,
  CKM_SHA512,
  CKM_SHA3_256,
  CKM_SHA3_512,
  hsm_digest,
  hsm_digestMultiPart,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmReadyGuard, HsmResultRow, toHex, hexSnippet } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'

// ── Algorithm table ────────────────────────────────────────────────────────────

const HASH_ALGOS = [
  { label: 'SHA-256', mech: CKM_SHA256, outBytes: 32 },
  { label: 'SHA-384', mech: CKM_SHA384, outBytes: 48 },
  { label: 'SHA-512', mech: CKM_SHA512, outBytes: 64 },
  { label: 'SHA3-256', mech: CKM_SHA3_256, outBytes: 32 },
  { label: 'SHA3-512', mech: CKM_SHA3_512, outBytes: 64 },
] as const

// ── Panel ──────────────────────────────────────────────────────────────────────

export const HsmHashingPanel = () => {
  const { moduleRef, hSessionRef, isReady } = useHsmContext()
  const [selectedMech, setSelectedMech] = useState<number>(CKM_SHA256)
  const [input, setInput] = useState('Hello, PQC World!')
  const [digest, setDigest] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Multi-part state
  const [multiPart, setMultiPart] = useState(false)
  const [chunks, setChunks] = useState<string[]>(['Hello, ', 'PQC World!'])
  const [matchResult, setMatchResult] = useState<boolean | null>(null)

  const selectedAlgo = HASH_ALGOS.find((a) => a.mech === selectedMech) ?? HASH_ALGOS[0]

  const doDigest = async () => {
    setLoading(true)
    setError(null)
    setDigest(null)
    setMatchResult(null)
    try {
      const M = moduleRef.current!
      if (multiPart) {
        const encodedChunks = chunks.map((c) => new TextEncoder().encode(c))
        const result = hsm_digestMultiPart(M, hSessionRef.current, encodedChunks, selectedMech)
        setDigest(result)
        // Compare with single-part
        const combined = new TextEncoder().encode(chunks.join(''))
        const singleResult = hsm_digest(M, hSessionRef.current, combined, selectedMech)
        setMatchResult(toHex(result) === toHex(singleResult))
      } else {
        const data = new TextEncoder().encode(input)
        const result = hsm_digest(M, hSessionRef.current, data, selectedMech)
        setDigest(result)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const updateChunk = (idx: number, value: string) => {
    setChunks((prev) => prev.map((c, i) => (i === idx ? value : c)))
    setDigest(null)
    setMatchResult(null)
  }

  const addChunk = () => {
    setChunks((prev) => [...prev, ''])
    setDigest(null)
    setMatchResult(null)
  }

  const removeChunk = (idx: number) => {
    if (chunks.length <= 1) return
    setChunks((prev) => prev.filter((_, i) => i !== idx))
    setDigest(null)
    setMatchResult(null)
  }

  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-primary" />
          <h3 className="font-semibold text-base">
            HSM Hashing — C_DigestInit / C_Digest{multiPart ? 'Update' : ''}
          </h3>
        </div>

        {/* Algorithm selector + multi-part toggle */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Algorithm
            </p>
            <button
              type="button"
              onClick={() => {
                setMultiPart((v) => !v)
                setDigest(null)
                setMatchResult(null)
              }}
              className={`text-xs rounded-lg px-3 py-1 border transition-colors ${
                multiPart
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Multi-part
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {HASH_ALGOS.map((a) => (
              <Button
                key={a.mech}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMech(a.mech)
                  setDigest(null)
                  setMatchResult(null)
                }}
                className={
                  selectedMech === a.mech
                    ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                    : 'text-muted-foreground text-xs h-7 px-3'
                }
              >
                {a.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Output: {selectedAlgo.outBytes} bytes ({selectedAlgo.outBytes * 8} bits) · PKCS#11
            mechanism:{' '}
            <span className="font-mono">0x{selectedMech.toString(16).padStart(4, '0')}</span>
          </p>
        </div>

        {/* Input — single or multi-part */}
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {multiPart ? 'Chunks' : 'Input'}
          </p>
          {multiPart ? (
            <div className="space-y-2">
              {chunks.map((chunk, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6 shrink-0">#{idx + 1}</span>
                  <input
                    type="text"
                    value={chunk}
                    onChange={(e) => updateChunk(idx, e.target.value)}
                    placeholder={`Chunk ${idx + 1}…`}
                    className="flex-1 text-xs rounded-lg px-3 py-1.5 bg-muted border border-input text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => removeChunk(idx)}
                    disabled={chunks.length <= 1}
                    className="text-muted-foreground hover:text-status-error transition-colors disabled:opacity-30"
                    aria-label={`Remove chunk ${idx + 1}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addChunk} className="text-xs h-7">
                <Plus size={12} className="mr-1" /> Add Chunk
              </Button>
              <p className="text-xs text-muted-foreground">
                {chunks.length} chunks · {chunks.join('').length} chars total
              </p>
            </div>
          ) : (
            <>
              <textarea
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setDigest(null)
                }}
                placeholder="Enter data to hash…"
              />
              <p className="text-xs text-muted-foreground">
                {new TextEncoder().encode(input).length} bytes
              </p>
            </>
          )}
        </div>

        {/* Digest button */}
        <Button
          onClick={doDigest}
          disabled={loading || (multiPart ? chunks.every((c) => !c) : !input.length)}
          className="w-full"
        >
          {loading ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Hash size={14} className="mr-2" />
          )}
          Compute {selectedAlgo.label} Digest{multiPart ? ' (Multi-part)' : ''}
        </Button>

        {error && <ErrorAlert message={error} />}

        {/* Result */}
        {digest && (
          <div className="glass-panel p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Digest Result
            </p>
            <HsmResultRow label="Algorithm" value={selectedAlgo.label} mono={false} />
            <HsmResultRow label="Hex digest" value={hexSnippet(digest, 32)} />
            <HsmResultRow
              label="Length"
              value={`${digest.length} bytes (${digest.length * 8} bits)`}
              mono={false}
            />
            {multiPart && matchResult !== null && (
              <div
                className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-mono ${
                  matchResult
                    ? 'bg-status-success/10 text-status-success'
                    : 'bg-status-error/10 text-status-error'
                }`}
              >
                {matchResult ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {matchResult
                  ? 'Matches single-part digest of concatenated input'
                  : 'Does not match single-part digest'}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Full hex output</p>
              <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
                {toHex(digest)}
              </p>
            </div>
          </div>
        )}

        <MiniPkcsLog />
      </div>
    </HsmReadyGuard>
  )
}
