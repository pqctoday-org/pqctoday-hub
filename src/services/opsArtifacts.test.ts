// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  certCapacityPlanMarkdown,
  emptyOpsScope,
  hsmCapacityPlanMarkdown,
  NOT_MACHINE_CHECKED,
  opsScopeMarkdown,
  opsScopeSummary,
  protocolConfigMarkdown,
  requirementsFrom,
  VPN_SIM_EXECUTION_NOTES,
  vpnSimRunMarkdown,
} from './opsArtifacts'
import { generateConfig as sshConfig } from '@/components/PKILearning/modules/VPNSSHModule/components/SSHConfigGenerator'

describe('operations scope', () => {
  it('marks empty fields as not stated and summarises the systems line', () => {
    const s = { ...emptyOpsScope(), systems: 'Edge TLS (nginx 1.27)\nVPN gateways' }
    expect(opsScopeMarkdown(s)).toContain('## Environments\n\n_Not stated._')
    expect(opsScopeSummary(s)).toBe('Edge TLS (nginx 1.27)')
  })
})

describe('HSM capacity plan', () => {
  const base = {
    deploymentSize: 'medium',
    redundancy: 'N+1',
    locations: 1,
    targetUtilizationPct: 100,
    migrationHorizon: 'end-state',
    hybridSigningTransition: false,
    codeSigningAlgorithm: 'ml-dsa-65',
    useCases: [
      { label: 'TLS termination', enabled: true, tps: 5000 },
      { label: 'Payments', enabled: false, tps: 20 },
    ],
    profiles: [
      {
        name: 'Classical HSM',
        sourceNote: 'Vendor datasheets',
        rates: [
          { algorithm: 'ML-DSA-65', opsPerSec: 150, userEntered: false },
          { algorithm: 'ECDSA P-256', opsPerSec: 18000, userEntered: true },
        ],
      },
    ],
    scenarios: [
      {
        label: 'Today',
        hsmProfile: 'Classical HSM',
        bottleneck: 'ECDSA P-256',
        hsmsRequired: 2,
        hsmsDeployed: 2,
        sufficient: true,
        fleetUtilizationPct: 46.7,
      },
    ],
    caveats: ['Simplified educational model.'],
  }

  it('labels every rate with its evidence type and flags no headroom', () => {
    const md = hsmCapacityPlanMarkdown(base)
    expect(md).toContain('Claim status: Estimate.')
    expect(md).toContain('| ML-DSA-65 | 150 | Editorial estimate (not a measurement) |')
    expect(md).toContain('| ECDSA P-256 | 18,000 | User-entered |')
    expect(md).toContain('Target utilisation: 100% (no headroom)')
    expect(md).toContain('1 of 2 use cases enabled, 5,000 transactions per second')
    expect(md).toContain('| Today | Classical HSM | ECDSA P-256 | 2 | 2 | Yes | 47% |')
    expect(md).toContain('- Simplified educational model.')
  })

  it('does not flag headroom below 100%', () => {
    expect(hsmCapacityPlanMarkdown({ ...base, targetUtilizationPct: 70 })).toContain(
      'Target utilisation: 70%\n'
    )
  })
})

describe('certificate capacity plan', () => {
  it('states the inputs as user-entered and cites each source', () => {
    const md = certCapacityPlanMarkdown({
      certCount: 1_000_000,
      renewalDays: 90,
      handshakesPerSec: 1000,
      rows: [
        {
          algorithm: 'ML-DSA-65',
          storageMB: 23474.1,
          renewalsPerYear: 4,
          tlsKBPerHandshake: 8.9,
          aggregateMBPerSec: 8.69,
          signOpsPerSecPerCore: 3500,
          cpuCorePercent: 28.6,
          sizeSource: 'FIPS 204',
          perfSource: 'liboqs',
        },
      ],
    })
    expect(md).toContain('## Inputs (user-entered)')
    expect(md).toContain('- Certificates: 1,000,000')
    expect(md).toContain('| ML-DSA-65 | FIPS 204 | liboqs |')
  })
})

describe('protocol configuration', () => {
  it('records requirements, scope and that it was not machine-checked', () => {
    const config = sshConfig({ configType: 'sshd_config', mode: 'hybrid' })
    const md = protocolConfigMarkdown({
      product: 'OpenSSH server (sshd_config)',
      profile: 'Hybrid',
      minimumVersion: requirementsFrom(config),
      doesNotChange: 'Host and user authentication',
      checked: NOT_MACHINE_CHECKED,
      config,
      source: 'PQC SSH Config Generator',
    })
    expect(md).toContain('- Needs: OpenSSH 9.9+ on this server')
    expect(md).toContain(`- How it was checked: ${NOT_MACHINE_CHECKED}`)
    expect(md).toContain('```\n# PQC SSH Server Configuration')
  })

  it('reads every "# Requires" line of a fragment', () => {
    expect(requirementsFrom('# Requires A\nfoo\n  # requires B\n# Other')).toBe('A; B')
  })
})

describe('VPN simulator run', () => {
  it('marks oversize messages and says how the run was produced', () => {
    const md = vpnSimRunMarkdown({
      keyExchange: 'ML-KEM-768 (primary) + ECP-256 (Additional KE 1)',
      initiatorAuth: 'PSK',
      responderAuth: 'PSK',
      mtu: 1280,
      fragmentation: true,
      messages: [
        { label: 'IKE_SA_INIT Request', bytes: 1400 },
        { label: 'IKE_AUTH Request', bytes: 300 },
      ],
      totalBytes: 1700,
      ranAt: Date.parse('2026-10-16T10:00:00Z'),
      executionNotes: VPN_SIM_EXECUTION_NOTES,
    })
    expect(md).toContain('| IKE_SA_INIT Request | 1,400 | Yes |')
    expect(md).toContain('| IKE_AUTH Request | 300 | No |')
    expect(md).toContain('Run saved: 2026-10-16 10:00 UTC')
    expect(md).toContain('not bytes captured on a network')
    for (const n of VPN_SIM_EXECUTION_NOTES) expect(md).toContain(n)
  })
})
