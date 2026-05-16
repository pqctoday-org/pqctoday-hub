// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CloudResponsibilityMatrix,
  buildCloudResponsibilityMatrix,
  renderCloudMatrixMarkdown,
  type CloudMatrixInputs,
} from './CloudResponsibilityMatrix'

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: { addExecutiveDocument: () => void }) => unknown) =>
    selector({ addExecutiveDocument: () => undefined }),
}))

const baseInputs: CloudMatrixInputs = {
  cloudProviders: ['AWS'],
  serviceModelMix: ['IaaS', 'PaaS'],
  regulatoryOverlay: [],
  assetClasses: ['TLS termination', 'KMS-backed keys'],
  customerKeyControl: 'customer-managed',
  dataResidency: 'single-region',
  crqcExposureHorizon: '5-15y',
  responsibilityPlan: '',
}

describe('CloudResponsibilityMatrix - component', () => {
  it('renders without crashing', () => {
    expect(() => render(<CloudResponsibilityMatrix />)).not.toThrow()
  })

  it('renders the CSWP-39 Section 6.4 banner heading', () => {
    render(<CloudResponsibilityMatrix />)
    expect(screen.getByText(/Cloud Shared-Responsibility Crypto Matrix/i)).toBeTruthy()
    expect(screen.getAllByText(/Section 6\.4/i).length).toBeGreaterThan(0)
  })
})

describe('buildCloudResponsibilityMatrix - matrix shape', () => {
  it('returns one cell per (assetClass x serviceModel) pair when applicable', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['TLS termination'],
      serviceModelMix: ['IaaS', 'PaaS', 'SaaS', 'FaaS'],
    })
    // TLS termination has cells for all four service models
    expect(rec.matrix).toHaveLength(4)
    expect(rec.matrix.map((c) => c.serviceModel).sort()).toEqual(['FaaS', 'IaaS', 'PaaS', 'SaaS'])
  })

  it('skips not-applicable cells (managed database on FaaS)', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['Managed database'],
      serviceModelMix: ['IaaS', 'PaaS', 'SaaS', 'FaaS'],
    })
    // Managed database under FaaS is n/a, so only 3 cells should exist
    expect(rec.matrix).toHaveLength(3)
    expect(rec.matrix.find((c) => c.serviceModel === 'FaaS')).toBeUndefined()
  })

  it('container-as-a-service collapses into FaaS for matrix population', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['FaaS function payloads'],
      serviceModelMix: ['container-as-a-service'],
    })
    expect(rec.matrix).toHaveLength(1)
    expect(rec.matrix[0].serviceModel).toBe('FaaS')
  })

  it('returns an empty matrix when no service models picked', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      serviceModelMix: [],
    })
    expect(rec.matrix).toHaveLength(0)
  })
})

describe('buildCloudResponsibilityMatrix - cell content assertions', () => {
  it('TLS termination on IaaS = customer-owned with explicit Envoy / Nginx guidance', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['TLS termination'],
      serviceModelMix: ['IaaS'],
    })
    const cell = rec.matrix[0]
    expect(cell.owner).toBe('customer')
    expect(cell.customerActions.join(' ')).toMatch(/Envoy|Nginx|load balancer/i)
  })

  it('TLS termination on PaaS = shared (provider terminates, customer picks policy)', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['TLS termination'],
      serviceModelMix: ['PaaS'],
    })
    const cell = rec.matrix[0]
    expect(cell.owner).toBe('shared')
    expect(cell.providerActions.join(' ')).toMatch(/terminates TLS/i)
  })

  it('TLS termination on SaaS = provider-owned, customer is audit-only', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['TLS termination'],
      serviceModelMix: ['SaaS'],
    })
    const cell = rec.matrix[0]
    expect(cell.owner).toBe('provider')
    expect(cell.customerActions.join(' ')).toMatch(/Audit-only/i)
  })

  it('KMS-backed keys on IaaS = customer-owned (custody choice)', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['KMS-backed keys'],
      serviceModelMix: ['IaaS'],
    })
    const cell = rec.matrix[0]
    expect(cell.owner).toBe('customer')
    expect(cell.customerActions.join(' ')).toMatch(/CloudHSM|KMS/i)
  })

  it('Code-signing in CI on SaaS = customer-owned despite SaaS runners', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['Code-signing in CI'],
      serviceModelMix: ['SaaS'],
    })
    const cell = rec.matrix[0]
    expect(cell.owner).toBe('customer')
    expect(cell.notes).toMatch(/signing-key custody/i)
  })

  it('FaaS function payloads cell has shared ownership and signing guidance', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['FaaS function payloads'],
      serviceModelMix: ['FaaS'],
    })
    const cell = rec.matrix[0]
    expect(cell.owner).toBe('shared')
    expect(cell.customerActions.join(' ')).toMatch(/Sign the function payload/i)
  })
})

describe('buildCloudResponsibilityMatrix - PQC availability lookup', () => {
  it('AWS for TLS asset class returns "roadmap" (TLS preview)', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      cloudProviders: ['AWS'],
      assetClasses: ['TLS termination'],
      serviceModelMix: ['IaaS'],
    })
    expect(rec.matrix[0].pqcAvailability).toBe('roadmap')
  })

  it('AWS for KMS asset class returns "partial" (KMS rolling out)', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      cloudProviders: ['AWS'],
      assetClasses: ['KMS-backed keys'],
      serviceModelMix: ['IaaS'],
    })
    expect(rec.matrix[0].pqcAvailability).toBe('partial')
  })

  it('Multi-provider takes the worst-case availability (AWS + Oracle => no-public-plan)', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      cloudProviders: ['AWS', 'Oracle'],
      assetClasses: ['KMS-backed keys'],
      serviceModelMix: ['IaaS'],
    })
    expect(rec.matrix[0].pqcAvailability).toBe('no-public-plan')
  })
})

describe('buildCloudResponsibilityMatrix - watch-outs', () => {
  it('multi-cloud (>=2 providers) emits the AWS/GCP timing-skew warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      cloudProviders: ['AWS', 'GCP'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/Multi-cloud/i)
    expect(rec.watchOuts.join(' ')).toMatch(/AWS|GCP/)
  })

  it('explicit multi-cloud token also triggers the multi-cloud warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      cloudProviders: ['multi-cloud'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/Multi-cloud/i)
  })

  it('BYOK + provider lacking PQC wrap emits a wrapping-algorithm warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      customerKeyControl: 'customer-supplied',
    })
    expect(rec.watchOuts.join(' ')).toMatch(/BYOK|HYOK/)
    expect(rec.watchOuts.join(' ')).toMatch(/wrapping algorithm/i)
  })

  it('FedRAMP High emits the FIPS 140-3 re-validation warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      regulatoryOverlay: ['FedRAMP High'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/FIPS 140-3/)
    expect(rec.watchOuts.join(' ')).toMatch(/6-12 months/)
  })

  it('IL5/IL6 also triggers the FedRAMP re-validation warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      regulatoryOverlay: ['IL5/IL6'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/FIPS 140-3/)
  })

  it('CRQC >15y + SaaS-only emits the contractual-SLA warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      crqcExposureHorizon: '>15y',
      serviceModelMix: ['SaaS'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/contractual PQC deadline/i)
  })

  it('EU sovereign + non-EU provider emits the 12-18 month delay warning', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      regulatoryOverlay: ['EU sovereign cloud'],
      cloudProviders: ['AWS'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/sovereign-cloud/i)
    expect(rec.watchOuts.join(' ')).toMatch(/12-18 months/)
  })

  it('multi-cloud + FedRAMP + BYOK triggers all three warnings simultaneously', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      cloudProviders: ['AWS', 'Azure'],
      regulatoryOverlay: ['FedRAMP High'],
      customerKeyControl: 'customer-supplied',
    })
    const joined = rec.watchOuts.join('\n')
    expect(joined).toMatch(/Multi-cloud/i)
    expect(joined).toMatch(/FIPS 140-3/)
    expect(joined).toMatch(/BYOK|HYOK/)
  })

  it('always emits the CSWP-39 Section 6.4 cloud-hardware reminder', () => {
    const rec = buildCloudResponsibilityMatrix(baseInputs)
    expect(rec.watchOuts.join(' ')).toMatch(/Section 6\.4/)
    expect(rec.watchOuts.join(' ')).toMatch(/cryptographic hardware/i)
  })
})

describe('buildCloudResponsibilityMatrix - recommendations', () => {
  it('always emits the cell-by-cell inventory recommendation', () => {
    const rec = buildCloudResponsibilityMatrix(baseInputs)
    expect(rec.recommendations.join(' ')).toMatch(/per-cell/i)
  })

  it('provider-managed keys + active CRQC exposure recommends moving to CMK', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      customerKeyControl: 'provider-managed',
      crqcExposureHorizon: '5-15y',
    })
    expect(rec.recommendations.join(' ')).toMatch(/customer-managed/i)
    expect(rec.recommendations.join(' ')).toMatch(/CMK/)
  })

  it('TLS in scope recommends hybrid X25519MLKEM768 on customer endpoints', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['TLS termination'],
    })
    expect(rec.recommendations.join(' ')).toMatch(/X25519MLKEM768/)
  })

  it('code-signing in scope recommends ML-DSA-65 or SLH-DSA-128s ahead of cloud KMS', () => {
    const rec = buildCloudResponsibilityMatrix({
      ...baseInputs,
      assetClasses: ['Code-signing in CI'],
    })
    expect(rec.recommendations.join(' ')).toMatch(/ML-DSA-65|SLH-DSA-128s/)
  })
})

/* renderCloudMatrixMarkdown is a pure markdown-string helper, not a React testing-library
 * render. Disable the plugin's render-result-naming convention for this block.
 */
/* eslint-disable testing-library/render-result-naming-convention */
describe('renderCloudMatrixMarkdown - export', () => {
  const data = {
    cloudPosture: {
      cloudProviders: ['AWS', 'Azure'],
      serviceModelMix: ['IaaS', 'PaaS'],
      regulatoryOverlay: ['FedRAMP High'],
    },
    cryptoInventory: {
      assetClasses: ['TLS termination', 'KMS-backed keys'],
      customerKeyControl: 'customer-supplied',
      dataResidency: 'single-region',
      crqcExposureHorizon: '5-15y',
    },
    plan: {
      responsibilityPlan: 'We plan to ship ML-DSA-65 code signing by 2026-Q3.',
    },
  }

  it('contains the CSWP-39 Section 6.4 citation', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/Section 6\.4/)
    expect(markdown).toMatch(/Crypto Agility in the Cloud/)
  })

  it('contains the Section 5.3 supply-chain citation', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/Section 5\.3/)
    expect(markdown).toMatch(/Technology Supply Chains/i)
  })

  it('contains the DOI link to CSWP.39', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/doi\.org\/10\.6028\/NIST\.CSWP\.39/)
  })

  it('contains a verbatim CSWP-39 Section 6.4 quote', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/shared responsibility model/)
    expect(markdown).toMatch(/clearly divides security duties/)
  })

  it('emits ASCII-only output (no em-dashes, smart quotes, arrows, section symbol)', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).not.toMatch(/[—–‘’“”→§]/)
  })

  it('emits a shared-responsibility matrix table with all 7 columns', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(
      /\| Asset class \| Service model \| Owner \| Customer actions \| Provider actions \| PQC availability \| Notes \|/
    )
  })

  it('matrix has at least one row per (assetClass x serviceModel) pair selected', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    // 2 asset classes x 2 service models = 4 rows
    const section = markdown
      .split('## 3. Shared-Responsibility Matrix')[1]
      .split('## 4. Watch-outs')[0]
    const dataRows = (section.match(/^\| [^|\n]+ \| (IaaS|PaaS|SaaS|FaaS) \|/gm) || []).length
    expect(dataRows).toBeGreaterThanOrEqual(4)
  })

  it('emits a Watch-outs section that triggers on FedRAMP + BYOK simultaneously', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/## 4\. Watch-outs/)
    expect(markdown).toMatch(/FIPS 140-3/)
    expect(markdown).toMatch(/BYOK|HYOK/)
  })

  it('emits a Recommendations section', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/## 5\. Recommendations/)
  })

  it('carries the editable narrative into the export', () => {
    const markdown = renderCloudMatrixMarkdown(data)
    expect(markdown).toMatch(/ML-DSA-65 code signing by 2026-Q3/)
  })

  it('falls back to safe defaults when given empty data', () => {
    const markdown = renderCloudMatrixMarkdown({})
    expect(markdown).toMatch(/# Cloud Shared-Responsibility Crypto Matrix/)
    expect(markdown).toMatch(/Section 6\.4/)
  })
})
/* eslint-enable testing-library/render-result-naming-convention */
