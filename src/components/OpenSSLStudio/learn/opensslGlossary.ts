// SPDX-License-Identifier: GPL-3.0-only
//
// opensslGlossary.ts — OpenSSL Studio's glossary content for the shared
// learnkit GlossaryProvider/GlossaryRail/Term components. Mirrors
// hsm/learn/pkcs11Glossary.ts, kmip/kmip3/glossary.ts, and
// TpmPlayground/learn/tpmGlossary.ts.
//
// VERIFICATION RULE (matching the KMIP/PKCS#11/TPM convention): every
// command/flag entry is cross-checked against either this codebase's own
// utils/opensslDocsData.ts (FLAG_HINTS / the verified openssl_docs_map.csv,
// itself dated against docs.openssl.org/3.6 on 2026-07-09) or a live
// measurement against the actual bundled openssl.wasm on 2026-07-24 (see
// opensslLessons.ts's header comment). PQC/protocol concept terms cite the
// relevant FIPS/RFC/NIST SP directly. No definition is guessed.

import {
  type GlossaryData,
  type GlossaryTerm,
  type TagGlossaryEntry,
  makeGlossaryLookup,
} from '../../Playground/learnkit/glossaryTypes'
import { FLAG_HINTS } from '../../../utils/opensslDocsData'

// ── Command flags — reused directly from the existing, already-verified
// FLAG_HINTS map (utils/opensslDocsData.ts) that already drives the
// Workbench's own command-preview hover hints, so this glossary can never
// silently drift from what the preview already claims. ───────────────────
const FLAG_ENTRIES: Record<string, TagGlossaryEntry> = Object.fromEntries(
  Object.entries(FLAG_HINTS).map(([flag, def]) => [flag, { def }])
)

// ── Subcommands & algorithm names shown inline via Term in the Learn tab's
// step list (tokenized the same way WorkbenchPreview tokenizes its command
// preview — see OpenSslLearnView.tsx). ────────────────────────────────────
const COMMAND_ENTRIES: Record<string, TagGlossaryEntry> = {
  genpkey: {
    def: 'docs.openssl.org/3.6/man1/openssl-genpkey — generates a private key (or keypair) for any algorithm the active providers support, classical or post-quantum, with the same command shape.',
  },
  pkey: {
    def: 'docs.openssl.org/3.6/man1/openssl-pkey — displays/converts a private key and (with -pubout) extracts its public key.',
  },
  req: {
    def: 'docs.openssl.org/3.6/man1/openssl-req — builds a PKCS#10 CSR (-new) or, with -x509 added, a self-signed certificate directly.',
  },
  x509: {
    def: 'docs.openssl.org/3.6/man1/openssl-x509 — displays, converts, or (as a "micro CA") signs X.509 certificates.',
  },
  dgst: {
    def: 'docs.openssl.org/3.6/man1/openssl-dgst — hashes input, and with -sign/-verify signs or verifies using the classical hash-then-sign shape (RSA/EC/Ed25519 keys in this Studio).',
  },
  pkeyutl: {
    def: 'docs.openssl.org/3.6/man1/openssl-pkeyutl — the generic public-key operation command: -sign/-verify (ML-DSA/SLH-DSA, hashing internally) and -encap/-decap (ML-KEM key establishment).',
  },
  enc: {
    def: 'docs.openssl.org/3.6/man1/openssl-enc — symmetric encrypt/decrypt. Never supports authenticated modes (GCM/CCM) and the docs say it never will; use openssl-cms for AEAD.',
  },
  rand: {
    def: "docs.openssl.org/3.6/man1/openssl-rand — draws bytes from RAND_bytes(), OpenSSL's CSPRNG. Fails loudly if OS entropy seeding failed, rather than emitting weak output.",
  },
  pkcs12: {
    def: 'docs.openssl.org/3.6/man1/openssl-pkcs12 — bundles/unpacks a key + certificate(+ chain) into one password-protected .p12 file. OpenSSL 3.x defaults to AES-256-CBC + PBKDF2; -legacy reverts to RC2/3DES.',
  },
  kdf: {
    def: 'docs.openssl.org/3.6/man1/openssl-kdf — new in OpenSSL 3.6. Drives HKDF, PBKDF2, SCRYPT, SSKDF and more behind one command; -kdfopt keys are algorithm-specific.',
  },
  configutl: {
    def: 'docs.openssl.org/3.6/man1/openssl-configutl — new in OpenSSL 3.6. Parses a config file and (with -out) re-dumps its linearized, expanded form.',
  },
  version: {
    def: 'docs.openssl.org/3.6/man1/openssl-version — reports the OpenSSL build in use; -a includes build flags and platform. This Studio runs 3.6.2.',
  },
  'ML-KEM': {
    def: "FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism. Native in OpenSSL's default provider since 3.5. -512/-768/-1024 name the parameter set.",
  },
  'ML-DSA': {
    def: "FIPS 204, Module-Lattice-Based Digital Signature Algorithm. Native in OpenSSL's default provider since 3.5. -44/-65/-87 name the parameter set.",
  },
  'SLH-DSA': {
    def: 'FIPS 205, Stateless Hash-Based Digital Signature Algorithm. Native since OpenSSL 3.5; SHA2/SHAKE variants at 128/192/256-bit levels, each in a small-signature (s) or fast-signing (f) form.',
  },
  LMS: {
    def: 'RFC 8554 / NIST SP 800-208 — Leighton-Micali stateful hash-based signatures. OpenSSL 3.6 supports VERIFICATION ONLY; key generation and signing are intentionally out of scope for OpenSSL core (see the "stateful signature" term below).',
  },
  HSS: {
    def: "RFC 8554 — Hierarchical Signature System, LMS's multi-tree extension. Same OpenSSL 3.6 verify-only scope as LMS.",
  },
  // ── Classical algorithm names surfaced by the Algorithm Explorer's live
  // `openssl list` query (Phase 3) — Term-wrapped on each result row. ──────
  RSA: {
    def: 'Rivest-Shamir-Adleman — security rests on integer factorization being hard, which is exactly what Shor\'s algorithm breaks on a quantum computer (see the "Shor\'s algorithm" term).',
  },
  EC: {
    def: "Elliptic Curve — the OpenSSL algorithm family name for elliptic-curve keys (paired with a named curve like P-256/P-384 via -pkeyopt ec_paramgen_curve). Security rests on the elliptic-curve discrete log problem, also broken by Shor's algorithm.",
  },
  X25519: {
    def: 'RFC 7748 — a specific Curve25519-based key-exchange algorithm. Appears alone in genpkey (a classical KEX key) and combined with ML-KEM in the hybrid group X25519MLKEM768.',
  },
  X448: {
    def: 'RFC 7748 — a specific Curve448-based key-exchange algorithm, the higher-security sibling of X25519. Combined with ML-KEM-1024 in the hybrid group X448MLKEM1024.',
  },
  ED25519: {
    def: 'RFC 8032 — EdDSA signatures over Curve25519. A classical signature algorithm, distinct from X25519 (key exchange) despite the shared curve.',
  },
  ED448: {
    def: 'RFC 8032 — EdDSA signatures over Curve448, the higher-security sibling of Ed25519.',
  },
  DSA: {
    def: 'Digital Signature Algorithm (FIPS 186) — an older classical signature scheme based on the discrete-log problem, largely superseded by ECDSA/EdDSA in new deployments but still listed by openssl list.',
  },
  SM2: {
    def: 'A Chinese national-standard elliptic-curve signature/encryption algorithm (GB/T 32918), registered as an alias of the generic EC key manager in this OpenSSL build.',
  },
  HKDF: {
    def: 'RFC 5869 — HMAC-based Extract-and-Expand KDF. Assumes the input is ALREADY a high-entropy secret (unlike PBKDF2/SCRYPT, which assume a human password) — see the KDF concept term.',
  },
  SCRYPT: {
    def: 'RFC 7914 — a memory-hard password-based KDF, more resistant to hardware (ASIC/GPU) brute-forcing than PBKDF2 because it deliberately costs memory as well as CPU time.',
  },
  PBKDF2: {
    def: 'RFC 2898 / PKCS#5 — Password-Based KDF 2. Stretches a human password via repeated HMAC iterations (-kdfopt iter:) — what pkcs12 and enc use internally via -pbkdf2.',
  },
  HMAC: {
    def: 'RFC 2104 — a keyed-hash message authentication code, built from any underlying digest (e.g. HMAC-SHA256). Also usable as a KDF building block (HKDF is HMAC-based).',
  },
  X25519MLKEM768: {
    def: 'A hybrid TLS key-share group combining classical X25519 with ML-KEM-768 — secure as long as EITHER component holds. OpenSSL 3.5+ defaults new TLS 1.3 connections to this group.',
  },
  SecP256r1MLKEM768: {
    def: 'A hybrid TLS key-share group combining classical P-256 (secp256r1) with ML-KEM-768.',
  },
  SecP384r1MLKEM1024: {
    def: 'A hybrid TLS key-share group combining classical P-384 (secp384r1) with the higher-security ML-KEM-1024.',
  },
  X448MLKEM1024: {
    def: 'A hybrid TLS key-share group combining classical X448 with ML-KEM-1024.',
  },
}

export const TAG_GLOSSARY: Record<string, TagGlossaryEntry> = {
  ...FLAG_ENTRIES,
  ...COMMAND_ENTRIES,
}

// ── Protocol/PQC concept terms ─────────────────────────────────────────────

const TERMS: GlossaryTerm[] = [
  {
    id: 'csr',
    label: 'CSR (Certificate Signing Request)',
    cat: 'protocol',
    def: 'A PKCS#10 request (RFC 2986) containing a public key + subject, produced by req -new, for a CA to sign into a certificate. req -x509 -new skips this and self-signs directly.',
  },
  {
    id: 'self-signed-cert',
    label: 'Self-signed certificate',
    cat: 'protocol',
    def: "A certificate signed by its own private key rather than an external CA — produced by req -x509 -new in one step. Fine for testing/internal use; browsers won't trust it by default.",
  },
  {
    id: 'pkcs8',
    label: 'PKCS#8',
    cat: 'protocol',
    def: 'The standard container format genpkey writes private keys in by default — algorithm-agnostic, which is why the SAME -out flag works whether the key is RSA or ML-DSA.',
  },
  {
    id: 'pkcs12-concept',
    label: 'PKCS#12',
    cat: 'protocol',
    def: 'A password-protected bundle format holding a private key + certificate (+ chain) in one file — the shape most browsers and app servers actually import, versus loose PEM files.',
  },
  {
    id: 'kem',
    label: 'KEM (Key Encapsulation Mechanism)',
    cat: 'pqc',
    def: 'An operation shape where encapsulation GENERATES a fresh shared secret as a side effect (pkeyutl -encap), unlike RSA key transport where the caller picks the secret and encrypts it. ML-KEM is a KEM; RSA is not.',
  },
  {
    id: 'hybrid-kem',
    label: 'Hybrid key exchange',
    cat: 'pqc',
    def: 'Combining a classical group (X25519, P-256/384) with an ML-KEM parameter set in one TLS key-share group (e.g. X25519MLKEM768) — secure as long as EITHER component holds, hedging against an undiscovered weakness in the newer PQC math.',
  },
  {
    id: 'harvest-now-decrypt-later',
    label: 'Harvest-now-decrypt-later',
    cat: 'pqc',
    def: "Recording today's classically-encrypted traffic now, to decrypt once a cryptographically relevant quantum computer exists. The reason PQC key establishment (ML-KEM) is being deployed years before such a computer is known to exist.",
  },
  {
    id: 'grovers-algorithm',
    label: "Grover's algorithm",
    cat: 'pqc',
    def: "A quantum algorithm giving only a QUADRATIC speedup against symmetric ciphers/hash functions — AES-256 keeps ~128-bit security against it. Contrast with Shor's algorithm below.",
  },
  {
    id: 'shors-algorithm',
    label: "Shor's algorithm",
    cat: 'pqc',
    def: "A quantum algorithm that breaks integer factorization and discrete log (RSA, ECC, finite-field Diffie-Hellman) in POLYNOMIAL time — an exponential-to-polynomial collapse, not a mild weakening. This asymmetry is why public-key algorithms need replacement while symmetric ones mostly don't.",
  },
  {
    id: 'module-lattice',
    label: 'Module lattice problem',
    cat: 'pqc',
    def: 'The hardness assumption (Module-LWE / Module-SIS) underlying both ML-KEM (FIPS 203) and ML-DSA (FIPS 204) — believed hard even for a quantum computer, unlike factoring or discrete log.',
  },
  {
    id: 'stateful-signature',
    label: 'Stateful hash-based signature',
    cat: 'pqc',
    def: 'LMS/HSS\'s security depends on NEVER reusing a one-time key — a property software key generation can\'t safely guarantee across backups/restores. An OpenSSL maintainer confirmed keygen is intentionally out of core scope for exactly this reason (github.com/openssl/openssl/discussions/29619) — "should be hardware, not software."',
  },
  {
    id: 'aead',
    label: 'AEAD (Authenticated Encryption with Associated Data)',
    cat: 'protocol',
    def: 'A cipher mode (GCM, CCM, ChaCha20-Poly1305) that authenticates as it encrypts. openssl enc has never supported these and the docs say it never will — openssl-cms is the documented path for AEAD.',
  },
  {
    id: 'kdf-concept',
    label: 'KDF (Key Derivation Function)',
    cat: 'protocol',
    def: 'Turns one input (a password, or an existing high-entropy secret) into cryptographic key material. HKDF/SSKDF assume a high-entropy secret already; PBKDF2/SCRYPT assume a human password and add deliberate work factor — mixing them up silently derives a weaker-than-intended key.',
  },
  {
    id: 'fips-203',
    label: 'FIPS 203',
    cat: 'pqc',
    def: "NIST's Module-Lattice-Based Key-Encapsulation Mechanism Standard — specifies ML-KEM-512/768/1024, including the exact ciphertext and shared-secret sizes this curriculum measured live.",
  },
  {
    id: 'fips-204',
    label: 'FIPS 204',
    cat: 'pqc',
    def: "NIST's Module-Lattice-Based Digital Signature Standard — specifies ML-DSA-44/65/87, including the exact key and signature sizes this curriculum measured live.",
  },
  {
    id: 'fips-205',
    label: 'FIPS 205',
    cat: 'pqc',
    def: "NIST's Stateless Hash-Based Digital Signature Standard — specifies SLH-DSA's 12 parameter sets (SHA2/SHAKE × 128/192/256 × s/f).",
  },
  {
    id: 'provider',
    label: 'Provider',
    cat: 'protocol',
    def: 'OpenSSL 3.x\'s unit of pluggable algorithm implementations (docs.openssl.org/3.6/man7/openssl-glossary). `openssl list -providers` reporting a provider "active" only means it loaded into the registry — NOT that every algorithm it claims to register actually works (see the Algorithm Explorer\'s live functional check).',
  },
  {
    id: 'composite-signature',
    label: 'Composite signature',
    cat: 'pqc',
    def: 'A single signature combining a classical algorithm (e.g. RSA, ECDSA) with ML-DSA — a hedging strategy like hybrid KEM, but for signatures, from the IETF LAMPS working group\'s composite-signatures draft work. This build\'s pkcs11 provider registers 3 such composites (named after "draft-lamps-19" in its own algorithm labels — the revision it was built against), though that provider is not currently functional here.',
  },
]

/** This playground's `GlossaryData`, passed to the shared `GlossaryProvider`. */
export const OPENSSL_GLOSSARY_DATA: GlossaryData = {
  tagGlossary: TAG_GLOSSARY,
  terms: TERMS,
  lookupDef: makeGlossaryLookup(TAG_GLOSSARY, TERMS),
  sectionTitles: {
    wire: 'Commands & flags',
    protocol: 'OpenSSL concepts',
    pqc: 'Post-quantum transition',
  },
}

export { TERMS }
