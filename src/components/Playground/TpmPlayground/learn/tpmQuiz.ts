// SPDX-License-Identifier: GPL-3.0-only
//
// tpmQuiz.ts — knowledge-check question banks for the TPM Learn tab, keyed
// by `TpmLesson.id`. Every question is answerable from what the lesson just
// demonstrated live — no outside trivia. Pass-state persists under the
// `tpm-learn` namespace (QuizCard: `tpm-learn-quiz-<lessonId>`).
import type { QuizQuestion } from '../../learnkit/QuizCard'

export const TPM_QUIZZES: Record<string, QuizQuestion[]> = {
  'boot-discover': [
    {
      q: 'GetCapability listed RSA (0x0001) and ML-KEM (0x00A0) in the same response. What does that say about V1.85?',
      options: [
        'V1.85 removed classical algorithms and emulates them for compatibility',
        'V1.85 EXTENDED the algorithm table — classical and post-quantum coexist in one chip, and migration is coexistence, not replacement',
        'The emulator is misconfigured; a real TPM only reports one family',
      ],
      answer: 1,
      why: 'You read the live table: 36 algorithms spanning both eras. V1.85 added ML-KEM/ML-DSA alongside RSA/ECC — which is exactly what makes staged, hybrid migrations possible on real hardware.',
    },
    {
      q: 'Re-running TPM2_Startup produced TPM_RC_INITIALIZE (0x100). Why does this playground count that step as SUCCESSFUL?',
      options: [
        'Because the error is harmless enough to ignore',
        'Because the step EXPECTED the refusal: a specified, honest error proves the TPM enforces its state machine — the refusal is the lesson',
        'Because the TPM retried internally and eventually succeeded',
      ],
      answer: 1,
      why: 'The step declared expect:"refusal". A TPM that let you double-Startup would be broken; the precise, specified error is correct behavior — the same honest-refusal convention the PKCS#11 and KMIP curricula use.',
    },
  ],
  'create-keys': [
    {
      q: 'The lesson measured the RSA-2048 public key at 256 B and ML-KEM-768 at 1184 B. Where did those numbers come from?',
      options: [
        'From a lookup table of spec constants shown for illustration',
        'From the unique.size field of each live TPM2_CreatePrimary response — measured, not quoted',
        'From the browser estimating typical key sizes',
      ],
      answer: 1,
      why: 'Both steps parsed the real response bytes (unique.size at the TPMT_PUBLIC offsets). The compare table summarizes what the engine actually produced — and would fail the step if the sizes were wrong.',
    },
    {
      q: 'What stayed EXACTLY the same between the RSA and ML-KEM key creations?',
      options: [
        'The public key size and the parameter fields',
        'Deterministic derivation from hierarchy seed + template, and hardware non-exportability (fixedTPM)',
        'The hierarchy used — both keys went to the Endorsement hierarchy',
      ],
      answer: 1,
      why: 'The trust model is era-independent: same seed derivation, same fixedTPM non-exportability. The template type (and the resulting sizes) changed; the RSA key went to Owner and the ML-KEM EK to Endorsement, and sizes obviously differ.',
    },
  ],
  'key-establishment': [
    {
      q: 'Who chose the 32-byte secret in each half of the lesson?',
      options: [
        'The caller both times',
        'Classical RSA-OAEP: the caller supplied it; ML-KEM Encapsulate: the TPM generated it during the operation',
        'The TPM both times',
      ],
      answer: 1,
      why: 'That is THE structural difference between key transport and a KEM — and why ML-KEM cannot be dropped into an RSA-shaped protocol without re-plumbing. You watched both shapes run.',
    },
    {
      q: 'You corrupted one ciphertext byte in each system. What happened?',
      options: [
        'Both operations returned an error code',
        'Both silently returned wrong secrets',
        'RSA-OAEP decryption FAILED loudly with an error; ML-KEM decapsulation returned SUCCESS with a different, useless secret (implicit rejection)',
      ],
      answer: 2,
      why: 'FIPS 203 implicit rejection denies attackers a failure oracle (the class of oracle behind Bleichenbacher attacks on RSA). The price: your protocol must detect key mismatch itself — “success” no longer means “agreement”.',
    },
  ],
  'sign-verify': [
    {
      q: 'Why did ML-DSA signing use a NEW command (TPM2_SignDigest) instead of the classical TPM2_Sign?',
      options: [
        'Purely for naming clarity',
        'V1.85 gave PQC signing its own command surface with its own layouts — e.g. the ML-DSA input is a 64-byte external µ, not a 32-byte scheme-hash digest, and the signature union has no embedded hash field',
        'TPM2_Sign was deprecated and removed in V1.85',
      ],
      answer: 1,
      why: 'You ran both: TPM2_Sign took a 32 B digest + RSASSA scheme; TPM2_SignDigest took a 64 B µ and returned a 3309 B signature whose structure has no hash-algorithm field (errata §2.3: its scheme union is TPMS_EMPTY). Different command, different contract.',
    },
    {
      q: 'The two verification tickets carried different tags (0x8022 vs 0x8027). What is that distinction FOR?',
      options: [
        'Version accounting inside TCG documents',
        'So downstream consumers can tell WHAT was verified: classical digest verification (VERIFIED) vs V1.85 digest/µ verification (DIGEST_VERIFIED) vs streamed-message verification (MESSAGE_VERIFIED, 0x8026)',
        'The tags are interchangeable; TPMs pick one at random',
      ],
      answer: 1,
      why: 'Tickets are transferable proof — so what they prove must be encoded in them. V1.85 added distinguishable tags for the new verification semantics; errata §2.5 further limits what an external-µ ticket may be used for.',
    },
  ],
  streaming: [
    {
      q: 'Why can’t pure ML-DSA use the classical hash-then-sign shortcut?',
      options: [
        'ML-DSA is too slow to hash inside the TPM',
        'FIPS 204’s security claim for pure ML-DSA is over the MESSAGE — pre-hashing changes the claim (HashML-DSA exists as a distinct algorithm for exactly that trade)',
        'The TPM’s hash engine only supports SHA-1',
      ],
      answer: 1,
      why: 'That is the entire reason V1.85 added sign/verify sequence commands: the message must stream into the signing operation. HashML-DSA (0x00A2) is the separately-defined pre-hash variant for callers who need the old shape.',
    },
    {
      q: 'Which command was shared VERBATIM between the classical and PQC streaming flows?',
      options: [
        'TPM2_HashSequenceStart',
        'TPM2_SequenceUpdate — the chunk feeder addresses only the sequence object, so both eras reuse it',
        'TPM2_SignSequenceComplete',
      ],
      answer: 1,
      why: 'You fed 64 bytes into a hash sequence and into a verify sequence with the same TPM2_SequenceUpdate (§17.7). The Start/Complete commands differ per flow; the streaming middle is common machinery.',
    },
  ],
  'v27-ek-certs': [
    {
      q: 'How did you FIND the PQC EK certificate without being told where it was?',
      options: [
        'By brute-force scanning all NV space',
        'By convention: the V2.7 profile assigns well-known NV indices (§5.3.1, 0x01C00060–74) — the same discovery pattern attestation software uses in the field',
        'The TPM broadcasts certificate locations at boot',
      ],
      answer: 1,
      why: 'Well-known NV indices ARE the discovery protocol. You read 0x01C00072 (the ML-DSA-65 slot) and got DER bytes starting 0x30 0x82 — a real X.509 certificate, retrieved exactly how a relying party would.',
    },
    {
      q: 'What honesty caveat does this playground attach to the EK certificates it provisions?',
      options: [
        'The certificates are random bytes, not real X.509',
        'The issuer is an ephemeral in-browser dev CA — real DER, real signatures, but NOT a production trust anchor',
        'The certificates expired in 2025',
      ],
      answer: 1,
      why: 'The cert is structurally real and cryptographically signed, but its issuer was created in your browser session. A production EK cert chains to a TPM manufacturer CA — a distinction the playground states rather than blurs.',
    },
  ],
  attestation: [
    {
      q: 'Why must a Quote key be RESTRICTED?',
      options: [
        'Restricted keys are faster',
        'A restricted signer only signs TPM-generated data — so a valid Quote signature proves the TPM produced the report, not a caller who fabricated “platform state”',
        'Unrestricted keys cannot use SHA-256',
      ],
      answer: 1,
      why: 'That is the attestation trust argument in one attribute. The TPMS_ATTEST additionally begins with TPM_GENERATED magic, and restricted keys refuse to sign external data that could forge it.',
    },
    {
      q: 'The classical AK pinned RSASSA/SHA-256 at creation and Quote used inScheme=NULL. What did NULL mean there?',
      options: [
        '“Do not sign — dry run only”',
        '“Inherit the key’s own pinned scheme” — a restricted signer fixes its scheme at creation, and callers defer to it',
        '“Use the TPM’s default algorithm, whatever that is today”',
      ],
      answer: 1,
      why: 'For restricted signers the scheme is part of the key’s identity (TPM_RC_SYMMETRIC/SCHEME errors enforce the template rules). inScheme=NULL defers to it — which the WS0 probes and your Quote both exercised.',
    },
  ],
  'honest-tpm': [
    {
      q: 'Why is a placeholder stub that returns SUCCESS worse than one that returns an error?',
      options: [
        'It is slower',
        'It manufactures false confidence: every downstream check passes while no real cryptography protected anything — which is why you verified the output BYTES (≠ 0xDD/0xEE), not just the return code',
        'It uses more memory',
      ],
      answer: 1,
      why: 'Return codes prove the plumbing ran; byte-pattern checks prove the MATH ran. The V185-017/018 detectors you ran by hand exist because this engine deliberately falls back to recognizable placeholder patterns when its crypto bridge is absent.',
    },
    {
      q: 'The drift check found the engine returning a DIGEST_VERIFIED ticket where the published errata prefers a NULL ticket. What is the correct takeaway?',
      options: [
        'The engine is useless until rebuilt',
        'Specs move: this engine implements RC4 (Dec 2025), the published spec + errata landed 2026-03-12, and YOU can now detect the divergence with one command — auditing implementations against moving standards is a learnable skill',
        'The errata must be wrong because the engine disagrees',
      ],
      answer: 1,
      why: 'Errata are non-normative until folded into a published revision, but they signal where conforming implementations are heading. Knowing how to observe the gap (ticket tag, one command) matters more than memorizing today’s answer.',
    },
  ],
}
