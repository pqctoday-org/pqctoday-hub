// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import {
  ShieldCheck,
  ShieldX,
  Play,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Shuffle,
} from 'lucide-react'
import {
  buildMerkleTree,
  getInclusionProof,
  verifyInclusionProof,
  type MerkleNode,
  type InclusionProof,
  type VerificationStep,
} from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash } from '../data/mtcConstants'

/** Compute the hex complement of a single hex character (0↔f, 1↔e, ...) */
function hexComplement(char: string): string {
  return (15 - parseInt(char, 16)).toString(16)
}

export const ProofVerifier: React.FC = () => {
  const [, setLevels] = useState<MerkleNode[][] | null>(null)
  const [originalProof, setOriginalProof] = useState<InclusionProof | null>(null)
  const [editableProof, setEditableProof] = useState<InclusionProof | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Track which hex positions the user has flipped: "sibIdx-charIdx" → original char
  const [tamperedPositions, setTamperedPositions] = useState<Map<string, string>>(new Map())

  // Verification state
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    steps: VerificationStep[]
    usedOriginal: boolean
  } | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)

  const certs = SAMPLE_CERTS.slice(0, 8)
  const tamperCount = tamperedPositions.size

  const handleSetup = useCallback(async () => {
    setIsBuilding(true)
    try {
      const result = await buildMerkleTree(certs)
      setLevels(result.levels)
      // Pick leaf index 2 (Cert 3) for the demo
      const p = getInclusionProof(result.levels, 2)
      setOriginalProof(p)
      setEditableProof(structuredClone(p))
      setTamperedPositions(new Map())
      setVerificationResult(null)
      setCurrentStep(-1)
    } finally {
      setIsBuilding(false)
    }
  }, [])

  /** Toggle a hex character in a sibling hash */
  const handleFlipChar = useCallback(
    (sibIdx: number, charIdx: number) => {
      if (!editableProof || !originalProof) return

      const key = `${sibIdx}-${charIdx}`
      const newTampered = new Map(tamperedPositions)
      const newProof = structuredClone(editableProof)
      const currentChar = editableProof.siblings[sibIdx].hash[charIdx]

      if (newTampered.has(key)) {
        // Restore to original
        const origChar = newTampered.get(key)!
        const hash = newProof.siblings[sibIdx].hash.split('')
        hash[charIdx] = origChar
        newProof.siblings[sibIdx].hash = hash.join('')
        newTampered.delete(key)
      } else {
        // Flip to complement
        const flipped = hexComplement(currentChar)
        const hash = newProof.siblings[sibIdx].hash.split('')
        hash[charIdx] = flipped
        newProof.siblings[sibIdx].hash = hash.join('')
        newTampered.set(key, currentChar)
      }

      setEditableProof(newProof)
      setTamperedPositions(newTampered)
      setVerificationResult(null)
      setCurrentStep(-1)
    },
    [editableProof, originalProof, tamperedPositions]
  )

  /** Auto-tamper: flip one random character in a random sibling */
  const handleAutoTamper = useCallback(() => {
    if (!editableProof || !originalProof) return

    // Pick a random sibling and character that isn't already tampered
    const candidates: [number, number][] = []
    for (let sIdx = 0; sIdx < originalProof.siblings.length; sIdx++) {
      for (let cIdx = 0; cIdx < originalProof.siblings[sIdx].hash.length; cIdx++) {
        if (!tamperedPositions.has(`${sIdx}-${cIdx}`)) {
          candidates.push([sIdx, cIdx])
        }
      }
    }
    if (candidates.length === 0) return
    const [sibIdx, charIdx] = candidates[Math.floor(Math.random() * candidates.length)]
    handleFlipChar(sibIdx, charIdx)
  }, [editableProof, originalProof, tamperedPositions, handleFlipChar])

  /** Reset all tampering back to original */
  const handleResetTampering = useCallback(() => {
    if (!originalProof) return
    setEditableProof(structuredClone(originalProof))
    setTamperedPositions(new Map())
    setVerificationResult(null)
    setCurrentStep(-1)
  }, [originalProof])

  const handleVerify = useCallback(
    async (useOriginal: boolean) => {
      const proofToVerify = useOriginal ? originalProof : editableProof
      if (!proofToVerify) return
      setIsVerifying(true)
      setVerificationResult(null)
      setCurrentStep(-1)

      try {
        const result = await verifyInclusionProof(proofToVerify)

        // Animate step-by-step
        for (let i = 0; i < result.steps.length; i++) {
          setCurrentStep(i)
          await new Promise((resolve) => setTimeout(resolve, 600))
        }

        setVerificationResult({
          valid: result.valid,
          steps: result.steps,
          usedOriginal: useOriginal,
        })
      } finally {
        setIsVerifying(false)
      }
    },
    [originalProof, editableProof]
  )

  // Determine which proof is being shown in the step display
  const displayProof = useMemo(() => {
    if (!verificationResult) return editableProof
    return verificationResult.usedOriginal ? originalProof : editableProof
  }, [verificationResult, editableProof, originalProof])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Step-by-Step Proof Verification</h3>
        <p className="text-sm text-muted-foreground">
          Watch how an inclusion proof is verified by recomputing hashes from the leaf to the root.
          Click any hex character in the sibling hashes to tamper with it, then verify to see how
          the avalanche effect causes complete verification failure.
        </p>
      </div>

      {/* Setup */}
      {!originalProof ? (
        <button
          onClick={handleSetup}
          disabled={isBuilding}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
        >
          {isBuilding ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Preparing...
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Set Up Verification Demo
            </>
          )}
        </button>
      ) : (
        <>
          {/* Proof info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-foreground">
                Proof for Cert 3 ({certs[2].subject})
              </h4>
              {tamperCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30 font-bold">
                  {tamperCount} char{tamperCount !== 1 ? 's' : ''} modified
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Leaf Hash</div>
                <div className="font-mono text-[10px] text-foreground bg-background rounded p-2 border border-border break-all">
                  {truncateHash(originalProof.leafHash, 16)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Expected Root</div>
                <div className="font-mono text-[10px] text-accent bg-background rounded p-2 border border-accent/30 break-all">
                  {truncateHash(originalProof.root, 16)}
                </div>
              </div>
            </div>

            {/* Interactive sibling hashes */}
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">
                Authentication Path &mdash; click any hex character to flip it
              </div>
              <div className="space-y-2">
                {editableProof?.siblings.map((s, sibIdx) => (
                  <div
                    key={sibIdx}
                    className={`bg-background rounded p-2 border transition-colors ${
                      Array.from(tamperedPositions.keys()).some((k) => k.startsWith(`${sibIdx}-`))
                        ? 'border-destructive/50'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        Sibling {sibIdx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          s.position === 'left'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {s.position === 'left' ? 'L' : 'R'}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] leading-relaxed flex flex-wrap">
                      {s.hash.split('').map((char, charIdx) => {
                        const key = `${sibIdx}-${charIdx}`
                        const isTampered = tamperedPositions.has(key)
                        return (
                          <button
                            key={key}
                            onClick={() => handleFlipChar(sibIdx, charIdx)}
                            className={`w-[10px] text-center transition-colors hover:bg-primary/20 rounded-sm cursor-pointer ${
                              isTampered
                                ? 'bg-destructive/30 text-destructive font-bold'
                                : 'text-foreground'
                            }`}
                            title={
                              isTampered
                                ? `Click to restore (was: ${tamperedPositions.get(key)})`
                                : `Click to flip: ${char} → ${hexComplement(char)}`
                            }
                          >
                            {char}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleVerify(true)}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success border border-success/30 rounded-lg hover:bg-success/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isVerifying && verificationResult?.usedOriginal !== false ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Verify Original
            </button>
            <button
              onClick={() => handleVerify(false)}
              disabled={isVerifying || tamperCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/30 transition-colors text-sm font-medium disabled:opacity-50"
              title={tamperCount === 0 ? 'Click hex characters above to tamper first' : undefined}
            >
              {isVerifying && verificationResult?.usedOriginal === false ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <AlertTriangle size={14} />
              )}
              Verify Tampered
            </button>
            <button
              onClick={handleAutoTamper}
              disabled={isVerifying}
              className="flex items-center gap-2 px-3 py-2 bg-warning/10 text-warning border border-warning/30 rounded-lg hover:bg-warning/20 transition-colors text-sm disabled:opacity-50"
            >
              <Shuffle size={14} /> Auto-Tamper
            </button>
            {tamperCount > 0 && (
              <button
                onClick={handleResetTampering}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={12} /> Reset All
              </button>
            )}
          </div>

          {/* Step-by-step visualization */}
          {(currentStep >= 0 || verificationResult) && displayProof && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3">Verification Steps</h4>

              {/* Steps */}
              <div className="space-y-2">
                {/* Starting hash */}
                <div className="bg-background rounded-lg p-3 border border-primary/30">
                  <div className="text-[10px] text-muted-foreground mb-1">Start: Leaf Hash</div>
                  <div className="font-mono text-[10px] text-primary break-all">
                    {displayProof.leafHash}
                  </div>
                </div>

                {/* Intermediate steps */}
                {verificationResult?.steps.map((step, i) => {
                  const isReached = currentStep >= i || verificationResult
                  return (
                    <div
                      key={i}
                      className={`bg-background rounded-lg p-3 border transition-all duration-300 ${
                        isReached ? 'border-border opacity-100' : 'border-border/30 opacity-30'
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground mb-1">
                        {step.label}: H(left || right)
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-primary w-4">L:</span>
                          <span className="font-mono text-[10px] text-foreground break-all">
                            {truncateHash(step.inputLeft, 12)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-warning w-4">R:</span>
                          <span className="font-mono text-[10px] text-foreground break-all">
                            {truncateHash(step.inputRight, 12)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] font-bold text-success w-4">=</span>
                          <span className="font-mono text-[10px] text-foreground break-all">
                            {truncateHash(step.output, 12)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Final result */}
                {verificationResult && (
                  <div
                    className={`rounded-lg p-4 border-2 text-center ${
                      verificationResult.valid
                        ? 'bg-success/10 border-success'
                        : 'bg-destructive/10 border-destructive'
                    }`}
                  >
                    {verificationResult.valid ? (
                      <div className="flex items-center justify-center gap-2">
                        <ShieldCheck size={24} className="text-success" />
                        <div>
                          <div className="text-sm font-bold text-success">Verification Passed</div>
                          <div className="text-[10px] text-muted-foreground">
                            Computed root matches the signed root hash
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <ShieldX size={24} className="text-destructive" />
                        <div>
                          <div className="text-sm font-bold text-destructive">
                            Verification Failed
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {tamperCount > 0
                              ? `${tamperCount} flipped character${tamperCount !== 1 ? 's' : ''} caused the computed root to diverge completely`
                              : 'Computed root does not match the expected root'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Avalanche effect explanation */}
          {verificationResult && !verificationResult.valid && tamperCount > 0 && (
            <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Avalanche effect:</strong> You flipped{' '}
                  {tamperCount} hex character{tamperCount !== 1 ? 's' : ''} across the
                  authentication path. Even a single-character change causes all subsequent hashes
                  to differ, making the computed root completely different from the expected root.
                  This is why Merkle proofs are computationally infeasible to forge.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
