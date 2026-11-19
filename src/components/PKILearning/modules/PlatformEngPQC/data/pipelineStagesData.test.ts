// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PIPELINE_STAGES } from './pipelineStagesData'

describe('SSH deploy-key migration evidence', () => {
  it('distinguishes the OpenSSH hybrid signature from the current SSH draft and pure ML-DSA', () => {
    const deployKey = PIPELINE_STAGES.flatMap((stage) => stage.cryptoAssets).find(
      (asset) => asset.id === 'src-deploy-key'
    )!

    expect(deployKey.pqcReplacement).toContain('OpenSSH 10.6')
    expect(deployKey.pqcReplacement).toContain('ssh-mldsa44-ed25519')
    expect(deployKey.notes).toContain(
      '10.4 introduced composite ML-DSA-44+Ed25519 signatures experimentally and off by default'
    )
    expect(deployKey.notes).toContain('10.6p2 permits it as a CA signature algorithm')
    expect(deployKey.notes).toContain('not a pure ML-DSA SSH key')
    expect(deployKey.notes).toContain('draft-ietf-sshm-composite-sigs-01')
    expect(deployKey.notes).toContain(
      'https://datatracker.ietf.org/doc/html/draft-ietf-sshm-composite-sigs-01'
    )
  })
})
