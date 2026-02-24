import React, { useState, useCallback } from 'react'
import { ShieldCheck, ShieldX, Play, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import {
  buildMerkleTree,
  getInclusionProof,
  verifyInclusionProof,
  tamperProof,
  type MerkleNode,
  type InclusionProof,
  type VerificationStep,
} from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash } from '../data/mtcConstants'

export const ProofVerifier: React.FC = () => {
  const [, setLevels] = useState<MerkleNode[][] | null>(null)
  const [proof, setProof] = useState<InclusionProof | null>(null)
  const [tamperedProof, setTamperedProof] = useState<InclusionProof | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Verification state
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    steps: VerificationStep[]
    isTampered: boolean
  } | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)

  const certs = SAMPLE_CERTS.slice(0, 8)

  const handleSetup = useCallback(async () => {
    setIsBuilding(true)
    try {
      const result = await buildMerkleTree(certs)
      setLevels(result.levels)
      // Pick leaf index 2 (Cert 3) for the demo
      const p = getInclusionProof(result.levels, 2)
      setProof(p)
      setTamperedProof(tamperProof(p))
      setVerificationResult(null)
      setCurrentStep(-1)
    } finally {
      setIsBuilding(false)
    }
  }, [])

  const handleVerify = useCallback(
    async (useTampered: boolean) => {
      const proofToVerify = useTampered ? tamperedProof : proof
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
          isTampered: useTampered,
        })
      } finally {
        setIsVerifying(false)
      }
    },
    [proof, tamperedProof]
  )

  const handleReset = useCallback(() => {
    setVerificationResult(null)
    setCurrentStep(-1)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Step-by-Step Proof Verification</h3>
        <p className="text-sm text-muted-foreground">
          Watch how an inclusion proof is verified by recomputing hashes from the leaf to the root.
          Then try tampering with the proof to see how verification detects the modification.
        </p>
      </div>

      {/* Setup */}
      {!proof ? (
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
            <h4 className="text-sm font-bold text-foreground mb-2">
              Proof for Cert 3 ({certs[2].subject})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Leaf Hash</div>
                <div className="font-mono text-[10px] text-foreground bg-background rounded p-2 border border-border break-all">
                  {truncateHash(proof.leafHash, 16)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Expected Root</div>
                <div className="font-mono text-[10px] text-accent bg-background rounded p-2 border border-accent/30 break-all">
                  {truncateHash(proof.root, 16)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Auth path: {proof.siblings.length} sibling hashes
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleVerify(false)}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success border border-success/30 rounded-lg hover:bg-success/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isVerifying && !verificationResult?.isTampered ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Verify Valid Proof
            </button>
            <button
              onClick={() => handleVerify(true)}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isVerifying && verificationResult?.isTampered ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <AlertTriangle size={14} />
              )}
              Verify Tampered Proof
            </button>
            {verificationResult && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {/* Step-by-step visualization */}
          {(currentStep >= 0 || verificationResult) && proof && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3">Verification Steps</h4>

              {/* Steps */}
              <div className="space-y-2">
                {/* Starting hash */}
                <div className="bg-background rounded-lg p-3 border border-primary/30">
                  <div className="text-[10px] text-muted-foreground mb-1">Start: Leaf Hash</div>
                  <div className="font-mono text-[10px] text-primary break-all">
                    {(verificationResult?.isTampered ? tamperedProof : proof)?.leafHash}
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
                            {verificationResult.isTampered
                              ? 'A single flipped bit in a sibling hash causes the computed root to diverge completely'
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

          {/* Tamper explanation */}
          {verificationResult?.isTampered && tamperedProof && (
            <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">What was tampered:</strong> The last hex
                  character of the first sibling hash was flipped. Original:{' '}
                  <code className="text-[10px]">...{proof.siblings[0].hash.slice(-4)}</code> &rarr;
                  Tampered:{' '}
                  <code className="text-[10px]">...{tamperedProof.siblings[0].hash.slice(-4)}</code>
                  . This single-bit change causes all subsequent hashes to differ, making the
                  computed root completely different from the expected root. This is the{' '}
                  <strong>avalanche effect</strong> of SHA-256.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
