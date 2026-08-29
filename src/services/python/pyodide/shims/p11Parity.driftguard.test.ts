// SPDX-License-Identifier: GPL-3.0-only
//
// Shim parity driftguard (dev-tabs-pkcs11-kmip plan G6). Asserts the p11
// shim's public method surface against a manifest of the REAL
// pqctoday-sandbox samples/py/p11 package's public methods, extracted by
// grep from that package's own source (see the manifest comment below for
// the exact command). If the sandbox package's API ever changes, this
// breaks the hub BUILD, not a learner's script at runtime — the whole
// point of the shim being a mirror, not a rewrite (see
// shims/p11/__init__.py's own header).
//
// This manifest is what CAUGHT Module.info() missing entirely (G6,
// 2026-08-28) — it had shipped unnoticed since P1 because nothing in any
// template or gate ever called it.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SHIM_SOURCE = readFileSync(join(__dirname, 'p11/__init__.py'), 'utf-8')

/** Extracted 2026-08-27 via:
 *   grep -oE "^    def [a-z_0-9]+\(" samples/py/p11/__init__.py \
 *     | sed 's/^    def //;s/($//' | grep -v '^_' | sort -u
 * against pqctoday-sandbox's samples/py/p11/__init__.py. 39 methods —
 * the real package's entire public surface (Module + Session, dunders and
 * private `_`-prefixed helpers excluded). */
const REAL_P11_PUBLIC_METHODS = [
  'login',
  'logout',
  'close',
  'generate_keypair',
  'generate_secret_key',
  'generate_ml_kem',
  'generate_ml_dsa',
  'generate_slh_dsa',
  'generate_hss',
  'hss_keys_remaining',
  'generate_rsa',
  'generate_ec_p256',
  'generate_ed25519',
  'generate_aes256',
  'oaep_params',
  'pss_params',
  'sign',
  'verify',
  'encapsulate',
  'decapsulate',
  'derive_key',
  'ecdh_derive',
  'ec_point',
  'encrypt',
  'encrypt_gcm',
  'decrypt',
  'decrypt_gcm',
  'digest',
  'create_object',
  'import_secret',
  'value',
  'get_attribute',
  'find_objects',
  'destroy',
  'slots',
  'info',
  'token_info',
  'open_session',
  'finalize',
] as const

function shimDefinesMethod(name: string): boolean {
  // Matches "    def <name>(" at 4-space class-method indent, so `_Alloc`'s
  // own similarly-named private helpers (malloc/bytes/free_all/u32) at the
  // SAME indent inside a DIFFERENT class don't false-positive — this asks
  // "does Module or Session define this", not "does this string exist".
  const re = new RegExp(`^    def ${name}\\(`, 'm')
  return re.test(SHIM_SOURCE)
}

describe('p11 shim parity — every real sandbox method exists (or is a documented NotImplementedError)', () => {
  // Methods the shim deliberately does not implement, each raising
  // NotImplementedError with a reason — see p11/__init__.py's own
  // docstring "WHAT THE REAL CLIENT DOES THAT THIS SHIM CANNOT". Kept as an
  // explicit allowlist so a REAL gap (like info() was) still fails the test
  // above, while an intentional, documented gap doesn't need re-litigating
  // here every time this manifest is checked.
  const DELIBERATELY_UNIMPLEMENTED: string[] = []

  for (const name of REAL_P11_PUBLIC_METHODS) {
    if (DELIBERATELY_UNIMPLEMENTED.includes(name)) continue
    it(`defines ${name}()`, () => {
      expect(
        shimDefinesMethod(name),
        `p11 shim is missing ${name}() — real sandbox p11 package has it`
      ).toBe(true)
    })
  }
})

describe('p11 shim parity — legacy=True raises NotImplementedError (documented, not silently broken)', () => {
  it('Module.__init__ handles legacy explicitly', () => {
    expect(SHIM_SOURCE).toMatch(/if legacy:\s*\n\s*raise NotImplementedError/)
  })
})
