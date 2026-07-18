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
}
