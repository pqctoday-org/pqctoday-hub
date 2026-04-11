// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Search, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react'
import { SAMPLE_JWTS, JOSE_SIGNING_ALGORITHMS } from '../constants'
import { decodeJWT } from '../jwtUtils'
import { Button } from '@/components/ui/button'

type SampleKey = keyof typeof SAMPLE_JWTS

export const JWTInspector: React.FC = () => {
  const [jwtInput, setJwtInput] = useState(SAMPLE_JWTS['ES256'])
  const [selectedSample, setSelectedSample] = useState<SampleKey>('ES256')
  const [copied, setCopied] = useState(false)

  const decoded = useMemo(() => decodeJWT(jwtInput), [jwtInput])

  const parts = useMemo(() => {
    const segments = jwtInput.split('.')
    if (segments.length !== 3) return null
    return { header: segments[0], payload: segments[1], signature: segments[2] }
  }, [jwtInput])

  const algorithmInfo = useMemo(() => {
    if (!decoded) return null
    const alg = decoded.header.alg as string
    return JOSE_SIGNING_ALGORITHMS.find((a) => a.jose === alg) ?? null
  }, [decoded])

  const handleSampleChange = (key: SampleKey) => {
    setSelectedSample(key)
    setJwtInput(SAMPLE_JWTS[key])
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jwtInput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Interactive JWT Decoder</h3>
        <p className="text-sm text-muted-foreground">
          Paste a JWT or select a sample token. The decoder splits the three parts and analyzes the
          algorithm for quantum safety.
        </p>
      </div>

      {/* Sample Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SAMPLE_JWTS) as SampleKey[]).map((key) => (
          <Button
            variant="ghost"
            key={key}
            onClick={() => handleSampleChange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSample === key
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {key}
          </Button>
        ))}
      </div>

      {/* JWT Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="jwt-token-input" className="text-sm font-medium text-foreground">
            JWT Token
          </label>
          <Button
            variant="ghost"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <textarea
          id="jwt-token-input"
          value={jwtInput}
          onChange={(e) => {
            setJwtInput(e.target.value)
            setSelectedSample('' as SampleKey)
          }}
          className="w-full h-32 p-3 rounded-lg bg-background border border-border text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Paste a JWT here..."
          spellCheck={false}
        />
      </div>

      {/* Color-coded Token Display */}
      {parts && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Token Structure</h4>
          <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
            <code className="text-xs break-all">
              <span className="text-primary">{parts.header}</span>
              <span className="text-muted-foreground font-bold">.</span>
              <span className="text-success">{parts.payload}</span>
              <span className="text-muted-foreground font-bold">.</span>
              <span className="text-destructive">{parts.signature}</span>
            </code>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary/20 border border-primary/50" />
              <span className="text-muted-foreground">Header ({parts.header.length} chars)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-success/20 border border-success/50" />
              <span className="text-muted-foreground">Payload ({parts.payload.length} chars)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/50" />
              <span className="text-muted-foreground">
                Signature ({parts.signature.length} chars)
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Decoded Header & Payload */}
      {decoded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">Decoded Header</h4>
            </div>
            <pre className="text-xs font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">Decoded Payload</h4>
            </div>
            <pre className="text-xs font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Algorithm Analysis */}
      {decoded && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Algorithm Analysis</h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Algorithm: <span className="font-mono">{String(decoded.header.alg)}</span>
                </span>
                {algorithmInfo ? (
                  algorithmInfo.broken ? (
                    <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-destructive/20 text-destructive border-destructive/50 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      Quantum Vulnerable
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50 flex items-center gap-1">
                      <ShieldCheck size={10} />
                      Quantum Safe
                    </span>
                  )
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-muted text-muted-foreground border-border">
                    Unknown Algorithm
                  </span>
                )}
              </div>
              {algorithmInfo && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-2 border border-border">
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium text-foreground">{algorithmInfo.type}</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 border border-border">
                    <div className="text-muted-foreground">Key Size</div>
                    <div className="font-medium text-foreground">
                      {algorithmInfo.keyBytes.toLocaleString()} bytes
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 border border-border">
                    <div className="text-muted-foreground">Signature</div>
                    <div className="font-medium text-foreground">
                      {algorithmInfo.sigBytes?.toLocaleString() ?? 'N/A'} bytes
                    </div>
                  </div>
                  {algorithmInfo.nistLevel && (
                    <div className="bg-muted/50 rounded p-2 border border-border">
                      <div className="text-muted-foreground">NIST Level</div>
                      <div className="font-medium text-foreground">{algorithmInfo.nistLevel}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {parts && (
            <div className="mt-3 bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground">
                <strong>Signature length:</strong> {parts.signature.length} base64url characters
                {algorithmInfo?.sigBytes && (
                  <span> (~{algorithmInfo.sigBytes.toLocaleString()} raw bytes)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <strong>Total token size:</strong> {jwtInput.length} characters (
                {(jwtInput.length / 1024).toFixed(1)} KB)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {!decoded && jwtInput.trim().length > 0 && (
        <div className="glass-panel p-4 border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              Invalid JWT format. A JWT must have exactly 3 base64url-encoded parts separated by
              dots.
            </span>
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key takeaway:</strong> JWT decoding is purely base64url &mdash; no cryptographic
          keys are needed to read the header and payload. The signature provides integrity, not
          confidentiality. Anyone with the token can read the claims. Use JWE if payload
          confidentiality is required.
        </p>
      </div>
    </div>
  )
}
