// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Trash2, TreePine, Search, ShieldCheck, BarChart3, FileCheck } from 'lucide-react'
import { MerkleTreeBuilder } from './MerkleTreeBuilder'
import { InclusionProofGenerator } from './InclusionProofGenerator'
import { ProofVerifier } from './ProofVerifier'
import { SizeComparison } from './SizeComparison'
import { CTLogSimulator } from './CTLogSimulator'
import { WorkshopStepHeader } from '../../../common/WorkshopStepHeader'

const MODULE_ID = 'merkle-tree-certs'

const PARTS = [
  {
    id: 'build-tree',
    title: 'Step 1: Build Tree',
    description: 'Add certificate leaves and build a Merkle tree with SHA-256 hashing.',
    icon: TreePine,
  },
  {
    id: 'inclusion-proof',
    title: 'Step 2: Inclusion Proof',
    description: 'Select a leaf and generate its authentication path through the tree.',
    icon: Search,
  },
  {
    id: 'verify-proof',
    title: 'Step 3: Verify Proof',
    description: 'Walk through proof verification step-by-step and test tampering.',
    icon: ShieldCheck,
  },
  {
    id: 'size-comparison',
    title: 'Step 4: Size Comparison',
    description: 'Compare handshake sizes: traditional X.509 chains vs Merkle Tree Certificates.',
    icon: BarChart3,
  },
  {
    id: 'ct-log',
    title: 'Step 5: CT Log',
    description:
      'Simulate a Certificate Transparency log with ML-DSA-44 signing via SoftHSMv3, consistency proofs, and misissuance detection.',
    icon: FileCheck,
  },
]

/**
 * Standalone 5-step Merkle Tree workshop for the Playground.
 * Contains only the simulation steps — no Learn/Visual/Exercises/References tabs.
 */
export const MerkleWorkshopSteps: React.FC = () => {
  const [currentPart, setCurrentPart] = useState(0)
  const [configKey, setConfigKey] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const handlePartChange = useCallback(
    (newPart: number) => {
      if (newPart > currentPart) {
        setCompletedSteps((prev) => new Set(prev).add(currentPart))
      }
      setCurrentPart(newPart)
    },
    [currentPart]
  )

  const handleReset = () => {
    if (confirm('Restart Merkle Tree Workshop?')) {
      setCurrentPart(0)
      setConfigKey((prev) => prev + 1)
      setCompletedSteps(new Set())
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Reset button */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset
        </button>
      </div>

      {/* Part Progress Steps */}
      <div className="overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-between relative min-w-max sm:min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

          {PARTS.map((part, idx) => {
            const Icon = part.icon
            const isCompleted = completedSteps.has(idx)
            return (
              <button
                key={part.id}
                onClick={() => handlePartChange(idx)}
                className={`flex flex-col items-center gap-2 group px-1 sm:px-2 ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${
                      idx === currentPart
                        ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                        : isCompleted
                          ? 'border-success text-success'
                          : 'border-border text-muted-foreground'
                    }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {part.title.split(':')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
        <WorkshopStepHeader
          moduleId={MODULE_ID}
          stepId={PARTS[currentPart].id}
          stepTitle={PARTS[currentPart].title}
          stepDescription={PARTS[currentPart].description}
          stepIndex={currentPart}
          totalSteps={PARTS.length}
        />
        {currentPart === 0 && <MerkleTreeBuilder key={`build-${configKey}`} />}
        {currentPart === 1 && <InclusionProofGenerator key={`proof-${configKey}`} />}
        {currentPart === 2 && <ProofVerifier key={`verify-${configKey}`} />}
        {currentPart === 3 && <SizeComparison key={`size-${configKey}`} />}
        {currentPart === 4 && <CTLogSimulator key={`ctlog-${configKey}`} />}
      </div>

      {/* Part Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <button
          onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
          disabled={currentPart === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
        >
          &larr; Previous Step
        </button>
        {currentPart === PARTS.length - 1 ? (
          <button
            onClick={() => setCompletedSteps((prev) => new Set(prev).add(currentPart))}
            className="px-6 py-3 min-h-[44px] bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-colors"
          >
            Complete ✓
          </button>
        ) : (
          <button
            onClick={() => handlePartChange(currentPart + 1)}
            className="px-6 py-3 min-h-[44px] bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next Step &rarr;
          </button>
        )}
      </div>
    </div>
  )
}
