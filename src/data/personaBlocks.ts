// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "For your role" blocks on modules and tools:
 * one paragraph per CLAIMED persona (decision 3 of the round: a tool's
 * `recommendedPersonas`, a business tool's audience, a module's persona
 * paths), saying what to do with the item in that role's terms. Every line is
 * written against the item's real controls — its step titles, field labels
 * and options — not its summary (round 8: five of eight drafts written from
 * summaries described features the tools did not have).
 *
 * Keyed by route. Rendered by shared/PersonaBlock (active persona's line, or
 * every claimed persona's when none is set). personaBlocks.test.ts pins that
 * every route resolves, every persona listed is one the item claims, and an
 * item present here covers all of its claimed personas. Pages keep their
 * "What this means for you" strip (pagePersonaNotes.ts).
 */
import type { PersonaId } from '@/data/personaIds'

export type PersonaBlockSet = Partial<Record<PersonaId, string>>

export const PERSONA_BLOCKS: Record<string, PersonaBlockSet> = {
  // ── Playground tools (batch 2a, 2026-09-19) — written from each tool's rendered controls ──
  '/playground/cacp-kmip': {
    developer:
      "Take the Guided Tour's ten steps in the Learn tab, from Provisioning a key through Certificate Services, then switch to Operate and Dev: every operation is a genuine KMIP 3.0 request answered by the Rust engine, and Inspect decodes the response tree.",
    architect:
      "Open the Policy tab, change one line of the Permissive (default) policy's algorithm disposition, and watch Operate switch operations from RSA-3072 to ML-DSA-65: crypto agility as a policy decision rather than a code change, with the Migration Estate tab showing which labels move.",
    researcher:
      'The spec status banner says KMIP 3.0 is an OASIS committee draft (CSD02); step 9, An honest HSM, lets you check that Destroy scrubs, read-only refuses and Locate filters, and Inspect shows the raw protocol version and correlation values.',
  },
  '/playground/hsm-capacity': {
    architect:
      'Pick Demand sizing or Inventory sizing, enable the workloads you run (TLS termination, VPN IKE, SSH, DNSSEC, code signing, document signing) with their transactions per second, and choose N + 1 or 2N: the fleet sizing model gives HSMs per location under ML-DSA-65 or SLH-DSA-128s.',
    ops: 'Start from the Small, Medium or Large organisation profile, set the number of locations and the sizing headroom, and read the per-location capacity formula: the result is the HSM count to put in front of a change board, with Model limits & caveats stating what it does not cover.',
    executive:
      'Choose the organisation profile closest to yours and toggle Standards today against Full end-state: the difference in HSM count is the capital question post-quantum signatures raise, before any vendor quote.',
    grc: 'Model transition-window hybrid signing shows the period when both classical and post-quantum signatures run at once; the How we estimated this notes under each workload are the assumptions to record with the figure.',
  },
  '/playground/hybrid-encrypt': {
    developer:
      "Walk the six steps from Generate Alice Keypair to the HKDF-SHA-256 combiner: each step's Field / Value / Description table names the PKCS#11 mechanism your code calls for X25519, ML-KEM-768 encapsulation and the final 32-byte session key.",
    architect:
      'The combiner is the design point: both the X25519 and the ML-KEM-768 secrets feed HKDF, so the session key stays secure if either component survives, and the step tables show the size each component adds to the exchange.',
    researcher:
      'Follow the mechanism and key-handle columns through the six steps to reproduce the exchange outside the browser; the PKCS#11 call log records every call with its return code.',
  },
  '/playground/envelope-encrypt': {
    architect:
      'Set the KEK algorithm to RSA-2048 and then ML-KEM-768 and run the five steps for each: the Artifact Sizes by Step chart shows what the three-step encapsulate, KDF and AES-wrap flow costs against a one-step RSA-OAEP wrap.',
    researcher:
      'Choose AES-KW, AES-KWP or AES-GCM as the wrap mechanism and compare the wrapped-key sizes in the Envelope Encryption Flow; Run NIST KAT confirms the ML-KEM and wrap implementations against the published vectors.',
    ops: 'Run the ML-KEM-768 / AES-KW flow with Execute (Live WASM): the PKCS#11 call log is the sequence of calls a KMS makes for every data key, which is what a migration changes on your HSM partitions.',
  },
  '/playground/token-migration': {
    developer:
      'Switch the signing algorithm from RS256 (RSA-2048) to an ML-DSA variant, press Sign Token (Live WASM) and then Verify Signature: the header, the signature size and the Size Impact Analysis show what your JWT libraries and token limits will see.',
    architect:
      'Use the Size Impact Analysis and the CBOR Token Encoding (CWT / COSE) alternative to decide whether a PQC token still fits your headers, cookies and gateways before choosing the algorithm.',
    researcher:
      'Run NIST KAT under IAM PQC Known Answer Tests, then compare the same payload signed with each algorithm to measure the exact signature and header overhead.',
    ops: 'The Verification Flow — Relying Party Perspective panel shows what every service that validates tokens must be able to parse after the switch; use it to list which relying parties need updating first.',
  },
  '/playground/firmware-signing': {
    developer:
      'Select ML-DSA-65 beside RSA-2048 in Upload & Configure, use the mock UEFI manifest or your own binary, and walk the four steps: the CMS output shows the pure-mode signing the RFC 9882 comment in the configuration refers to.',
    architect:
      'The side-by-side keys, signatures and CMS output show the size a firmware image grows by under ML-DSA-65, which is the number your boot ROM and update channel must have room for.',
    researcher:
      'Run NIST KAT under Secure Boot PQC Known Answer Tests, then compare the classical and post-quantum CMS structures produced from the same manifest.',
    ops: 'Sign the mock UEFI manifest with both algorithms and keep the two CMS outputs: they are what a signing service and a verifier on the device exchange, and the difference between them is your update-pipeline change.',
  },
  '/playground/slh-dsa': {
    developer:
      'Pick a parameter set from the twelve FIPS 205 variants, keep Pure mode (the recommended default), then run 1. Generate Key Pair, 2. Sign Message and 3. Verify Signature: the PKCS#11 call log shows the exact C_GenerateKeyPair, C_Sign and C_Verify sequence your code would issue.',
    architect:
      'Compare SHA2-128s against the f variants and the 192/256 levels: the same message signs to very different signature sizes, and the Stateful vs Stateless comparison panel says when a stateless scheme is worth that size over LMS or XMSS.',
    researcher:
      'Run NIST KAT under Stateful Signatures Known Answer Tests to see the in-browser implementation byte-match the FIPS 205 vectors, then switch between Pure and pre-hash mode to see what changes on the wire.',
  },
  '/playground/lms-hss': {
    developer:
      'Use the HSS / LMS Explorer to pick the hash (SHA-256 or SHAKE-256), tree height and Winternitz parameter, sign with Sign Message, and watch the Signature Counter: the token returns CKR_KEY_EXHAUSTED when the state runs out, which is the error your code has to handle.',
    architect:
      'Press Simulate State Loss after a few signatures: the What happens if state is lost panel shows why a stateful key can never be restored from backup, which decides where these keys may live in your design.',
    researcher:
      'Sign with the Rust engine and press Verify Signature (C++ engine), then tick Tamper with message or Tamper with signature: the cross-engine verification shows the exact byte flip that breaks C_Verify.',
  },
  '/playground/hybrid-sigs': {
    developer:
      'Choose Concatenation, Nesting or Silithium (Fused), then Generate Key Pairs, Sign and Verify on your message: the PKCS#11 trace shows the ML-DSA-65 calls through softhsmv3 and the description says whether a component signature can be stripped and verified alone.',
    architect:
      "The three modes differ in non-separability: concatenation offers none, nesting weak, Silithium strong; the Why hybrid signatures? panel and each mode's IETF reference are the basis for choosing one for a migration-period certificate.",
    researcher:
      'Sign the same message under all three constructions and compare signature layouts: the trace and the descriptions let you reproduce each composition and its separability property.',
  },
  '/playground/kdf-derivation': {
    developer:
      'Press Fetch QKD Key to start from the ETSI QKD 014 REST step, then follow the SP 800-108 counter-mode derivation: the label and context inputs are what bind the derived key to one purpose, and the same call applies to a KEM shared secret or a PSK.',
    architect:
      'Read KBKDF vs HKDF — Choosing the Right KDF before the run: it says when SP 800-108 counter mode and when HKDF is the right choice for splitting one master secret into encryption, MAC and IV keys.',
    researcher:
      'Open What runs live vs. simulated? to see that the QKD retrieval is a modelled REST exchange while the derivation runs in the PKCS#11 log; Run NIST KAT checks the KDF against the QKD/HSM PQC Known Answer Tests.',
  },
  '/playground/tee-channel': {
    architect:
      "Choose one of the presets such as Intel SGX + Thales Luna or AMD SEV-SNP + Entrust nShield, then Execute (Live WASM): the tool loads that pairing's documented integration architecture and shows which keys end up in the enclave and which in the HSM.",
    researcher:
      'Open What runs live vs. simulated? before reading the results: the ML-DSA-65 attestation key, ML-KEM key agreement and the AES key wrap run in the PKCS#11 call log, and the attestation transport is simulated.',
  },
  '/playground/tls-simulator': {
    developer:
      'Choose a key share such as X25519MLKEM768 and a signature algorithm such as mldsa65 on the client and server panels, then Start Full Interaction: the TXT and HEX views show every handshake message and the Config File tab is the OpenSSL configuration that produces it.',
    architect:
      'Compare the handshake with P-256 against ML-KEM-768 and a hybrid: the message sizes and the Trusted Root CA and mTLS options show what a PQC certificate chain adds to every connection.',
    researcher:
      'The supported set is listed at the top (pure ML-DSA certificates, hybrid key shares per the IETF drafts); use INSPECT and the HEX view to check the key share and signature encodings against the drafts.',
    ops: 'Set the server side the way your edge is configured, tick Require Client Certificate (mTLS) if you use it, and run the interaction: the Config File tab is the snippet shape you will deploy, and the Learn module holds the Apache, nginx, HAProxy and Caddy versions.',
  },
  '/playground/vpn-sim': {
    developer:
      'Pick Classical (DH Group 15), Hybrid (ML-KEM-768 + ECP-256) or Pure PQC (ML-KEM-768), Start Daemon, and step through IKE_SA_INIT and IKE_AUTH: the Live Wire Capture and Packet Inspector show the payloads, and Raw Config is the strongSwan configuration behind them.',
    architect:
      'Enable IKE Message Fragmentation (RFC 7383) and lower the MTU to see why IKE_SA_INIT cannot fragment and where a hybrid key share breaks a tunnel; the SKEYSEED Chaining panel explains the RFC 9370 intermediate exchange.',
    ops: 'Use Raw Config, then Download config bundle (.zip): it is the client and server configuration for the mode you chose, and Run algorithm matrix shows which combinations complete before you schedule a cutover.',
    researcher:
      "Open What's Real vs Simulated in This Build first: key generation and signing run on softhsmv3 PKCS#11 in the two token slots, and the Tunnel Statistics compare handshake sizes across the three modes.",
  },
  '/playground/pqc-ssh-sim': {
    developer:
      'Pick a key exchange such as mlkem768-curve25519-sha256 (marked REAL) and a host key like ssh-mldsa-65, press Run both handshakes, and read the Handshake Log, PKCS#11 Calls and Wire Packets tabs beside the classical baseline.',
    architect:
      'The side-by-side telemetry compares Classical (ecdsa-nistp256 + curve25519) with PQC (ML-DSA-65 + ML-KEM-768 × X25519) on packet sizes and round trips; the Host Trust & TOFU note covers what changes when host keys change algorithm.',
    researcher:
      'Variants marked REAL run on softhsmv3 and those marked MODEL are computed; compare an ML-DSA host key with an SLH-DSA one on the Wire Packets tab to measure the difference in the KEXINIT and signature payloads.',
  },
  '/playground/suci-flow': {
    developer:
      "Execute the steps from Home Network Key Generation through the UE's SUCI construction with Execute Step: Profile A uses Curve25519 and AES-128, and the Operator view shows the exact values a network's de-concealment side would compute.",
    architect:
      'Switch between Operator view and IMSI-catcher view: the catcher sees only ephemeral ciphertext, never the SUPI, which is the property a PQC profile has to preserve when Curve25519 is replaced; Customize… changes the profile and identifiers.',
    researcher:
      'Run NIST KAT under 5G PQC Known Answer Tests and use Plain English beside each step to check the construction against the 3GPP profile; the live HSM mode runs the key agreement in softhsmv3.',
  },
  '/playground/mls-group-messaging': {
    developer:
      'Run the three live primitives, the ML-DSA-65 credential signing, the ML-KEM-768 HPKE TreeKEM update and the AES-128-GCM message encryption, then Add a member to the ratchet tree: the nodes on the direct path that must re-key are the ones your client would update.',
    architect:
      'Use Add, Remove and Update on the TreeKEM ratchet tree to see how group size changes the number of re-keyed nodes; the How openmls_pqctoday_crypto wires OpenMLS to the HSM section shows where signature keys can be kept in custody.',
    researcher:
      'Enable HSM mode so the three primitives route through softhsmv3 (C_SignMessage, C_EncapsulateKey, C_EncryptInit) and compare the key material with the software path; the Authoritative references list the RFCs the invariants come from.',
  },
  '/playground/tpm-playground': {
    developer:
      'Run the eight tracks from Boot & discover to An honest TPM in the Learn tab, then use the Command Builder to send raw commands such as TPM2_GetCapability to the WebAssembly TPM: the Execution Log shows tags, return codes and the ML-KEM and ML-DSA primitives.',
    architect:
      "Track T3, Key establishment — transport vs encapsulation, and T6, Factory identity, show where a TPM's trust model changes under PQC; the V2.7 EKs and EK Certs tabs read the post-quantum endorsement key templates and certificates.",
    researcher:
      "Run the V1.85 Compliance Suite from the Command Builder and the ML-DSA Attestation tab's Quote / Certify with in-browser verify: track T8 shows how to detect fake crypto and spec drift yourself.",
  },
  '/playground/rng-demo': {
    researcher:
      'Generate 64 bytes from each source, Web Crypto API, OpenSSL WASM, Math.random() and Timestamp LCG, and compare them: the LCG output can be predicted from earlier bytes, which is the failure the test table shows.',
    developer:
      'Generate from Web Crypto API and from Math.random() side by side: the first is the call your code should make for keys and nonces, the second is the one that must never be, and the panels show why.',
    architect:
      'The Production Entropy Sources section lists the hardware and cloud services that feed SP 800-90B qualified entropy into production systems, which is where a key-generation design has to start.',
    ops: 'Use the four sources to see what a weak generator produces; the Production Entropy Sources list names the hardware and cloud entropy feeds to check for on your key-generating hosts.',
  },
  '/playground/qrng-demo': {
    researcher:
      'Generate CSPRNG and Run Entropy Tests on Both Samples: monobit, runs and chi-squared results for the QRNG reference, the CSPRNG and the Weak PRNG sit side by side, and the note states that the QRNG sample here is produced by crypto.getRandomValues, not quantum hardware.',
    curious:
      'Press Run Entropy Tests on Both Samples and look at which of the three sources fails: good random numbers from a computer and from a quantum device look the same statistically; only the weak one stands out.',
  },
  '/playground/entropy-test': {
    researcher:
      'Load Generate Random, then All Zeros, Repeating Pattern and Incrementing under Static Tests: the simplified tests show which check each bad sample fails; the note says production validation needs the NIST SP 800-90B EntropyAssessment tool.',
    architect:
      'Use the Bit Flipper and the Live Monitor to see how small biases change the test results; the point for a design is that ML-KEM and ML-DSA key generation depends on the same entropy quality.',
    developer:
      "Paste Hex from your own generator's output and run the static tests; Run NIST KAT under Entropy Testing Known Answer Tests shows the implementations against the published vectors.",
  },
  '/playground/drbg-demo': {
    architect:
      'Instantiate HMAC_DRBG with a personalization string, then Generate and Reseed: the Internal State Tracker shows the Key and V vectors ratcheting, which is why a DRBG can be seeded once and reseeded on a schedule.',
    developer:
      'Set the bytes and optional additional input, Generate several times and Reseed: the state tracker shows what your DRBG wrapper must keep between calls and when reseeding changes the output.',
    researcher:
      'Use a custom nonce and personalization to reproduce a deterministic run, then compare the Instantiate and Generate outputs across runs to check the SP 800-90A HMAC_DRBG construction.',
  },
  '/playground/source-combining': {
    researcher:
      "Generate Source A (CSPRNG), Assemble via Concat, Apply Hash_df and Expand to 64 bytes: each step names its SP 800-90 section, and replacing Source A with all zeros shows Source B's entropy surviving conditioning.",
    architect:
      'The SP 800-90C RBG Construction Types panel and the four-step pipeline are the reference for combining two entropy sources in a design so that one weak source does not weaken the key.',
    developer:
      'Run the pipeline once with the defaults and once with a zeroed Source A; the Hash_df and HKDF outputs are what your key-generation code should produce from the same inputs.',
  },
  '/playground/pki-workshop': {
    developer:
      'Step 1 generates a key and a CSR (choose the key source and a profile), Step 2 creates a root CA, Step 3 issues the certificate, Step 4 parses it and Step 5 revokes it with a CRL: the Console Output is the OpenSSL you would run.',
    architect:
      'Pick a profile in Select Profile and read the constraints it applies, then compare the parsed certificate in Step 4: the fields and sizes are what a PQC key changes in a chain.',
    researcher:
      'Use the Console Output at each step to reproduce the CSR, CA, issuance and CRL outside the browser.',
    ops: 'Run the five steps once with the default RSA key to see the full issue-and-revoke cycle, then note the Step 5 CRL: it is the artefact your revocation distribution has to carry.',
    curious:
      'Follow the five steps in order: you make a request, create an authority, get a certificate issued, read what is inside it, and revoke it — the whole life of a certificate in one sitting.',
  },
  '/playground/cert-capacity': {
    architect:
      'Enter your certificate count, renewal cadence and TLS handshakes per second and switch between Absolute and Relative to ECDSA: the Business Impact Summary states the archive storage and handshake bandwidth growth for the staged hybrid PKI.',
    ops: 'Fill in the three parameters from your inventory and Export CSV: the figures are the storage and bandwidth the CA and the edge need for the renewal cadence you run.',
    executive:
      'Three inputs, one summary: how much CA storage and handshake bandwidth grow when certificates move from ECDSA to ML-DSA, with the staged hybrid path shown as the alternative.',
    grc: "The Business Impact Summary and the Export CSV give a sourced figure for the certificate side of the migration, with the model's benchmark caveat stated on the page.",
  },
  '/playground/hybrid-certs': {
    developer:
      'Press Generate All Formats, or generate one at a time: Pure PQC (ML-DSA-65), Composite (ML-DSA-65 + ECDSA), Alt-Sig / Catalyst, Related Certificates (RFC 9763) and the KEM certificates; the PKCS#11 log shows the key generation each one needs.',
    architect:
      "Choose a composite profile such as ML-DSA-65 + ECDSA P-256 from the draft's list and compare its certificate with the Alt-Sig and Related Certificates forms: each keeps or breaks backward compatibility with relying parties differently.",
    researcher:
      'Generate each format and compare the encoded certificates: the OIDs in the composite profile list come from the draft, and the Pure PQC KEM (ML-KEM-768) form shows a certificate whose key is for encapsulation, not signing.',
    ops: 'Generate the Composite and the Alt-Sig / Catalyst forms: a relying party that knows only ECDSA still validates one of them, and that is the property that decides which form your fleet can carry during migration.',
  },
  '/playground/merkle-proof': {
    developer:
      'Load 8 sample certs or add your own Subject CN leaves, Build Merkle Tree, then walk Inclusion Proof, Verify Proof, Size Comparison and CT Log: the proof for one leaf is the structure a Merkle Tree Certificate carries.',
    researcher:
      'Run NIST KAT under Merkle Tree Certificates Known Answer Tests, then use the Size Comparison step to measure a proof against an ML-DSA-44 signature on the same leaf.',
    curious:
      'Add a few certificate names, build the tree at Slow speed, and click a node: you can see how one small proof shows that a certificate is in the tree without listing all the others.',
  },
  '/playground/digital-id': {
    developer:
      "Walk the five steps, EUDI Wallet, PID Issuer, University, Bank (RP) and QTSP (QES): the wallet's Credentials, Hardware Keys and History tabs show what is issued, where the keys live and what each relying party asked for.",
    architect:
      "The PQC Readiness note on the wallet step says today's credentials use P-256 and P-384 and where PQC is expected in the ARF; the Hardware Keys tab is where an architecture has to place the post-quantum keys.",
    researcher:
      'Follow the OpenID4VCI issuance and the mDoc and QES steps with the History tab open: the log records each exchange, which is the material to compare against the ARF and the standards it cites.',
  },
  '/playground/bitcoin-flow': {
    developer:
      'Walk the nine steps from Generate Source Key: the secp256k1 key is created inside the softhsmv3 token, and each step explains the transaction structure being built and signed.',
    researcher:
      "The Shor's Algorithm note on the first step is the threat model; follow the steps to see which values in a transaction expose the public key and when.",
  },
  '/playground/hd-wallet': {
    developer:
      'Generate Mnemonic starts the five steps: 256-bit entropy to a 24-word BIP39 phrase, a PBKDF2 seed, a master key and BIP32 or SLIP-0010 derivation to BTC, ETH and SOL addresses, with the PKCS#11 traces for each.',
    researcher:
      'The step table lists the sizes at each stage, from 256 bits of entropy to the derived addresses; use it to reproduce the derivation path and compare it with the classical and post-quantum key sizes.',
  },
  '/playground/solana-flow': {
    developer:
      'Walk the nine steps from Generate Source Keypair: Ed25519 signing, the BIP39 and SLIP-0010 derivation notes and the signed message at the end show what a Solana client signs and where a post-quantum replacement would sit.',
    researcher:
      'The notes on each step explain why an Ed25519 signature is a post-quantum liability; compare the signed message with the Bitcoin flow to see what differs between EdDSA and ECDSA transactions.',
  },
  '/playground/openssl-studio': {
    developer:
      'Run the eleven Learn lessons from Your first keypair to the Capstone, then open Workbench: the Command Preview shows the openssl invocation for each form field, and Edit OpenSSL Config exposes the openssl.cnf behind it.',
    architect:
      "Lessons L4 (key establishment without classical exchange), L7 (key derivation) and L8 (packaging keys) are the design choices; the Explore tab's Query this build lists which algorithms this OpenSSL build supports.",
    researcher:
      "Lesson L5, An honest LMS, is a claim you can check yourself; the Explore tab's Algorithm Explorer and the glossary's commands and flags are the reference for reproducing each lesson at a terminal.",
    ops: "Use the Workbench's Quick Start, Key Generation, CSR and Certificate forms with Command Preview open: the commands are what your scripts will run, and lesson L10 demystifies the config files they read.",
  },
  '/playground/api-security-jwt': {
    developer:
      'Choose ML-DSA-44, 65 or 87 or an SLH-DSA set, pick the signing backend (@noble/post-quantum or SoftHSM3), Generate Keypair and Sign JWT: the editable payload and the resulting header show what your issuer and verifier will handle.',
    architect:
      "Step 3 offers two hybrid patterns, a Nested JWT and a Composite MLDSA65-Ed25519 signature: which verifiers accept each is the migration decision, and Step 4's ML-KEM-768 JWE shows encrypted tokens.",
    researcher:
      'Run NIST KAT under API Security JWT Known Answer Tests, then sign the same payload with each algorithm and backend to compare signature sizes and the composite encoding against the JOSE drafts.',
  },
  '/playground/pki-enrollment': {
    developer:
      'Generate an ML-DSA-65 keypair, Send CMP Initial Request with a subject DN and shared secret, Run simpleenroll for EST, then Run ML-KEM-768 KUR: the four steps are the RFC 9810 and RFC 7030 exchanges a client library implements.',
    architect:
      'The CMP Initial Request is ML-DSA signed and the key update uses an encrypted-certificate proof of possession for a KEM key: these two steps show how enrollment works when the key cannot sign.',
    ops: 'Regenerate CA and run the four steps: the CMP and EST requests and the PKCS#7 response are what your enrollment endpoints will exchange with devices after the switch.',
    researcher:
      "Compare the CMP and EST enrollments of the same key and the KEM key update's encrCert proof of possession against RFC 9810 and RFC 7030; the full module adds composite enrollment and certificate inspection.",
  },
  '/playground/email-signing': {
    developer:
      'Run Sign + Verify with ML-DSA-65 on a payload, then Encrypt + Decrypt with ML-KEM-768 and aes-256-gcm: the CMS SignedData and AuthEnvelopedData are produced by OpenSSL 3.6 WASM, and Use HSM key routes the signing key through softhsmv3.',
    architect:
      'The Dual-sign + Verify step (ML-DSA-65 with EC, marked WIP and not LAMPS composite) shows the migration-period pattern of two SignerInfos; the CMS Encryption step shows KEMRecipientInfo replacing key transport.',
    researcher:
      'Run the ML-DSA and ML-KEM steps and compare the CMS structures with and without the HSM key; the Live HSM Provider smoke test at the top shows whether the PKCS#11 provider initialised.',
  },
}

export function personaBlocksFor(route: string): PersonaBlockSet | undefined {
  // eslint-disable-next-line security/detect-object-injection -- route is a literal from the calling component
  return PERSONA_BLOCKS[route]
}
