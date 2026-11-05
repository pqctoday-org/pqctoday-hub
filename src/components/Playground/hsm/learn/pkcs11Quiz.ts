// SPDX-License-Identifier: AGPL-3.0-only
//
// pkcs11Quiz.ts — knowledge-check question banks for the PKCS#11 Learn tab,
// keyed by `Pkcs11Lesson.id`. Every question is answerable from the lesson
// the learner just ran — no outside trivia.
import type { QuizQuestion } from '@/components/Playground/learnkit/QuizCard'

export const QUIZZES: Record<string, QuizQuestion[]> = {
  'cryptoki-model': [
    {
      q: 'Why did C_GetTokenInfo succeed without a session, while C_GetSessionInfo needed one?',
      options: [
        "C_GetTokenInfo is a legacy call that doesn't check permissions",
        "A token's identity belongs to the slot, independent of any session; a session's state can only exist once a session has actually been opened",
        'It was a bug in this specific build',
      ],
      answer: 1,
      why: "PKCS#11 layers slot → token → session deliberately. Token identity (label, manufacturer) is a property of the device itself, readable by anyone who can see the slot. Session state doesn't exist until C_OpenSession creates it.",
    },
    {
      q: 'What did passing session handle 999999 actually prove?',
      options: [
        'That the token is broken',
        'That PKCS#11 returns a specific, honest error (CKR_SESSION_HANDLE_INVALID) for a handle it never issued, rather than crashing or silently doing nothing',
        'That session handles must always be under 1000',
      ],
      answer: 1,
      why: "Every PKCS#11 return code is part of the spec's contract. CKR_SESSION_HANDLE_INVALID is the library telling you, precisely, what's wrong — the same honesty theme the KMIP playground's lessons demonstrate with refused operations.",
    },
  ],
  'objects-attributes': [
    {
      q: 'A key was generated with CKA_EXTRACTABLE=false. What happened when the lesson tried to read CKA_VALUE?',
      options: [
        'It returned zeroed-out bytes',
        'The call refused with an attribute-sensitive error — the value genuinely cannot be read back, by design',
        'It succeeded, because CKA_SENSITIVE was not explicitly set',
      ],
      answer: 1,
      why: 'Generating a key non-extractable auto-sets CKA_SENSITIVE too in this engine. The refusal is not a missing feature — it is the entire point of routing key storage through an HSM instead of application memory.',
    },
  ],
  'mechanism-discovery': [
    {
      q: 'Why did asking about mechanism type 0x0eadbeef fail?',
      options: [
        "It's a reserved value that always errors",
        "The token doesn't recognize it as any mechanism it implements — the same honest 'I don't know this' answer as an unopened session handle",
        'Mechanism types must be under 0x100',
      ],
      answer: 1,
      why: 'C_GetMechanismInfo returning failure for an unrecognized type is normal, expected behavior — exactly why production code should query capabilities with C_GetMechanismList/C_GetMechanismInfo rather than assuming them.',
    },
  ],
  'symmetric-encryption': [
    {
      q: 'What did flipping one byte of the AES-GCM ciphertext actually prove?',
      options: [
        'That AES-GCM is broken',
        "That GCM's authentication tag detects ANY tampering to the ciphertext, causing decryption to refuse rather than silently return corrupted plaintext",
        'That the key was wrong',
      ],
      answer: 1,
      why: 'This is the core value of an AEAD mode: a non-authenticated mode like CTR would have decrypted the tampered bytes into garbage plaintext with no error at all.',
    },
  ],
  'digest-random': [
    {
      q: 'How should you interpret the digest and random-byte examples?',
      options: [
        'Random-byte generation is correct only if consecutive outputs can never repeat',
        'SHA-256 is deterministic; a cryptographic generator may also use deterministic internals, but its output should be unpredictable without knowledge of its secret state and seed',
        'Two different random-byte samples prove that the generator and entropy source are secure',
      ],
      answer: 1,
      why: 'Random outputs can repeat. Two different samples do not establish unpredictability or validate seeding. A deterministic random bit generator is not the same as hashing public inputs and treating the digest as fresh randomness.',
    },
  ],
  'sign-verify': [
    {
      q: 'hsm_rsaVerify returned false for the corrupted signature instead of throwing an error. What does that distinction mean?',
      options: [
        'It is a bug — it should have thrown',
        'Verification is a real pass/fail ANSWER (CKR_OK vs CKR_SIGNATURE_INVALID), not an exceptional condition — code must check the boolean, not just catch exceptions',
        'RSA signatures cannot actually be verified this way',
      ],
      answer: 1,
      why: 'Treating "verify returned false" the same as "verify threw" is a common integration bug — they mean different things and calling code must handle the boolean result explicitly.',
    },
  ],
  'key-wrap': [
    {
      q: 'Why did wrapping the non-extractable key fail, while wrapping the second, extractable key succeeded?',
      options: [
        'The wrapping key was different each time',
        'CKA_EXTRACTABLE is a property of the key being wrapped (the target), not the wrapping key — it is the specific, opt-in gate for "may this key ever leave the token"',
        'Only AES keys can be wrapped',
      ],
      answer: 1,
      why: 'This is the attribute that decides whether key export is even possible, independent of who holds the wrapping key or what mechanism is used.',
    },
  ],
  'agreement-derivation': [
    {
      q: 'The lesson derived keys on both sides and returned two handles. What does that establish?',
      options: [
        'The two key values were compared and proved equal',
        'Both derivation operations returned handles; this lesson did not compare the derived values or perform key confirmation',
        'A shared secret was transmitted between the parties',
      ],
      answer: 1,
      why: 'Handles identify objects; their existence does not establish that the objects contain equal key material. Production integration testing needs an appropriate agreement or key-confirmation check while preserving required key protections.',
    },
  ],
  'whats-new': [
    {
      q: 'What does finding a CKO_PROFILE object with CKA_PROFILE_ID=1 (CKP_BASELINE_PROVIDER) tell a caller?',
      options: [
        "It doesn't — it's cosmetic metadata",
        "It exposes the token's declared support for that standard profile; profile objects already existed before v3.2",
        'It replaces C_GetMechanismList entirely',
      ],
      answer: 1,
      why: 'Profiles v3.0 and specification v3.1 already defined this discovery mechanism. A profile declaration does not replace mechanism discovery or independent evidence of implementation conformance.',
    },
  ],
  'signing-goes-lattice': [
    {
      q: 'The ML-DSA-65 signature came out several times larger than the RSA-3072 signature of the identical message. What does that cost actually come from?',
      options: [
        'A bug in this specific implementation',
        'The lattice-hardness assumption ML-DSA rests on — it is an inherent, permanent property of the algorithm, not an engineering shortfall to be optimized away',
        'ML-DSA signs the message twice internally',
      ],
      answer: 1,
      why: 'Migration planning has to budget for this permanently larger footprint (storage, bandwidth, protocol overhead) — it is not something a future software update fixes.',
    },
  ],
  'kem-api': [
    {
      q: 'C_EncapsulateKey only needs the PUBLIC key, yet produces a secret only the matching PRIVATE key can recover via C_DecapsulateKey. How is that different from ECDH?',
      options: [
        "It isn't different — it's the same operation with a new name",
        'ECDH has both sides run the SAME derive operation; a KEM is asymmetric — one side encapsulates (needs only the public key), the other decapsulates (needs the ciphertext plus the private key)',
        'C_EncapsulateKey secretly performs ECDH internally',
      ],
      answer: 1,
      why: 'This is exactly why porting ECDH-shaped code to a KEM requires restructuring the call sequence, not just swapping an algorithm name — the two primitives have genuinely different call shapes.',
    },
  ],
  'hash-based-signatures': [
    {
      q: 'This lesson uses SLH-DSA-SHA2-128s: a 32-byte public key and a 7,856-byte signature. Why consider a hash-based signature alongside ML-DSA?',
      options: [
        'They would never choose it — it is strictly worse',
        'Its hash-based construction offers a different cryptographic foundation from lattice-based ML-DSA, with a signature-size and performance trade-off to evaluate for the intended application',
        'SLH-DSA is actually faster than ML-DSA in every case',
      ],
      answer: 1,
      why: 'Sizes depend on the parameter set: FIPS 205 Table 2 gives 7,856 bytes for SHA2-128s signatures and 17,088 for SHA2-128f; both public keys are 32 bytes. Compare the exact profile and application requirements rather than treating all SLH-DSA signatures as the same size.',
    },
  ],
  'hedged-signing': [
    {
      q: 'This lesson compared repeated signature bytes without verifying the signatures. What can you conclude from that comparison?',
      options: [
        'Hedging makes signatures invalid half the time',
        'The comparison shows whether the bytes repeat; signature validity still requires a separate verification check',
        'Only deterministic signatures are cryptographically valid',
      ],
      answer: 1,
      why: 'Equal or different bytes alone do not establish signature validity. Verify each signature against its public key, message and context before claiming it is valid.',
    },
  ],
  'authenticated-wrap': [
    {
      q: 'Which comparison is accurate after this AES-GCM wrapping example?',
      options: [
        'AES-KW has no integrity protection and accepts any modified wrapped key',
        'Both AES-KW and AES-GCM protect wrapped-key integrity; this GCM interface also supports a per-wrap IV and associated data',
        'C_WrapKeyAuthenticated only works on RSA keys',
      ],
      answer: 1,
      why: 'AES-KW checks integrity during unwrapping; it is not an unauthenticated alternative. The mechanisms have different formats and interface requirements. This GCM example uses empty associated data, so it does not demonstrate binding additional metadata.',
    },
  ],
  'policy-pinning': [
    {
      q: 'CKM_AES_ECB is a perfectly valid mechanism for AES keys in general, yet it was refused on the pinned key. Why?',
      options: [
        "The token doesn't actually support CKM_AES_ECB at all",
        "CKA_ALLOWED_MECHANISMS pins policy PER KEY, not per token — this specific key's allow-list excludes ECB even though the token as a whole supports it",
        'ECB mode was deprecated in v3.2',
      ],
      answer: 1,
      why: 'This is what makes allowed-mechanisms genuinely useful as a policy control: it restricts what a SPECIFIC key may be used for, enforced by the token itself rather than trusted-but-bypassable application logic.',
    },
  ],
  'inspecting-policy': [
    {
      q: 'Reading CKA_ALLOWED_MECHANISMS back off the key returned exactly [CKM_AES_GCM] — the same value set at creation. Why does that round trip matter?',
      options: [
        "It doesn't — the value could just be assumed",
        'It proves the enforcement in lesson B7 is backed by a real, auditable, readable policy on the token — not an opaque internal rule nobody can verify after the fact',
        'It only matters for debugging this specific engine',
      ],
      answer: 1,
      why: "A policy nobody can read back is a policy no compliance review can actually confirm. This is what turns pinning from 'trust us' into something independently verifiable.",
    },
  ],
  'migration-capstone': [
    {
      q: 'After generating the ML-DSA successor key, was the legacy RSA key immediately destroyed?',
      options: [
        'Yes — generating a successor automatically retires the predecessor',
        'No — both local key pairs remained available until the explicit C_DestroyObject step; creating a successor did not automatically delete the predecessor',
        'No — the legacy key becomes read-only automatically',
      ],
      answer: 1,
      why: 'Provisioning a successor and deleting local predecessor objects are separate actions. This sample does not perform a deployment cutover or revoke trust in verification keys held elsewhere.',
    },
  ],
  'trust-wrapping-policy': [
    {
      q: 'Setting CKA_TRUSTED=true in a C_GenerateKey template returned CKR_OK. Was the key actually trusted?',
      options: [
        'Yes — a success return code means every requested attribute was applied',
        'No — this engine silently drops CKA_TRUSTED from generate templates instead of erroring; the key is created fine, just never actually trusted, and reading it back proves that',
        'Only if CKA_EXTRACTABLE was also true',
      ],
      answer: 1,
      why: "A CKR_OK return only means the operation as a whole succeeded — it doesn't guarantee every attribute in the template was honored exactly as written. This is why the lesson reads CKA_TRUSTED back rather than trusting the generate call's success code alone.",
    },
    {
      q: 'Why did wrapping the pinned key with an ordinary wrapping key fail with CKR_KEY_NOT_WRAPPABLE rather than a generic permission error?',
      options: [
        "PKCS#11 has a dedicated return code for exactly this policy violation — the wrapping key lacks CKA_TRUSTED=true, which the target's CKA_WRAP_WITH_TRUSTED requires",
        'It was a random transient failure',
        'The wrapping key was the wrong algorithm',
      ],
      answer: 0,
      why: 'CKR_KEY_NOT_WRAPPABLE is the spec-defined answer specifically for a wrap-with-trusted policy mismatch — distinct from CKR_KEY_FUNCTION_NOT_PERMITTED (missing CKA_WRAP) or CKR_MECHANISM_INVALID (wrong algorithm).',
    },
    {
      q: 'The SO successfully imported a trusted wrapping key. Could that same SO later revoke it (set CKA_TRUSTED back to false)?',
      options: [
        'Yes — the SO can always change any attribute',
        'No — this engine treats CKA_TRUSTED as fixed at creation for every caller, SO included; C_SetAttributeValue refuses it unconditionally',
        'Only after logging out and back in as SO again',
      ],
      answer: 1,
      why: "This is the lesson's closing point: SO-only-to-grant and permanently-fixed-once-granted are two separate guarantees. A policy the granter can quietly loosen later isn't the same guarantee as one nobody can ever change.",
    },
    {
      q: 'Why did the lesson need to log out before logging in as SO, instead of just calling C_Login(SO) directly on the already-logged-in-as-USER session?',
      options: [
        "PKCS#11 login is per-token, not per-session — a second login attempt on a token that's already authenticated a different role fails CKR_USER_ANOTHER_ALREADY_LOGGED_IN",
        "It was just this codebase's convention, not a spec requirement",
        'C_Login always requires a fresh session handle',
      ],
      answer: 0,
      why: 'This trips up nearly everyone building their first multi-role PKCS#11 integration: login state lives at the token level, so switching roles on a live session always means C_Logout first.',
    },
  ],
  'certificate-discovery': [
    {
      q: 'Why could the short flow get away with a single C_GetSlotList call?',
      options: [
        'Because the playground only ever has one slot',
        'Because PKCS#11 lets the caller pass a buffer sized in advance; the size query (NULL pSlotList) is only needed when the caller cannot bound the slot count',
        'Because C_GetSlotList caches its answer between calls',
      ],
      answer: 1,
      why: '§5.5.1: if pSlotList is large enough the list comes back directly, and "multiple calls to C_GetSlotList are by no means required". In this engine the size query also has a side effect — it is the call that adds a spare slot — which the long flow then has to skip.',
    },
    {
      q: 'Both flows filtered on CKA_CLASS = CKO_CERTIFICATE. What did that filter save?',
      options: [
        'Nothing — the token returns every object anyway',
        "The key objects and the token's CKO_PROFILE objects never came back, so no call was spent finding out which handles were certificates",
        'It made the certificates readable without a login',
      ],
      answer: 1,
      why: 'C_FindObjectsInit matches the template byte for byte inside the token (§5.7.7). Without the filter every object would be returned and the client would need an extra C_GetAttributeValue(CKA_CLASS) per object to sort them.',
    },
    {
      q: 'The long flow used twice as many C_GetAttributeValue calls. Did it return different data?',
      options: [
        'Yes — the length query reveals extra attributes',
        'No — the first call only asks for lengths (pValue = NULL), the second fetches the same values the short flow read in one call with pre-sized buffers',
        'Yes — it also reads the private keys',
      ],
      answer: 1,
      why: '§5.7.5 case 3: a NULL pValue returns just the exact length. That two-call pattern is the safe default when sizes are unknown; when the caller can bound them (labels, IDs, subject names), one call per object is enough.',
    },
  ],
  // ── PKCS#11 v3.3 (working draft) track ─────────────────────────────────────
  'v33-what-is-v33': [
    {
      q: 'An engine implements every v3.3 composite mechanism. What Cryptoki version does C_GetInfo report?',
      options: [
        '3.3, because it implements v3.3',
        '3.2 — the v3.3 draft header itself still declares version 3.2, so the mechanism list is the only reliable test',
        'It depends on the parameter set',
      ],
      answer: 1,
      why: 'v3.3 is an unpublished working draft. Its codepoints are approved, but CRYPTOKI_VERSION_MINOR is still 2, so feature detection goes through C_GetMechanismList / C_GetMechanismInfo.',
    },
    {
      q: 'Which kind of hybrid has its own PKCS#11 key type?',
      options: [
        'TLS hybrid groups such as X25519MLKEM768',
        'HPKE hybrid KEMs',
        'Composites — CKK_COMP_KEM and CKK_COMP_SIG hold both halves in one object',
      ],
      answer: 2,
      why: 'TLS hybrid groups and HPKE are built by the caller out of ordinary keys. Only composites get a key type, and with it one handle for both halves.',
    },
  ],
  'v33-composite-mldsa': [
    {
      q: 'Why did verification fail after the ECDSA half was stripped, even though the ML-DSA half was valid?',
      options: [
        'Because ML-DSA signatures expire',
        'A composite signature is valid only if BOTH halves verify over M′; one valid half is not enough',
        'Because the context was lost',
      ],
      answer: 1,
      why: 'Composite verification checks both component signatures. Stripping a half — the attack composites are designed to stop — leaves an invalid composite signature.',
    },
    {
      q: 'What does CKM_COMP_SIG_EXTERNAL_HASH take as input?',
      options: [
        'The full message, streamed through C_SignUpdate',
        'The pre-hash PH(M), exactly the set’s hash length, in one single-part call',
        'The ML-DSA µ value',
      ],
      answer: 1,
      why: 'The caller hashes M itself. The mechanism is single-part only and refuses an input of the wrong length, as the 63-byte step showed.',
    },
  ],
  'v33-composite-mlkem': [
    {
      q: 'The same ML-KEM and X25519 secrets went into a TLS hybrid group and into the composite combiner. Why were the results different?',
      options: [
        'One of the two calculations is wrong',
        'TLS concatenates the two secrets; the composite combiner hashes them together with the classical ciphertext, the classical public key and a per-set label',
        'Composite KEM uses a different ML-KEM',
      ],
      answer: 1,
      why: 'Both are correct for their setting. TLS binds the key shares through its transcript hash; a composite KEM used outside TLS has no transcript, so it binds them in the combiner. Treating one as the other gives two different keys.',
    },
    {
      q: 'What does C_DecapsulateKey(CKM_COMP_KEM) return?',
      options: [
        'The two component secrets',
        'A handle to a generic secret key holding the 32-byte combined secret',
        'The classical ciphertext',
      ],
      answer: 1,
      why: 'Only the combined secret leaves the decapsulation, as a key object. Its bytes need never leave the token.',
    },
  ],
  'v33-external-mu': [
    {
      q: 'Why does CKM_ML_DSA_EXTERNAL_MU take no context?',
      options: [
        'Contexts are not allowed in v3.3',
        'The context is already inside µ, which was computed from TR, the context and the message',
        'Because µ is signed with SHA-256',
      ],
      answer: 1,
      why: 'µ = SHAKE256(TR ‖ 0 ‖ len(ctx) ‖ ctx ‖ M). Once µ exists, the context has been applied.',
    },
    {
      q: 'Who can verify a signature made with CKM_ML_DSA_EXTERNAL_MU?',
      options: [
        'Only a verifier that also supports external µ',
        'Any ordinary ML-DSA verifier, given the message and context',
        'Nobody without the TR value',
      ],
      answer: 1,
      why: 'The lesson verified it with plain CKM_ML_DSA over the message. External µ changes where µ is computed, not the signature.',
    },
  ],
  'v33-keys-remaining': [
    {
      q: 'What changed between CKA_HSS_KEYS_REMAINING and CKA_KEYS_REMAINING?',
      options: [
        'The value moved to a new codepoint',
        'Only the name: same value 0x61c, the old name kept as an alias, and the attribute now covers XMSS and XMSS^MT too',
        'The counter now counts up',
      ],
      answer: 1,
      why: 'The v3.3 draft renames the attribute and widens it. Code using either name reads the same attribute.',
    },
  ],
  'v33-renamed-deprecated': [
    {
      q: 'You upgrade to the v3.3 header and get deprecation warnings for CKM_TLS12_KDF. Does your token stop working?',
      options: [
        'Yes — deprecated mechanisms are removed',
        'No — no value changed; deprecated means "do not use in new code"',
        'Only on v3.3 tokens',
      ],
      answer: 1,
      why: 'Deprecation and historical markings change no values. They tell you what to move away from, here TLS 1.2-era key derivation.',
    },
  ],
}
