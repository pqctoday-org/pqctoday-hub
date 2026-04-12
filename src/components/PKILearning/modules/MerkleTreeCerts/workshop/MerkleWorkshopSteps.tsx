// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Trash2, TreePine, Search, ShieldCheck, BarChart3, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MerkleTreeBuilder } from './MerkleTreeBuilder'
import { InclusionProofGenerator } from './InclusionProofGenerator'
import { ProofVerifier } from './ProofVerifier'
import { SizeComparison } from './SizeComparison'
import { CTLogSimulator } from './CTLogSimulator'
import { WorkshopStepHeader } from '../../../common/WorkshopStepHeader'
import type { MerkleNode, CertLeaf } from '../utils/merkleTree'

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
      'Simulate a Certificate Transparency log with ML-DSA-65 signing via SoftHSMv3 (NIST Level 3, configurable), consistency proofs, and misissuance detection.',
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
  // Shared tree built in Step 1 — passed to Step 2 so the user proves their own certificates.
  const [sharedLevels, setSharedLevels] = useState<MerkleNode[][] | null>(null)
  const [sharedCerts, setSharedCerts] = useState<CertLeaf[] | null>(null)

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
      setSharedLevels(null)
      setSharedCerts(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Reset button */}
      <div className="flex justify-end">
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex items-center gap-2 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 text-sm"
        >
          <Trash2 size={16} />
          Reset
        </Button>
      </div>

      {/* Part Progress Steps */}
      <div className="overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-evenly relative min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

          {PARTS.map((part, idx) => {
            const Icon = part.icon
            const isCompleted = completedSteps.has(idx)
            return (
              <Button
                key={part.id}
                onClick={() => handlePartChange(idx)}
                variant="ghost"
                className={`flex flex-col items-center gap-2 group h-auto px-1 sm:px-2 ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
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
              </Button>
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
        {currentPart === 0 && (
          <MerkleTreeBuilder
            key={`build-${configKey}`}
            onTreeBuilt={(levels, certs) => {
              setSharedLevels(levels)
              setSharedCerts(certs)
            }}
          />
        )}
        {currentPart === 1 && (
          <InclusionProofGenerator
            key={`proof-${configKey}`}
            sharedLevels={sharedLevels}
            sharedCerts={sharedCerts}
          />
        )}
        {currentPart === 2 && (
          <ProofVerifier
            key={`verify-${configKey}`}
            sharedLevels={sharedLevels}
            sharedCerts={sharedCerts}
          />
        )}
        {currentPart === 3 && <SizeComparison key={`size-${configKey}`} />}
        {currentPart === 4 && <CTLogSimulator key={`ctlog-${configKey}`} />}
      </div>

      {/* Part Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
          disabled={currentPart === 0}
          variant="outline"
          className="px-6 min-h-[44px] rounded-lg text-foreground"
        >
          &larr; Previous Step
        </Button>
        {currentPart === PARTS.length - 1 ? (
          <Button
            variant="gradient"
            onClick={() => setCompletedSteps((prev) => new Set(prev).add(currentPart))}
            className="px-6 min-h-[44px] font-bold"
          >
            Complete ✓
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={() => handlePartChange(currentPart + 1)}
            className="px-6 min-h-[44px] font-bold"
          >
            Next Step &rarr;
          </Button>
        )}
      </div>
    </div>
  )
}
