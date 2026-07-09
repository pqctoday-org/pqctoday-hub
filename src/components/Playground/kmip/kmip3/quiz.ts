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
}
