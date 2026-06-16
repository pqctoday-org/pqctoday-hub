// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Search, PenLine, Layers, Lock, BarChart3, Activity } from 'lucide-react'
import { APISecurityIntroduction } from './components/APISecurityIntroduction'
import { APISecurityExercises } from './components/APISecurityExercises'
import { JWTInspector } from './workshop/JWTInspector'
import { PQCJWTSigning } from './workshop/PQCJWTSigning'
import { HybridJWT } from './workshop/HybridJWT'
import { JWEEncryption } from './workshop/JWEEncryption'
import { TokenSizeAnalyzer } from './workshop/TokenSizeAnalyzer'
import { JOSEProtocolMatrixAudit } from './workshop/JOSEProtocolMatrixAudit'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'jwt-inspector',
    title: 'Step 1: JWT Inspector',
    description: 'Decode and inspect JWT structure with algorithm vulnerability analysis.',
    icon: Search,
  },
  {
    id: 'pqc-signing',
    title: 'Step 2: PQC JWT Signing',
    description: 'Sign and verify JWTs with ML-DSA algorithms.',
    icon: PenLine,
  },
  {
    id: 'hybrid-jwt',
    title: 'Step 3: Hybrid JWT',
    description: 'Create backwards-compatible JWTs with dual classical + PQC signatures.',
    icon: Layers,
  },
  {
    id: 'jwe-encryption',
    title: 'Step 4: JWE Encryption',
    description: 'Encrypt JWTs using ML-KEM key agreement.',
    icon: Lock,
  },
  {
    id: 'size-analyzer',
    title: 'Step 5: Token Size Analyzer',
    description: 'Compare JWT sizes across signing algorithms interactively.',
    icon: BarChart3,
  },
  {
    id: 'matrix-audit',
    title: 'Step 6: Matrix Audit',
    description: 'Audit the JOSE row of the PQC Protocol Matrix and propose a patch.',
    icon: Activity,
  },
]

export const APISecurityJWTModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="API Security & JWT with PQC"
    description="JWT/JWS/JWE with post-quantum algorithms — ML-DSA signing, ML-KEM key agreement, and OAuth 2.0 migration."
    learn={(api) => <APISecurityIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <APISecurityExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <JWTInspector key={`jwt-inspector-${configKey}`} />
        case 1:
          return <PQCJWTSigning key={`pqc-signing-${configKey}`} />
        case 2:
          return <HybridJWT key={`hybrid-jwt-${configKey}`} />
        case 3:
          return <JWEEncryption key={`jwe-encryption-${configKey}`} />
        case 4:
          return <TokenSizeAnalyzer key={`size-analyzer-${configKey}`} />
        case 5:
          return <JOSEProtocolMatrixAudit key={`matrix-audit-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
