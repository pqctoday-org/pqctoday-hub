// SPDX-License-Identifier: GPL-3.0-only
//
// quiz.ts — knowledge-check question banks for the Learn walkthroughs
// (currently the three engine-0.12/0.13 lessons). Every question is
// answerable from the lesson the learner just ran — no outside trivia —
// and every `why` cites the behavior the walkthrough demonstrated live.

export interface QuizQuestion {
  q: string
  options: string[]
  /** Index into `options`. */
  answer: number
  /** Shown after answering — WHY the right answer is right. */
  why: string
}

/** Keyed by `Lesson.id`. A lesson without an entry simply shows no quiz. */
export const QUIZZES: Record<string, QuizQuestion[]> = {
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
      why: '§6.1.43: Poll\'s successful response "SHALL be identical to the response that would have been sent if the operation had completed synchronously" — the walkthrough\'s digest bytes proved it.',
    },
    {
      q: 'Which of these is NOT eligible for asynchronous processing?',
      options: ['Hash', 'CreateKeyPair', 'Poll itself'],
      answer: 2,
      why: 'The async-management ops (Poll/Cancel/Process/QueryAsynchronousRequests) are explicitly never asynchronous — otherwise you would need a ticket to redeem your ticket. Nearly every other handled op is eligible.',
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
      q: 'What does "Destroy genuinely scrubs" mean beyond flipping the lifecycle state?',
      options: [
        'The key bytes are zeroized in memory and securely deleted from storage',
        "The object's UID is recycled for the next key",
        'The key is re-encrypted under a destruction key',
      ],
      answer: 0,
      why: '"The key material SHALL be destroyed" is a claim about bytes. Before 0.13.0 only a flag flipped while the plaintext sat in the database; now memory is zeroized and SQLite\'s secure_delete is on.',
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
      q: "Certify's stored-PublicKey-UID path failed with KeyValueNotPresent for a key fresh out of CreateKeyPair. Why?",
      options: [
        'CreateKeyPair-generated keys are always Sensitive and cannot be certified',
        "A freshly generated key's SubjectPublicKeyInfo lives only in the engine — the KMIP-level object record has no key_material until the key is Register'd (or read via a path that copies it in, like the CA bootstrap)",
        'This is a wasm-only limitation — the native server can certify any CreateKeyPair output directly',
      ],
      answer: 1,
      why: "It's the same limitation natively, not a wasm gap: CreateKeyPair's ObjectRecord stores key_material only for a handful of cases (e.g. hybrid KEM public shares); a plain classical/PQC key's real material stays engine-side. \"Set up demo CA\" works around this by reading the SPKI straight off the engine, the same way the native --ca-key bootstrap does.",
    },
  ],
}
