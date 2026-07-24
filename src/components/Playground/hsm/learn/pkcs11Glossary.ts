// SPDX-License-Identifier: GPL-3.0-only
//
// pkcs11Glossary.ts — the PKCS#11 Learn tab's "explain everything" data
// layer, mirroring kmip/kmip3/glossary.ts's shape for the shared
// GlossaryProvider/GlossaryRail/Term kit. Unlike KMIP's TTLV wire tags,
// PKCS#11 has no wire format — `tagGlossary` instead holds the C API /
// object-attribute / mechanism vocabulary a learner hovers over inline.
// Constant values are cross-checked against ../../../wasm/softhsm/constants.ts
// and, for the newer v3.2 additions, against pqctoday-hsm/rust/src/constants.rs
// directly (not guessed) — a hex value is included only where verified.
import {
  makeGlossaryLookup,
  type GlossaryData,
  type GlossaryTerm,
  type TagGlossaryEntry,
} from '@/components/Playground/learnkit/glossaryTypes'

/** Keyed by the C function / attribute / mechanism name shown inline via `Term`. */
export const TAG_GLOSSARY: Record<string, TagGlossaryEntry> = {
  // ── Session & token lifecycle ────────────────────────────────────────────
  C_Initialize: {
    def: 'The first call any PKCS#11 application makes — loads the Cryptoki library and readies it for use. Calling it twice without an intervening C_Finalize fails with CKR_CRYPTOKI_ALREADY_INITIALIZED.',
  },
  C_Finalize: {
    def: 'Shuts the library down, invalidating every open session and handle. The mirror image of C_Initialize.',
  },
  C_GetSlotList: {
    def: 'Enumerates the slots (physical or virtual token sockets) the library knows about — the first thing you call to find a token to work with.',
  },
  C_InitToken: {
    def: 'Formats a token in a slot with a fresh Security Officer PIN and a label — the token-level equivalent of C_Initialize. Destroys any objects already on the token.',
  },
  C_OpenSession: {
    def: "Opens a session against a slot's token — the handle every later call (C_Login, C_GenerateKey, C_Sign, …) operates through.",
  },
  C_CloseSession: {
    def: 'Closes one session handle. C_CloseAllSessions closes every session on a slot at once.',
  },
  C_Login: {
    def: 'Authenticates a session as a user role (typically CKU_USER) with a PIN — required before most cryptographic and private-object operations. Logging in twice on the same session returns CKR_USER_ALREADY_LOGGED_IN.',
  },
  C_Logout: { def: 'Drops the authenticated role on a session, without closing it.' },
  C_GetSessionInfo: {
    def: 'Reads back a session\'s slot ID, state (e.g. "R/W User Functions"), and flags — how a lesson step proves login actually took effect.',
  },
  C_GetTokenInfo: {
    def: "Reads a token's identity — label, manufacturer, model, serial number, session/memory limits — independent of any open session.",
  },
  CKR_OK: {
    hex: '0x00000000',
    def: 'The universal PKCS#11 success code — every function returns this, and only this, on success.',
  },
  CKR_SESSION_HANDLE_INVALID: {
    hex: '0x000000B3',
    def: "Returned when a call names a session handle the library doesn't recognize — e.g. one that was never opened, or was already closed. The honest failure a lesson can trigger on demand, with no side effects, just by passing a handle nobody opened.",
  },
  CKR_USER_NOT_LOGGED_IN: {
    hex: '0x00000101',
    def: 'Returned by operations that require an authenticated session (most private-key and secret-key operations) when C_Login was never called on it.',
  },
  CKR_MECHANISM_INVALID: {
    hex: '0x00000070',
    def: "Returned when the mechanism named in a call isn't one the token supports for that operation — including when a key's own CKA_ALLOWED_MECHANISMS pins it to a different mechanism than the one requested.",
  },
  CKR_ATTRIBUTE_SENSITIVE: {
    // Not in this codebase's RV_NAMES table (src/wasm/softhsm.ts) to cross-check
    // against, so — per this file's own convention — no hex value is asserted here.
    def: 'Returned by C_GetAttributeValue when the requested attribute exists but is marked CKA_SENSITIVE (or the key is CKA_EXTRACTABLE=false) — the value genuinely cannot leave the token, by design, not by bug.',
  },
  CKR_ARGUMENTS_BAD: {
    hex: '0x00000007',
    def: "A call's arguments are malformed for the operation being attempted — e.g. a mechanism that requires parameters (like AES-GCM's IV) was called with none.",
  },

  // ── Objects & attributes ─────────────────────────────────────────────────
  C_CreateObject: {
    def: 'Creates a token or session object directly from a caller-supplied attribute template, rather than generating one.',
  },
  C_GenerateKey: {
    def: 'Generates one symmetric key (or other single-key object) inside the token from a mechanism + attribute template.',
  },
  C_GenerateKeyPair: {
    def: 'Generates a public/private key pair inside the token, returning two handles.',
  },
  C_GetAttributeValue: {
    def: "Reads one or more attributes off an object — the only way to inspect a key's metadata (or, for extractable keys, its value).",
  },
  C_SetAttributeValue: {
    def: 'Changes a writable attribute on an existing object (most are fixed at creation).',
  },
  C_FindObjectsInit: {
    def: 'Begins a search for objects matching an attribute template — paired with C_FindObjects and C_FindObjectsFinal.',
  },
  C_DestroyObject: {
    def: 'Deletes an object and, for sensitive key material, the underlying bytes.',
  },
  CKO_PUBLIC_KEY: {
    hex: '0x00000002',
    def: 'CKA_CLASS value for a public-key object (verify, encrypt, wrap — the non-secret half of a keypair).',
  },
  CKO_PRIVATE_KEY: {
    hex: '0x00000003',
    def: 'CKA_CLASS value for a private-key object (sign, decrypt, unwrap, decapsulate).',
  },
  CKO_SECRET_KEY: {
    hex: '0x00000004',
    def: 'CKA_CLASS value for a symmetric-key object (AES, HMAC, ChaCha20, …) — usable for both directions of an operation pair.',
  },
  CKO_PROFILE: {
    hex: '0x00000009',
    def: 'New object class introduced by PKCS#11 Profiles v3.2 §3: a token exposes one CKO_PROFILE object per conformance profile it claims — discoverable by any application via a plain C_FindObjects, no vendor-specific query needed.',
  },
  CKA_CLASS: {
    hex: '0x00000000',
    def: 'Every object has one — which of the object classes (CKO_PUBLIC_KEY, CKO_SECRET_KEY, CKO_PROFILE, …) this is.',
  },
  CKA_KEY_TYPE: {
    hex: '0x00000100',
    def: 'Which key algorithm family this key object holds — CKK_AES, CKK_RSA, CKK_ML_DSA, …',
  },
  CKA_TOKEN: {
    def: 'True = the object survives session close (persisted on the token); false = a session object, gone when the session closes.',
  },
  CKA_SENSITIVE: {
    def: "True = this key's value can never be read back via C_GetAttributeValue, even by an authenticated session — CKR_ATTRIBUTE_SENSITIVE is the honest, permanent answer, not a bug.",
  },
  CKA_EXTRACTABLE: {
    def: 'True = this key MAY leave the token, wrapped, via C_WrapKey. Once created false, PKCS#11 guarantees it can never be flipped true later (see CKA_NEVER_EXTRACTABLE).',
  },
  CKA_PROFILE_ID: {
    hex: '0x00000601',
    def: 'The single attribute on a CKO_PROFILE object — which conformance profile it names (e.g. CKP_BASELINE_PROVIDER). Read-only, fixed at creation.',
  },
  CKA_ALLOWED_MECHANISMS: {
    hex: '0x40000600',
    def: 'v3.2 §4.8 Table 13 — an array attribute pinning a key to a specific allow-list of mechanisms. Any call naming a mechanism outside the list fails CKR_MECHANISM_INVALID, even if the mechanism itself is otherwise valid for that key type — the enforcement happens per-key, not just per-token.',
  },
  CKA_PARAMETER_SET: {
    def: "Which named parameter set a PQC key uses — e.g. one of SLH-DSA's 12 CKP_SLH_DSA_* sets, distinct from the generic CKA_KEY_TYPE/CKA_KEY_TYPE algorithm family.",
  },
  CKA_ENCAPSULATE: {
    def: "A public key's KEM capability flag — this key may be used as the target of C_EncapsulateKey.",
  },
  CKA_DECAPSULATE: {
    def: "A private key's KEM capability flag — this key may be used with C_DecapsulateKey to recover the shared secret.",
  },
  CKA_TRUSTED: {
    hex: '0x00000086',
    def: 'v3.2 §4.2 Table 13 footnote 10 — "Can only be set to CK_TRUE by the SO user." This engine enforces that more strictly than the footnote alone implies: silently dropped from C_GenerateKey templates (no error — the key is created, just without the flag), and permanently read-only via C_SetAttributeValue for every caller, SO included, once an object exists. The only live path to CKA_TRUSTED=TRUE is C_CreateObject (raw key import) on an SO session.',
  },
  CKA_WRAP_WITH_TRUSTED: {
    hex: '0x00000210',
    def: 'v3.2 §4.8/§4.10 — pins a key so it can only be wrapped by a wrapping key whose own CKA_TRUSTED=TRUE. Unlike CKA_TRUSTED itself, this one is ordinary client-settable — no SO gate.',
  },
  CKR_ATTRIBUTE_READ_ONLY: {
    hex: '0x00000010',
    def: 'Returned when a template tries to change an attribute this token treats as fixed — CKA_TRUSTED, always, for any caller, is the example this curriculum uses.',
  },
  CKR_KEY_NOT_WRAPPABLE: {
    hex: '0x00000069',
    def: "Returned by C_WrapKey when the target key's CKA_WRAP_WITH_TRUSTED=TRUE policy isn't satisfied — the wrapping key's own CKA_TRUSTED attribute is FALSE.",
  },
  CKR_USER_ANOTHER_ALREADY_LOGGED_IN: {
    hex: '0x00000104',
    def: 'PKCS#11 login is per-token, not per-session — attempting to log in as SO while a USER session is active on the same token (or vice versa) gets this, not a silent role switch. C_Logout first.',
  },

  // ── Mechanisms & mechanism info ──────────────────────────────────────────
  C_GetMechanismList: {
    def: "Enumerates every mechanism (algorithm+mode combination) the token's currently-selected slot supports.",
  },
  C_GetMechanismInfo: {
    def: 'For one mechanism, returns its supported key-size range and capability flags (CKF_SIGN, CKF_ENCRYPT, CKF_GENERATE_KEY_PAIR, …).',
  },
  CKM_AES_KEY_GEN: {
    hex: '0x00001080',
    def: 'Mechanism for C_GenerateKey to produce a fresh AES key of the requested length.',
  },
  CKM_AES_GCM: {
    hex: '0x00001087',
    def: 'AES in Galois/Counter Mode — authenticated encryption; requires a CK_GCM_PARAMS structure (IV, AAD, tag length) as the mechanism parameter.',
  },
  CKM_AES_KW: {
    def: 'RFC 3394 AES Key Wrap — the classic mechanism for C_WrapKey/C_UnwrapKey to move key material off/onto a token without ever exposing it in the clear.',
  },
  CKM_ML_KEM: {
    def: 'PKCS#11 v3.2 §6.68 mechanism family for ML-KEM (FIPS 203) key generation and C_EncapsulateKey/C_DecapsulateKey.',
  },
  CKM_ML_DSA: {
    def: 'PKCS#11 v3.2 §6.67 mechanism family for ML-DSA (FIPS 204) key generation, C_Sign, and C_Verify.',
  },
  CKM_SLH_DSA: {
    def: 'PKCS#11 v3.2 §6.69 mechanism family for SLH-DSA (FIPS 205) — the stateless hash-based signature scheme, 12 named parameter sets.',
  },

  // ── PQC operation shape ──────────────────────────────────────────────────
  C_EncapsulateKey: {
    def: "PKCS#11 v3.2's KEM entry point — takes a public key, returns a ciphertext AND (as a new, usually session-only) secret-key object holding the shared secret. No classical PKCS#11 call has this two-output shape.",
  },
  C_DecapsulateKey: {
    def: "The KEM's other half — takes a private key and the ciphertext C_EncapsulateKey produced, returns a secret-key object holding the SAME shared secret. No plaintext shared-secret bytes need ever leave the token.",
  },
  CK_SIGN_ADDITIONAL_CONTEXT: {
    def: "Mechanism-parameter structure carrying an ML-DSA/SLH-DSA signature's optional context string and hedge preference — where CKH_HEDGE_* selects between randomized and deterministic signing.",
  },
}

export type TermCategory = GlossaryTerm['cat']

/** Broader PKCS#11/crypto concepts, not tied to one C symbol. */
export const TERMS: GlossaryTerm[] = [
  {
    id: 'cryptoki',
    label: 'Cryptoki',
    cat: 'protocol',
    def: 'The formal name of the PKCS#11 API itself ("Cryptographic Token Interface") — "PKCS#11" names the standard document, "Cryptoki" names the C API it defines.',
  },
  {
    id: 'slot-vs-token',
    label: 'Slot vs. token',
    cat: 'protocol',
    def: 'A slot is a socket (physical or virtual) that may or may not currently hold a token; the token is the actual cryptographic device/store plugged into it. SoftHSM presents both as software.',
  },
  {
    id: 'session-state',
    label: 'Session state',
    cat: 'protocol',
    def: 'A session is Public or User (authenticated via C_Login) crossed with Read-Only or Read/Write — four states in total, e.g. "R/W User Functions" — visible via C_GetSessionInfo.',
  },
  {
    id: 'object-class',
    label: 'Object class',
    cat: 'protocol',
    def: 'Every PKCS#11 object (CKA_CLASS) is exactly one of a fixed set: public key, private key, secret key, certificate, data, domain parameters, and (new in v3.2) profile.',
  },
  {
    id: 'template',
    label: 'Attribute template',
    cat: 'protocol',
    def: 'An array of (type, value) pairs describing an object to create/generate, or the attributes to fetch/search on — the same CK_ATTRIBUTE[] shape used by C_CreateObject, C_GenerateKey, C_GetAttributeValue, and C_FindObjectsInit alike.',
  },
  {
    id: 'sensitive-vs-extractable',
    label: 'Sensitive vs. extractable',
    cat: 'protocol',
    def: "Two independent attributes that are easy to conflate: CKA_SENSITIVE blocks reading a key's value directly; CKA_EXTRACTABLE blocks wrapping it out at all. A key can be extractable-but-sensitive: it can leave (wrapped) but never be read in the clear on this token.",
  },
  {
    id: 'baseline-provider',
    label: 'Baseline Provider profile',
    cat: 'protocol',
    def: "PKCS#11 Profiles v3.2's minimum conformance profile (CKP_BASELINE_PROVIDER) — a fixed, spec-defined list of functions and mechanisms every claiming token must support, discoverable via a CKO_PROFILE object rather than vendor documentation.",
  },
  {
    id: 'kem',
    label: 'KEM (Key Encapsulation Mechanism)',
    cat: 'pqc',
    def: "A primitive shaped as Encapsulate (recipient's public key → ciphertext + shared secret) / Decapsulate (ciphertext + private key → the same shared secret) — the shape C_EncapsulateKey/C_DecapsulateKey add to PKCS#11 v3.2. Classical Diffie-Hellman (C_DeriveKey) is a different shape entirely.",
  },
  {
    id: 'lattice',
    label: 'Lattice-based cryptography',
    cat: 'pqc',
    def: 'Security rests on the hardness of geometry problems in high-dimensional lattices (e.g. Learning With Errors) — believed hard even for a quantum computer. ML-KEM and ML-DSA are lattice-based.',
  },
  {
    id: 'hash-based',
    label: 'Hash-based signature',
    cat: 'pqc',
    def: "Security rests on nothing but the hash function's own security — the most conservative assumption class available. SLH-DSA is hash-based: tiny keys, large signatures, 12 parameter sets trading speed against size.",
  },
  {
    id: 'hedged-signing',
    label: 'Hedged signing',
    cat: 'pqc',
    def: 'Mixing fresh randomness into an otherwise-deterministic signature scheme as a defense against certain fault and side-channel attacks. PKCS#11 v3.2 exposes this as an explicit per-call choice (CKH_HEDGE_PREFERRED / CKH_HEDGE_REQUIRED / CKH_DETERMINISTIC_REQUIRED) rather than a fixed engine behavior.',
  },
  {
    id: 'shor',
    label: "Shor's algorithm",
    cat: 'pqc',
    def: 'A quantum algorithm giving an exponential speedup at integer factorization and discrete logarithms — breaks RSA, ECDSA, ECDH outright once a large enough quantum computer exists. The reason asymmetric crypto must migrate.',
  },
  {
    id: 'grover',
    label: "Grover's algorithm",
    cat: 'pqc',
    def: "A quantum algorithm giving only a quadratic speedup at unstructured search — halves a symmetric key's effective strength. AES-256 loses headroom it already had to spare.",
  },
  {
    id: 'fips',
    label: 'FIPS 203 / 204 / 205',
    cat: 'pqc',
    def: "NIST's finalized PQC standards (Aug 2024): FIPS 203 = ML-KEM (key establishment), FIPS 204 = ML-DSA (signatures), FIPS 205 = SLH-DSA (hash-based signatures) — the three algorithm families PKCS#11 v3.2 adds native mechanisms for.",
  },
  {
    id: 'trust-objects',
    label: 'Trust objects (CKO_TRUST / CKT_TRUST_ANCHOR)',
    cat: 'protocol',
    def: 'v3.2 §4.7 — a separate object class binding trusted usages (server auth, code signing, …) to a specific certificate, used to build certificate trust chains. CKT_TRUST_ANCHOR marks a certificate trusted as a root for chain validation. Not the same mechanism as CKA_TRUSTED/CKA_WRAP_WITH_TRUSTED (§4.2/§4.8, this lesson) — a different §4.7 concept this engine does not implement at all.',
  },
  {
    id: 'validation-objects',
    label: 'Validation objects (CKO_VALIDATION)',
    cat: 'protocol',
    def: 'v3.2 §4.15 — describes which third-party validation (e.g. NIST CMVP) a module conforms to. Session-level validation flags (§4.15.3.1, C_GetSessionValidationFlags) ARE implemented here — honestly, always empty, since this build has no such validation. Key-object-level flags (§4.15.3.2, CKA_OBJECT_VALIDATION_FLAGS) and CKO_VALIDATION objects themselves are not implemented at all — a distinct gap from trust objects above.',
  },
]

export const TERM_BY_ID: Record<string, GlossaryTerm> = Object.fromEntries(
  TERMS.map((t) => [t.id, t])
)

export const lookupGlossaryDef = makeGlossaryLookup(TAG_GLOSSARY, TERMS)

/** This playground's `GlossaryData`, passed to the shared `GlossaryProvider`. */
export const PKCS11_GLOSSARY_DATA: GlossaryData = {
  tagGlossary: TAG_GLOSSARY,
  terms: TERMS,
  lookupDef: lookupGlossaryDef,
  sectionTitles: {
    wire: 'API & attributes',
    protocol: 'Protocol concepts',
    pqc: 'Post-quantum concepts',
  },
}
