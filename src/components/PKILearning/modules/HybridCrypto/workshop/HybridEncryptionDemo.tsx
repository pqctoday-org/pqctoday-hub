import React, { useState, useCallback } from 'react'
import { Loader2, Play, CheckCircle, XCircle, Lock, PenTool } from 'lucide-react'
import { hybridCryptoService, type HybridKemResult } from '../services/HybridCryptoService'

interface HybridEncryptionDemoProps {
  initialMode?: 'kem' | 'signature'
}

interface KemDemoResult {
  algorithm: string
  keyGenMs: number
  encapMs: number
  decapMs: number
  ciphertextHex: string
  encapSecretHex: string
  decapSecretHex: string
  secretsMatch: boolean
  error?: string
}

interface SignDemoResult {
  algorithm: string
  keyGenMs: number
  signMs: number
  verifyMs: number
  signatureHex: string
  verified: boolean
  error?: string
}

export const HybridEncryptionDemo: React.FC<HybridEncryptionDemoProps> = ({
  initialMode = 'kem',
}) => {
  const [mode, setMode] = useState<'kem' | 'signature'>(initialMode)
  const [pqcKemResult, setPqcKemResult] = useState<KemDemoResult | null>(null)
  const [hybridKemResult, setHybridKemResult] = useState<HybridKemResult | null>(null)
  const [sigResults, setSigResults] = useState<SignDemoResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const message = 'Hello, Post-Quantum World!'

  const runKemDemo = useCallback(async () => {
    setIsRunning(true)
    setPqcKemResult(null)
    setHybridKemResult(null)

    // 1. Pure PQC: ML-KEM-768
    const prefix = 'ml_kem_768'
    const keyFile = `${prefix}_enc_key.pem`
    const pubFile = `${prefix}_enc_pub.pem`

    const keyResult = await hybridCryptoService.generateKey('ML-KEM-768', keyFile)
    if (keyResult.error) {
      setPqcKemResult({
        algorithm: 'ML-KEM-768',
        keyGenMs: keyResult.timingMs,
        encapMs: 0,
        decapMs: 0,
        ciphertextHex: '',
        encapSecretHex: '',
        decapSecretHex: '',
        secretsMatch: false,
        error: keyResult.error,
      })
    } else {
      const pubResult = await hybridCryptoService.extractPublicKey(
        keyFile,
        pubFile,
        keyResult.fileData
      )
      if (pubResult.error) {
        setPqcKemResult({
          algorithm: 'ML-KEM-768',
          keyGenMs: keyResult.timingMs,
          encapMs: 0,
          decapMs: 0,
          ciphertextHex: '',
          encapSecretHex: '',
          decapSecretHex: '',
          secretsMatch: false,
          error: pubResult.error,
        })
      } else {
        const encapResult = await hybridCryptoService.kemEncapsulate(
          pubFile,
          prefix,
          pubResult.fileData
        )
        if (encapResult.error) {
          setPqcKemResult({
            algorithm: 'ML-KEM-768',
            keyGenMs: keyResult.timingMs,
            encapMs: encapResult.timingMs,
            decapMs: 0,
            ciphertextHex: '',
            encapSecretHex: '',
            decapSecretHex: '',
            secretsMatch: false,
            error: encapResult.error,
          })
        } else {
          const ctFile = `${prefix}_ct.bin`
          const decapInputFiles: { name: string; data: Uint8Array }[] = []
          if (keyResult.fileData) decapInputFiles.push(keyResult.fileData)
          if (encapResult.ctFileData) decapInputFiles.push(encapResult.ctFileData)
          const decapResult = await hybridCryptoService.kemDecapsulate(
            keyFile,
            ctFile,
            prefix,
            decapInputFiles
          )

          const secretsMatch =
            encapResult.sharedSecretHex === decapResult.sharedSecretHex &&
            encapResult.sharedSecretHex.length > 0

          setPqcKemResult({
            algorithm: 'ML-KEM-768',
            keyGenMs: keyResult.timingMs,
            encapMs: encapResult.timingMs,
            decapMs: decapResult.timingMs,
            ciphertextHex: encapResult.ciphertextHex,
            encapSecretHex: encapResult.sharedSecretHex,
            decapSecretHex: decapResult.sharedSecretHex,
            secretsMatch,
            error: decapResult.error,
          })
        }
      }
    }

    // 2. Hybrid: X25519 + ML-KEM-768 (simulated via separate ops + HKDF)
    const hybrid = await hybridCryptoService.hybridKemEncapDecap()
    setHybridKemResult(hybrid)

    setIsRunning(false)
  }, [])

  const runSignatureDemo = useCallback(async () => {
    setIsRunning(true)
    const algorithms = [
      { name: 'ECDSA P-256', opensslAlg: 'EC' },
      { name: 'ML-DSA-65', opensslAlg: 'ML-DSA-65' },
    ]
    const results: SignDemoResult[] = []

    for (const algo of algorithms) {
      const prefix = algo.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const keyFile = `${prefix}_sig_key.pem`
      const pubFile = `${prefix}_sig_pub.pem`

      const keyResult = await hybridCryptoService.generateKey(algo.opensslAlg, keyFile)
      if (keyResult.error) {
        results.push({
          algorithm: algo.name,
          keyGenMs: keyResult.timingMs,
          signMs: 0,
          verifyMs: 0,
          signatureHex: '',
          verified: false,
          error: keyResult.error,
        })
        continue
      }

      const pubResult = await hybridCryptoService.extractPublicKey(
        keyFile,
        pubFile,
        keyResult.fileData
      )

      const signResult = await hybridCryptoService.signData(
        keyFile,
        message,
        prefix,
        keyResult.fileData
      )
      if (signResult.error) {
        results.push({
          algorithm: algo.name,
          keyGenMs: keyResult.timingMs,
          signMs: signResult.timingMs,
          verifyMs: 0,
          signatureHex: '',
          verified: false,
          error: signResult.error,
        })
        continue
      }

      const sigFile = `${prefix}_sig.bin`
      const verifyInputFiles: { name: string; data: Uint8Array }[] = []
      if (pubResult.fileData) verifyInputFiles.push(pubResult.fileData)
      if (signResult.sigFileData) verifyInputFiles.push(signResult.sigFileData)
      const verifyResult = await hybridCryptoService.verifySignature(
        pubFile,
        message,
        sigFile,
        prefix,
        verifyInputFiles
      )

      results.push({
        algorithm: algo.name,
        keyGenMs: keyResult.timingMs,
        signMs: signResult.timingMs,
        verifyMs: verifyResult.timingMs,
        signatureHex: signResult.signatureHex,
        verified: verifyResult.verified,
        error: verifyResult.error,
      })
    }

    setSigResults(results)
    setIsRunning(false)
  }, [message])

  const handleRun = mode === 'kem' ? runKemDemo : runSignatureDemo

  const truncateHex = (hex: string, max = 64): string => {
    if (hex.length <= max) return hex
    return hex.slice(0, max) + '\u2026'
  }

  const hasKemResults = pqcKemResult !== null || hybridKemResult !== null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Encrypt &amp; Sign</h3>
        <p className="text-sm text-muted-foreground">
          Run end-to-end KEM encapsulation/decapsulation and digital signature sign/verify
          operations. Compare pure PQC against hybrid to see performance and correctness.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('kem')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'kem'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          <Lock size={14} /> KEM Operations
        </button>
        <button
          onClick={() => setMode('signature')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'signature'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          <PenTool size={14} /> Signature Operations
        </button>
      </div>

      {/* Message display for signatures */}
      {mode === 'signature' && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <span className="text-xs text-muted-foreground">Message to sign: </span>
          <span className="text-sm font-mono text-foreground">&quot;{message}&quot;</span>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isRunning ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            Run {mode === 'kem' ? 'KEM Demo' : 'Signature Demo'}
          </>
        )}
      </button>

      {/* KEM Results */}
      {mode === 'kem' && hasKemResults && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ML-KEM-768 (Pure PQC) Card */}
            {pqcKemResult && (
              <div className="glass-panel p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground">{pqcKemResult.algorithm}</h4>
                    <span className="text-xs px-2 py-0.5 rounded border bg-success/10 text-success border-success/20 font-bold">
                      PQC
                    </span>
                  </div>
                  {pqcKemResult.error ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                      ERROR
                    </span>
                  ) : pqcKemResult.secretsMatch ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle size={14} /> Secrets Match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <XCircle size={14} /> Mismatch
                    </span>
                  )}
                </div>

                {pqcKemResult.error ? (
                  <p className="text-xs text-destructive">{pqcKemResult.error}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          {pqcKemResult.keyGenMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Key Gen (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {pqcKemResult.encapMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Encap (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-secondary">
                          {pqcKemResult.decapMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Decap (ms)</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          Ciphertext
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-border block overflow-x-auto">
                          {truncateHex(pqcKemResult.ciphertextHex)}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          Shared Secret (encap)
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-border block overflow-x-auto text-success">
                          {truncateHex(pqcKemResult.encapSecretHex)}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          Shared Secret (decap)
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-border block overflow-x-auto text-success">
                          {truncateHex(pqcKemResult.decapSecretHex)}
                        </code>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hybrid KEM Card */}
            {hybridKemResult && (
              <div className="glass-panel p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground">X25519 + ML-KEM-768</h4>
                    <span className="text-xs px-2 py-0.5 rounded border bg-primary/10 text-primary border-primary/20 font-bold">
                      HYBRID
                    </span>
                  </div>
                  {hybridKemResult.error ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                      ERROR
                    </span>
                  ) : hybridKemResult.pqcSecretsMatch ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle size={14} /> Secrets Match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <XCircle size={14} /> Mismatch
                    </span>
                  )}
                </div>

                {hybridKemResult.error ? (
                  <p className="text-xs text-destructive">{hybridKemResult.error}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          {hybridKemResult.keyGenMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Key Gen (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {hybridKemResult.encapMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Encap+ECDH (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-secondary">
                          {hybridKemResult.decapMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Decap (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-muted-foreground">
                          {hybridKemResult.hkdfMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">HKDF (ms)</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          PQC Ciphertext (ML-KEM-768)
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-border block overflow-x-auto">
                          {truncateHex(hybridKemResult.pqcCiphertextHex)}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-success block mb-1">
                          PQC Shared Secret
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-success/30 block overflow-x-auto text-success">
                          {truncateHex(hybridKemResult.pqcSecretHex)}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-warning block mb-1">
                          Classical Shared Secret (X25519)
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-warning/30 block overflow-x-auto text-warning">
                          {truncateHex(hybridKemResult.classicalSecretHex)}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-primary block mb-1 font-bold">
                          Combined Hybrid Secret (HKDF-Extract)
                        </span>
                        <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-primary/30 block overflow-x-auto text-primary">
                          {truncateHex(hybridKemResult.combinedSecretHex)}
                        </code>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* KEM comparison table */}
          {pqcKemResult && hybridKemResult && !pqcKemResult.error && !hybridKemResult.error && (
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-3">Timing Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">
                        Key Gen (ms)
                      </th>
                      <th className="text-right p-2 text-muted-foreground font-medium">
                        Encap (ms)
                      </th>
                      <th className="text-right p-2 text-muted-foreground font-medium">
                        Decap (ms)
                      </th>
                      <th className="text-right p-2 text-muted-foreground font-medium">
                        HKDF (ms)
                      </th>
                      <th className="text-right p-2 text-muted-foreground font-medium">
                        Total (ms)
                      </th>
                      <th className="text-center p-2 text-muted-foreground font-medium">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-2 font-medium">ML-KEM-768</td>
                      <td className="p-2 text-right font-mono text-xs">
                        {pqcKemResult.keyGenMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {pqcKemResult.encapMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {pqcKemResult.decapMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                        {'\u2014'}
                      </td>
                      <td className="p-2 text-right font-mono text-xs font-bold">
                        {(
                          pqcKemResult.keyGenMs +
                          pqcKemResult.encapMs +
                          pqcKemResult.decapMs
                        ).toFixed(0)}
                      </td>
                      <td className="p-2 text-center">
                        {pqcKemResult.secretsMatch ? (
                          <CheckCircle size={14} className="inline text-success" />
                        ) : (
                          <XCircle size={14} className="inline text-destructive" />
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 font-medium">X25519 + ML-KEM-768</td>
                      <td className="p-2 text-right font-mono text-xs">
                        {hybridKemResult.keyGenMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {hybridKemResult.encapMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {hybridKemResult.decapMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {hybridKemResult.hkdfMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs font-bold">
                        {hybridKemResult.totalMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-center">
                        {hybridKemResult.pqcSecretsMatch ? (
                          <CheckCircle size={14} className="inline text-success" />
                        ) : (
                          <XCircle size={14} className="inline text-destructive" />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature Results */}
      {mode === 'signature' && sigResults.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sigResults.map((result) => (
              <div key={result.algorithm} className="glass-panel p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{result.algorithm}</h4>
                  {result.error ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                      ERROR
                    </span>
                  ) : result.verified ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle size={14} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <XCircle size={14} /> Failed
                    </span>
                  )}
                </div>

                {result.error ? (
                  <p className="text-xs text-destructive">{result.error}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          {result.keyGenMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Key Gen (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {result.signMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Sign (ms)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-secondary">
                          {result.verifyMs.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Verify (ms)</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">
                        Signature ({Math.ceil(result.signatureHex.length / 2)} bytes)
                      </span>
                      <code className="text-[10px] font-mono bg-background p-1.5 rounded border border-border block overflow-x-auto">
                        {truncateHex(result.signatureHex)}
                      </code>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Signature comparison table */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Timing Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">
                      Key Gen (ms)
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Sign (ms)</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">
                      Verify (ms)
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Total (ms)</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {sigResults.map((r) => (
                    <tr key={r.algorithm} className="border-b border-border/50">
                      <td className="p-2 font-medium">{r.algorithm}</td>
                      <td className="p-2 text-right font-mono text-xs">
                        {r.error ? '\u2014' : r.keyGenMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {r.error ? '\u2014' : r.signMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {r.error ? '\u2014' : r.verifyMs.toFixed(0)}
                      </td>
                      <td className="p-2 text-right font-mono text-xs font-bold">
                        {r.error ? '\u2014' : (r.keyGenMs + r.signMs + r.verifyMs).toFixed(0)}
                      </td>
                      <td className="p-2 text-center">
                        {r.error ? (
                          '\u2014'
                        ) : r.verified ? (
                          <CheckCircle size={14} className="inline text-success" />
                        ) : (
                          <XCircle size={14} className="inline text-destructive" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          {mode === 'kem' ? (
            <>
              <strong>What&apos;s happening:</strong> KEM (Key Encapsulation Mechanism) is the
              quantum-safe replacement for ECDH key exchange. The sender <em>encapsulates</em>{' '}
              against the recipient&apos;s public key to produce a ciphertext and a shared secret.
              The recipient <em>decapsulates</em> with their private key to recover the same shared
              secret. The hybrid X25519 + ML-KEM-768 demo performs both X25519 ECDH and ML-KEM-768
              encapsulation separately, then combines the shared secrets via HKDF-Extract for
              defense in depth.
            </>
          ) : (
            <>
              <strong>What&apos;s happening:</strong> Both ECDSA and ML-DSA produce digital
              signatures, but ML-DSA signatures are based on lattice problems rather than elliptic
              curves. ML-DSA-65 signatures (~3.3 KB) are significantly larger than ECDSA (~72 bytes)
              but provide quantum resistance. A composite signature scheme would produce both
              signatures and package them together.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
