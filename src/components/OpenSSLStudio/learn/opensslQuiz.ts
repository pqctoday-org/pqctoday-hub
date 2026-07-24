// SPDX-License-Identifier: GPL-3.0-only
//
// opensslQuiz.ts — knowledge-check question banks for the OpenSSL Studio
// Learn tab, keyed by `OpenSslLesson.id`. Every question is answerable from
// what the lesson just demonstrated live — no outside trivia. Pass-state
// persists under the `openssl-learn` namespace (QuizCard:
// `openssl-learn-quiz-<lessonId>`).
import type { QuizQuestion } from '../../Playground/learnkit/QuizCard'

export const OPENSSL_QUIZZES: Record<string, QuizQuestion[]> = {
  'first-keypair': [
    {
      q: "You ran genpkey -algorithm ML-DSA-65 — no separate flag for the parameter set. Why doesn't ML-DSA-65 need a -pkeyopt like RSA's rsa_keygen_bits?",
      options: [
        "ML-DSA doesn't support tunable parameters at all",
        'The variant name (ML-DSA-65) IS the -algorithm value — the parameter set is baked into the name, unlike RSA where you name the algorithm family and choose the bit length separately',
        "It's a bug — a future OpenSSL version will require -pkeyopt",
      ],
      answer: 1,
      why: "FIPS 204 defines ML-DSA-44/65/87 as three fixed parameter sets; -algorithm ML-DSA-65 selects the whole thing in one name. RSA's -algorithm RSA plus -pkeyopt rsa_keygen_bits:2048 reflects that RSA's bit length is a free choice.",
    },
    {
      q: 'The lesson measured 1704 B (RSA-2048) vs 5604 B (ML-DSA-65) for the private key files. Where did those numbers come from?',
      options: [
        'A lookup table of typical sizes, shown for illustration',
        'The actual byte length of the PEM files the two genpkey calls just wrote — read back and measured, not quoted',
        'An estimate based on the algorithm names',
      ],
      answer: 1,
      why: 'Both steps call ctx.readFile() on the file genpkey just produced and report its real length — the compare table reflects what THIS run produced, not a spec table.',
    },
  ],
  'cert-issuance': [
    {
      q: 'req -x509 -new -key ... produced a complete certificate in one command. What did it skip?',
      options: [
        "Nothing — it's identical to req -new followed by x509 -req",
        'The separate CSR file — req -new alone would have produced a CSR for an external CA to sign; adding -x509 self-signs directly instead',
        "The subject name — -x509 certificates don't have a subject",
      ],
      answer: 1,
      why: 'req has two personalities: -new alone builds a PKCS#10 CSR; adding -x509 makes it self-sign a certificate directly. Try req -new alone in the Workbench to see the CSR-only path.',
    },
    {
      q: 'The RSA-2048 cert measured 1127 B; the ML-DSA-65 cert measured 7529 B. What stayed identical between the two req commands?',
      options: [
        'Nothing — the commands were completely different',
        'The command shape itself: req -x509 -new -key <file> -days 365 -sha256 -subj "..." -out <file> — only the key file differed',
        'The certificate size — they were actually the same',
      ],
      answer: 1,
      why: "Migration doesn't change the CA-facing workflow — only the key algorithm inside it. That's exactly what this lesson's two identical-shaped req commands demonstrated.",
    },
  ],
  'sign-verify': [
    {
      q: 'Classical signing used dgst -sha256 -sign; ML-DSA signing used pkeyutl -sign with no hash flag at all. Why the different command?',
      options: [
        "ML-DSA doesn't use hashing at all",
        "dgst's hash-then-sign lets YOU choose the hash algorithm; ML-DSA hashes internally as part of the algorithm itself, so there's no hash choice to make — pkeyutl just signs",
        "It's an arbitrary OpenSSL naming inconsistency with no technical reason",
      ],
      answer: 1,
      why: "This is the exact branch OpenSSL Studio's own Workbench makes internally when you pick Sign for a PQC vs. classical key — dgst for classical (hash-then-sign, hash is your choice), pkeyutl for ML-DSA/SLH-DSA (hashing is fixed by the algorithm).",
    },
    {
      q: "The ML-DSA-65 signature measured 3309 B against RSA-2048's 256 B — about 13× larger. What does the lesson's verify step prove that a \"Verified OK\" message alone wouldn't?",
      options: [
        'Nothing extra — verification just prints a fixed success message regardless of input',
        'That a genuine pkeyutl -verify call against the real public key, signature, and data files succeeded — a fabricated demo could print the same string without running anything',
        'That the signature is smaller than expected',
      ],
      answer: 1,
      why: "The verify step runs the actual pkeyutl -verify command against files the earlier steps genuinely produced — if the signature, key, or data didn't genuinely match, the command would exit nonzero and the step would fail, not silently pass.",
    },
  ],
  'key-establishment': [
    {
      q: 'Who generated the 32-byte shared secret in this lesson — the caller (you) or the encapsulate operation?',
      options: [
        'The caller chose it before running pkeyutl -encap',
        'pkeyutl -encap generated it as a side effect — you never supplied a secret, unlike RSA key transport where the caller picks the secret and encrypts it',
        'It was read from a fixed constant in the key file',
      ],
      answer: 1,
      why: "That's the core KEM vs. key-transport distinction the lesson's notes call out: RSA's caller picks the secret; ML-KEM's algorithm generates it during encapsulation. This is why protocols need re-plumbing, not just an algorithm-name swap.",
    },
    {
      q: "The final step compared the encapsulated secret against the decapsulated one byte-for-byte. What would have happened if they didn't match?",
      options: [
        'Nothing — the lesson would still report success',
        'The step throws an error naming the mismatch — a genuine correctness check, not an assumed pass',
        'The lesson silently retries until they match',
      ],
      answer: 1,
      why: "The step explicitly compares the two files and throws if they differ — this lesson doesn't just run commands, it verifies the round trip actually produced the right answer.",
    },
  ],
  'honest-lms': [
    {
      q: 'genpkey -algorithm LMS was refused with a real OpenSSL error. Why does this Learn tab count that as the lesson SUCCEEDING?',
      options: [
        'Because any error is treated as a pass, regardless of cause',
        'Because the step declared expect:"refusal" — the honest rejection IS the lesson, proving OpenSSL genuinely doesn\'t support LMS keygen rather than just being told so',
        "Because the WASM engine crashed and the test harness couldn't tell the difference",
      ],
      answer: 1,
      why: 'The same convention KMIP, PKCS#11, and TPM\'s curricula use: a step marked expect:"refusal" is only correct if it throws. A genpkey -algorithm LMS that SUCCEEDED would actually be the surprising, worth-investigating outcome.',
    },
    {
      q: 'Why does OpenSSL core intentionally leave out LMS/HSS key generation, according to the OpenSSL maintainer discussion this lesson cites?',
      options: [
        'It was simply never implemented due to lack of demand',
        "Stateful hash-based signatures break irrecoverably if a one-time key is ever reused (e.g. after restoring from backup) — software can't safely guarantee that, so the maintainers judged it should be a hardware guarantee instead",
        'LMS is patent-encumbered and OpenSSL avoids it for licensing reasons',
      ],
      answer: 1,
      why: 'This is the actual rationale from github.com/openssl/openssl/discussions/29619 — "should be hardware, not software" — cited directly rather than paraphrased from memory.',
    },
  ],
  'symmetric-myth': [
    {
      q: "AES-256 and SHA-256 are NOT being replaced for post-quantum migration, while RSA and ECC ARE. What's the actual reason?",
      options: [
        'AES and SHA are newer algorithms than RSA/ECC',
        "Grover's algorithm only gives a quadratic speedup against symmetric ciphers/hashes (AES-256 keeps ~128-bit security); Shor's algorithm breaks RSA/ECC in polynomial time — an entirely different magnitude of threat",
        'AES and SHA are already post-quantum algorithms by design',
      ],
      answer: 1,
      why: 'This is the core myth this lesson busts: "quantum breaks everything" conflates a mild, well-understood haircut (Grover, symmetric) with a total break (Shor, public-key). Only the second forces wholesale algorithm replacement.',
    },
    {
      q: 'The lesson deliberately ran enc -aes-256-gcm and it was refused with "AEAD ciphers not supported." What does that refusal actually tell you?',
      options: [
        'That this WASM build is missing a feature other OpenSSL builds have',
        "That openssl enc has never supported authenticated modes and the documentation says it never will — openssl-cms is the documented path for AEAD, regardless of which OpenSSL build you're on",
        'That AES-256-GCM is a post-quantum-insecure cipher mode',
      ],
      answer: 1,
      why: 'docs.openssl.org/3.6/man1/openssl-enc is explicit about this — a real, permanent boundary of the enc command, not a bug or a version gap.',
    },
  ],
  'kdf-choice': [
    {
      q: "HKDF used -kdfopt key: while PBKDF2 used -kdfopt pass:. What's the actual difference in what each expects as input?",
      options: [
        'No real difference — key: and pass: are interchangeable aliases',
        'HKDF/SSKDF expect an already-random, high-entropy secret (key:); PBKDF2/SCRYPT expect a low-entropy human password (pass:) and add deliberate work factor (iter:/N:) to slow brute-forcing',
        'key: is for encryption keys and pass: is only used for PKCS#12',
      ],
      answer: 1,
      why: 'Feeding a password to key: (or an already-random secret to pass:) is accepted syntactically but derives a key with the wrong security assumptions baked in — silently.',
    },
  ],
  'pkcs12-packaging': [
    {
      q: 'The bundle exported with no -legacy flag. What does OpenSSL 3.x use by default for pkcs12 -export?',
      options: [
        'RC2 and 3DES, matching decades-old compatibility expectations',
        "AES-256-CBC + PBKDF2 — the modern default; -legacy is what reverts to the old RC2/3DES algorithms for compatibility with software that can't read the current format",
        'No encryption at all unless -legacy is specified',
      ],
      answer: 1,
      why: 'This inverts a common assumption — -legacy is a downgrade path for old readers, not an upgrade or a required flag for modern security.',
    },
  ],
  randomness: [
    {
      q: 'Every genpkey call across this whole curriculum — RSA, ML-KEM, ML-DSA, SLH-DSA — drew from the same rand entropy source. What does openssl rand do if OS entropy seeding actually fails?',
      options: [
        'Silently falls back to a weaker, deterministic source so key generation can still complete',
        'Fails loudly (nonzero exit) rather than handing back predictable bytes — documented behavior, not an edge case left unspecified',
        'Retries indefinitely until real entropy becomes available',
      ],
      answer: 1,
      why: "A CSPRNG that degrades silently is far more dangerous than one that refuses to run — that's the documented design of RAND_bytes() this lesson's notes describe.",
    },
  ],
  'config-files': [
    {
      q: 'configutl re-dumped the test config as a "linearized, expanded" form. What does that mean it changed from the original file?',
      options: [
        'Nothing observable — configutl only validates syntax and exits',
        "It stripped comments/whitespace formatting and resolved the file into its normalized, effective form — visible directly in the step's own output",
        'It encrypted the config file for storage',
      ],
      answer: 1,
      why: 'The step reads back learn-l10-dumped.cnf and shows its literal re-dumped text — a real transformation you can inspect, not just a claim about what configutl does.',
    },
  ],
  'capstone-tls': [
    {
      q: 'This lesson generated an ML-DSA-65 certificate but ran the actual TLS handshake in a SEPARATE tool (the TLS Simulator). Why not simulate the handshake here too?',
      options: [
        'OpenSSL Studio has no way to run a TLS handshake at all',
        'The TLS Simulator already implements a real, honestly-labeled TLS 1.3 handshake in WASM — reusing it (via crossPlaygroundLink) avoids building a second, likely-drifting implementation of the same thing',
        'TLS handshakes can only be tested with real network sockets, never in a browser sandbox',
      ],
      answer: 1,
      why: 'This curriculum\'s own "no mocked data" rule cuts both ways — rather than fake a handshake inside the Learn tab, it hands off to the ONE real implementation that already exists, exactly as the lesson\'s notes describe.',
    },
  ],
}
