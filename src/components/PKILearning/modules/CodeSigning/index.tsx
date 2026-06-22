// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { PenLine, ShieldCheck, Package, Globe, Cpu } from 'lucide-react'
import { CodeSigningIntroduction } from './components/CodeSigningIntroduction'
import { CodeSigningExercises } from './components/CodeSigningExercises'
import { BinarySigning } from './workshop/BinarySigning'
import { CertChainBuilder } from './workshop/CertChainBuilder'
import { PackageSigning } from './workshop/PackageSigning'
import { SigstoreFlow } from './workshop/SigstoreFlow'
import { SecureBootChain } from './workshop/SecureBootChain'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'binary-signing',
    title: 'Step 1: Binary Signing',
    description: 'Sign a file hash with ML-DSA and verify the signature.',
    icon: PenLine,
  },
  {
    id: 'cert-chain',
    title: 'Step 2: Certificate Chain',
    description: 'Build a PQC code signing certificate chain.',
    icon: ShieldCheck,
  },
  {
    id: 'package-signing',
    title: 'Step 3: Package Signing',
    description: 'Simulate RPM-style hybrid ML-DSA-87+Ed448 package signing.',
    icon: Package,
  },
  {
    id: 'sigstore-flow',
    title: 'Step 4: Sigstore Flow',
    description: 'Walk through keyless signing and transparency logs.',
    icon: Globe,
  },
  {
    id: 'secure-boot',
    title: 'Step 5: Secure Boot Chain',
    description: 'Explore firmware signing trust chain with LMS, XMSS, and ML-DSA.',
    icon: Cpu,
  },
]

export const CodeSigningModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Code Signing & Supply Chain Security"
    description="Protect software distribution — from classical code signing to post-quantum ML-DSA package integrity."
    learn={(api) => <CodeSigningIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <CodeSigningExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <BinarySigning key={`binary-signing-${configKey}`} />
        case 1:
          return <CertChainBuilder key={`cert-chain-${configKey}`} />
        case 2:
          return <PackageSigning key={`package-signing-${configKey}`} />
        case 3:
          return <SigstoreFlow key={`sigstore-flow-${configKey}`} />
        case 4:
          return <SecureBootChain key={`secure-boot-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
