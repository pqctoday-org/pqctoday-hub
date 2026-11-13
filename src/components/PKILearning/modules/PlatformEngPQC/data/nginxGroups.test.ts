// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { IAC_PATTERNS } from './iacCryptoData'
import { POLICY_RULES } from './policyRulesData'

describe('ingress controller TLS groups', () => {
  const sample = IAC_PATTERNS.find((p) => p.id === 'helm-tls-values')!
  const policy = POLICY_RULES.find((p) => p.id === 'kyverno-tls-cipher')!
  const values = parse(sample.pqcConfig)
  const rule = parse(policy.rule).spec.rules[0]
  it('configures the actual controller group key without assigning groups or TLS1.3 suites to legacy ciphers', () => {
    expect(values.controller.config).toEqual({
      'ssl-protocols': 'TLSv1.3',
      'ssl-ecdh-curve': 'X25519MLKEM768:X25519:P-256',
    })
    expect(sample.pqcConfig).toContain('nginx 1.30.4 linked to OpenSSL 3.6.3')
    expect(sample.pqcConfig).toContain('permitted classical fallbacks')
    expect(sample.pqcConfig).toContain('inspect the negotiated group')
  })
  it('checks the controller ConfigMap, not an Ingress annotation; exact declaration rejects prefix spoofs and missing data', () => {
    expect(rule.match.any[0].resources).toEqual({
      kinds: ['ConfigMap'],
      selector: {
        matchLabels: {
          'app.kubernetes.io/name': 'ingress-nginx',
          'app.kubernetes.io/component': 'controller',
        },
      },
    })
    const required = rule.validate.pattern.data['ssl-ecdh-curve']
    expect(required).toBe(values.controller.config['ssl-ecdh-curve'])
    for (const wrong of [undefined, '', 'X25519:P-256', 'X25519MLKEM768bogus:X25519:P-256'])
      expect(wrong).not.toBe(required)
    expect(rule.validate.pattern.metadata).toBeUndefined()
    expect(policy.requiredAlgorithms).toEqual(['X25519MLKEM768', 'X25519', 'P-256'])
    expect(policy.blockedAlgorithms).toEqual([])
  })
})
