// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface MTCExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopStep?: (step: number) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  workshopStep: number
}

export const MTCExercises: React.FC<MTCExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopStep,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'build-tree',
      title: '1. Build a Merkle Tree with 8 Certificates',
      description:
        'Add 8 certificate leaves to the tree builder — use a mix of ML-DSA-44, ML-DSA-65, and ML-DSA-87 algorithms. Build the tree and examine how the SHA-256 hashes propagate from leaves to root.',
      badge: 'Build',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Note that changing any single certificate leaf (even one character in the subject) completely changes the root hash. This is the avalanche effect — the foundation of Merkle tree security. Also notice how padding works when the number of leaves is not a power of two.',
      workshopStep: 0,
    },
    {
      id: 'generate-proof',
      title: '2. Generate and Examine an Inclusion Proof',
      description:
        'Build a tree with the sample certificates, then click different leaves to generate their inclusion proofs. Compare the authentication paths for leaves at different positions in the tree.',
      badge: 'Proof',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Each proof contains exactly log2(N) sibling hashes, where N is the number of leaves. For 8 leaves, every proof has 3 siblings. Notice that the proof size is the same regardless of which leaf you select — the path length is always equal to the tree height.',
      workshopStep: 1,
    },
    {
      id: 'tamper-test',
      title: '3. Tamper with a Proof and Observe Failure',
      description:
        'First verify a valid proof to see the step-by-step hash recomputation succeed. Then verify the tampered proof to see how a single flipped bit causes complete verification failure.',
      badge: 'Tamper',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'The tampered proof flips just one hex character in the first sibling hash. Despite this tiny change, the computed root hash is entirely different from the expected root — demonstrating that Merkle proofs are computationally infeasible to forge without knowing the correct sibling hashes.',
      workshopStep: 2,
    },
    {
      id: 'size-analysis',
      title: '4. Compare Handshake Sizes Across Algorithm Families',
      description:
        'Toggle between ECDSA, ML-DSA-44, ML-DSA-65, ML-DSA-87, and SLH-DSA-128s in the size comparison dashboard. Analyze how the MTC size advantage scales with signature size.',
      badge: 'Analysis',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'The inclusion proof size (~96 bytes for this demo, ~736 bytes for production batches of 4.4M certs) is constant regardless of signature algorithm. MTC savings therefore scale with signature size: for ECDSA (64 B sig), standalone savings are only ~3% — the 736 B proof dwarfs the tiny 64 B signature it replaces, so the standalone cert is nearly the same size as a traditional chain. For ML-DSA-44 (2,420 B sig), savings are ~60% standalone and ~92% landmark. For SLH-DSA-128s (7,856 B sig), standalone savings reach ~63%. MTCs are designed for PQC migration — they solve a problem that barely exists for compact classical algorithms.',
      workshopStep: 3,
    },
  ]

  const handleStartExercise = (scenario: Scenario) => {
    onSetWorkshopStep?.(scenario.workshopStep)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these exercises in order to understand how Merkle Tree Certificates work.
          Each exercise guides you through a specific Workshop step &mdash; click &ldquo;Start
          Exercise&rdquo; to jump to the right step.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleStartExercise(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Start Exercise
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Related modules */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Continue Learning</h3>
              <p className="text-sm text-muted-foreground">
                Explore the PKI Workshop for hands-on certificate chain building, or the Stateful
                Hash Signatures module to see how Merkle trees are used in LMS/XMSS.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
