// SPDX-License-Identifier: AGPL-3.0-only
//
// quiz.ts — knowledge-check question banks for all ten Learn walkthroughs.
// Every question is answerable from the lesson the learner just ran — no
// outside trivia — and every `why` cites the behavior the walkthrough
// demonstrated live.

export type { QuizQuestion } from '@/components/Playground/learnkit/QuizCard'
import type { QuizQuestion } from '@/components/Playground/learnkit/QuizCard'

/** Keyed by `Lesson.id`. A lesson without an entry simply shows no quiz. */
export const QUIZZES: Record<string, QuizQuestion[]> = {
  provision: [
    {
      q: 'What does "modernizing" the RSA key to ML-DSA actually do?',
      options: [
        'Converts the RSA key material to ML-DSA in place, keeping its UID',
        'Creates a brand-new key object with its own UniqueIdentifier; the old key keeps working until you retire it',
        'Re-wraps the RSA key under an ML-DSA wrapping key',
      ],
      answer: 1,
      why: 'In-place algorithm conversion is not how KMIP or real crypto works — the walkthrough deliberately runs a fresh CreateKeyPair. The old key stays valid (e.g. to verify old signatures) until deliberately retired.',
    },
    {
      q: 'What changed between the RSA-3072 request and the ML-DSA-65 request on the wire?',
      options: [
        'The whole request payload was restructured for PQC',
        'Only the CryptographicAlgorithm value (and the sizes that come back)',
        'A new PQC-specific operation replaced CreateKeyPair',
      ],
      answer: 1,
      why: 'The request/response SHAPE is identical — same CreateKeyPair, same lifecycle. That protocol-level equivalence is what makes the algorithm a swappable parameter: crypto-agility.',
    },
    {
      q: 'Why must you Activate a freshly created key before using it?',
      options: [
        'Activation generates the actual key material',
        'A new key starts Pre-Active, and operations like Sign are gated on the Active lifecycle state by the protocol itself',
        'Activation registers the key with the policy engine',
      ],
      answer: 1,
      why: 'The KMIP lifecycle (Pre-Active → Active → … → Destroyed) is enforced by the base protocol, independent of any policy — Sign on a Pre-Active key is refused before a policy even runs.',
    },
  ],
  sign: [
    {
      q: 'What is the biggest visible difference when signing with ML-DSA-65 instead of RSA-3072 or ECDSA?',
      options: [
        'The signature is much larger (kilobytes instead of tens/hundreds of bytes)',
        'Signing needs two round trips instead of one',
        'Verification requires the private key',
      ],
      answer: 0,
      why: 'An ML-DSA-65 signature is ~3.3 KB versus 384 B for RSA-3072 and ~64-72 B for ECDSA — the size jump is the migration cost you actually feel; the operations themselves are unchanged.',
    },
    {
      q: 'What stays exactly the same across the classical and PQC sign flows?',
      options: [
        'The signature length',
        'The operation sequence and wire shape: Sign with a UID + data, SignatureVerify with the public key',
        'The private key encoding',
      ],
      answer: 1,
      why: 'Same Sign / SignatureVerify requests, same fields — only the CryptographicAlgorithm and the byte counts differ. Integration code that treats UIDs as opaque handles can keep the same calls; the larger sizes, the new public key, reissued certificates and verifier support for the algorithm still have to be handled.',
    },
    {
      q: 'Why do signatures need to migrate to PQC sooner than you might think?',
      options: [
        "They don't — signatures aren't affected by quantum computers",
        'Anything signed today with a quantum-breakable key can be forged once a large quantum computer exists — long-lived signatures (firmware, documents) outlive the algorithm',
        'PQC signatures are faster, so migration saves money',
      ],
      answer: 1,
      why: "Shor's algorithm breaks RSA/ECDSA outright. A firmware image or contract that must remain verifiable for 10+ years needs a signature that will still be trustworthy then.",
    },
  ],
  kem: [
    {
      q: 'ML-KEM replaces ECDH for key establishment. How do the two differ in SHAPE?',
      options: [
        'They are identical — both derive a shared secret from two key pairs',
        'ML-KEM is a KEM: Encapsulate (public key → ciphertext + secret) / Decapsulate (ciphertext + private key → the same secret) — not a Diffie-Hellman exchange',
        'ML-KEM needs three round trips instead of two',
      ],
      answer: 1,
      why: "A KEM is a genuinely different primitive from Diffie-Hellman: one side encapsulates to the other's public key and SENDS a ciphertext. Same goal — a shared secret — completely different wire shape.",
    },
    {
      q: 'After Encapsulate and Decapsulate complete, what do the two parties hold?',
      options: [
        'Two different secrets they must reconcile',
        'The same shared secret — the encapsulator derived it, the decapsulator re-derived it from the ciphertext',
        'The ciphertext, which IS the shared secret',
      ],
      answer: 1,
      why: "The walkthrough's Decapsulate step re-derives exactly the secret Encapsulate produced — that agreement is the whole point, and it's what feeds a KDF to key your session cipher.",
    },
    {
      q: 'Why is key establishment the MOST urgent thing to migrate?',
      options: [
        'Harvest-now-decrypt-later: traffic recorded today can be decrypted once a quantum computer exists, so secrets with long confidentiality needs are already at risk',
        'ECDH is already broken by classical computers',
        'KEM ciphertexts are smaller, saving bandwidth',
      ],
      answer: 0,
      why: 'An attacker recording your ECDH-protected traffic today just waits. Anything that must stay confidential past the arrival of a quantum computer needs quantum-safe key establishment NOW.',
    },
  ],
  hbs: [
    {
      q: "What does SLH-DSA's security rest on?",
      options: [
        'Lattice problems, like ML-DSA',
        "Nothing but the hash function's own security — the most conservative assumption class available",
        'The difficulty of factoring large integers',
      ],
      answer: 1,
      why: 'Hash-based signatures need no structured mathematical problem at all. If the hash function stands, the signature stands — which is why it exists ALONGSIDE ML-DSA as the conservative option, not a replacement.',
    },
    {
      q: 'What is the practical trade-off for that conservatism?',
      options: [
        'Very large signatures (and slower signing) in exchange for tiny keys and the minimal assumption',
        'Keys that expire after a fixed number of days',
        'It only works for encryption, not signing',
      ],
      answer: 0,
      why: 'SLH-DSA-SHA2-128f: a ~32 B public key but a ~17 KB signature. You pay in bytes and speed for the smallest possible security assumption.',
    },
    {
      q: 'Why does this lesson have no classical side to compare against?',
      options: [
        'The classical equivalent was removed from the engine',
        'SLH-DSA has no classical predecessor — it is a new option in the toolbox, not a drop-in replacement for something',
        'Classical hash-based signatures are export-controlled',
      ],
      answer: 1,
      why: 'RSA→ML-DSA is a like-for-like swap; SLH-DSA is an addition. That is why the lesson frames it as "a new option" rather than a migration pair.',
    },
  ],
  symmetric: [
    {
      q: 'What must change about AES-256 for the post-quantum era?',
      options: [
        'Nothing — that is the entire lesson',
        'It must be re-keyed to AES-512',
        'It must be wrapped in an ML-KEM layer',
      ],
      answer: 0,
      why: "Grover's algorithm gives only a quadratic speedup in the idealized query-count model: a search over 2^256 keys needs about 2^128 quantum queries, which is still far out of reach. The shortest lesson, on purpose.",
    },
    {
      q: 'Which quantum algorithm threatens symmetric ciphers, and how badly?',
      options: [
        "Shor's — it breaks them completely",
        "Grover's — a quadratic search speedup that, in the idealized query-count model, roughly halves the key size an attacker must search",
        'Neither — quantum computers cannot touch symmetric crypto at all',
      ],
      answer: 1,
      why: "Shor's exponential speedup applies to factoring and discrete logs (asymmetric crypto). Symmetric ciphers only face Grover's quadratic speedup, and that speedup needs a very long serial quantum computation, so it is far less damaging in practice than the query count suggests.",
    },
    {
      q: "Grover's algorithm cuts a 128-bit key search to about 2^64 queries in the idealized model. Is that count, by itself, a verdict that AES-128 must be replaced?",
      options: [
        'Yes — AES-128 is broken by quantum computers, so every AES-128 key must be replaced',
        'No — the query count ignores the cost of running one very long serial quantum computation. Moving to AES-256 is a policy choice that depends on the assurance level required and how long the data must stay confidential',
        "No — Grover's algorithm cannot be applied to symmetric ciphers at all",
      ],
      answer: 1,
      why: "The 2^64 figure counts idealized queries only. NIST's call for proposals puts the quantum cost of an AES-128 key search at about 2^170/MAXDEPTH gates for a depth limit MAXDEPTH between 2^40 and 2^96, and NIST's PQC FAQ says it is \"quite likely that Grover's algorithm will provide little or no advantage in attacking AES, and AES 128 will remain secure for decades to come\". The Migration tab's sample hybrid and PQC policies rekey payments-db-cipher from AES-128 to AES-256: a choice made for the exercise, not a portable verdict. A new key also protects only what is encrypted with it afterwards; data already encrypted under the old key stays under the old key until it is re-encrypted.",
    },
  ],
  hybrid: [
    {
      q: 'What is the design goal of a hybrid KEM like X25519MLKEM768, and how are its two shared secrets combined?',
      options: [
        'It is broken as soon as EITHER X25519 or ML-KEM falls',
        'It is designed to hold unless BOTH X25519 AND ML-KEM fall. The raw secret is the plain concatenation of the two (no KDF inside the KEM); the consuming protocol then derives its keys from it',
        'It cannot be broken, because a KDF inside the KEM mixes the two secrets',
      ],
      answer: 1,
      why: "RFC 10024 §4.3 defines the X25519MLKEM768 shared secret as the concatenation of the ML-KEM secret and the X25519 secret (64 bytes), which is what this engine returns: a raw secret, not a finished session key. In TLS 1.3 the key schedule (HKDF) then derives keys from it, and RFC 10024 §6 notes that the security analysis relies on the TLS 1.3 message transcript, so one cannot assume a similar hybridization is secure in other protocols. 'Secure while either algorithm survives' is therefore the goal for that construction, a hedge against ML-KEM being young AND X25519 being quantum-vulnerable, not a guarantee for every consumer of the raw secret.",
    },
    {
      q: 'How does your client code drive the hybrid — two algorithms, so two operations?',
      options: [
        'Yes: Encapsulate twice, once per half, then combine client-side',
        'No: one managed object, one ordinary Encapsulate — the engine runs both algorithms and combines the secrets underneath',
        'Via a dedicated HybridEncapsulate operation',
      ],
      answer: 1,
      why: 'X25519MLKEM768 is a single first-class CryptographicAlgorithm value (KMIP 3.0 CSD02). Your code sees one key and one Encapsulate, so the call shape stays the same for a compatible key-management caller. Clients must still handle the larger public keys and ciphertexts, and whatever consumes the raw concatenated secret still has to derive its keys from it.',
    },
    {
      q: 'What is the state of hybrid (composite) SIGNATURES in KMIP?',
      options: [
        'Fully standardized alongside hybrid KEMs',
        'No native composite-signature algorithm or dual-sign operation exists yet — workarounds are an extension codepoint or two linked keys signed in one batch',
        'Signatures cannot be hybridized even in principle',
      ],
      answer: 1,
      why: "KMIP defines exactly one hybrid primitive today: the KEM. For signatures you either register a vendor extension codepoint (8XXXXXXX) or batch two independent signatures — the lesson's note walks both options.",
    },
  ],
  splitkey: [
    {
      q: 'You split a key 3-of-5 and then permanently lose two shares. What happens?',
      options: [
        'The key is unrecoverable — every share is needed',
        'Nothing is lost: any 3 of the remaining shares still reconstruct it',
        'The server automatically re-issues the missing shares',
      ],
      answer: 1,
      why: 'That loss tolerance is the point of a threshold scheme: any 3 of 5 reconstruct the key, so losing 2 is survivable. Losing a 3rd would be fatal.',
    },
    {
      q: 'Why did the walkthrough use a polynomial (Shamir) method instead of XOR?',
      options: [
        'XOR is deprecated in KMIP 3.0',
        'Polynomial sharing is faster',
        'XOR requires every share (N = M) — it cannot express 3-of-5',
      ],
      answer: 2,
      why: 'KMIP 3.0 §13.1: the XOR method needs all N shares to reconstruct, so parts must equal threshold. True M-of-N needs one of the three polynomial methods — the engine refuses an XOR 3-of-5 with exactly that reason.',
    },
    {
      q: 'What did the engine do when you tried to join with only 2 of the 3 required shares?',
      options: [
        'Returned a wrong key derived from the 2 shares',
        'Refused, naming the threshold shortfall',
        'Returned the closest partial reconstruction',
      ],
      answer: 1,
      why: 'Below the threshold the shares reveal nothing about the key — and the honest response is a refusal that says so, never silently-wrong key material.',
    },
  ],
  async: [
    {
      q: 'What does the server return when a request carries Asynchronous Indicator = Mandatory?',
      options: [
        'The result, after blocking until the job finishes',
        'OperationPending plus a correlation value',
        'A URL to fetch the result from',
      ],
      answer: 1,
      why: 'The job is enqueued for real (§8.1.2) — the immediate response carries no payload, just OperationPending and the §9.1 correlation value you later redeem.',
    },
    {
      q: "How does a completed job's Poll response compare to the synchronous response?",
      options: [
        'It is wrapped in an AsynchronousResult structure',
        'It only confirms completion; the data needs a second call',
        'It is identical — same payload the synchronous op would have returned',
      ],
      answer: 2,
      why: '§6.1.45: Poll\'s successful response "SHALL be identical to the response that would have been sent if the operation had completed synchronously" — the walkthrough\'s digest bytes proved it.',
    },
    {
      q: 'Which of these is NOT eligible for asynchronous processing?',
      options: ['Hash', 'CreateKeyPair', 'Poll itself'],
      answer: 2,
      why: "Poll's own response is explicitly barred from being asynchronous (§6.1.45) — otherwise you'd need a ticket to redeem your ticket. Cancel is barred the same way (§6.1.5); everything else, including CreateKeyPair and Hash, is eligible at the server's discretion.",
    },
  ],
  honesty: [
    {
      q: 'Since engine 0.13.0, what happens when a client sets a read-only attribute?',
      options: [
        'Success — the value is stored in a shadow field',
        'Success — but the value is silently discarded',
        'An honest refusal naming the attribute as read-only',
      ],
      answer: 2,
      why: 'The audit found a group of attributes answering Success while persisting nothing. A server that cannot honor a write must say so — silence indistinguishable from success is the bug.',
    },
    {
      q: 'After Destroy, Get is refused. What does this sample establish?',
      options: [
        'The API refused retrieval; byte erasure is not established by this check',
        'Every copy in memory, storage and backups was erased',
        'No separate storage assurance is needed',
      ],
      answer: 0,
      why: 'An API refusal is an observed lifecycle/access outcome. It can occur even when stored bytes remain. Evaluating destruction needs evidence about the implementation, covered copies and storage sanitization; this browser sample does not inspect those properties.',
    },
    {
      q: "Why does the engine's Query response now list exactly 62 operations?",
      options: [
        'KMIP 3.0 defines exactly 62 operations',
        'Every advertised operation is genuinely implemented; the 4 that are not were removed from the list',
        'The wasm build strips 4 operations to save space',
      ],
      answer: 1,
      why: 'KMIP defines 66. The honest-Query audit emptied the advertised-but-unimplemented list: Notify/Put (server-to-client scope boundary) and DelegatedLogin/Re-Provision (no handler) are simply no longer claimed.',
    },
    {
      q: 'A usage budget was allocated with Get Usage Allocation. What does §4.69 honesty require?',
      options: [
        'The budget resets at the next server restart',
        'Re-setting the UsageLimits attribute afterwards is refused',
        'The budget can be silently topped up by SetAttribute',
      ],
      answer: 1,
      why: 'A budget you can silently re-set is not a budget. Once an allocation is granted, the engine refuses to overwrite the UsageLimits attribute out from under it.',
    },
  ],
  'certificate-services': [
    {
      q: 'Before the 0.14 pure-Rust cert-ops port, why did this wasm build answer Validate/Certify/Re-certify with OperationNotSupported?',
      options: [
        'The operations were never implemented at all',
        "Their crypto backends (ring for Validate, rcgen for Certify) don't cross-compile to wasm32",
        'They were disabled for licensing reasons',
      ],
      answer: 1,
      why: "Both were real, spec'd operations with real NATIVE handlers — the gap was specifically that ring/rcgen are C-backed and can't target wasm32. The port replaced both with pure-Rust spki/der decoding through the same engine, so the identical code now runs on both targets.",
    },
    {
      q: 'A certificate chain fails Validate with ValidityIndicator = Invalid. What does the ResultStatus say?',
      options: [
        'OperationFailed — Invalid is a protocol-level error',
        'Success — Invalid is an honest ANSWER, not an error',
        'It depends on which certificate in the chain failed',
      ],
      answer: 1,
      why: 'KMIP 3.0 §6.1.62: a negative validity result is not a KMIP error. ResultStatus=OperationFailed is reserved for protocol failures (a missing UID, an unrecognized object type) — Invalid and Unknown are both legitimate ValidityIndicator values on a Success response.',
    },
    {
      q: "Why couldn't rcgen ever have accepted a genuinely valid, self-signed ML-DSA CSR — even in the native (non-wasm) server, before this port?",
      options: [
        'rcgen requires a network connection to verify PQC signatures',
        "rcgen's SignatureAlgorithm table has no ML-DSA entry at all — it can't evaluate the signature, valid or not",
        'ML-DSA CSRs use a different wire format rcgen cannot parse',
      ],
      answer: 1,
      why: 'This is a coverage gap, not a validity check: rcgen simply has no algorithm entry to evaluate the signature against, so it rejected the CSR regardless of whether the self-signature was genuinely correct. The engine-backed verify_with_spki has no such gap.',
    },
    {
      q: "A key fresh out of CreateKeyPair is certified through Certify's stored-PublicKey-UID path, with no Register step. Why does that work?",
      options: [
        "It doesn't: Certify only accepts keys that were Register'd and answers KeyValueNotPresent for a CreateKeyPair output",
        "Certify reads the public key's SubjectPublicKeyInfo from a Register'd record when there is one, and otherwise falls back to a live lookup on the engine, so a bare CreateKeyPair output works too",
        'Certify copies the private key out of the engine and embeds it in the certificate',
      ],
      answer: 1,
      why: 'A plain CreateKeyPair leaves the KMIP-level record without key material (only hybrid-KEM public halves are cached there), so an older build that read only that record answered KeyValueNotPresent. The engine now falls back to a live lookup of the SubjectPublicKeyInfo, the same path the demo-CA setup uses, so no re-registration is needed. The certificate this lesson issues comes from its own demo CA and is a sample object, not a certificate from a trusted CA.',
    },
  ],
}
