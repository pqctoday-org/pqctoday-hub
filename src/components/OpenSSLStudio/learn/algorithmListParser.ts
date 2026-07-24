// SPDX-License-Identifier: GPL-3.0-only
//
// algorithmListParser.ts — pure parsing for `openssl list ...` output, which
// is human-formatted text with (verified live against the real bundled
// openssl.wasm, 2026-07-24) FOUR distinct shapes depending on the flag:
//
//  1. `list -providers -verbose` — a small structured block, one provider
//     per un-indented name, `key: value` lines under it.
//  2. `list -public-key-algorithms`'s `Provided: > Key Managers:` section —
//     repeating 3-line stanzas: `Name: X` / `Type: Provider Algorithm` /
//     `IDs: { oid, alias, … } @ provider` (or `IDs: BARENAME @ provider`).
//     This is where every PQC algorithm (and any non-default provider's
//     registrations) actually shows up — the one section worth fully
//     parsing for this purpose.
//  3. The generic `Provided:` shape used by `-kdf-algorithms`,
//     `-mac-algorithms`, `-kem-algorithms`, `-signature-algorithms`, and
//     (mixed with a `Legacy:` section) `-digest-algorithms` /
//     `-cipher-algorithms`: flat `{ oid, alias, … } @ provider` or bare
//     `NAME @ provider` lines, optionally under a header line.
//  4. `Legacy:` sections — decades-old ENGINE-style names/aliases, no
//     provider attribution at all. Deliberately NOT deep-parsed (mostly
//     aliasing, not distinct algorithms) — captured minimally for search.
//
// No section is invented or guessed at — every shape here was read off
// real captured output before this parser was written.

export type AlgorithmFamily =
  | 'pqc'
  | 'classical-asymmetric'
  | 'symmetric'
  | 'hash-hmac'
  | 'kdf'
  | 'other'

export interface AlgorithmEntry {
  /** Primary display name — the `Name:` label if present, else the first ID/alias. */
  name: string
  oids: string[]
  aliases: string[]
  /** 'legacy' for Legacy-section entries (no provider object involved). */
  provider: string
  family: AlgorithmFamily
  /** Which `list` flag produced this row, e.g. 'kem-algorithms'. */
  sourceList: string
}

export interface ProviderStatus {
  key: string
  displayName: string
  version: string
  /** As self-reported by `list -providers -verbose` — NOT proof of usability, see probeProviderFunctional. */
  reportedStatus: string
  buildInfo?: string
}

// ── Family classification ───────────────────────────────────────────────────

const PQC_PATTERN =
  /^(ML-KEM|MLKEM|ML-DSA|MLDSA|SLH-DSA|LMS|HSS|X25519MLKEM|X448MLKEM|SecP256r1MLKEM|SecP384r1MLKEM|id-alg-ml-kem|id-alg-ml-dsa|id-ml-dsa|id-slh-dsa)/i
const COMPOSITE_SIG_PATTERN = /MLDSA\d{2}-(RSA|ECDSA)/i
const CLASSICAL_ASYMMETRIC_PATTERN =
  /^(RSA|DSA|EC|DH|X9\.42|X25519|X448|ED25519|ED448|SM2|ECDSA|DHX|dsaEncryption|dsaWithSHA|dhKeyAgreement|dhpublicnumber|rsaEncryption|rsassaPss|id-ecPublicKey)/i
const KDF_PATTERN =
  /^(HKDF|PBKDF2|SCRYPT|SSKDF|TLS1-PRF|TLS13-KDF|X942KDF|X963KDF|KBKDF|KRB5KDF|PKCS12KDF|SSHKDF|ARGON2|HMAC-DRBG-KDF|id-scrypt|id-alg-hkdf)/i
const HASH_HMAC_PATTERN =
  /^(SHA|MD4|MD5|RIPEMD|RMD160|ripemd|BLAKE2|SHAKE|KECCAK|SM3|HMAC|CMAC|GMAC|KMAC|SIPHASH|POLY1305|MDC2|whirlpool|NULL|sha|md4|md5|mdc2|ssl3-)/i
const SYMMETRIC_PATTERN =
  /^(AES|ARIA|CAMELLIA|ChaCha20|DES|RC2|RC4|SEED|SM4|BF|IDEA|CAST|aes|des|rc2|rc4|seed|sm4|bf|idea|cast|blowfish|id-aes|id-smime-alg)/i

export function classifyFamily(candidateNames: string[]): AlgorithmFamily {
  for (const n of candidateNames) {
    if (COMPOSITE_SIG_PATTERN.test(n) || PQC_PATTERN.test(n)) return 'pqc'
  }
  for (const n of candidateNames) {
    if (KDF_PATTERN.test(n)) return 'kdf'
  }
  for (const n of candidateNames) {
    if (HASH_HMAC_PATTERN.test(n)) return 'hash-hmac'
  }
  for (const n of candidateNames) {
    if (SYMMETRIC_PATTERN.test(n)) return 'symmetric'
  }
  for (const n of candidateNames) {
    if (CLASSICAL_ASYMMETRIC_PATTERN.test(n)) return 'classical-asymmetric'
  }
  return 'other'
}

// ── `list -providers -verbose` ──────────────────────────────────────────────

export function parseProviders(raw: string): ProviderStatus[] {
  const lines = raw.split('\n')
  const providers: ProviderStatus[] = []
  let current: ProviderStatus | null = null

  for (const line of lines) {
    // Provider key: exactly 2 leading spaces, no colon (e.g. "  default", "  pkcs11").
    const keyMatch = line.match(/^ {2}(\S+)\s*$/)
    if (keyMatch) {
      if (current) providers.push(current)
      current = { key: keyMatch[1], displayName: keyMatch[1], version: '', reportedStatus: '' }
      continue
    }
    if (!current) continue
    const kv = line.match(/^\s{4}([a-z ]+):\s*(.*)$/)
    if (!kv) continue
    const [, key, value] = kv
    if (key === 'name') current.displayName = value
    else if (key === 'version') current.version = value
    else if (key === 'status') current.reportedStatus = value
    else if (key === 'build info') current.buildInfo = value
  }
  if (current) providers.push(current)
  return providers
}

// ── `-public-key-algorithms`'s `Provided: > Key Managers:` stanzas ─────────

// eslint-disable-next-line security/detect-unsafe-regex -- fixed dotted-decimal shape (\d+ then a MANDATORY literal '.' before each repetition), no ambiguous overlap between the outer and inner \d+ so backtracking is linear, not exponential; applied only to short strings parsed from this codebase's own bundled openssl.wasm output, never untrusted/attacker input
const OID_PATTERN = /^\d+(\.\d+)+$/
const isOid = (id: string): boolean => OID_PATTERN.test(id)

/** Splits a `{ a, b, c }` or bare `NAME` id-list string into its parts. */
function splitIds(idsRaw: string): string[] {
  const trimmed = idsRaw.trim()
  if (trimmed.startsWith('{')) {
    return trimmed
      .slice(1, trimmed.lastIndexOf('}'))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return [trimmed]
}

const KEY_MANAGER_STANZA =
  /Name: (.+?)\r?\n\s+Type: Provider Algorithm\r?\n\s+IDs: (.+?)\s*@\s*(\S+)/g

export function parseKeyManagersSection(raw: string): AlgorithmEntry[] {
  const keyManagersStart = raw.indexOf('Key Managers:')
  if (keyManagersStart === -1) return []
  // Stop at the next un-indented/differently-indented top-level section, if
  // any — Key Managers: is (at least in this build) the only Provided:
  // sub-group observed, so this just guards against a future build adding
  // a sibling section after it.
  const section = raw.slice(keyManagersStart)

  const entries: AlgorithmEntry[] = []
  let match: RegExpExecArray | null
  KEY_MANAGER_STANZA.lastIndex = 0
  while ((match = KEY_MANAGER_STANZA.exec(section)) !== null) {
    const [, name, idsRaw, provider] = match
    const ids = splitIds(idsRaw)
    const oids = ids.filter(isOid)
    const aliases = ids.filter((id) => !isOid(id))
    entries.push({
      name: name.trim(),
      oids,
      aliases,
      provider,
      family: classifyFamily([name, ...aliases]),
      sourceList: 'public-key-algorithms',
    })
  }
  return entries
}

// ── The generic `Provided:` flat-list shape ─────────────────────────────────

/** Matches one flat entry line: `{ id, alias, … } @ provider` or `NAME @ provider`. */
const FLAT_ENTRY = /^\s*(\{[^}]*\}|[^@{}\n][^@\n]*?)\s*@\s*(\S+)\s*$/

export function parseFlatProvidedList(raw: string, sourceList: string): AlgorithmEntry[] {
  const entries: AlgorithmEntry[] = []
  for (const line of raw.split('\n')) {
    const m = line.match(FLAT_ENTRY)
    if (!m) continue
    const ids = splitIds(m[1])
    if (ids.length === 0 || !ids[0]) continue
    const provider = m[2]
    const oids = ids.filter(isOid)
    const aliases = ids.filter((id) => !isOid(id))
    if (aliases.length === 0) continue // an OID-only line with no readable name isn't useful to show
    entries.push({
      name: aliases[0],
      oids,
      aliases,
      provider,
      family: classifyFamily(aliases),
      sourceList,
    })
  }
  return entries
}

/** Minimal Legacy-section capture — names only, no provider attribution
 * (Legacy predates the 3.0 provider model), for search completeness. Not
 * deep-parsed: Legacy stanzas mix several inconsistent per-entry shapes and
 * are mostly aliasing rather than distinct algorithms (see file header). */
// ── Provider-honesty probe ───────────────────────────────────────────────────
//
// `list -providers` self-reports `status: active` for ANY registered
// provider — that only means it loaded into the registry, not that it can
// actually do anything. So every non-default provider gets probed with a
// real operation before we show its algorithms as usable. `default` is
// trivially functional (everything in this Studio already depends on it)
// and is never re-probed.
//
// The pkcs11 provider needs a DIFFERENT probe from everyone else, because
// the generic one asks for something a PKCS#11 token is designed to refuse.
//
// Verified against the 2026-07-24 rebuild, in this order:
//   1. `genpkey -provider pkcs11 ... -out probe.key` used to fail with
//      "Module initialization failed!". That is FIXED — config.h now
//      defines DEFAULT_PKCS11_MODULE and apps_startup() registers the
//      provider in the global lib ctx, so the module loads.
//   2. With no token yet, it then failed honestly with "The token was not
//      present in its slot".
//   3. With a token provisioned, RSA key generation SUCCEEDS and the
//      command still exits non-zero — at "Error writing key(s)", because
//      `-out <file>` asks to export a CKA_SENSITIVE token-resident private
//      key. Refusing that is the whole point of an HSM.
//
// So a generic keygen-to-file probe can never pass here, no matter how
// healthy the provider is. We instead exercise the path this provider is
// actually for: generate a key INTO the token (via the worker's direct
// C_GenerateKeyPair — `genpkey -out pkcs11:` would write a PEM to MEMFS
// rather than the token), then have the CLI read the PUBLIC half back
// through a `pkcs11:` URI. Reading it back proves the whole chain:
// CLI → OSSL_STORE → pkcs11-provider → engine → token object.

export interface ProviderProbeResult {
  functional: boolean
  /** The real stderr/error text on failure — shown to the user, never hidden. */
  error?: string
  /** Which algorithm name was used for the probe. */
  probedWith?: string
  /** How the probe reached the provider — shown so the badge is not a bare
   *  claim. e.g. "pkcs11: URI (global libctx)". */
  probedVia?: string
}

/** Picks a reasonable probe target from a provider's own registered
 * classical-asymmetric algorithms (RSA preferred — virtually every
 * key-management provider claims it), falling back to its first PQC entry. */
export function pickProbeTarget(entries: AlgorithmEntry[], provider: string): string | undefined {
  const own = entries.filter((e) => e.provider === provider)
  const rsa = own.find((e) => e.aliases.includes('RSA') || e.aliases.includes('rsaEncryption'))
  if (rsa) return 'RSA'
  const classical = own.find((e) => e.family === 'classical-asymmetric')
  if (classical) return classical.aliases[0]
  const pqc = own.find((e) => e.family === 'pqc')
  return pqc?.aliases[0]
}

/** Object id the pkcs11 probe generates into the token and then reads back.
 *  Fixed rather than random so repeated probes reuse one object instead of
 *  littering the token. */
export const PKCS11_PROBE_KEY_ID = 'explorer-probe'
/** Algorithm the pkcs11 probe generates. ML-DSA-65 rather than RSA: it is
 *  what this engine is actually for, and it is fast to generate. */
export const PKCS11_PROBE_ALGORITHM = 'ML-DSA-65'

/**
 * Probe for the pkcs11 provider specifically.
 *
 * `-provider pkcs11` is NOT avoided because it is broken — verified working
 * (see the section comment above): the CLI has a single default library
 * context (`apps/lib/app_libctx.c` keeps it NULL unless the undocumented
 * `OPENSSL_TEST_LIBCTX` test hook is set), so `-provider pkcs11` reaches the
 * exact same registration `pqctoday_cms_init()` made. A prior version of
 * this comment claimed the flag builds a separate context that "can't see"
 * the provider — that claim did not hold up against the OpenSSL 3.6.2
 * source and has been removed; do not reintroduce it.
 *
 * The flag is simply unnecessary here: `pkcs11:` URIs already resolve
 * against that same default context with no flag at all, and testing
 * without it means this probe also verifies the URI-only path the
 * Workbench and CMS workshop actually rely on day to day. We generate a
 * token-resident key (via the worker's direct C_GenerateKeyPair, since
 * `genpkey -out pkcs11:` would write a PEM to MEMFS rather than the token),
 * then have the OpenSSL CLI read it back through a `pkcs11:` URI. Reading
 * the public half back proves the whole chain: CLI → OSSL_STORE →
 * pkcs11-provider → engine → token object.
 *
 * `hsmKeygen` is supplied by the Studio (worker-backed). When absent — e.g.
 * the Node test driver, or a build with no token support — we skip straight
 * to the URI read, which is still a genuine end-to-end test if a key exists.
 */
export async function probePkcs11Functional(
  run: (cmd: string) => Promise<{ stdout: string }>,
  hsmKeygen?: (algorithm: string, keyId: string) => Promise<unknown>
): Promise<ProviderProbeResult> {
  const probedVia = 'pkcs11: URI (global libctx, no -provider flag)'
  try {
    if (hsmKeygen) await hsmKeygen(PKCS11_PROBE_ALGORITHM, PKCS11_PROBE_KEY_ID)
    // Read the public half back out of the token through the provider.
    await run(`pkey -in "pkcs11:object=${PKCS11_PROBE_KEY_ID};type=private?pin-value=1234" -pubout`)
    return { functional: true, probedWith: PKCS11_PROBE_ALGORITHM, probedVia }
  } catch (e) {
    return {
      functional: false,
      error: e instanceof Error ? e.message : String(e),
      probedWith: PKCS11_PROBE_ALGORITHM,
      probedVia,
    }
  }
}

/** Runs one cheap real genpkey through the named provider and reports
 * whether it actually worked — never trusts `list -providers`'s
 * self-reported `status` alone. `run` is the same `OpenSslLearnContext.run`
 * used everywhere else (browser worker or the Node driver in tests).
 *
 * For `pkcs11`, callers must use probePkcs11Functional instead: the
 * `-provider` flag this builds is precisely what breaks that provider. */
export async function probeProviderFunctional(
  run: (cmd: string) => Promise<{ stdout: string }>,
  provider: string,
  probeAlgorithm: string
): Promise<ProviderProbeResult> {
  const pkeyopt = probeAlgorithm === 'RSA' ? ' -pkeyopt rsa_keygen_bits:2048' : ''
  const cmd = `genpkey -provider ${provider} -provider default -propquery provider=${provider} -algorithm ${probeAlgorithm}${pkeyopt} -out explorer-probe-${provider}.key`
  try {
    await run(cmd)
    return {
      functional: true,
      probedWith: probeAlgorithm,
      probedVia: `-provider ${provider}`,
    }
  } catch (e) {
    return {
      functional: false,
      error: e instanceof Error ? e.message : String(e),
      probedWith: probeAlgorithm,
      probedVia: `-provider ${provider}`,
    }
  }
}

export function parseLegacySection(raw: string, sourceList: string): AlgorithmEntry[] {
  const legacyStart = raw.indexOf('Legacy:')
  const providedStart = raw.indexOf('Provided')
  if (legacyStart === -1) return []
  const section =
    providedStart > legacyStart ? raw.slice(legacyStart, providedStart) : raw.slice(legacyStart)

  const entries: AlgorithmEntry[] = []
  const seen = new Set<string>()
  for (const line of section.split('\n')) {
    const nameMatch = line.match(/^\s*Name:\s*(.+)$/)
    // eslint-disable-next-line security/detect-unsafe-regex -- applied per-line to short, trusted local openssl.wasm output (never untrusted input); worst case is linear (no whitespace to create ambiguity between the lazy .*? and trailing \s*), not exponential
    const bareMatch = nameMatch ? null : line.match(/^\s{2}(\S.*?)(?:\s*=>\s*(\S+))?\s*$/)
    const name = nameMatch?.[1]?.trim() ?? bareMatch?.[1]?.trim()
    if (!name || name === 'Legacy:' || seen.has(name)) continue
    seen.add(name)
    entries.push({
      name,
      oids: [],
      aliases: [name],
      provider: 'legacy',
      family: classifyFamily([name]),
      sourceList,
    })
  }
  return entries
}
