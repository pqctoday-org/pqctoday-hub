// SPDX-License-Identifier: GPL-3.0-only
/**
 * Route-derivation conformance (A1 single-source completion).
 *
 * PKILearningView's learn routes are derived from the manifests (every module's
 * `load` + `id`), replacing a ~270-line hand-maintained parallel list of lazy
 * imports + <Route> entries. This frozen golden is the exact set of route paths
 * the router served BEFORE derivation (captured 2026-06-16): 60 module ids + the
 * `mls` alias + the `common-ground` journey path. The derived set must reproduce
 * it byte-for-byte, so adding/removing/renaming a manifest is a deliberate,
 * reviewed change — never a silent route gain or gap.
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from './registry'

// Aliases + non-module paths PKILearningView adds on top of the derived modules.
const ROUTE_ALIASES = ['mls']
const SPECIAL_PATHS = ['common-ground']

const GOLDEN_ROUTE_PATHS = [
  '5g-security',
  'aerospace-pqc',
  'ai-security-pqc',
  'api-security-jwt',
  'arch-quantum-impact',
  'automotive-pqc',
  'code-signing',
  'common-ground',
  'compliance-strategy',
  'confidential-computing',
  'crypto-agility',
  'crypto-dev-apis',
  'crypto-mgmt-modernization',
  'data-asset-sensitivity',
  'database-encryption-pqc',
  'dev-quantum-impact',
  'digital-assets',
  'digital-id',
  'email-signing',
  'emv-payment-pqc',
  'energy-utilities-pqc',
  'entropy-randomness',
  'exec-quantum-impact',
  'healthcare-pqc',
  'hsm-pqc',
  'hybrid-crypto',
  'iam-pqc',
  'iot-ot-pqc',
  'kms-pqc',
  'merkle-tree-certs',
  'migration-program',
  'mls',
  'mls-group-messaging',
  'network-security-pqc',
  'ops-quantum-impact',
  'os-pqc',
  'pki-enrollment-protocols',
  'pki-workshop',
  'platform-eng-pqc',
  'pqc-101',
  'pqc-business-case',
  'pqc-candidates',
  'pqc-governance',
  'pqc-grc',
  'pqc-risk-management',
  'pqc-team',
  'pqc-testing-validation',
  'qkd',
  'quantum-threats',
  'quiz',
  'research-quantum-impact',
  'secrets-management-pqc',
  'secure-boot-pqc',
  'skills-team-structure',
  'slh-dsa',
  'soc-implementation-pqc',
  'standards-bodies',
  'stateful-signatures',
  'tls-basics',
  'vendor-risk',
  'vpn-ssh-pqc',
  'web-gateway-pqc',
].sort()

describe('learn route derivation (single source = manifests)', () => {
  it('derived module routes + aliases + specials reproduce the legacy route set', () => {
    const modulePaths = MANIFESTS.filter((m) => m.load).map((m) => m.id)
    const derived = [...modulePaths, ...ROUTE_ALIASES, ...SPECIAL_PATHS].sort()
    expect(derived).toEqual(GOLDEN_ROUTE_PATHS)
  })

  it('every alias resolves to a real loadable module id', () => {
    const loadableIds = new Set(MANIFESTS.filter((m) => m.load).map((m) => m.id))
    // mls -> mls-group-messaging
    expect(loadableIds.has('mls-group-messaging')).toBe(true)
  })

  it('module route paths are unique (no two manifests claim the same id)', () => {
    const ids = MANIFESTS.filter((m) => m.load).map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
