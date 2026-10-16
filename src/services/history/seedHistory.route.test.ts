// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { artifactHistoryRoute } from './seedHistory'

describe('artifactHistoryRoute', () => {
  it('opens the operations pack for its own artifact types', () => {
    expect(artifactHistoryRoute({ type: 'hsm-capacity-plan', moduleId: 'hsm-capacity' })).toBe(
      '/business#operations-pack'
    )
    expect(
      artifactHistoryRoute({
        type: 'protocol-config',
        moduleId: 'vpn-ssh-pqc:ssh-config:sshd_config:hybrid',
      })
    ).toBe('/business#operations-pack')
  })

  it('opens the architecture pack for its scope, decisions and test plan', () => {
    expect(
      artifactHistoryRoute({ type: 'architecture-scope', moduleId: 'architecture-pack' })
    ).toBe('/business#architecture-pack')
    expect(
      artifactHistoryRoute({
        type: 'architecture-decision-record',
        moduleId: 'architecture-pack:adr:123',
      })
    ).toBe('/business#architecture-pack')
  })

  it('opens the KMIP Migration tab for a quick run', () => {
    expect(artifactHistoryRoute({ type: 'kmip-quick-run', moduleId: 'kmip-playground' })).toBe(
      '/playground/cacp?tab=migration'
    )
  })

  it('keeps the Learn workshop route for module artifacts', () => {
    expect(
      artifactHistoryRoute({ type: 'deployment-playbook', moduleId: 'migration-program' })
    ).toBe('/learn/migration-program?tab=workshop')
  })
})
