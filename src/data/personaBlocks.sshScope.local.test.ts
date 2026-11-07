// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { personaBlocksFor } from './personaBlocks'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

describe('SSH introduction describes the exposed sample results', () => {
  it('distinguishes modeled traces from network observations in the role guidance', () => {
    const roles = personaBlocksFor('/playground/pqc-ssh-sim')!
    expect(roles.developer).toContain('Run comparison')
    expect(roles.architect).toContain('does not measure network round trips')
    expect(roles.researcher).toContain('not captured network traffic or peer-verification results')
  })

  it('promises available counts and logs rather than absent secret/session outputs', () => {
    const tool = WORKSHOP_TOOLS.find((entry) => entry.id === 'pqc-ssh-sim')!
    expect(tool.description).toContain('bundled modified OpenSSH')
    expect(tool.description).toContain('modeled token-operation traces')
    expect(tool.outputSpec).toContain('byte counts')
    expect(tool.outputSpec).toContain('identified separately')
    expect(tool.outputSpec).not.toMatch(/session ID|shared secret|32 bytes hex/)
    expect(tool.id).toBe('pqc-ssh-sim')
  })
})
