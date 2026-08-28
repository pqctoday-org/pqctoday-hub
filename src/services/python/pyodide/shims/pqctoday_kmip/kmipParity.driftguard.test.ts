// SPDX-License-Identifier: GPL-3.0-only
//
// Shim parity driftguard for the KMIP lane (dev-tabs-pkcs11-kmip plan G6).
// Same role as ../p11Parity.driftguard.test.ts: a checked-in manifest of
// the REAL pqctoday-hsm/kmip/python-client's KmipClient public methods
// (obtained by direct source inspection during P3's research, not
// guessed), asserted against this shim's actual method definitions.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SHIM_SOURCE = readFileSync(join(__dirname, '__init__.py'), 'utf-8')

/** The real KmipClient's public method surface (27 methods), read directly
 * from pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/kmip.py during
 * P3's research (2026-08-27) — see the `p11` shim's sibling driftguard for
 * the equivalent PKCS#11-side manifest. `request(operation, *payload)` is
 * the real client's raw TTLV dispatch core every other method routes
 * through — this shim has no TTLV tree at all (see pqctoday_kmip/
 * __init__.py's module docstring on RESULT SHAPE), and routes every op
 * through its own `_run(op_dict)` instead. That is an architectural
 * substitution for request()'s ROLE, not a same-named mirror of its
 * signature, so `request` is deliberately excluded from this manifest
 * rather than asserted as a required method name. */
const REAL_KMIP_CLIENT_PUBLIC_METHODS = [
  'openssl_is_hybrid_capable', 'negotiated_group', 'assert_quantum_safe_channel',
  'serve_as_endpoint',
  'create_symmetric', 'create_key_pair', 'activate', 'get', 'encrypt',
  'sign', 'signature_verify', 'validity',
  'register', 'encapsulate', 'decapsulate', 'destroy', 'revoke', 'locate',
  'get_attributes', 'get_usage_allocation', 'get_constraints',
  'set_endpoint_role', 'set_defaults', 'derive_key', 'rekey', 'rekey_key_pair',
] as const

function shimDefinesMethod(name: string): boolean {
  const re = new RegExp(`^    def ${name}\\(`, 'm')
  return re.test(SHIM_SOURCE)
}

describe('pqctoday_kmip shim parity — every real KmipClient method exists (functionally, or as a documented NotImplementedError)', () => {
  for (const name of REAL_KMIP_CLIENT_PUBLIC_METHODS) {
    it(`defines ${name}()`, () => {
      expect(shimDefinesMethod(name), `pqctoday_kmip shim is missing ${name}() — the real KmipClient has it`).toBe(true)
    })
  }
})

describe('pqctoday_kmip shim — hub-only extensions are documented as such, not silently added', () => {
  // D3/WS-C: load_policy/dry_run/policy_status are NOT on the real
  // KmipClient at all (policy control-plane is a separate AdminClient on
  // the real system) — this asserts they carry the explanatory comment
  // rather than looking like ordinary mirrored methods.
  for (const name of ['load_policy', 'dry_run', 'policy_status']) {
    it(`${name}() sits under the "HUB-ONLY policy-plane convenience" section`, () => {
      const idx = SHIM_SOURCE.indexOf('HUB-ONLY policy-plane convenience')
      const methodIdx = SHIM_SOURCE.search(new RegExp(`^    def ${name}\\(`, 'm'))
      expect(idx, 'marker comment missing entirely').toBeGreaterThan(-1)
      expect(methodIdx, `${name}() missing entirely`).toBeGreaterThan(-1)
      expect(methodIdx, `${name}() defined before the hub-only marker comment`).toBeGreaterThan(idx)
    })
  }
})
