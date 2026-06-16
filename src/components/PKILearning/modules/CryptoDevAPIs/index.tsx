// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import {
  Network,
  Languages,
  Code2,
  ShoppingCart,
  Package,
  Grid3X3,
  Shuffle,
  GitBranch,
} from 'lucide-react'
import { CryptoDevAPIsIntroduction } from './components/CryptoDevAPIsIntroduction'
import { CryptoDevAPIsExercises } from './components/CryptoDevAPIsExercises'
import { APIArchitectureExplorer } from './workshop/APIArchitectureExplorer'
import { LanguageEcosystemComparator } from './workshop/LanguageEcosystemComparator'
import { ProviderPatternWorkshop } from './workshop/ProviderPatternWorkshop'
import { BuildBuyAnalyzer } from './workshop/BuildBuyAnalyzer'
import { PQCLibraryExplorer } from './workshop/PQCLibraryExplorer'
import { PQCSupportMatrix } from './workshop/PQCSupportMatrix'
import { CryptoAgilityPatterns } from './workshop/CryptoAgilityPatterns'
import { MigrationDecisionLab } from './workshop/MigrationDecisionLab'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'api-architecture-explorer',
    title: 'Step 1: API Architecture Explorer',
    description:
      'Compare JCA/JCE, OpenSSL, PKCS#11, CNG, Bouncy Castle, and JCProv — architecture diagrams, key objects, session models, and PQC readiness radar.',
    icon: Network,
  },
  {
    id: 'language-ecosystem',
    title: 'Step 2: Language Ecosystem Comparator',
    description:
      'Evaluate 7 languages (C++, Rust, Zig, Java, Python, Go, .NET) across memory safety, crypto ecosystem, FFI capability, and PQC binding availability.',
    icon: Languages,
  },
  {
    id: 'provider-patterns',
    title: 'Step 3: Provider Pattern Workshop',
    description:
      'Side-by-side code examples for KeyGen, Sign, Verify, Encrypt, and KEM Encapsulate across all APIs — highlighting the provider registration pattern.',
    icon: Code2,
  },
  {
    id: 'build-buy-oss',
    title: 'Step 4: Build vs Buy vs Open Source',
    description:
      'Interactive scoring wizard to recommend a sourcing strategy based on your regulatory requirements, team expertise, and PQC timeline. Real-world case studies included.',
    icon: ShoppingCart,
  },
  {
    id: 'pqc-library-explorer',
    title: 'Step 5: PQC Library Explorer',
    description:
      'Deep dive into 8 open-source PQC libraries (liboqs, AWS-LC, Bouncy Castle, pqcrypto, PQClean, BoringSSL, wolfSSL, Botan) with algorithm coverage, FIPS status, and dependency graph.',
    icon: Package,
  },
  {
    id: 'pqc-support-matrix',
    title: 'Step 6: PQC Support Matrix',
    description:
      'Interactive API × Algorithm support matrix with status badges, version requirements, code snippets per cell, and a roadmap timeline of PQC additions.',
    icon: Grid3X3,
  },
  {
    id: 'crypto-agility-patterns',
    title: 'Step 7: Crypto Agility Patterns',
    description:
      'Five design patterns for algorithm-agile code: provider abstraction, config-driven selection, hybrid/composite operations, algorithm negotiation, and feature flags.',
    icon: Shuffle,
  },
  {
    id: 'migration-decision-lab',
    title: 'Step 8: Migration Decision Lab',
    description:
      'Decision tree wizard from your current stack to recommended PQC migration path, with before/after code refactoring examples and cross-API interop patterns.',
    icon: GitBranch,
  },
]

export const CryptoDevAPIsModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Compare JCA/JCE, OpenSSL, PKCS#11, CNG, and Bouncy Castle across 7 languages — with PQC readiness, provider patterns, library selection, and migration guidance."
    learn={<CryptoDevAPIsIntroduction />}
    exercises={(api) => (
      <CryptoDevAPIsExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step)}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <APIArchitectureExplorer key={`api-arch-${configKey}`} />
        case 1:
          return <LanguageEcosystemComparator key={`lang-eco-${configKey}`} />
        case 2:
          return <ProviderPatternWorkshop key={`provider-${configKey}`} />
        case 3:
          return <BuildBuyAnalyzer key={`build-buy-${configKey}`} />
        case 4:
          return <PQCLibraryExplorer key={`pqc-lib-${configKey}`} />
        case 5:
          return <PQCSupportMatrix key={`pqc-matrix-${configKey}`} />
        case 6:
          return <CryptoAgilityPatterns key={`agility-${configKey}`} />
        case 7:
          return <MigrationDecisionLab key={`migration-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
