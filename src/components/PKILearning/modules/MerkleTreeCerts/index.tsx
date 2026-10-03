// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useState, type FC } from 'react'
import { TreePine, Search, ShieldCheck, BarChart3, FileCheck } from 'lucide-react'
import { MTCIntroduction } from './components/MTCIntroduction'
import { MTCExercises } from './components/MTCExercises'
import { MerkleTreeBuilder } from './workshop/MerkleTreeBuilder'
import { InclusionProofGenerator } from './workshop/InclusionProofGenerator'
import { ProofVerifier } from './workshop/ProofVerifier'
import { SizeComparison } from './workshop/SizeComparison'
import { CTLogSimulator } from './workshop/CTLogSimulator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import type { CertLeaf, MerkleNode } from './utils/merkleTree'

const PARTS: WorkshopPart[] = [
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

/** The tree the learner builds in Step 1, kept for the workshop run (configKey) that built it. */
interface SharedTree {
  configKey: number
  levels: MerkleNode[][]
  certs: CertLeaf[]
}

export const MerkleTreeCertsModule: FC = () => {
  // Steps 2 and 3 prove and verify the learner's own Step 1 tree (same wiring as the
  // Playground's MerkleWorkshopSteps); a reset or a new exercise config starts fresh.
  const [sharedTree, setSharedTree] = useState<SharedTree | null>(null)
  const treeFor = useCallback(
    (configKey: number) => (sharedTree?.configKey === configKey ? sharedTree : null),
    [sharedTree]
  )

  return (
    <ModuleShell
      manifest={manifest}
      description="Build Merkle trees interactively, generate and verify inclusion proofs, and compare MTC vs traditional PKI for post-quantum TLS."
      learn={(api) => <MTCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
      exercises={(api) => (
        <MTCExercises
          onNavigateToWorkshop={api.goToWorkshop}
          onSetWorkshopStep={(step) => api.openWorkshopStep(step)}
        />
      )}
      workshopParts={PARTS}
      renderWorkshopStep={(index, configKey) => {
        const tree = treeFor(configKey)
        switch (index) {
          case 0:
            return (
              <MerkleTreeBuilder
                key={`build-${configKey}`}
                onTreeBuilt={(levels, certs) => setSharedTree({ configKey, levels, certs })}
              />
            )
          case 1:
            return (
              <InclusionProofGenerator
                key={`proof-${configKey}`}
                sharedLevels={tree?.levels ?? null}
                sharedCerts={tree?.certs ?? null}
              />
            )
          case 2:
            return (
              <ProofVerifier
                key={`verify-${configKey}`}
                sharedLevels={tree?.levels ?? null}
                sharedCerts={tree?.certs ?? null}
              />
            )
          case 3:
            return <SizeComparison key={`size-${configKey}`} />
          case 4:
            return <CTLogSimulator key={`ctlog-${configKey}`} />
          default:
            return null
        }
      }}
    />
  )
}
