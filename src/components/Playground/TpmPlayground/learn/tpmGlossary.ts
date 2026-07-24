// SPDX-License-Identifier: GPL-3.0-only
//
// tpmGlossary.ts — the TPM 2.0 playground's glossary content for the shared
// learnkit GlossaryProvider/GlossaryRail/Term components. Mirrors
// hsm/learn/pkcs11Glossary.ts and kmip/kmip3/glossary.ts.
//
// VERIFICATION RULE (per the 2026-07-23 remediation plan WS4, matching the
// KMIP/PKCS#11 convention): a hex codepoint appears ONLY where cross-checked
// against this codebase's own constants (src/wasm/tpmSerializer.ts,
// TpmPlayground/tpmCommandDefs.ts TPM_RC_TABLE, v2p7-reference.ts) or the
// fork's TpmTypes.h — each itself derived from the PUBLISHED TCG TPM 2.0
// Library v1.85 (2026-03-12) tables. Unverified values carry name + meaning
// with no codepoint. Section refs cite the published v1.85 parts.

import {
  type GlossaryData,
  type GlossaryTerm,
  type TagGlossaryEntry,
  makeGlossaryLookup,
} from '../../learnkit/glossaryTypes'

// ── Command codes, structure tags, return codes, algorithm IDs ─────────────
// Keyed by the TCG symbol shown inline in the Execution Log / lessons.

export const TAG_GLOSSARY: Record<string, TagGlossaryEntry> = {
  // ── Command codes (Part 2 §6.5; hex per tpmSerializer.ts/TpmTypes.h) ──
  TPM2_Startup: {
    hex: '0x00000144',
    def: 'Part 3 §9.3 — transitions the TPM from power-on to operational. Called automatically when the WASM module loads; calling it again is refused with TPM_RC_INITIALIZE, an honest-refusal you can trigger in Lesson T1.',
  },
  TPM2_SelfTest: {
    hex: '0x00000143',
    def: 'Part 3 §10.2 — runs the TPM’s algorithm self-tests. fullTest=YES tests everything rather than deferring until first use.',
  },
  TPM2_GetCapability: {
    hex: '0x0000017A',
    def: 'Part 3 §30.2 — enumerates what this TPM supports: algorithms (TPM_CAP_ALGS), loaded/persistent handles (TPM_CAP_HANDLES), ECC curves, and more. The migration story in one command: RSA and ML-KEM appear in the same algorithm table.',
  },
  TPM2_GetRandom: {
    hex: '0x0000017B',
    def: 'Part 3 §16.1 — returns bytes from the TPM’s DRBG. Both classical and PQC keys draw from this same entropy source.',
  },
  TPM2_CreatePrimary: {
    hex: '0x00000131',
    def: 'Part 3 §24.1 — creates and loads a primary key derived deterministically from the hierarchy seed plus the public template: same template, same key, every time. Works identically for RSA-2048 and ML-KEM-768 — the template’s type field is what changes.',
  },
  TPM2_ReadPublic: {
    hex: '0x00000173',
    def: 'Part 3 §12.4 — returns the public area (TPMT_PUBLIC) and Name of a loaded object. How you fetch a public key’s real bytes to compare sizes.',
  },
  TPM2_FlushContext: {
    hex: '0x00000165',
    def: 'Part 3 §28.4 — releases a transient object, sequence, or session handle. This WASM build has 3 transient slots, so flushing between steps matters (TPM_RC_OBJECT_MEMORY otherwise).',
  },
  TPM2_Encapsulate: {
    hex: '0x000001A7',
    def: 'Part 3 §14.10, NEW in v1.85 — ML-KEM encapsulation: the TPM generates a fresh shared secret and returns it with the ciphertext. Note the shape: the caller never chooses the secret, unlike RSA_Encrypt.',
  },
  TPM2_Decapsulate: {
    hex: '0x000001A8',
    def: 'Part 3 §14.11, NEW in v1.85 — ML-KEM decapsulation: recovers the shared secret from a ciphertext using the private key. FIPS 203 implicit rejection means a corrupted ciphertext still returns SUCCESS — with a different, useless secret.',
  },
  TPM2_SignDigest: {
    hex: '0x000001A6',
    def: 'Part 3 §20.7, NEW in v1.85 — one-shot ML-DSA signing. With allowExternalMu the digest parameter carries the 64-byte external µ (FIPS 204 Algorithm 7); PQC signing got a NEW command rather than extending TPM2_Sign.',
  },
  TPM2_VerifyDigestSignature: {
    hex: '0x000001A5',
    def: 'Part 3 §20.4, NEW in v1.85 — verifies an ML-DSA signature over a digest/µ, returning a TPM_ST_DIGEST_VERIFIED ticket. Errata v1 §2.5: over an external µ the ticket cannot serve TPM2_PolicyAuthorize, so a conforming TPM SHOULD return a NULL ticket instead — this engine (built from RC4) still returns the real ticket.',
  },
  TPM2_SignSequenceStart: {
    hex: '0x000001AA',
    def: 'Part 3 §17.5, NEW in v1.85 — opens a streaming ML-DSA signing sequence. Pure ML-DSA must see the whole message (hash-then-sign changes the security claim), so the message streams INTO the signing operation.',
  },
  TPM2_SignSequenceComplete: {
    hex: '0x000001A4',
    def: 'Part 3 §20.6, NEW in v1.85 — appends the final chunk and returns the ML-DSA signature over the accumulated message. Consumes the sequence handle.',
  },
  TPM2_VerifySequenceStart: {
    hex: '0x000001A9',
    def: 'Part 3 §17.6, NEW in v1.85 — opens a streaming verification sequence. The hint parameter MUST be empty for ML-DSA (only EdDSA uses it).',
  },
  TPM2_VerifySequenceComplete: {
    hex: '0x000001A3',
    def: 'Part 3 §20.3, NEW in v1.85 — tests a signature against the streamed message; success returns a TPM_ST_MESSAGE_VERIFIED ticket, distinguishable on the wire from the digest-verified kind.',
  },
  TPM2_SequenceUpdate: {
    hex: '0x0000015C',
    def: 'Part 3 §17.7 — feeds message chunks into ANY open sequence: a v1.85 PQC verify sequence or a classical hash sequence. Addresses only the sequence object; no key handle.',
  },
  TPM2_Quote: {
    hex: '0x00000158',
    def: 'Part 3 §18.4 — signs a report of selected PCR values with an attestation key: the heart of remote attestation. Errata v1 §2.6: with schemeless signatures (pure ML-DSA, EdDSA) pcrDigest uses the signing key’s Name algorithm.',
  },
  TPM2_Certify: {
    hex: '0x00000148',
    def: 'Part 3 §18.2 — attests that a named object is loaded in this TPM, signed by an attestation key.',
  },
  TPM2_NV_ReadPublic: {
    hex: '0x00000169',
    def: 'Part 3 §31.6 — reads an NV index’s public area (attributes, size). How the EK-cert reader learns a certificate blob’s size before chunked reads.',
  },
  TPM2_NV_Read: {
    hex: '0x0000014E',
    def: 'Part 3 §31.13 — reads data from an NV index, up to MAX_NV_BUFFER_SIZE per call. The V2.7 EK certificates live in NV slots 0x01C00060–0x01C00074.',
  },
  // Classical commands (hex per TpmTypes.h; live-probed WS0 2026-07-23)
  TPM2_Sign: {
    hex: '0x0000015D',
    def: 'Part 3 §20.5 — classical one-shot signing over a caller-supplied digest (RSASSA here). The command TPM2_SignDigest modernizes; an RSA-2048 signature is 256 B vs ML-DSA-65’s 3309 B.',
  },
  TPM2_VerifySignature: {
    hex: '0x00000177',
    def: 'Part 3 §20.2 — classical verification; success returns a TPM_ST_VERIFIED (0x8022) ticket. Compare the two NEW v1.85 ticket tags for the PQC verify modes.',
  },
  TPM2_RSA_Encrypt: {
    hex: '0x00000174',
    def: 'Part 3 §14.2 — OAEP-wraps a caller-chosen secret to an RSA public key: classical key transport, the primitive ML-KEM encapsulation replaces. Note who picks the secret — the caller here, the TPM in Encapsulate.',
  },
  TPM2_RSA_Decrypt: {
    hex: '0x00000159',
    def: 'Part 3 §14.3 — recovers an OAEP-wrapped secret with the RSA private key. A corrupted ciphertext FAILS LOUDLY — no implicit rejection, unlike ML-KEM Decapsulate.',
  },
  TPM2_HashSequenceStart: {
    hex: '0x00000186',
    def: 'Part 3 §17.4 — opens a classical hash sequence: the TPM accumulates chunks and returns digest + hashcheck ticket at SequenceComplete. Classical TPMs hash-then-sign; pure ML-DSA cannot, which is why v1.85 added the sign-sequence commands.',
  },
  TPM2_SequenceComplete: {
    hex: '0x0000013E',
    def: 'Part 3 §17.8 — closes a hash sequence, returning the digest and a TPMT_TK_HASHCHECK ticket a follow-up TPM2_Sign can present as validation.',
  },
  // ── Structure tags (Part 2 §6.9; hex per tpmSerializer.ts/TpmTypes.h) ──
  TPM_ST_NO_SESSIONS: {
    hex: '0x8001',
    def: 'Command/response tag: no authorization sessions attached. Used by public-key-only operations (Encapsulate, VerifySignature, ReadPublic…).',
  },
  TPM_ST_SESSIONS: {
    hex: '0x8002',
    def: 'Command/response tag: an authorization area follows the handles. Private-key operations require it (Decapsulate, Sign, RSA_Decrypt…).',
  },
  TPM_ST_VERIFIED: {
    hex: '0x8022',
    def: 'Ticket tag from classical TPM2_VerifySignature: “this TPM verified this signature.” The pre-quantum member of the verified-ticket family.',
  },
  TPM_ST_HASHCHECK: {
    hex: '0x8024',
    def: 'Ticket tag proving a digest was computed by this TPM from non-restricted data. SequenceComplete produces one; TPM2_Sign consumes one (a NULL hashcheck is acceptable for unrestricted keys).',
  },
  TPM_ST_MESSAGE_VERIFIED: {
    hex: '0x8026',
    def: 'NEW in v1.85 — ticket tag from TPM2_VerifySequenceComplete: the signature was verified over a streamed MESSAGE. Distinguishable on the wire from digest-level verification.',
  },
  TPM_ST_DIGEST_VERIFIED: {
    hex: '0x8027',
    def: 'NEW in v1.85 — ticket tag from TPM2_VerifyDigestSignature: the signature was verified over a DIGEST (or external µ). See errata §2.5 for the external-µ NULL-ticket preference.',
  },
  // ── Return codes (per tpmCommandDefs.ts TPM_RC_TABLE / live probes) ──
  TPM_RC_SUCCESS: { hex: '0x00000000', def: 'Command completed successfully.' },
  TPM_RC_INITIALIZE: {
    hex: '0x00000100',
    def: 'TPM2_Startup called when already started. Expected — and an honest refusal this playground treats as a SUCCESSFUL lesson outcome, not an error to hide.',
  },
  TPM_RC_OBJECT_MEMORY: {
    hex: '0x00000902',
    def: 'Warning: no free transient slot (this build has 3). Flush a handle (TPM2_FlushContext) and retry.',
  },
  TPM_RC_NO_RESULT: {
    hex: '0x00000154',
    def: 'The operation produced no usable result. Errata v1 §2.4 designates it the expected error when ML-DSA rejection sampling exceeds the iteration limit. Also what this wasm build currently (incorrectly) returns for ECC key generation — a known fork bug.',
  },
  TPM_RC_SYMMETRIC: {
    def: 'A symmetric-algorithm field is wrong. Notably: a restricted SIGNING key must have symmetric=NULL — the AES block belongs only to restricted DECRYPT/storage templates (the WS0 probe hit exactly this).',
  },
  // ── Algorithm IDs (Part 2 §6.3; hex per tpmSerializer.ts/TpmTypes.h) ──
  TPM_ALG_RSA: {
    hex: '0x0001',
    def: 'RSA — the pre-quantum workhorse, broken by Shor’s algorithm on a cryptographically relevant quantum computer. Still in the v1.85 algorithm table, side by side with its replacements.',
  },
  TPM_ALG_SHA256: {
    hex: '0x000B',
    def: 'SHA-256 — used as nameAlg (object naming/authorization) and as the scheme hash for classical signing. Grover’s algorithm only halves its effective strength, so SHA-256 survives the transition.',
  },
  TPM_ALG_NULL: {
    hex: '0x0010',
    def: 'The “nothing here” algorithm ID: scheme=NULL on an unrestricted key means the caller picks the scheme per operation; a restricted key must pin a real scheme instead.',
  },
  TPM_ALG_RSASSA: {
    hex: '0x0014',
    def: 'RSASSA-PKCS1-v1_5 signing scheme. TPMS_SIGNATURE_RSA embeds its hash algorithm — the ML-DSA signature layout does not.',
  },
  TPM_ALG_OAEP: {
    hex: '0x0017',
    def: 'RSA-OAEP padding for encryption/key transport — the modern classical choice, and what TPM2_RSA_Encrypt uses in the T3 lesson.',
  },
  TPM_ALG_ECC: {
    hex: '0x0023',
    def: 'Elliptic-curve cryptography. Advertised by this build’s GetCapability, but ECC key generation currently fails in the WASM build (TPM_RC_NO_RESULT) — a known fork bug the playground discloses rather than hides.',
  },
  TPM_ALG_MLKEM: {
    hex: '0x00A0',
    def: 'NEW in v1.85 (Part 2 §6.3) — ML-KEM (FIPS 203), the module-lattice KEM. Optional in the Library spec; PC Client PTP v1.07 makes ML-KEM-768 or -1024 MANDATORY for PC-class TPMs.',
  },
  TPM_ALG_MLDSA: {
    hex: '0x00A1',
    def: 'NEW in v1.85 (Part 2 §6.3) — ML-DSA (FIPS 204), the module-lattice signature. Optional in the Library spec; PTP v1.07 makes ML-DSA-65 or -87 mandatory for PC-class TPMs.',
  },
  TPM_ALG_HASH_MLDSA: {
    hex: '0x00A2',
    def: 'NEW in v1.85 — HashML-DSA (FIPS 204 §5.4): the pre-hash ML-DSA variant, usable with the streaming sequence commands.',
  },
}

// ── Broader concept terms (rail sections) ──────────────────────────────────

export const TERMS: GlossaryTerm[] = [
  {
    id: 'hierarchy',
    label: 'Hierarchy',
    cat: 'protocol',
    def: 'One of the TPM’s key families — Owner (user keys), Endorsement (platform identity), Platform (firmware). Each has a seed; primary keys derive deterministically from seed + template, for classical and PQC keys alike.',
  },
  {
    id: 'ek',
    label: 'EK (Endorsement Key)',
    cat: 'protocol',
    def: 'The manufacturer-provisioned identity key in the Endorsement hierarchy. Classically RSA (activated via OAEP key transport); in the V2.7 profile, ML-KEM EKs are activated via encapsulation.',
  },
  {
    id: 'ak',
    label: 'AK (Attestation Key)',
    cat: 'protocol',
    def: 'A restricted signing key used to sign attestations (Quote). Restricted = it only signs TPM-generated data, so a relying party knows a Quote wasn’t forged over arbitrary input.',
  },
  {
    id: 'pcr',
    label: 'PCR',
    cat: 'protocol',
    def: 'Platform Configuration Register — accumulates measurements via extend (new = H(old ‖ measurement)). TPM2_Quote signs a digest of selected PCRs to prove platform state.',
  },
  {
    id: 'transient-handle',
    label: 'Transient vs persistent handles',
    cat: 'protocol',
    def: 'Transient objects (0x80xxxxxx) live in scarce RAM slots — 3 in this build — and vanish on restart. Persistent handles (0x81xxxxxx) survive; the V2.7 EKs sit at 0x810100B0–B6.',
  },
  {
    id: 'nv-index',
    label: 'NV index',
    cat: 'protocol',
    def: 'Non-volatile storage slot with its own access controls. EK certificates are provisioned into well-known NV indices (V2.7 §5.3.1: 0x01C00060–74) so software can find them.',
  },
  {
    id: 'restricted-key',
    label: 'Restricted key',
    cat: 'protocol',
    def: 'A key limited to TPM-blessed payloads: a restricted signer only signs TPM-generated digests (attestation), and must PIN its scheme at creation with symmetric=NULL. Restricted decrypt keys (storage/EKs) instead carry a symmetric block for child-key protection.',
  },
  {
    id: 'ticket',
    label: 'Ticket',
    cat: 'protocol',
    def: 'A small HMAC-backed structure the TPM issues to itself as transferable proof (hashcheck, verified). v1.85 added two new verified-ticket tags so digest-level and message-level PQC verification are distinguishable.',
  },
  {
    id: 'sequence-object',
    label: 'Sequence object',
    cat: 'protocol',
    def: 'A transient object accumulating streamed data across SequenceUpdate calls. Classical: hash sequences (hash-then-sign). v1.85 adds sign/verify sequences because pure ML-DSA must see the message itself.',
  },
  {
    id: 'external-mu',
    label: 'External µ (Mu)',
    cat: 'pqc',
    def: 'FIPS 204 Algorithm 7: µ = H(tr ‖ message) can be computed OUTSIDE the TPM and handed to TPM2_SignDigest when the key sets allowExternalMu — the 64-byte digest parameter in the T4 lesson. Errata §2.5 limits what the resulting verify ticket can be used for.',
  },
  {
    id: 'implicit-rejection',
    label: 'Implicit rejection',
    cat: 'pqc',
    def: 'FIPS 203: ML-KEM decapsulation never errors on a bad ciphertext — it returns a deterministic pseudorandom secret instead, denying attackers a failure oracle. RSA-OAEP fails loudly; the T3 lesson shows both behaviors live.',
  },
  {
    id: 'kem-vs-transport',
    label: 'KEM vs key transport',
    cat: 'pqc',
    def: 'RSA key transport: the caller picks a secret and encrypts it. A KEM: the algorithm GENERATES the secret during encapsulation. Not a drop-in swap — protocols must be re-plumbed, which is why v1.85 added new commands instead of overloading RSA_Encrypt.',
  },
  {
    id: 'crqc',
    label: 'CRQC',
    cat: 'pqc',
    def: 'Cryptographically Relevant Quantum Computer — one big enough to run Shor’s algorithm against real key sizes, breaking RSA and ECC. The reason the v1.85 algorithm table grew.',
  },
  {
    id: 'ptp-v107',
    label: 'PC Client PTP v1.07',
    cat: 'pqc',
    def: 'The published PC Client Platform TPM Profile v1.07 (2026) MANDATES ML-KEM and ML-DSA support for PC-class TPMs — the Library spec keeps them optional. Requirements live in profiles, not only the Library.',
  },
  {
    id: 'v27-ek-profile',
    label: 'EK Credential Profile v2.7',
    cat: 'pqc',
    def: 'The published TCG EK Credential Profile v2.7 defines PQC EK templates and their certificate NV slots — the basis for this playground’s V2.7 EKs tab. The issuer here is an ephemeral dev CA, honestly labeled as such.',
  },
  {
    id: 'spec-vs-engine',
    label: 'Spec vs engine drift',
    cat: 'pqc',
    def: 'This engine was built from v1.85 RC4 (Dec 2025); TCG published the final spec + Errata v1 on 2026-03-12. The T8 lesson shows where the two now differ (e.g. the errata’s NULL-ticket preference) — knowing HOW to spot drift is part of the curriculum.',
  },
]

/** This playground's `GlossaryData`, passed to the shared `GlossaryProvider`. */
export const TPM_GLOSSARY_DATA: GlossaryData = {
  tagGlossary: TAG_GLOSSARY,
  terms: TERMS,
  lookupDef: makeGlossaryLookup(TAG_GLOSSARY, TERMS),
  sectionTitles: {
    wire: 'Commands, tags & return codes',
    protocol: 'TPM concepts',
    pqc: 'Post-quantum transition',
  },
}
