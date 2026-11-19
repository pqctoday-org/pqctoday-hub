// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Cut-over guard — every legacy moduleData/moduleEnrichment map is rebuilt from
 * the manifest collection, byte-for-byte, checked against a FROZEN golden
 * snapshot of the original hand-written maps. This survives the cut-over that
 * replaces those literals with these builders (the live maps then ARE the
 * builders, so comparing to the frozen golden is what keeps the guard honest).
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from './registry'
import {
  buildCatalog,
  buildStepCounts,
  buildLearnSections,
  buildWorkshopSteps,
  buildModuleTracks,
  buildPlaygroundTools,
  buildTaxonomy,
} from './derive'
import golden from './__golden__/legacyMaps.golden.json'

const historicalCryptoMgmtDescription =
  'Build a modern cryptographic posture management program across certificates, libraries, software, and keys — iterative and ROI-positive even if quantum never arrives.'
const reviewedCryptoMgmtDescription =
  'Build a modern cryptographic posture management program across certificates, libraries, software, and keys — iterative, with a business case tested against explicit costs, benefits and uncertainty.'

const historicalSecretsDescription =
  'Master PQC migration for secrets managers: classify secrets by HNDL risk, simulate a proposed Vault transit design with ML-KEM (Vault documents no ML-KEM transit key type), design rotation policies, and integrate PQC-safe secrets into Kubernetes and CI/CD pipelines.'
const reviewedSecretsDescription =
  'Evaluate PQC migration for secrets managers: classify exposure, compare Vault transit operations with an executable application-side ML-KEM envelope, design rotation policies, and assess Kubernetes and CI/CD integration capabilities.'

const historicalPqcRiskMgmtDescription =
  'Quantify quantum risk, build risk registers, model CRQC timeline scenarios, and generate risk heatmaps from real threat data.'
const reviewedPqcRiskMgmtDescription =
  'Compare quantum-risk planning scenarios, record asset assumptions, and rank editable likelihood-by-impact worksheets.'

const historicalQuantumThreatsDescription =
  "Understand how Shor's and Grover's algorithms break cryptography, CRQC timelines, and HNDL/HNFL attack mechanics."
const reviewedQuantumThreatsDescription =
  "Understand how Shor's algorithm threatens factoring and discrete-log cryptography, how quantum search affects symmetric-key margins, and how HNDL/HNFL risks are modeled."

const historicalSbomDescription =
  'Inventory every software component a product depends on — supplier, version, dependency graph — the discovery input that feeds a CBOM and closes the vulnerability-triage loop with VEX.'
const reviewedSbomDescription =
  'Inventory software components within a stated scope, with versions, supplier or producer details, and dependency relationships — one input for vulnerability triage and broader crypto-asset discovery.'

// The cut-over predates the two optional PKI reference labs and the two published
// hybrid RFCs. Keep the historic maps intact, with exact expectations for those additions.
const pkiReferenceLabs = [
  { id: 'acme', label: 'ACME + PQC', optional: true },
  { id: 'capacity', label: 'Cert Capacity', optional: true },
]

describe('cut-over: manifests rebuild every legacy map (vs frozen golden)', () => {
  it('MODULE_CATALOG', () => {
    // Retain the historical snapshot; only reviewed module descriptions change.
    // Other fields remain guarded exactly.
    const original = golden.MODULE_CATALOG['crypto-mgmt-modernization']
    expect(original.description).toBe(historicalCryptoMgmtDescription)
    const secrets = golden.MODULE_CATALOG['secrets-management-pqc']
    expect(secrets.description).toBe(historicalSecretsDescription)
    const riskMgmt = golden.MODULE_CATALOG['pqc-risk-management']
    expect(riskMgmt.description).toBe(historicalPqcRiskMgmtDescription)
    const quantumThreats = golden.MODULE_CATALOG['quantum-threats']
    expect(quantumThreats.description).toBe(historicalQuantumThreatsDescription)
    const sbom = golden.MODULE_CATALOG['sbom']
    expect(sbom.description).toBe(historicalSbomDescription)
    expect(buildCatalog(MANIFESTS)).toEqual({
      ...golden.MODULE_CATALOG,
      'secrets-management-pqc': { ...secrets, description: reviewedSecretsDescription },
      'crypto-mgmt-modernization': { ...original, description: reviewedCryptoMgmtDescription },
      'pqc-risk-management': { ...riskMgmt, description: reviewedPqcRiskMgmtDescription },
      'quantum-threats': { ...quantumThreats, description: reviewedQuantumThreatsDescription },
      sbom: { ...sbom, description: reviewedSbomDescription },
    })
  })
  it('MODULE_STEP_COUNTS', () =>
    expect(buildStepCounts(MANIFESTS)).toEqual({
      ...golden.MODULE_STEP_COUNTS,
      'pki-workshop': golden.MODULE_STEP_COUNTS['pki-workshop'] + pkiReferenceLabs.length,
    }))
  it('LEARN_SECTIONS', () => {
    const cbom = golden.LEARN_SECTIONS['cbom']
    const cbomDiscoveryIdx = cbom.findIndex((s) => s.id === 'cbom-discovery')
    expect(cbomDiscoveryIdx).toBeGreaterThanOrEqual(0)
    const pkiEnrollment = golden.LEARN_SECTIONS['pki-enrollment-protocols']
    expect(pkiEnrollment.find((s) => s.id === 'pqc-enrollment')?.label).toBe(
      'PQC Enrollment Drafts'
    )
    expect(buildLearnSections(MANIFESTS)).toEqual({
      ...golden.LEARN_SECTIONS,
      cbom: [
        ...cbom.slice(0, cbomDiscoveryIdx + 1),
        { id: 'cbom-estate', label: 'Estate Fields' },
        ...cbom.slice(cbomDiscoveryIdx + 1),
      ],
      'pki-enrollment-protocols': pkiEnrollment.map((s) =>
        s.id === 'pqc-enrollment' ? { ...s, label: 'PQC Enrollment Standards' } : s
      ),
    })
  })
  it('WORKSHOP_STEPS', () => {
    // Keep the historical cut-over snapshot intact. These two reviewed labels
    // now describe the operations actually demonstrated; IDs/order stay fixed.
    const enrollment = golden.WORKSHOP_STEPS['pki-enrollment-protocols']
    expect(enrollment.find((step) => step.id === 'cmp-kur')?.label).toBe(
      'CMP Key Update with ML-KEM'
    )
    expect(enrollment.find((step) => step.id === 'composite')?.label).toBe(
      'Composite Enrollment (draft)'
    )
    const expected = {
      ...golden.WORKSHOP_STEPS,
      'pki-workshop': [...golden.WORKSHOP_STEPS['pki-workshop'], ...pkiReferenceLabs],
      'pki-enrollment-protocols': enrollment.map((step) => {
        if (step.id === 'cmp-kur') return { ...step, label: 'ML-KEM certificate key update' }
        if (step.id === 'composite') return { ...step, label: 'Parallel certificate issuance' }
        return step
      }),
    }
    expect(buildWorkshopSteps(MANIFESTS)).toEqual(expected)
  })
  it('MODULE_TRACKS', () => {
    const expected = golden.MODULE_TRACKS.map((track) => ({
      ...track,
      modules: track.modules.map((module) => {
        if (module.id === 'secrets-management-pqc') {
          expect(module.description).toBe(historicalSecretsDescription)
          return { ...module, description: reviewedSecretsDescription }
        }
        if (module.id === 'pqc-risk-management') {
          expect(module.description).toBe(historicalPqcRiskMgmtDescription)
          return { ...module, description: reviewedPqcRiskMgmtDescription }
        }
        if (module.id === 'quantum-threats') {
          expect(module.description).toBe(historicalQuantumThreatsDescription)
          return { ...module, description: reviewedQuantumThreatsDescription }
        }
        if (module.id === 'sbom') {
          expect(module.description).toBe(historicalSbomDescription)
          return { ...module, description: reviewedSbomDescription }
        }
        if (module.id !== 'crypto-mgmt-modernization') return module
        expect(module.description).toBe(historicalCryptoMgmtDescription)
        return { ...module, description: reviewedCryptoMgmtDescription }
      }),
    }))
    expect(buildModuleTracks(MANIFESTS)).toEqual(expected)
  })
  it('MODULE_PLAYGROUND_TOOL', () =>
    expect(buildPlaygroundTools(MANIFESTS)).toEqual(golden.MODULE_PLAYGROUND_TOOL))
  it('MODULE_TAXONOMY', () => {
    const hybrid = golden.MODULE_TAXONOMY['hybrid-crypto']
    const cryptoRegistry = golden.MODULE_TAXONOMY['crypto-registry']
    const migrationProgram = golden.MODULE_TAXONOMY['migration-program']
    const platformEng = golden.MODULE_TAXONOMY['platform-eng-pqc']
    const socImpl = golden.MODULE_TAXONOMY['soc-implementation-pqc']
    expect(buildTaxonomy(MANIFESTS)).toEqual({
      ...golden.MODULE_TAXONOMY,
      'hybrid-crypto': {
        ...hybrid,
        standards: [hybrid.standards[0], 'RFC 10073', 'RFC 10024', ...hybrid.standards.slice(1)],
      },
      'crypto-registry': {
        ...cryptoRegistry,
        standards: [...cryptoRegistry.standards, 'CycloneDX / ECMA-424'],
      },
      'migration-program': {
        ...migrationProgram,
        standards: [
          ...migrationProgram.standards.slice(0, 2),
          'OMB M-26-15',
          ...migrationProgram.standards.slice(2),
        ],
      },
      'platform-eng-pqc': {
        ...platformEng,
        standards: [
          ...platformEng.standards.slice(0, 2),
          'RFC 9980',
          'RFC 10073',
          ...platformEng.standards.slice(2),
        ],
      },
      'soc-implementation-pqc': {
        ...socImpl,
        standards: [socImpl.standards[0], 'RFC 10024', ...socImpl.standards.slice(1)],
      },
    })
  })
})
