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
  TreePine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildMerkleTree,
  getInclusionProof,
  verifyInclusionProof,
  type MerkleNode,
  type InclusionProof,
  type VerificationStep,
} from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash } from '../data/mtcConstants'
import type { CertLeaf } from '../utils/merkleTree'

/** Compute the hex complement of a single hex character (0↔f, 1↔e, ...) */
function hexComplement(char: string): string {
  return (15 - parseInt(char, 16)).toString(16)
}

type PathNodeType = 'selected' | 'computed' | 'provided' | 'root'
interface PathAnnotation {
  type: PathNodeType
  order: number
  label: string
}

const circledNumbers = ['\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465']
const DEFAULT_VERIFIER_CERTS = SAMPLE_CERTS.slice(0, 8)

interface ProofVerifierProps {
  sharedLevels?: MerkleNode[][] | null
  sharedCerts?: CertLeaf[] | null
}

export const ProofVerifier: React.FC<ProofVerifierProps> = ({ sharedLevels, sharedCerts }) => {
  const PROOF_VERIFIER_CERTS = useMemo(
    () => (sharedCerts && sharedCerts.length > 0 ? sharedCerts : DEFAULT_VERIFIER_CERTS),
    [sharedCerts]
  )
  const [levels, setLevels] = useState<MerkleNode[][] | null>(sharedLevels ?? null)
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null)
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

  const tamperCount = tamperedPositions.size

  const handleSetup = useCallback(async () => {
    setIsBuilding(true)
    try {
      const result = await buildMerkleTree(PROOF_VERIFIER_CERTS)
      setLevels(result.levels)
      setSelectedLeaf(null)
      setOriginalProof(null)
      setEditableProof(null)
      setTamperedPositions(new Map())
      setVerificationResult(null)
      setCurrentStep(-1)
    } finally {
      setIsBuilding(false)
    }
  }, [PROOF_VERIFIER_CERTS])

  const handleSelectLeaf = useCallback(
    (leafIndex: number) => {
      if (!levels) return
      const p = getInclusionProof(levels, leafIndex)
      setSelectedLeaf(leafIndex)
      setOriginalProof(p)
      setEditableProof(structuredClone(p))
      setTamperedPositions(new Map())
      setVerificationResult(null)
      setCurrentStep(-1)
    },
    [levels]
  )

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
        const result = await verifyInclusionProof(
          proofToVerify,
          useOriginal ? undefined : (originalProof ?? undefined)
        )

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

  // Per-node annotations: selected, provided, computed, root
  const pathAnnotations = useMemo(() => {
    if (!originalProof || !levels) return new Map<string, PathAnnotation>()
    const annotations = new Map<string, PathAnnotation>()

    annotations.set(`0-${originalProof.leafIndex}`, {
      type: 'selected',
      order: 0,
      label: `Cert ${originalProof.leafIndex + 1}`,
    })

    let idx = originalProof.leafIndex
    for (let lvl = 0; lvl < originalProof.siblings.length; lvl++) {
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1
      const parentIdx = Math.floor(idx / 2)

      annotations.set(`${lvl}-${siblingIdx}`, {
        type: 'provided',
        order: lvl + 1,
        label: `Sibling ${lvl + 1}`,
      })

      const isRoot = lvl + 1 === levels.length - 1
      if (lvl + 1 < levels.length) {
        annotations.set(`${lvl + 1}-${parentIdx}`, {
          type: isRoot ? 'root' : 'computed',
          order: lvl + 1,
          label: isRoot ? 'Root' : `Step ${lvl + 1}`,
        })
      }

      idx = parentIdx
    }

    return annotations
  }, [originalProof, levels])

  // Original hashes of tampered siblings (for tree color override)
  const tamperedSiblingHashes = useMemo(() => {
    if (!originalProof || tamperedPositions.size === 0) return new Set<string>()
    const tampered = new Set<string>()
    for (const key of tamperedPositions.keys()) {
      const sibIdx = parseInt(key.split('-')[0], 10)
      tampered.add(originalProof.siblings[sibIdx].hash)
    }
    return tampered
  }, [originalProof, tamperedPositions])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Step-by-Step Proof Verification</h3>
        <p className="text-sm text-muted-foreground">
          Watch how an inclusion proof is verified by recomputing hashes from the leaf to the root.
          Click any hex character in the sibling hashes to tamper with it, then verify to see how
          the avalanche effect causes complete verification failure.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          In the MTC model, this proof is embedded in the certificate itself — relying parties use
          it to verify the cert was included in the CA&apos;s signed batch without downloading the
          full tree.
        </p>
      </div>

      {/* Step 1 continuity tip */}
      {sharedCerts && sharedCerts.length > 0 ? (
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-xs text-foreground">
          <ShieldCheck size={12} className="inline mr-1 text-primary" />
          <strong>Your tree from Step 1 is loaded</strong> ({sharedCerts.length} certificates).
          Build the tree below to verify proofs against the same certs you built.
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-[10px] text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Build your own tree in Step 1 first — it
          will automatically load here so you can verify your own certificates&apos; inclusion
          proofs.
        </div>
      )}

      {/* Setup */}
      {!levels ? (
        <Button
          variant="gradient"
          onClick={handleSetup}
          disabled={isBuilding}
          className="flex items-center gap-2 font-bold text-sm"
        >
          {isBuilding ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Building...
            </>
          ) : (
            <>
              <ShieldCheck size={16} />{' '}
              {sharedCerts && sharedCerts.length > 0
                ? `Build Tree with ${sharedCerts.length} Certificates from Step 1`
                : 'Build Tree & Select a Leaf'}
            </>
          )}
        </Button>
      ) : !originalProof ? (
        /* Leaf picker — tree built but no leaf selected yet */
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-foreground">
              <TreePine size={12} className="inline mr-1 text-primary" />
              <strong>Click any certificate leaf</strong> to generate its inclusion proof, then
              verify it step-by-step.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
            <div className="space-y-3 min-w-fit">
              {[...levels].reverse().map((level, reversedIdx) => {
                const levelIdx = levels.length - 1 - reversedIdx
                const isRoot = levelIdx === levels.length - 1
                const isLeaf = levelIdx === 0
                return (
                  <div key={levelIdx}>
                    <div className="text-[10px] text-muted-foreground mb-1">
                      {isRoot ? 'Root' : isLeaf ? 'Leaves (click to select)' : `Level ${levelIdx}`}
                    </div>
                    <div className="flex justify-center gap-1 flex-wrap">
                      {level.map((node) => (
                        <Button
                          key={`${levelIdx}-${node.index}`}
                          onClick={() => isLeaf && handleSelectLeaf(node.index)}
                          disabled={!isLeaf}
                          variant="ghost"
                          className={`px-2 py-1.5 h-auto rounded text-[10px] font-mono border transition-all ${
                            isRoot
                              ? 'bg-accent/20 text-accent border-accent/50 cursor-default'
                              : isLeaf
                                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/25 cursor-pointer'
                                : 'bg-muted text-foreground border-border cursor-default'
                          }`}
                        >
                          <div className="text-[9px] text-muted-foreground mb-0.5">
                            {node.label}
                          </div>
                          <div>{truncateHash(node.hash, 6)}</div>
                          {isLeaf && node.index < PROOF_VERIFIER_CERTS.length && (
                            <div className="text-[8px] mt-0.5 text-muted-foreground">
                              {PROOF_VERIFIER_CERTS[node.index].subject}
                            </div>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Proof info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-foreground">
                Proof for Cert {(selectedLeaf ?? 0) + 1} (
                {PROOF_VERIFIER_CERTS[selectedLeaf ?? 0]?.subject})
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
                          <Button
                            key={key}
                            onClick={() => handleFlipChar(sibIdx, charIdx)}
                            variant="ghost"
                            className={`w-[10px] h-auto p-0 text-[10px] font-mono leading-relaxed text-center hover:bg-primary/20 rounded-sm cursor-pointer ${
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
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tree visualization */}
          {levels && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TreePine size={14} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground">Authentication Path in Tree</h4>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                Cert {(selectedLeaf ?? 0) + 1} is the selected leaf. The highlighted siblings are
                the hashes you must provide to recompute the root. Tampered nodes appear in red.
              </p>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[10px] mb-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-primary/30 border-2 border-primary inline-block" />
                  Selected leaf
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-warning/20 border-2 border-dashed border-warning inline-block" />
                  Provided sibling
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-success/20 border-2 border-success inline-block" />
                  Computed parent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-accent/20 border-2 border-double border-accent inline-block" />
                  Verified root
                </span>
                {tamperCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-destructive/30 border-2 border-destructive inline-block" />
                    Tampered
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <div className="space-y-3 min-w-fit">
                  {[...levels].reverse().map((level, reversedIdx) => {
                    const levelIdx = levels.length - 1 - reversedIdx
                    const isRootLevel = levelIdx === levels.length - 1
                    const isLeaf = levelIdx === 0
                    return (
                      <div key={levelIdx}>
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {isRootLevel ? 'Root' : isLeaf ? 'Leaves' : `Level ${levelIdx}`}
                        </div>
                        <div className="flex justify-center gap-1 flex-wrap">
                          {level.map((node) => {
                            const annotation = pathAnnotations.get(`${levelIdx}-${node.index}`)
                            const isTampered =
                              annotation?.type === 'provided' &&
                              tamperedSiblingHashes.has(node.hash)

                            let borderClass = ''
                            if (isTampered) {
                              borderClass =
                                'bg-destructive/20 text-destructive border-2 border-destructive shadow-md'
                            } else if (annotation) {
                              if (annotation.type === 'selected') {
                                borderClass =
                                  'bg-primary/30 text-primary border-2 border-primary ring-2 ring-primary'
                              } else if (annotation.type === 'provided') {
                                borderClass =
                                  'bg-warning/15 text-warning border-2 border-dashed border-warning shadow-md'
                              } else if (annotation.type === 'computed') {
                                borderClass =
                                  'bg-success/20 text-success border-2 border-success shadow-md'
                              } else if (annotation.type === 'root') {
                                if (verificationResult) {
                                  borderClass = verificationResult.valid
                                    ? 'bg-success/20 text-success border-[3px] border-double border-success shadow-lg'
                                    : 'bg-destructive/20 text-destructive border-[3px] border-double border-destructive shadow-lg'
                                } else {
                                  borderClass =
                                    'bg-accent/20 text-accent border-[3px] border-double border-accent shadow-lg'
                                }
                              }
                            } else if (isRootLevel) {
                              borderClass = 'bg-accent/20 text-accent border-accent/50'
                            } else {
                              borderClass = 'bg-muted text-muted-foreground border-border'
                            }

                            return (
                              <div
                                key={`${levelIdx}-${node.index}`}
                                className={`relative px-2 py-1.5 rounded text-[10px] font-mono border ${borderClass}`}
                              >
                                {annotation && (
                                  <span
                                    className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                                      isTampered
                                        ? 'bg-destructive text-destructive-foreground'
                                        : annotation.type === 'selected'
                                          ? 'bg-primary text-primary-foreground'
                                          : annotation.type === 'provided'
                                            ? 'bg-warning text-warning-foreground'
                                            : annotation.type === 'root'
                                              ? 'bg-accent text-black'
                                              : 'bg-success text-black'
                                    }`}
                                    title={annotation.label}
                                  >
                                    {annotation.order < circledNumbers.length
                                      ? circledNumbers[annotation.order]
                                      : annotation.order}
                                  </span>
                                )}
                                <div className="text-[9px] text-muted-foreground mb-0.5">
                                  {node.label}
                                </div>
                                <div>{truncateHash(node.hash, 6)}</div>
                                {isLeaf && node.index < PROOF_VERIFIER_CERTS.length && (
                                  <div className="text-[8px] mt-0.5 text-muted-foreground">
                                    {PROOF_VERIFIER_CERTS[node.index].subject}
                                  </div>
                                )}
                                {annotation && annotation.type !== 'selected' && (
                                  <div
                                    className={`text-[8px] mt-0.5 font-bold ${
                                      isTampered
                                        ? 'text-destructive'
                                        : annotation.type === 'provided'
                                          ? 'text-warning'
                                          : annotation.type === 'root'
                                            ? verificationResult
                                              ? verificationResult.valid
                                                ? 'text-success'
                                                : 'text-destructive'
                                              : 'text-accent'
                                            : 'text-success'
                                    }`}
                                  >
                                    {isTampered ? 'Tampered' : annotation.label}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleVerify(true)}
              disabled={isVerifying}
              variant="outline"
              className="flex items-center gap-2 bg-success/20 text-success border-success/30 hover:bg-success/30 text-sm font-medium"
            >
              {isVerifying && verificationResult?.usedOriginal !== false ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Verify Original
            </Button>
            <Button
              onClick={() => handleVerify(false)}
              disabled={isVerifying || tamperCount === 0}
              variant="outline"
              className="flex items-center gap-2 bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30 text-sm font-medium"
              title={tamperCount === 0 ? 'Click hex characters above to tamper first' : undefined}
            >
              {isVerifying && verificationResult?.usedOriginal === false ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <AlertTriangle size={14} />
              )}
              Verify Tampered
            </Button>
            <Button
              onClick={handleAutoTamper}
              disabled={isVerifying}
              variant="outline"
              className="flex items-center gap-2 bg-warning/10 text-warning border-warning/30 hover:bg-warning/20 text-sm"
            >
              <Shuffle size={14} /> Auto-Tamper
            </Button>
            {tamperCount > 0 && (
              <Button
                onClick={handleResetTampering}
                variant="link"
                className="flex items-center gap-1 text-xs h-auto p-0 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={12} /> Reset All
              </Button>
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
                        isReached ? 'opacity-100' : 'border-border/30 opacity-30'
                      } ${step.isDivergencePoint ? 'border-destructive/60 ring-1 ring-destructive/30' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">
                          {step.label}: H(left || right)
                        </span>
                        {step.isDivergencePoint && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30">
                            ⚠ first divergence
                          </span>
                        )}
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
                          <span
                            className={`text-[10px] font-bold w-4 ${step.isDivergencePoint ? 'text-destructive' : 'text-success'}`}
                          >
                            =
                          </span>
                          <span
                            className={`font-mono text-[10px] break-all ${step.isDivergencePoint ? 'text-destructive' : 'text-foreground'}`}
                          >
                            {truncateHash(step.output, 12)}
                          </span>
                        </div>
                        {step.isDivergencePoint && step.expectedOutput && (
                          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-destructive/20">
                            <span className="text-[10px] font-bold text-success w-4">✓</span>
                            <span className="font-mono text-[10px] text-success break-all">
                              {truncateHash(step.expectedOutput, 12)}
                            </span>
                            <span className="text-[9px] text-muted-foreground ml-1">
                              (expected)
                            </span>
                          </div>
                        )}
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
