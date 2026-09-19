// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "Try it" under a Playground tool: one to
 * three questions answerable from the tool's own controls and output, with
 * feedback that names the concept. Keyed by tool id; rendered by
 * shared/ToolExercise below the tool. Written during the playground sittings
 * from each tool's rendered controls (label dump at 4.97.0); a question must
 * be answerable by using the tool, not by reading its summary.
 * toolExercises.test.ts pins ids, option counts and reasons.
 */
import type { StepExercise } from '@/data/stepExercises'

export const TOOL_EXERCISES: Record<string, StepExercise[]> = {
  'slh-dsa': [
    {
      prompt: 'Sign the same message with SHA2-128s and then a 128f variant. What changes?',
      options: [
        'The signature size and signing time',
        'The public key size only',
        'Nothing — the variants are aliases',
      ],
      answer: 0,
      why: 'The s and f variants trade signing speed for signature size at the same security level; the key sizes stay tiny in both.',
    },
  ],
  'lms-hss': [
    {
      prompt: 'After Simulate State Loss, why can the key not simply be restored from a backup?',
      options: [
        'A restored state would reuse one-time keys and void the security proof',
        'The backup format is not supported',
        'The token deletes the public key',
      ],
      answer: 0,
      why: 'LMS/HSS signatures are one-time leaves; signing twice from the same state breaks the scheme, which is why the token returns CKR_KEY_EXHAUSTED rather than rewinding.',
    },
  ],
  'hybrid-encrypt': [
    {
      prompt: 'In the six steps, where do the X25519 secret and the ML-KEM-768 secret meet?',
      options: [
        'In the HKDF-SHA-256 combiner that derives the 32-byte session key',
        'They are XORed on the wire',
        'Only the ML-KEM secret is used; X25519 is a fallback',
      ],
      answer: 0,
      why: 'Both secrets are inputs to HKDF, so the session key stays secure if either component survives; that is the point of a hybrid.',
    },
  ],
  'envelope-encrypt': [
    {
      prompt:
        'Compare the RSA-2048 and ML-KEM-768 runs: how many steps does the ML-KEM path add before the AES wrap?',
      options: ['Two: encapsulate, then a KDF', 'None — ML-KEM wraps the DEK directly', 'Five'],
      answer: 0,
      why: 'A KEM produces a shared secret rather than wrapping a chosen key, so a KDF turns that secret into the wrapping key before AES-KW, AES-KWP or AES-GCM runs.',
    },
  ],
  'token-migration': [
    {
      prompt:
        'Sign a token with RS256 and then with an ML-DSA variant. What in the Size Impact Analysis grows most?',
      options: [
        'The signature segment of the JWT',
        'The payload claims',
        'The header alg value only',
      ],
      answer: 0,
      why: 'ML-DSA signatures are kilobytes rather than hundreds of bytes, which is why the CBOR/CWT alternative and header limits matter.',
    },
  ],
  'tee-channel': [
    {
      prompt:
        'After Execute, which key is generated as the attestation key in the PKCS#11 call log?',
      options: ['An ML-DSA-65 key', 'An RSA-2048 key', 'An AES-256 key'],
      answer: 0,
      why: 'The enclave proves its identity with an ML-DSA-65 attestation signature; ML-KEM does the key agreement and AES is the key wrapped across the channel.',
    },
  ],
  'firmware-signing': [
    {
      prompt:
        'The signing configuration says "pure mode, no caller pre-hash". What does that mean for the firmware image?',
      options: [
        'The whole image is passed to the signer, not a digest of it',
        'The image is hashed twice',
        'Only the manifest is signed',
      ],
      answer: 0,
      why: 'Pure ML-DSA signs the message itself (RFC 9882 §3.1 and RFC 9814); a pre-hashed variant would sign a digest, which changes what a verifier must reproduce.',
    },
  ],
  'kdf-derivation': [
    {
      prompt: 'What binds the derived session key to its purpose in the SP 800-108 step?',
      options: [
        'The label and context inputs',
        'The length of the QKD key',
        'The REST endpoint URL',
      ],
      answer: 0,
      why: 'Counter-mode KBKDF mixes a label and a context into each derivation, so the same master secret yields different keys for encryption, MAC and IV without them colliding.',
    },
  ],
  'hsm-capacity': [
    {
      prompt:
        'Switch a scenario from Standards today to Full end-state with ML-DSA-65. What moves the HSM count?',
      options: [
        'Signatures per second per HSM fall, so more HSMs are needed for the same load',
        'The number of locations changes',
        'The headroom percentage resets',
      ],
      answer: 0,
      why: 'Post-quantum signing is slower per operation on the same hardware; the calculator divides your peak transactions by the per-HSM rate and applies N+1 or 2N.',
    },
  ],
  'hybrid-sigs': [
    {
      prompt:
        'Which construction lets a verifier strip one component signature and verify the other alone?',
      options: ['Concatenation', 'Silithium (Fused)', 'All three equally'],
      answer: 0,
      why: 'Concatenation has no non-separability: sig1 and sig2 stand alone. Nesting is weakly non-separable and Silithium is strongly non-separable.',
    },
  ],
  'cacp-kmip': [
    {
      prompt:
        'In the Policy tab, change the disposition for RSA-3072. Where do you see the effect?',
      options: [
        'In Operate, where the next operation uses the policy-selected algorithm',
        'Only in the glossary',
        'Nowhere until the page is reloaded',
      ],
      answer: 0,
      why: 'Crypto agility here is a policy decision: the control plane picks the algorithm per operation from the active policy, and Migration Estate shows which labels move.',
    },
  ],
  'vpn-sim': [
    {
      prompt:
        'Run IKE_SA_INIT in Hybrid mode with fragmentation off and a small MTU. What does the wire capture show?',
      options: [
        'IKE_SA_INIT cannot fragment, so the oversized key share fails the exchange',
        'The packet is silently truncated',
        'The tunnel falls back to classical',
      ],
      answer: 0,
      why: 'RFC 7383 fragmentation applies after IKE_SA_INIT, so a hybrid ML-KEM key share that exceeds the MTU is exactly the problem RFC 9370 intermediate exchanges address.',
    },
  ],
  'pqc-ssh-sim': [
    {
      prompt: 'Which host-key variants run on the real OpenSSH binary in this simulator?',
      options: [
        'The ones marked REAL, such as ssh-mldsa-65 and the SLH-DSA variants',
        'All of them',
        'Only the classical baseline',
      ],
      answer: 0,
      why: 'Variants marked MODEL are computed from sizes; REAL ones execute the handshake on softhsmv3, which is why their telemetry is the one to compare.',
    },
  ],
  'tls-simulator': [
    {
      prompt:
        'Choose X25519MLKEM768 as the key share and mldsa65 as the signature, then Start Full Interaction. Where does the certificate chain size appear?',
      options: [
        'In the TXT and HEX views of the server Certificate message',
        'In the Config File tab only',
        'It is not shown',
      ],
      answer: 0,
      why: 'The handshake transcript shows each message with its bytes; a PQC certificate chain is what makes the Certificate message grow, not the key share.',
    },
  ],
  'tpm-playground': [
    {
      prompt:
        'Track T5 says pure ML-DSA must see the whole message. What TPM command difference does that produce?',
      options: [
        'Streaming commands replace a single hash-and-sign call',
        'The TPM refuses messages over 1 KB',
        'Signing needs a second key',
      ],
      answer: 0,
      why: 'A pure (non-pre-hash) signature is computed over the message itself, so the TPM has to be fed the message in a sequence rather than a 32-byte digest.',
    },
  ],
  'mls-group-messaging': [
    {
      prompt: 'Add a third member to the group. Which nodes re-key?',
      options: [
        'The nodes on the direct path from the new leaf to the root',
        'Every leaf',
        'Only the root',
      ],
      answer: 0,
      why: 'TreeKEM updates the path from a changed leaf to the root, which is why group operations cost logarithmic work instead of pairwise re-keying with everyone.',
    },
  ],
  'suci-flow': [
    {
      prompt: 'Switch to the IMSI-catcher view during the SUCI steps. What does the catcher see?',
      options: [
        'An ephemeral ciphertext, never the SUPI',
        'The SUPI in the clear',
        'The home network private key',
      ],
      answer: 0,
      why: 'SUCI conceals the permanent identifier with the home network public key (Profile A: Curve25519 and AES-128), so a radio observer sees only a fresh encryption each time.',
    },
  ],
  'rng-demo': [
    {
      prompt: 'Generate 64 bytes from Timestamp LCG. Why can the next output be predicted?',
      options: [
        'An LCG is a deterministic recurrence seeded from the clock',
        'The bytes are all zero',
        'It reuses the Web Crypto output',
      ],
      answer: 0,
      why: 'A linear congruential generator has a small internal state and a fixed step; once a few outputs are known, every later one follows, which no cryptographic use can tolerate.',
    },
  ],
  'entropy-test': [
    {
      prompt: 'Load Repeating Pattern and run the static tests. Which check fails first?',
      options: [
        'The runs or serial test, because the pattern repeats',
        'The monobit test, because there are no ones',
        'None — patterns pass',
      ],
      answer: 0,
      why: 'A repeating pattern can have a balanced bit count yet fail structure tests; that is why several statistics are needed, and why real validation uses the SP 800-90B tool.',
    },
  ],
  'qrng-demo': [
    {
      prompt:
        'After Run Entropy Tests on Both Samples, how do the QRNG reference and the CSPRNG compare?',
      options: [
        'Statistically equivalent; only the Weak PRNG stands out',
        'The QRNG scores far higher',
        'The CSPRNG fails monobit',
      ],
      answer: 0,
      why: 'Good randomness from a physical quantum source and from an OS CSPRNG look the same to statistical tests; the page also says this demo generates the "QRNG" sample with crypto.getRandomValues.',
    },
  ],
  'source-combining': [
    {
      prompt: 'Replace Source A with all zeros and run the pipeline. What does the output show?',
      options: [
        "Source B's entropy survives Hash_df conditioning",
        'The output is all zeros',
        'The pipeline refuses to run',
      ],
      answer: 0,
      why: 'Concatenation then Hash_df (SP 800-90C §3.1, §3.2) means one dead source does not zero the result; that is the reason for combining sources at all.',
    },
  ],
  'drbg-demo': [
    {
      prompt:
        'Instantiate the HMAC_DRBG, Generate twice, then Reseed. What changes in the Internal State Tracker?',
      options: [
        'Key and V ratchet on each Generate and take fresh entropy on Reseed',
        'Only the output length changes',
        'The state resets to zero',
      ],
      answer: 0,
      why: 'SP 800-90A defines the three phases: instantiate seeds Key and V, generate ratchets them forward, reseed injects new entropy so a state compromise does not last.',
    },
  ],
  'pki-workshop': [
    {
      prompt: 'After Step 3 issues the certificate, what does Step 5 produce for the Root CA?',
      options: ['An empty CRL signed by the CA key', 'A second root certificate', 'A CSR'],
      answer: 0,
      why: 'Revocation is published as a CRL signed by the issuing CA; with nothing revoked yet the list is empty but still valid and signed.',
    },
  ],
  'hybrid-certs': [
    {
      prompt: 'Which generated format can a relying party that knows only ECDSA still validate?',
      options: [
        'Alt-Sig / Catalyst (ECDSA + ML-DSA)',
        'Pure PQC (ML-DSA-65)',
        'Pure PQC KEM (ML-KEM-768)',
      ],
      answer: 0,
      why: 'Alt-Sig keeps the classical signature in the standard field and adds the PQC one as an extension, so an old verifier ignores what it cannot parse; composite forms need a verifier that knows the composite OID.',
    },
  ],
  'merkle-proof': [
    {
      prompt:
        'Build the tree from 8 leaves and generate an inclusion proof. How many hashes does the proof carry?',
      options: ['Three — one sibling per level', 'Eight — every leaf', 'One — the root'],
      answer: 0,
      why: 'A proof is the sibling hash at each level up to the root, log2(n) for n leaves; that is what makes a Merkle Tree Certificate small.',
    },
  ],
  'cert-capacity': [
    {
      prompt: 'Set Relative to ECDSA and raise the renewal cadence. Which figure grows?',
      options: [
        'CA archive storage, because more certificates are issued per year',
        'Handshake bandwidth',
        'The number of HSMs',
      ],
      answer: 0,
      why: 'Cadence sets how many certificates are issued and archived over time; handshake bandwidth depends on the chain size per connection, not on cadence.',
    },
  ],
  'digital-id': [
    {
      prompt: 'Try to issue the University diploma before the PID. What happens?',
      options: [
        'It requires the PID first',
        'It issues with a warning',
        'It issues a temporary ID',
      ],
      answer: 0,
      why: 'Attestations are bound to the wallet holder identified by the PID; the issuer step says "requires PID", which is the EUDI trust order.',
    },
  ],
  'bitcoin-flow': [
    {
      prompt: 'In Generate Source Key, where does the secp256k1 private key live?',
      options: [
        'Inside the softhsmv3 token; it never leaves',
        'In the browser tab as hex',
        'On the blockchain',
      ],
      answer: 0,
      why: 'The key is created by the HSM CSPRNG and used through PKCS#11; only the public key and signatures come out, which is the custody model the later steps build on.',
    },
  ],
  'solana-flow': [
    {
      prompt: 'Why does the flow call Ed25519 a post-quantum liability?',
      options: [
        'Its public key is on-chain, and a large quantum computer recovers the private key from it',
        'It uses SHA-1',
        'Its signatures are too small',
      ],
      answer: 0,
      why: "Ed25519 is an elliptic-curve scheme; Shor's algorithm breaks it, and every exposed public key is already there to attack.",
    },
  ],
  'hd-wallet': [
    {
      prompt: 'From 256 bits of entropy, how many BIP39 words does the mnemonic have?',
      options: ['24', '12', '32'],
      answer: 0,
      why: 'BIP39 encodes 11 bits per word plus a checksum: 128 bits give 12 words, 256 bits give 24.',
    },
  ],
  'openssl-studio': [
    {
      prompt:
        'In the Workbench, change the key algorithm and watch the Command Preview. What is the studio teaching?',
      options: [
        'That the openssl invocation is the real artefact; the form only writes it',
        'That the form replaces the command line',
        'That keys are generated on a server',
      ],
      answer: 0,
      why: 'Every field maps to a flag in the preview, so what you learn transfers to a terminal; lesson L10 does the same for the config file.',
    },
  ],
  'pki-enrollment': [
    {
      prompt: 'Why does the ML-KEM key update use an encrypted-certificate proof of possession?',
      options: [
        'A KEM key cannot sign, so possession is proved by decrypting the certificate',
        'ML-KEM signatures are too large',
        'CMP requires it for every key',
      ],
      answer: 0,
      why: 'RFC 9810 encrCert POP: the CA encrypts the new certificate to the KEM public key, and only the holder of the private key can recover it.',
    },
  ],
  'email-signing': [
    {
      prompt:
        'Run Encrypt + Decrypt with ML-KEM-768. Which CMS structure carries the recipient key material?',
      options: ['AuthEnvelopedData with a KEMRecipientInfo', 'SignedData', 'A PKCS#12 bundle'],
      answer: 0,
      why: 'RFC 9629 adds KEMRecipientInfo so a KEM replaces RSA key transport inside CMS; signing stays in SignedData.',
    },
  ],
  'api-security-jwt': [
    {
      prompt: 'Create a Nested JWT in Step 3. Who validates what?',
      options: [
        'Classical verifiers process the inner ES256 token; PQC verifiers validate the outer ML-DSA-65 one',
        'Both verifiers must validate both',
        'Only the outer signature counts',
      ],
      answer: 0,
      why: 'Nesting wraps the whole inner token as the payload of an outer PQC-signed token, which is the backward-compatible migration pattern beside the composite algorithm.',
    },
  ],
}
