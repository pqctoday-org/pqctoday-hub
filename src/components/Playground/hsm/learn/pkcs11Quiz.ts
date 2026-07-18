// SPDX-License-Identifier: GPL-3.0-only
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
      q: 'Why must two consecutive C_GenerateRandom calls produce different output, while two C_Digest calls on the same input must produce the SAME output?',
      options: [
        'They are unrelated coincidences',
        'Hashing is a deterministic function of its input; randomness generation is explicitly NOT supposed to be a function of anything predictable — they have opposite correctness requirements',
        'C_GenerateRandom is actually also deterministic internally',
      ],
      answer: 1,
      why: 'Confusing these two properties is a real source of cryptographic bugs — e.g. reusing a value from a hash where fresh randomness was required.',
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
      q: "Alice derived using Bob's public point and her own private key; Bob derived using Alice's public point and his own private key. Why did they land on the same secret?",
      options: [
        'Coincidence — it only works for P-256',
        "That convergence IS Diffie-Hellman's defining mathematical property — each side combines their own private key with the other's public key and the math guarantees the same result",
        'The engine cached the first result and reused it',
      ],
      answer: 1,
      why: 'Two independent C_DeriveKey calls, on two different key pairs, producing provably-linked handles is the entire basis of key agreement — no secret ever crossed the wire.',
    },
  ],
  'whats-new': [
    {
      q: "The token's CKO_PROFILE object reported CKA_PROFILE_ID=1 (CKP_BASELINE_PROVIDER). Why does this matter compared to pre-v3.2 PKCS#11?",
      options: [
        "It doesn't — it's cosmetic metadata",
        'A token can now self-describe its conformance level via a standard object query, instead of requiring out-of-band vendor documentation to know what it supports',
        'It replaces C_GetMechanismList entirely',
      ],
      answer: 1,
      why: 'Profiles v3.2 §3 is specifically about discoverability — the same C_FindObjects call used for keys now also answers "what does this token claim to conform to."',
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
      q: 'SLH-DSA has a tiny 32-byte public key but a signature over 17,000 bytes. Why would anyone choose that trade-off over ML-DSA?',
      options: [
        'They would never choose it — it is strictly worse',
        'SLH-DSA rests on nothing but hash-function security — the most conservative assumption available — which some deployments value enough to accept the size cost, typically for a narrow use case like firmware signing',
        'SLH-DSA is actually faster than ML-DSA in every case',
      ],
      answer: 1,
      why: 'SLH-DSA is meant as an addition alongside ML-DSA for risk diversification, not a wholesale replacement — exactly the framing this lesson\'s "why it matters" makes explicit.',
    },
  ],
  'hedged-signing': [
    {
      q: 'Both the hedged and deterministic signatures verified successfully, even though only the deterministic pair was byte-identical across two runs. What does that tell you about hedging?',
      options: [
        'Hedging makes signatures invalid half the time',
        'Hedging changes ONLY which bytes get produced (via injected randomness), never whether verification succeeds — it is a side-channel defense, not a correctness trade-off',
        'Only deterministic signatures are cryptographically valid',
      ],
      answer: 1,
      why: 'This is precisely why v3.2 exposes hedging as an explicit, application-chosen parameter — different compliance regimes have opposite requirements here (some mandate determinism, others mandate hedging), and both must remain fully valid.',
    },
  ],
  'authenticated-wrap': [
    {
      q: "Tampering one byte of the C_WrapKeyAuthenticated blob caused C_UnwrapKeyAuthenticated to refuse it. What's the real difference from the classic C_WrapKey lesson (A7)?",
      options: [
        'There is no real difference — both would behave identically',
        'C_WrapKeyAuthenticated adds a real IV and an AEAD integrity tag, so tampering is cryptographically detected — classic AES-KW wrap has no equivalent authenticated-tampering check',
        'C_WrapKeyAuthenticated only works on RSA keys',
      ],
      answer: 1,
      why: "This is the same AEAD-vs-non-AEAD distinction from the symmetric-encryption lesson (A4), applied to key export instead of data encryption — one of PKCS#11 v3.2's 12 new functions closing a real gap.",
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
        'No — both keys remained valid simultaneously until the explicit C_DestroyObject step; the successor gets its own identity, the predecessor is retired as a deliberate, separate decision',
        'No — the legacy key becomes read-only automatically',
      ],
      answer: 1,
      why: "This mirrors the KMIP playground's own migration lessons: provisioning a successor and retiring a predecessor are two distinct, deliberate steps, never an automatic or implicit conversion.",
    },
  ],
}
