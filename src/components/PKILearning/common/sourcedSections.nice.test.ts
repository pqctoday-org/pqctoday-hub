// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SourcedSectionData } from './SourcedSection'
import { getStandard } from '@/data/standardsRegistry'
import { MANIFEST_BY_ID } from '../manifest/registry'
import { LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import { TAILORING_CODE_ANALYSIS_SECTION } from '../modules/CryptoDevAPIs/data/tailoringCodeAnalysisSection'
import { STATIC_CODE_ANALYSIS_SECTION } from '../modules/CryptoDevAPIs/data/staticCodeAnalysisSection'
import { DYNAMIC_ANALYSIS_SECTION } from '../modules/CryptoDevAPIs/data/dynamicAnalysisSection'
import { OPEN_SOURCE_SECURITY_SECTION } from '../modules/CryptoDevAPIs/data/openSourceSecuritySection'
import { CONTINGENCY_RECOVERY_SECTION } from '../modules/NetworkSecurityPQC/data/contingencyRecoverySection'
import { KEY_ESCROW_SECTION } from '../modules/KmsPqc/data/keyEscrowSection'
import { PROTOCOL_DESIGN_SECTION } from '../modules/HybridCrypto/data/protocolDesignSection'
import { CIA_PRINCIPLES_SECTION } from '../modules/DataAssetSensitivity/data/ciaPrinciplesSection'
import { SYSTEMS_ENGINEERING_SECTION } from '../modules/CryptoAgility/data/systemsEngineeringSection'
import { SYSTEM_INTEGRATION_SECTION } from '../modules/PQCTestingValidation/data/systemIntegrationSection'
import { STATIC_DISCOVERY_SECTION } from '../modules/PQCTestingValidation/data/staticDiscoverySection'
import { SYSTEM_LIFE_CYCLES_SECTION } from '../modules/AutomotivePQC/data/systemLifeCyclesSection'
import { TERMINATION_POINT_SECTION } from '../modules/WebGatewayPQC/data/terminationPointSection'
import { AIR_GAPPED_VAULT_SECTION } from '../modules/DigitalAssets/data/airGappedVaultSection'
import { COMSEC_POLICY_SECTION } from '../modules/GovernmentDefensePQC/data/comsecPolicySection'
import { SYSTEM_DESIGN_STANDARDS_SECTION } from '../modules/ArchQuantumImpact/data/systemDesignStandardsSection'
import { MIDDLEWARE_PROVIDERS_SECTION } from '../modules/CryptoDevAPIs/data/middlewareProvidersSection'
import { SYSTEMS_ENGINEERING_PRACTICE_SECTION } from '../modules/CryptoMgmtModernization/data/systemsEngineeringPracticeSection'
import { CYBER_RESILIENCY_SECTION } from '../modules/DataAssetSensitivity/data/cyberResiliencySection'
import { INTEGRATION_DELIVERY_SECTION } from '../modules/PlatformEngPQC/data/integrationDeliverySection'
import { COLLABORATION_SECTION } from '../modules/MigrationProgram/data/collaborationSection'
import { ADVERSARY_REPORTING_SECTION } from '../modules/SocImplementationPqc/data/adversaryReportingSection'
import { VPN_ADMINISTRATION_SECTION } from '../modules/OpsQuantumImpact/data/vpnAdministrationSection'
import { HARDWARE_MAINTENANCE_SECTION } from '../modules/HsmPqc/data/hardwareMaintenanceSection'
import { THREAT_ENVIRONMENT_SECTION } from '../modules/PQCRiskManagement/data/threatEnvironmentSection'

/**
 * The sourced sections that answer a NICE Framework knowledge, skill or task statement.
 *
 * Each section records the statement it answers (`nice`); the statement id and its
 * wording must be the official NICE Framework Components v2.2.0 ones. Every sentence
 * must cite a Library document that exists (it links to its Library entry), and the
 * section must be a learn section of its host module.
 */
const SECTIONS: { moduleId: string; section: SourcedSectionData }[] = [
  { moduleId: 'crypto-dev-apis', section: TAILORING_CODE_ANALYSIS_SECTION },
  { moduleId: 'crypto-dev-apis', section: STATIC_CODE_ANALYSIS_SECTION },
  { moduleId: 'crypto-dev-apis', section: DYNAMIC_ANALYSIS_SECTION },
  { moduleId: 'crypto-dev-apis', section: OPEN_SOURCE_SECURITY_SECTION },
  { moduleId: 'network-security-pqc', section: CONTINGENCY_RECOVERY_SECTION },
  { moduleId: 'kms-pqc', section: KEY_ESCROW_SECTION },
  { moduleId: 'hybrid-crypto', section: PROTOCOL_DESIGN_SECTION },
  { moduleId: 'data-asset-sensitivity', section: CIA_PRINCIPLES_SECTION },
  { moduleId: 'crypto-agility', section: SYSTEMS_ENGINEERING_SECTION },
  { moduleId: 'pqc-testing-validation', section: SYSTEM_INTEGRATION_SECTION },
  { moduleId: 'pqc-testing-validation', section: STATIC_DISCOVERY_SECTION },
  { moduleId: 'automotive-pqc', section: SYSTEM_LIFE_CYCLES_SECTION },
  { moduleId: 'web-gateway-pqc', section: TERMINATION_POINT_SECTION },
  { moduleId: 'digital-assets', section: AIR_GAPPED_VAULT_SECTION },
  { moduleId: 'government-defense-pqc', section: COMSEC_POLICY_SECTION },
  { moduleId: 'arch-quantum-impact', section: SYSTEM_DESIGN_STANDARDS_SECTION },
  { moduleId: 'crypto-dev-apis', section: MIDDLEWARE_PROVIDERS_SECTION },
  { moduleId: 'crypto-mgmt-modernization', section: SYSTEMS_ENGINEERING_PRACTICE_SECTION },
  { moduleId: 'data-asset-sensitivity', section: CYBER_RESILIENCY_SECTION },
  { moduleId: 'platform-eng-pqc', section: INTEGRATION_DELIVERY_SECTION },
  { moduleId: 'migration-program', section: COLLABORATION_SECTION },
  { moduleId: 'soc-implementation-pqc', section: ADVERSARY_REPORTING_SECTION },
  { moduleId: 'ops-quantum-impact', section: VPN_ADMINISTRATION_SECTION },
  { moduleId: 'hsm-pqc', section: HARDWARE_MAINTENANCE_SECTION },
  { moduleId: 'pqc-risk-management', section: THREAT_ENVIRONMENT_SECTION },
]

interface CprtElement {
  element_type: string
  element_identifier: string
  text: string
}
const official = new Map<string, CprtElement>(
  (
    JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      readFileSync(
        resolve(process.cwd(), 'pqc-references', 'NICE-Framework-Components-v2.2.0.json'),
        'utf-8'
      )
    ) as { elements: CprtElement[] }
  ).elements.map((e) => [e.element_identifier, e])
)

describe('NICE-gap sourced sections', () => {
  it.each(SECTIONS.map((s) => [s.section.id, s] as const))(
    '%s records a real NICE v2.2.0 knowledge, skill or task statement, word for word',
    (_id, { section }) => {
      expect(section.nice?.length ?? 0).toBeGreaterThan(0)
      for (const n of section.nice ?? []) {
        const el = official.get(n.id)
        expect(el, `${n.id} is not in the vendored NICE Framework Components`).toBeDefined()
        expect(['knowledge', 'skill', 'task']).toContain(el?.element_type)
        expect(n.statement).toBe(el?.text)
      }
    }
  )

  it.each(SECTIONS.map((s) => [s.section.id, s] as const))(
    '%s: its statements are listed as taught by the host lesson, and not as merely mentioned',
    (_id, { moduleId, section }) => {
      // eslint-disable-next-line security/detect-object-injection
      const lesson = LEARN_MODULE_BY_ID[moduleId]
      for (const n of section.nice ?? []) {
        expect(lesson.niceStatementsTaught).toContain(n.id)
        expect(lesson.niceStatementsMentioned).not.toContain(n.id)
      }
    }
  )

  it('each NICE statement is answered by one section only', () => {
    const ids = SECTIONS.flatMap((s) => (s.section.nice ?? []).map((n) => n.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(SECTIONS.map((s) => [s.section.id, s] as const))(
    '%s is a learn section of its host module',
    (_id, { moduleId, section }) => {
      // eslint-disable-next-line security/detect-object-injection
      const ids = (MANIFEST_BY_ID[moduleId]?.learnSections ?? []).map((l) => l.id)
      expect(ids).toContain(section.id)
    }
  )

  it.each(SECTIONS.map((s) => [s.section.id, s] as const))(
    '%s: every sentence cites a Library document, with its edition and place',
    (_id, { section }) => {
      const seen = new Set<string>()
      for (const block of section.blocks) {
        for (const sentence of block.sentences) {
          expect(seen.has(sentence.id), `duplicate sentence id ${sentence.id}`).toBe(false)
          seen.add(sentence.id)
          expect(getStandard(sentence.sourceId).id).toBe(sentence.sourceId)
          expect(sentence.locator.trim().length).toBeGreaterThan(0)
          expect(sentence.edition.trim().length).toBeGreaterThan(0)
        }
      }
    }
  )
})
