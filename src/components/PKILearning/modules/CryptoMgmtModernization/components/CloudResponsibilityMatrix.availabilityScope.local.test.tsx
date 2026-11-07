// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  buildCloudResponsibilityMatrix,
  renderCloudMatrixMarkdown,
  type CloudMatrixInputs,
} from './CloudResponsibilityMatrix'

const base: CloudMatrixInputs = {
  cloudProviders: ['AWS'],
  serviceModelMix: ['PaaS'],
  regulatoryOverlay: [],
  assetClasses: ['Customer-managed keys'],
  customerKeyControl: 'customer-supplied',
  dataResidency: 'single-region',
  crqcExposureHorizon: '5-15y',
  responsibilityPlan: '',
}
function markdown(inputs: CloudMatrixInputs) {
  return renderCloudMatrixMarkdown({
    cloudPosture: {
      cloudProviders: inputs.cloudProviders,
      serviceModelMix: inputs.serviceModelMix,
      regulatoryOverlay: inputs.regulatoryOverlay,
    },
    cryptoInventory: {
      assetClasses: inputs.assetClasses,
      customerKeyControl: inputs.customerKeyControl,
      dataResidency: inputs.dataResidency,
      crqcExposureHorizon: inputs.crqcExposureHorizon,
    },
    plan: { responsibilityPlan: inputs.responsibilityPlan },
  })
}
describe('provider availability teaching scope', () => {
  it('does not assign a fixed import delay, preserving selected cell and user narrative', () => {
    const inputs = { ...base, responsibilityPlan: 'Illustrative owner assumption: wait 6 months.' }
    const rec = buildCloudResponsibilityMatrix(inputs)
    expect(rec.matrix).toHaveLength(1)
    expect(rec.matrix[0]).toMatchObject({
      assetClass: 'Customer-managed keys',
      serviceModel: 'PaaS',
      owner: 'shared',
    })
    expect(rec.matrix[0].notes).toContain(
      'exact operation, key type, wrapping profile, region and version'
    )
    const view = markdown(inputs)
    expect(view).toContain(
      'verify the exact import operation, key type and wrapping profile for AWS'
    )
    expect(view).toContain(inputs.responsibilityPlan)
    expect(view).not.toMatch(/typically lags algorithm GA|1-2 quarters/)
  })
  it('scopes sovereign-region support to the selected combination instead of a universal delay', () => {
    const inputs = { ...base, regulatoryOverlay: ['EU sovereign cloud'] }
    const view = markdown(inputs)
    expect(view).toContain('selected sovereign-region service and version')
    expect(view).toContain('Do not assume that commercial-region availability establishes support')
    expect(view).not.toContain('12-18 months')
    expect(buildCloudResponsibilityMatrix(inputs).matrix).toHaveLength(1)
  })
})
