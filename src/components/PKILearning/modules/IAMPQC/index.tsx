// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { UserCheck, Key, Database, BarChart3, Shield, ArrowRightLeft } from 'lucide-react'
import { IAMPQCIntroduction } from './components/IAMPQCIntroduction'
import { IAMPQCExercises } from './components/IAMPQCExercises'
import { IAMCryptoInventory } from './workshop/IAMCryptoInventory'
import { TokenMigrationLab } from './workshop/TokenMigrationLab'
import { DirectoryServicesAnalyzer } from './workshop/DirectoryServicesAnalyzer'
import { VendorReadinessScorer } from './workshop/VendorReadinessScorer'
import { ZeroTrustIdentityArchitect } from './workshop/ZeroTrustIdentityArchitect'
import { IdentityProxySimulator } from './workshop/IdentityProxySimulator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'iam-crypto-inventory',
    title: 'Step 1: Crypto Inventory',
    description: 'Audit 8 IAM components by quantum risk level and migration priority.',
    icon: UserCheck,
  },
  {
    id: 'token-migration-lab',
    title: 'Step 2: Token Migration',
    description: 'Migrate SAML/JWT signing to ML-DSA — compare signature sizes and header changes.',
    icon: Key,
  },
  {
    id: 'directory-services',
    title: 'Step 3: Directory Services',
    description: 'Analyze AD, OpenLDAP, and Azure AD quantum vulnerabilities and HNDL risk scores.',
    icon: Database,
  },
  {
    id: 'vendor-readiness',
    title: 'Step 4: Vendor Readiness',
    description: 'Score Okta, Entra, PingFederate, ForgeRock, and more across PQC dimensions.',
    icon: BarChart3,
  },
  {
    id: 'zero-trust-identity',
    title: 'Step 5: Zero Trust',
    description: 'Design a phased PQC migration roadmap for all five identity pillars.',
    icon: Shield,
  },
  {
    id: 'identity-proxy',
    title: 'Step 6: Identity Proxy',
    description: 'Simulate translating PQC SAML assertions to classical RSA for legacy apps.',
    icon: ArrowRightLeft,
  },
]

export const IAMPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Migrate enterprise IAM systems to quantum-safe cryptography: JWT/SAML token signing, Active Directory, LDAP, vendor roadmaps, and zero trust identity architecture."
    learn={(api) => <IAMPQCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <IAMPQCExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <IAMCryptoInventory key={`inventory-${configKey}`} />
        case 1:
          return <TokenMigrationLab key={`token-${configKey}`} />
        case 2:
          return <DirectoryServicesAnalyzer key={`directory-${configKey}`} />
        case 3:
          return <VendorReadinessScorer key={`vendor-${configKey}`} />
        case 4:
          return <ZeroTrustIdentityArchitect key={`zerotrust-${configKey}`} />
        case 5:
          return <IdentityProxySimulator key={`idproxy-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
