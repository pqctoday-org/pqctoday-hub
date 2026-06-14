// SPDX-License-Identifier: GPL-3.0-only
/**
 * simEmbedModules — registry of the Learn modules the Simulation can embed
 * in-place (rendered inside /simulation under the sim header, not navigated to).
 * Mirrors the lazy imports in PKILearningView but keyed by moduleId so the sim
 * can mount a module like the Command Center mounts a tool component.
 *
 * Only the modules referenced by the simulation trees are registered; an
 * unregistered id falls back to plain navigation. Each is a prop-less React.FC.
 */
import type { ComponentType } from 'react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

export const SIM_LEARN_MODULES: Record<string, ComponentType> = {
  'pqc-business-case': lazyWithRetry(() =>
    import('./modules/PQCBusinessCase').then((m) => ({ default: m.PQCBusinessCaseModule }))
  ),
  'data-asset-sensitivity': lazyWithRetry(() =>
    import('./modules/DataAssetSensitivity').then((m) => ({
      default: m.DataAssetSensitivityModule,
    }))
  ),
  'compliance-strategy': lazyWithRetry(() =>
    import('./modules/ComplianceStrategy').then((m) => ({ default: m.ComplianceStrategyModule }))
  ),
  'pqc-risk-management': lazyWithRetry(() =>
    import('./modules/PQCRiskManagement').then((m) => ({ default: m.PQCRiskManagementModule }))
  ),
  'pqc-governance': lazyWithRetry(() =>
    import('./modules/PQCGovernance').then((m) => ({ default: m.PQCGovernanceModule }))
  ),
  'crypto-mgmt-modernization': lazyWithRetry(() =>
    import('./modules/CryptoMgmtModernization').then((m) => ({
      default: m.CryptoMgmtModernizationModule,
    }))
  ),
  'platform-eng-pqc': lazyWithRetry(() =>
    import('./modules/PlatformEngPQC').then((m) => ({ default: m.PlatformEngPQCModule }))
  ),
  'migration-program': lazyWithRetry(() =>
    import('./modules/MigrationProgram').then((m) => ({ default: m.MigrationProgramModule }))
  ),
  'hybrid-crypto': lazyWithRetry(() =>
    import('./modules/HybridCrypto').then((m) => ({ default: m.HybridCryptoModule }))
  ),
  'tls-basics': lazyWithRetry(() =>
    import('./modules/TLSBasics').then((m) => ({ default: m.TLSBasicsModule }))
  ),
  'pki-workshop': lazyWithRetry(() =>
    import('./modules/PKIWorkshop').then((m) => ({ default: m.PKIWorkshop }))
  ),
  'hsm-pqc': lazyWithRetry(() =>
    import('./modules/HsmPqc').then((m) => ({ default: m.HsmPqcModule }))
  ),
  'kms-pqc': lazyWithRetry(() =>
    import('./modules/KmsPqc').then((m) => ({ default: m.KmsPqcModule }))
  ),
  'network-security-pqc': lazyWithRetry(() =>
    import('./modules/NetworkSecurityPQC').then((m) => ({ default: m.NetworkSecurityPQCModule }))
  ),
  'pqc-testing-validation': lazyWithRetry(() =>
    import('./modules/PQCTestingValidation').then((m) => ({
      default: m.PQCTestingValidationModule,
    }))
  ),
  'vendor-risk': lazyWithRetry(() =>
    import('./modules/VendorRisk').then((m) => ({ default: m.VendorRiskModule }))
  ),
}

export const isEmbeddableModule = (id: string): boolean => id in SIM_LEARN_MODULES
