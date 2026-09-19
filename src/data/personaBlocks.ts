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
  // ── Business tools (batch 2b, 2026-09-19) — written from each tool's rendered controls ──
  '/business/tools/roi-calculator': {
    executive:
      'Pick the SMB, Average org or Fortune-1000-class tier, enter the products to migrate, capex per product and the planning horizon: the three-year total cost against the cost of inaction is the payback figure for the board, exportable as .pdf or .docx.',
    grc: 'The Applicable Frameworks and Penalty per Incident inputs put regulatory exposure into the same figure as breach cost; keep the HNDL exposure and breach-probability inputs you used, because they are the assumptions an auditor will ask about.',
  },
  '/business/tools/board-pitch': {
    executive:
      'Fill the Executive Summary, Harvest-Now Risks, Migration Timeline and Budget Request sections in Edit, then Preview: one ask, one date, one consequence of missing it is the test the tool sets for the deck.',
    grc: 'The Risk Assessment Summary, Governance Structure and Peer Benchmark sections are where the compliance position goes; the Recommended Actions section is what the board is asked to approve and later hold the programme to.',
  },
  '/business/tools/breach-simulator': {
    executive:
      "Choose your industry sector and region, the data type you hold and the years of stored data: the classical and quantum-enabled breach costs update together, and the Mosca's theorem verdict says whether migration is already late.",
    grc: 'Set Years of Stored Data to your retention period and the migration time to your plan: the HNDL exposure factor and the Key Findings give the risk-register entry its likelihood and impact, with the IBM 2025 baseline cited on the page.',
  },
  '/business/tools/cost-of-inaction': {
    executive:
      'Slide Migration delay from 0 to 3 years with the horizon fixed: the ten-year cumulative NPV chart shows the year where waiting becomes the more expensive choice, and the breakdown shows which cost drives it.',
    grc: 'The Delay cost breakdown separates accumulated exposure from delay premium; record the annual breach probability and migration duration you chose, since they carry the whole comparison.',
  },
  '/business/tools/cost-model-explorer': {
    executive:
      'Enter the systems in scope and the annual IT budget, then read the parametric, bottom-up and Monte Carlo estimates side by side: the spread between them is the honest range to bring to a budget discussion.',
    grc: 'Run Monte Carlo and note which slider moves the result most: that assumption is the one to document and defend, and the cost-of-inaction line is shown as a reference because it measures a different thing.',
  },
  '/business/tools/crqc-scenario': {
    executive:
      'Set the CRQC arrival year and read which of RSA-2048, ECDSA P-256 and the others are broken by then, and the HNDL exposure window for data kept past that year; the default is the 2038 consensus median.',
    grc: 'Tick your compliance deadlines against the arrival year you chose: the Compliance Deadlines panel shows which obligations fall before the algorithms break, which is the order the controls have to land in.',
  },
  '/business/tools/risk-register': {
    executive:
      'Read the four example entries, RSA-2048, AES-128, ECDSA P-256 and DH-2048, with their likelihood and impact: the Risk Summary is the shape of the register the programme will be held to, and every entry needs a named owner.',
    grc: 'Add Risk Entry for each asset with its threat, likelihood, impact, owner and mitigation strategy; the How Likelihood × Impact Scoring Works panel is the method to cite, and Copy Markdown or .pdf exports the register for the risk committee.',
  },
  '/business/tools/risk-treatment-plan': {
    executive:
      'Load sample entries or build the register first, then read the Migration Priority Order: it is the sequence of what gets fixed first and why, and each move up or down has to carry a stated reason.',
    grc: 'Place each risk on the heatmap, choose Mitigate, Accept, Transfer or Avoid with a rationale: the Treatment Summary is the treatment plan a risk framework expects, one decision per entry.',
  },
  '/business/tools/compliance-checklist': {
    executive:
      'Enter the industry and primary jurisdiction and star your frameworks on the Compliance page: each starred framework gets a checklist with a deadline and an owner, which is the compliance programme in one view.',
    grc: "Each per-framework checklist carries evidence items such as 'Crypto inventory mapped to this framework' with a compliance owner; complete Scope & context first so exclusions are recorded before the controls are.",
  },
  '/business/tools/audit-checklist': {
    executive:
      'The seven readiness areas, from Cryptographic Inventory to Exceptions, each move from Not Started toward Established as items are ticked: the overall picture is what an audit will find today.',
    grc: "Tick each control, for example 'CBOM generated' or 'RACI defined', and add an evidence row with the reference such as a CMVP certificate number; every item cites its source (EO 14028, SP 800-131A, CSF 2.0) so the auditor can follow the row.",
  },
  '/business/tools/compliance-timeline': {
    executive:
      'Select the jurisdictions you operate in and add milestones with a year: the Gap Analysis says, per framework, whether the plan meets the deadline or by how many years it misses.',
    grc: "Choose the jurisdictions, then add milestones such as 'Complete crypto inventory' against each framework's deadline: the gap per framework is the finding to put in front of the compliance committee.",
  },
  '/business/tools/raci-builder': {
    executive:
      'Read the pre-filled matrix: each PQC activity has one Accountable role and the tool flags a row with two, because two Accountables means nobody owns it.',
    grc: 'Set Accountable, Responsible and Consulted per activity, for example the Enterprise Architect as Accountable for Crypto Inventory; the RACI Matrix Export is the governance artefact the programme charter refers to.',
  },
  '/business/tools/policy-generator': {
    executive:
      'Choose the Cryptographic Algorithm Policy, Key Management Policy, Vendor Crypto Requirements or Migration Timeline Policy template, name the policy owner and approver, and export: the policy names the approved and prohibited algorithms and the review cadence.',
    grc: 'Approve ML-KEM and ML-DSA, list the classical algorithms to retire, define the exception process and add KPI drift rules; the Applicable Standards section (NIST, ENISA, ISO/IEC, IETF, FIPS 140-3) ties the policy to its references.',
  },
  '/business/tools/kpi-dashboard': {
    executive:
      'Switch View as to Executive: the overall score and the KPIs such as Algorithms Migrated and Budget Utilization are the three to five measures that would move if the programme stalled.',
    grc: "Enter the scores you can evidence, Customise Weights to your framework's priorities, and note which KPIs need assessment or compliance data to unlock; How this score is computed is the method to cite with the .csv export.",
  },
  '/business/tools/vendor-scorecard': {
    executive:
      'Score each vendor on the six criteria, PQC Algorithm Support, FIPS 140-3 Validation, Published PQC Roadmap, Crypto Agility, SBOM/CBOM Delivery and Hybrid Mode Support: the weighted total ranks the vendors you depend on.',
    grc: 'Set each score with the migrate catalogue as evidence and fill the Observability Tooling Notes (crypto scanner, CVE feed, SIEM rules, zero-trust enforcement): the export is the vendor-assurance record.',
  },
  '/business/tools/contract-clause': {
    executive:
      'Pick the PQC compliance deadline year, the required algorithms and the non-compliance penalty: the generated clauses are the obligations to put on the table with a vendor, with counsel review noted on the page.',
    grc: 'Require ML-KEM and ML-DSA, a CMVP certificate number as evidence, CBOM delivery in a chosen format and a notice period for cryptographic changes, plus audit rights: each section becomes a clause with the evidence requirement written in.',
  },
  '/business/tools/supply-chain-matrix': {
    executive:
      'The matrix maps the products you selected on Migrate across TLS, VPN, SSH, email and messaging by migration gap and impact: the suppliers you cannot replace inside your own deadline are the programme.',
    grc: 'Read the Product Dependencies per domain with the catalogue evidence behind each cell; a product in the high-gap, high-impact corner is a third-party risk entry with its proof attached.',
  },
  '/business/tools/roadmap-builder': {
    executive:
      'Track A (confidentiality, key exchange) and Track B (integrity, signatures and PKI) run in parallel on the eight-phase spine with gates G0 to G6: each phase needs an exit test, not only an end date.',
    grc: "Add milestones against the regulatory dates listed for your countries and check the Mitigation Gateways: the Roadmap Export shows each gate's criterion, which is the evidence the programme review will ask for.",
  },
  '/business/tools/stakeholder-comms': {
    executive:
      'Write the Board / C-Suite message and set the reporting frequency and status-report format: the export is the communication plan that keeps the board informed without a second briefing.',
    grc: 'List the stakeholders with their power and interest, set the engagement strategy per group and the escalation triggers and path: the plan documents who is told what, when, which an audit of programme governance expects.',
  },
  '/business/tools/kpi-tracker': {
    executive:
      'Set the programme start year and switch View as to Executive: Pace-to-Deadline becomes a real number and the vendor, FIPS, threat and compliance KPIs score from your Migrate catalogue and assessment.',
    grc: 'Enter the scores you can evidence, note which KPIs are auto-scored from live data and which need input, and export the .csv each period: the trend fills in as later assessments add snapshots.',
  },
  '/business/tools/deployment-playbook': {
    executive:
      'Seven phases from Pre-Deployment Preparation to Rollback Procedures, each a checklist: the test the tool sets is that a colleague could run it at 3am without calling you.',
    grc: 'Tick the items as they are done, from feature flags and hybrid mode to Post-Deployment Validation and the Decommission Plan: the .pdf is the change record, with the CSWP.39 §4 methodology cited at the top.',
  },
  '/business/tools/hybrid-transition-planner': {
    architect:
      "Inventory the protocol, the algorithm in use, the data lifetime and the deployment maturity, set the interoperability and compliance constraints, then edit the plan narrative: the tool's decision tree from CSWP.39 §3.2.4 picks traditional+PQC, PQC+PQC, pure PQC or a gateway, and a hybrid without an exit trigger is flagged as permanent.",
  },
  '/business/tools/mti-negotiator': {
    architect:
      'Choose the protocol and audience, the interoperability profile (non-PQC, hybrid-only or pure-PQC peers), the compliance deadline and hardware constraints: the tool picks the mandatory-to-implement signature, KEM and hash with alternates, checked against the protocol matrix.',
  },
  '/business/tools/crypto-api-refactor-audit': {
    developer:
      'Enter the application type, language and the crypto APIs in use (OpenSSL EVP, BoringSSL, libsodium, BouncyCastle, .NET, Web Crypto, JCE, PKCS#11), the call-site count and how hardcoded they are: the plan is a phased refactor checklist by call site with language-specific guidance.',
  },
  '/business/tools/cloud-responsibility-matrix': {
    architect:
      'Select the cloud providers and service-model mix, the key-management posture and data lifetime, then edit the responsibility plan: the matrix says per asset class who acts first, with the PQC availability per cloud and the BYOK, FedRAMP and sovereign-cloud watch-outs.',
  },
  '/business/tools/crypto-architecture-diagram': {
    executive:
      'Add the applications, libraries, HSMs, protocols, key stores and certificate authorities with their dependencies: the diagram preview draws the chain and the detail lines say which components have post-quantum support yet.',
    grc: "Capture each cryptographic component with its version and dependencies (for example an HSM's firmware and whether it has ML-DSA): the structured table and the Mermaid diagram are the inventory artefact, exportable as markdown or PDF.",
  },
  '/business/tools/management-tools-audit': {
    executive:
      'Rate coverage None, Manual, Partial or Automated for the seven tool categories from crypto scanners to zero-trust enforcement: the gap list, ordered by importance, says which tool has to change before a production key does.',
    grc: 'Enter the systems covered by each category and the coverage level: the export records the management-tools gap the CSWP.39 §5 step 3 audit requires, with the ordering already applied.',
  },
  '/business/tools/crypto-cbom-builder': {
    executive:
      'Three linked views, SBOM to CBOM, library posture and hardware FIPS 140-3 inventory, produce a CBOM slice: the point is a bill of materials you can regenerate, not one built by hand.',
    grc: "Map an SBOM into a CBOM, record library posture and the HSM inventory with CMVP references, then Download CycloneDX 1.7: it is the inventory evidence that feeds the assets pipeline and the audit checklist's 'CBOM generated' item.",
  },
  '/business/tools/crypto-vulnerability-watch': {
    executive:
      'The digest lists the top CVEs by severity for the products you selected on Migrate, joined through CPE from the NVD snapshot: a short list you will actually read, not everything.',
    grc: 'Open Migrate to select the products in your estate, then read the CVE digest per product with How this data is sourced open: it is the vulnerability-management evidence for the crypto components you depend on.',
  },
  '/business/tools/program-charter': {
    executive:
      'Name the sponsor, write the purpose and scope boundary, fill the Steering Committee seats and cadence, and enter the year-one budget and multi-year commitment: the export is the one-page charter that closes gate G0.',
    grc: 'Record the mandate sign-off date, the QRPM appointment, the governance cadence and the success criteria: these are the Phase 0 records a programme review checks first.',
  },
  '/business/tools/initial-scoping': {
    executive:
      'List the top in-scope systems, give an estate-size estimate and the top vendor dependencies, seeded from your Migrate selection: an honest inventory gap is a finding, and often the most valuable one.',
    grc: 'Triage each system as internal or external with its protocols and sensitivity, and enter the estate-size estimate: the export is the Phase 0 scope statement the later inventory is measured against.',
  },
  '/business/tools/skills-team-plan': {
    executive:
      'Enter the instances in scope: the one-FTE-per-500-instances heuristic sizes the core roles for years one and two and for production rollout, and each role gets build, borrow or buy.',
    grc: 'Record the build, borrow or buy decision per core role and where the sizing comes from: the export is the resourcing evidence behind the training and staffing controls.',
  },
  '/business/tools/infra-modernization-planner': {
    executive:
      'The PKI modernization, HSM and KMS upgrade schedule, middlebox report and capacity plan consolidate into one export: it is the infrastructure investment the migration needs, with hardware replacement planned two to four years out.',
    grc: 'Enter the CA lifetimes, the HSMs inventoried with firmware and PQC status, the protocols tested through middleboxes and the capacity impact: the export records the infrastructure controls and their dates.',
  },
  '/business/tools/refresh-cycle-alignment': {
    executive:
      'Set the planning horizon and list the refresh programmes with their years: the assets whose refresh lands after the deadline are named, and those need a decision now rather than later.',
    grc: 'Add each funded refresh programme (data centre, SD-WAN, cloud, PKI, HSM, vendor renewals) with its year and the PQC task that rides it: the export shows which migration work has a budget line and which does not.',
  },
  '/business/tools/accelerated-execution-profile': {
    executive:
      'Tick the trigger conditions, write the compressed wave order, size the emergency resource request and name who can activate it: a contingency package ready before the quantum timeline moves.',
    grc: 'Pre-approve the risk acceptances (for example a temporary performance regression during rollout) and record the activation authority: the export is the documented contingency the risk committee signs before it is needed.',
  },
  '/business/tools/data-at-rest-strategy': {
    executive:
      'For each data store, set the sensitivity and choose re-encrypt, re-wrap, crypto-shred, delete or accept and monitor: retention drives the order, because data that stays secret for ten years is the harvest-now target.',
    grc: 'Enter each store with its retention note and the decision taken: the export records the per-store data-at-rest disposition back into the CBOM, which is the evidence of Phase 5 activity 5.6.',
  },
  '/business/tools/migration-verification': {
    executive:
      'Add each system and tick the five evidence points, observed negotiation, negative test, certificate chain under PQC, downgrade documented and evidence in the dossier: a system counts as migrated only when the old algorithm is gone.',
    grc: 'Attach an evidence reference to each of the five points per system, log the decommissioning of classical key material with its SP 800-88 method, and complete the closure and BAU handover: the export is the closure evidence.',
  },
  // ── Learn modules (batch 2c, 2026-09-19) — written from each module's description, why-this-matters and step titles ──
  '/learn/ai-security-pqc': {
    executive:
      "Step 1's Data Protection Analyzer lists where training data and model weights are protected by quantum-vulnerable cryptography today: stolen now, readable the day a large quantum computer arrives, which is the exposure to put beside your AI investment.",
    developer:
      "Run the Data Protection Analyzer over an AI pipeline, then Step 3's model-weight encryption, key wrapping and signing configuration and Step 6's agent-to-agent protocol design: they are the touch points your code changes.",
    researcher:
      "Step 2's Data Authenticity Verifier and Step 5's Agentic Commerce Simulator model synthetic-data contamination and agent transactions under a quantum overlay, a threat model the literature is still writing.",
    ops: "Step 4's authentication architectures and delegation chains for agents, and Step 6's protocol design, are the pieces that go into production; the analyzer in Step 1 is the inventory to run first.",
  },
  '/learn/api-security-jwt': {
    developer:
      'Decode a JWT in the inspector, sign and verify with ML-DSA, build a dual classical-plus-PQC token, encrypt with ML-KEM and compare sizes across algorithms: the workshop is the token pipeline you ship, step by step.',
    architect:
      'The dual-signature step and the size comparison decide whether a PQC token still fits your headers and gateways; the last step audits the JOSE row of the protocol matrix and proposes a patch.',
    researcher:
      'The size comparison across ML-DSA and SLH-DSA sets and the JOSE matrix audit are the measurements; the workshop runs real PQC signing with in-browser KAT vectors.',
  },
  '/learn/aerospace-pqc': {
    researcher:
      'The Satellite Link Budget Calculator across LEO, MEO, GEO and HEO and the Avionics Protocol Analyzer quantify PQC overhead on links no other sector runs; the Certification Impact Analyzer estimates DO-178C recertification cost.',
    ops: 'The Fleet Interoperability Matrix builds a mixed-generation fleet and shows which data links interoperate under PQC, and the Export Control Classifier places PQC-equipped products under ITAR, EAR and Wassenaar.',
  },
  '/learn/arch-quantum-impact': {
    architect:
      "Score your architecture across nine criteria in the Architecture Readiness step, then model a legacy monolith's gradual migration behind a PQC abstraction layer: the action plan runs from crypto mapping to a reference architecture.",
  },
  '/learn/automotive-pqc': {
    architect:
      'Map a domain-based or zonal E/E architecture in Step 1, then use the Safety-Crypto Analyzer to see how ISO 26262 ASIL levels constrain verification timing under PQC signatures.',
    researcher:
      'The Sensor Data Integrity Simulator compares signing throughput for LiDAR, radar, camera and V2X under classical and PQC algorithms, and the Car Key Protocol Explorer steps through CCC Digital Key 3.0 over NFC, BLE and UWB.',
    ops: 'The OTA Orchestration Planner plans multi-ECU firmware campaigns with dependency ordering and fleet sizing: the rollout problem a 15-year vehicle lifecycle turns into.',
  },
  '/learn/cbom': {
    executive:
      'The Source Coverage Mapper shows which discovery tools you already run and where the blind spots are: the inventory every later migration phase depends on, and the first thing an auditor asks for.',
    grc: "Pick CycloneDX or SPDX for the CBOM, evaluate the inventory against a quantum-safe policy, and collapse four artifacts into one logical key by SPKI fingerprint: the machine-verifiable inventory the audit checklist's 'CBOM generated' item refers to.",
    developer:
      'The Source Coverage Mapper reuses the scanners and build tooling you already run; the format step compares CycloneDX and SPDX for cryptographic assets, and the last step deduplicates keys by SPKI fingerprint.',
    architect:
      'Choose the BOM format, then evaluate the resulting inventory against a quantum-safe policy: the module shows what a CBOM has to carry for a migration decision to be made from it.',
    ops: "Map your existing discovery sources first, then evaluate the inventory against policy: the gaps are the systems nobody's scanner covers, which is where key rotations fail.",
  },
  '/learn/code-signing': {
    developer:
      'Sign a file hash with ML-DSA and verify it, build a PQC code-signing chain, simulate RPM-style hybrid ML-DSA-87 plus Ed448 package signing and walk through Sigstore keyless signing with transparency logs.',
    architect:
      'The certificate-chain step and the hybrid package-signing step show the two migration patterns for software distribution; the firmware step compares LMS, XMSS and ML-DSA trust chains for secure boot.',
    researcher:
      'Compare the hybrid ML-DSA-87 plus Ed448 package signature with a pure ML-DSA one and the LMS, XMSS and ML-DSA firmware chains: the size and verification-time trade-offs are on screen.',
  },
  '/learn/compliance-strategy': {
    executive:
      'Map the PQC frameworks and deadlines across the jurisdictions you operate in, then build the compliance timeline overlaying those deadlines on your migration: the gap assessment says where you are late.',
    grc: "The audit-readiness checklist and the Regulatory Gap Assessment across your selected jurisdictions produce the compliance position from live framework data rather than last year's summary.",
    researcher:
      'The framework map is built from the live compliance dataset, so the deadlines and their sources can be checked on the Compliance page; the gap assessment is reproducible for any set of jurisdictions.',
    curious:
      'Pick a country or two and see which rules about post-quantum cryptography already apply there and by when: the module turns a pile of regulations into a list with dates.',
  },
  '/learn/confidential-computing': {
    developer:
      'Compare seven TEE architectures in Step 1, step through remote attestation for Intel DCAP, ARM CCA and AMD SEV in Step 2, then design the TEE-to-HSM trusted channel in Step 4: the same flow the TEE-HSM Secure Channel tool runs live.',
    architect:
      "Step 4's TEE-HSM Trusted Channel designs mutual attestation and PQC key provisioning between an enclave and an HSM, and Step 5 assesses quantum risk per TEE component into a prioritised migration plan.",
    researcher:
      'Step 3 covers memory encryption engines, sealing-key derivation and the Grover margin on symmetric keys; the attestation flows in Step 2 are per vendor, which is where the differences live.',
    ops: "Step 5's per-component quantum risk assessment and migration plan is the operational output; Step 1's architecture comparison says which TEE features your platforms expose today.",
  },
  '/learn/crypto-agility': {
    executive:
      'Score your organisation across four crypto-agility dimensions in the last step: the result says whether the next algorithm change is a configuration change or a rebuild.',
    grc: 'The scan of a sample enterprise for quantum-vulnerable algorithms and the four-dimension agility score are the two artefacts a governance review wants: what is exposed and how fast it can change.',
    developer:
      'The first step shows algorithm-agnostic APIs swapping backends without code changes; the scanner then finds the hardcoded algorithms in a sample enterprise, which is what your codebase would look like.',
    architect:
      'Abstraction layers, CBOM scanning and the seven-phase migration framework are the design pattern; the agility score across four dimensions tells you which layer to fix first.',
    researcher:
      "The seven-phase framework and the four-dimension scoring model are stated explicitly; the module is the reference the rest of the curriculum's migration steps cite.",
    ops: 'Walk the seven-phase migration framework: it is the operating sequence the Command Center tools follow, and the scanner step shows what discovery has to find before rollout.',
    curious:
      'The one certainty is that algorithms will change again; this module shows, with a swap-the-backend demo, what it takes to be able to change them without rebuilding everything.',
  },
  '/learn/crypto-dev-apis': {
    developer:
      'Compare JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG and Bouncy Castle across seven languages, then work through the provider-pattern examples for KeyGen, Sign, Verify, Encrypt and KEM and the API-by-algorithm support matrix.',
    researcher:
      'The eight-library deep dive (liboqs, AWS-LC, Bouncy Castle and others) and the support matrix with status badges and versions are the current state of PQC library support, with the build-versus-buy scoring wizard on top.',
  },
  '/learn/crypto-mgmt-modernization': {
    executive:
      'The CPM Maturity Self-Assessment scores five pillars and four asset classes, and the ROI step models quantum-happens and quantum-never-happens scenarios: certificate outages and forgotten keys pay for the programme either way.',
    developer:
      'The Library & Hardware CBOM Builder maps SBOMs into crypto-focused CBOMs and tracks library end of life: the inventory step where your dependencies show up.',
    architect:
      'The Inventory Lifecycle Simulator walks assets through the six-stage loop from Discover onward, and the CBOM builder covers libraries and hardware: the posture-management design in nine steps.',
    researcher:
      "The maturity model's five pillars and four asset classes are explicit, and the ROI model's two scenarios are parameterised, so both can be reproduced against your own estate.",
    ops: 'The six-stage operational loop in Step 2 is the certificate and key lifecycle you run; the maturity self-assessment in Step 1 says which stage is manual today.',
  },
  '/learn/crypto-registry': {
    executive:
      'One canonical name per mechanism is what lets a CBOM from several scanners be read as one inventory; the two lookups show the problem and the fix in a minute.',
    grc: 'Resolve an HSM, JWT or scanner identifier to its canonical family with the Algorithm Name Normalizer: the same mechanism named three ways is the reconciliation problem in every crypto inventory audit.',
    developer:
      'Use the Algorithm Name Normalizer and the Curve Identifier Lookup to map the identifiers your libraries and tokens emit to the CycloneDX registry names a CBOM expects.',
    architect:
      'The registry is the shared vocabulary between discovery tools, HSMs, certificates and libraries; the lookups show where PQC families sit in it.',
    ops: "Resolve the names your scanners and HSM logs emit to the registry's canonical entries so the same key does not appear as three assets.",
  },
  '/learn/dnssec-pqc': {
    developer:
      'Compare RSA, ECDSA, Ed25519, ML-DSA-44 and SLH-DSA signature sizes against DNS response limits in Step 1, then walk the root, TLD and domain validation chain to see where algorithm 18 sits today.',
    architect:
      "The PQ Validation Chain Walkthrough and the Deployment Roadmap Tracker set Cloudflare's resolver-side pilot against the DNS root's separate rollover estimate: the dependencies a signed-zone plan waits on.",
  },
  '/learn/data-asset-sensitivity': {
    executive:
      'Catalogue data assets by type, sensitivity tier and retention, score them across four weighted dimensions, and read the prioritised migration list: not every dataset moves on the same timeline.',
    grc: 'The Classification Challenge scores ten real scenarios on the four-tier model and the conflict step resolves GDPR, HIPAA and CNSA obligations against each other; the output is a prioritised list with recommended algorithms.',
    researcher:
      'The four-dimension composite score and the multi-framework conflict resolution are explicit methods (NIST RMF, ISO 27005, FAIR), so the priority map is reproducible.',
    curious:
      'Ten short scenarios ask you to rate how sensitive a piece of data is and for how long it matters; the answer shows why some data needs protecting from future computers now and some does not.',
  },
  '/learn/database-encryption-pqc': {
    developer:
      'Map the encryption layers of a database in Step 1, step through the TDE migration from AES-256 to an ML-KEM-wrapped key hierarchy, and check queryable encryption schemes against PQC compatibility in Step 4.',
    architect:
      'The BYOK Architecture Designer in Step 3 places key ownership with an external PQC KMS; the readiness assessment in Step 5 covers the fleet.',
    researcher:
      "Step 4's Queryable Encryption Lab lays out the schemes and their PQC compatibility matrix, the part of database encryption where the research is least settled.",
    ops: "The TDE re-key walkthrough and Step 5's guided fleet readiness checklist are the operational path; a re-key done wrong re-encrypts the wrong data, and the walkthrough shows the order.",
    curious:
      'Databases keep their encryption keys for years; this module shows, layer by layer, what has to change so that stored data stays private after quantum computers arrive.',
  },
  '/learn/dev-quantum-impact': {
    developer:
      'Score your readiness across nine developer competencies with the exposure checklist, then build the action plan from auditing your crypto usage to deployment: what breaks is key sizes, signature sizes and TLS handshakes, not the word RSA.',
  },
  '/learn/digital-assets': {
    executive:
      "Choose a blockchain and see the primitives it signs with, then the custody step's wallet tiers, HSM, MPC and PQC threats: every public key already on-chain is exposed, which is the risk to size before the migration proposals.",
    researcher:
      "Bitcoin's secp256k1, ECDSA and Keccak-256 and Solana's Ed25519 are explored hands-on, with the migration proposals and initiatives step tracking what each chain is considering.",
    curious:
      "Pick a blockchain and see the cryptography it actually uses; the module explains why a wallet's public key being visible on-chain is a problem once quantum computers exist.",
  },
  '/learn/digital-id': {
    architect:
      "Activate the wallet, issue the PID and a diploma attestation, verify at a bank and sign with a QTSP: the five steps are the EUDI architecture, and the wallet's PQC Readiness note says where post-quantum keys are expected in the ARF.",
    researcher:
      "Follow the OpenID4VCI issuance, the attestation and the QES steps with the wallet's history open; the credentials use P-256 and P-384 today, which the module states beside each step.",
    curious:
      'Get a national digital ID, add a diploma, open a bank account and sign a document with it: the module walks the European digital wallet end to end.',
  },
  '/learn/emv-payment-pqc': {
    researcher:
      'Eight steps cover the stack: payment network comparison, EMV transaction flows, card personalisation with RSA against PQC, tokenisation, DUKPT key management, a severity-effort matrix of ten components, HNDL exposure for settlement rails and the sector regulation timeline.',
  },
  '/learn/email-signing': {
    developer:
      'Compare classical and PQC certificate structures, walk the CMS SignedData workflow and its ASN.1, then compare RSA key transport with KEM-based encryption (RFC 9629); the live step loads OpenSSL WASM with the PKCS#11 provider.',
    architect:
      'The KEM-based encryption step (RFC 9629) replaces key transport with KEMRecipientInfo; the certificate-structure step shows what a PQC S/MIME certificate changes for relying parties.',
    researcher:
      'The CMS SignedData and AuthEnvelopedData structures are shown in ASN.1 with the RFC references; the live step runs real OpenSSL 3.6 through the PKCS#11 provider.',
    curious:
      'A signature on an email has to be trustworthy for years; this module shows what a signed and an encrypted message are made of and what changes for post-quantum algorithms.',
  },
  '/learn/energy-utilities-pqc': {
    researcher:
      'Assess IEC 61850, DNP3, Modbus and DLMS readiness, model 900 MHz smart-meter time-on-air and saturation with PQC message sizes, and score safety and environmental consequences: the constraints are physical, not informational.',
    ops: 'Plan IEC 61850 substation migration across protection and control, PQC key rotation for a smart-meter fleet of millions, and the utility-wide roadmap with NERC CIP milestones.',
  },
  '/learn/entropy-randomness': {
    developer:
      'Generate random bytes from Web Crypto and OpenSSL, run the simplified SP 800-90B tests, then combine TRNG and QRNG output with the SP 800-90C conditioning step: the entropy every key you generate depends on.',
    architect:
      'The Entropy Source Validation walkthrough and the source-combining step are the design references for where keys are generated and how two sources are combined for defence in depth.',
    researcher:
      'The SP 800-90B tests, the pre-fetched quantum random data against local TRNG output, and the 90C XOR-and-conditioning step are all runnable, with the Entropy Testing tool for your own samples.',
    curious:
      'Every secret key starts as random numbers; the module shows the difference between good randomness and predictable numbers with tests you can run on both.',
  },
  '/learn/exec-quantum-impact': {
    executive:
      "Score your organisation's quantum exposure across nine criteria in the self-assessment, then build the phased action plan with milestones from this week onward: fiduciary risk and the 2030 and 2035 regulatory dates, in board terms.",
  },
  '/learn/5g-security': {
    developer:
      'Subscriber privacy with ECIES Profiles A and B and the proposed KEM Profile C, mutual authentication with 5G-AKA and MILENAGE, then provisioning and key lifecycle: the SUCI tool runs the concealment live.',
    architect:
      'The proposed KEM-based Profile C beside Profiles A and B shows what changes in subscriber concealment under PQC; the provisioning step covers the supply-chain and key-lifecycle side.',
  },
  '/learn/government-defense-pqc': {
    executive:
      'CNSA 2.0 is required for new National Security System acquisitions from 1 January 2027; the CNSA 1.0 to 2.0 comparator and the Federal Mandate Explorer say which instruments bind a system you sell into or run.',
    researcher:
      'The suite comparator maps every public-key purpose line by line, and the Federal PKI Profile Pair puts the classical Common Policy profile beside the draft PQC certificate profile.',
  },
  '/learn/healthcare-pqc': {
    researcher:
      'The Biometric Vault Assessor and the Patient Privacy Mapper set data lifecycles that never expire against the HNDL window; the Device Safety Simulator models attacks on medical devices whose cryptography fails physically.',
    curious:
      'Fingerprints and genomes cannot be reissued; the module shows why health data is the clearest case of steal-now, read-later and how a hospital would plan its way out.',
  },
  '/learn/hsm-pqc': {
    architect:
      'Step through eight PKCS#11 PQC operations with the on-prem versus cloud comparison, then the nine-vendor comparison by PQC maturity, algorithms and FIPS validation, and the fleet sizing for ten enterprise use cases.',
    researcher:
      'Track CMVP and CAVP PQC validation status across HSM vendors in Step 4: it is the current record of which modules have validated ML-KEM and ML-DSA implementations.',
    ops: 'Plan the firmware migration from classical to PQC with dual partitions in Step 3 and size the fleet in Step 5: the two operations a PQC rollout adds to an HSM estate.',
  },
  '/learn/hybrid-crypto': {
    developer:
      'Compare classical, PQC and hybrid key generation, run KEM encapsulation and hybrid signatures, generate the two root CAs and the hybrid X.509 formats, then the HPKE step composed from PKCS#11 v3.2 mechanisms.',
    architect:
      'The certificate steps generate and compare the hybrid X.509 approaches with the IETF reference artifacts, and the signature-spectrum step covers concatenation, nesting and Silithium: the relying-party compatibility decision.',
    researcher:
      'The IETF reference artifacts in the certificate deep-dive and the three signature compositions with their non-separability properties are the material to check against the drafts.',
    ops: 'Generate the classical and PQC root CAs and the hybrid certificate formats: which one a relying party that only knows ECDSA still validates is the property your fleet needs during migration.',
  },
  '/learn/iam-pqc': {
    executive:
      'Audit eight IAM components by quantum risk and migration priority, and score Okta, Entra, PingFederate and ForgeRock across PQC dimensions: the vendors are on different timelines you have to track.',
    developer:
      'Migrate SAML and JWT signing to ML-DSA and compare signature sizes and headers, then simulate translating a PQC SAML assertion to classical RSA for legacy relying parties.',
    architect:
      'Design the phased roadmap across the five identity pillars in Step 5, with the AD, OpenLDAP and Entra vulnerability analysis in Step 3 behind it.',
    researcher:
      'The vendor scoring across PQC dimensions and the directory vulnerability analysis with HNDL exposure are explicit and repeatable; the token-migration step gives the signature sizes.',
    ops: 'The eight-component audit in Step 1 orders the work, and the legacy-translation step in Step 6 is what keeps old relying parties working during the cutover.',
    curious:
      'Every login token your systems issue is signed; the module shows which parts of an identity system a quantum computer would break and in what order to fix them.',
  },
  '/learn/iot-ot-pqc': {
    developer:
      'Compare PQC algorithm resource requirements against device classes, sign and verify a firmware image with LMS, XMSS or ML-DSA, and simulate a CoAP/DTLS 1.3 handshake with PQC to measure the overhead.',
    architect:
      'Certificate chain sizes on constrained devices and the SCADA/ICS migration plan across the Purdue levels are the two design constraints; the device-class comparison says what fits in memory.',
    researcher:
      'The Secure Boot RAM load latency and V2X broadcast simulations, and the CoAP/DTLS overhead measurement, quantify what constrained devices pay for each algorithm.',
    ops: 'The SCADA/ICS assessment across Purdue levels and the firmware signing step are the two operations a plant migration consists of; a deployed device cannot be patched later.',
  },
  '/learn/kms-pqc': {
    architect:
      'Design the three-level key hierarchy (root KEK, zone KEK, DEK), compare ML-KEM envelope encryption with RSA-OAEP wrapping, explore the X25519 plus ML-KEM-768 combiner per provider, and write an AWS KMS key policy that enforces hybrid PQC.',
    researcher:
      'The envelope-encryption comparison and the hybrid combiner step are the primitives, and the KMIP v3.0 step maps PQC key types across providers.',
    ops: 'Plan PQC key rotation with provider-specific strategies and compliance windows in Step 4, and the KMIP operations in Step 5: the KMS is where every downstream key lives.',
    curious:
      'A key-management system holds the keys that protect everything else; the module shows how a data key is wrapped and rotated, and what changes when the wrapping key goes post-quantum.',
  },
  '/learn/mls-group-messaging': {
    developer:
      'TreeKEM, HPKE and a PKCS#11-backed OpenMLS provider: the workshop tool runs the ML-DSA-65 credential signing, the ML-KEM-768 HPKE node update and the AES-128-GCM message encryption, then adds members to the ratchet tree.',
    architect:
      "Group key agreement that scales to thousands while signature keys stay in the HSM: the tool's Add, Remove and Update on the ratchet tree show how many nodes re-key per change.",
    researcher:
      "RFC 9420's TreeKEM and the post-quantum ciphersuites are shown with live primitives and the authoritative references; enable HSM mode to route them through softhsmv3.",
  },
  '/learn/merkle-tree-certs': {
    developer:
      'Build a Merkle tree from certificate leaves, generate and verify an inclusion proof, test tampering, compare handshake sizes against X.509 chains and simulate a CT log signing with ML-DSA-65.',
    architect:
      'The handshake-size comparison between traditional chains and Merkle Tree Certificates is the number that decides which post-quantum TLS ecosystem your edge can carry.',
    researcher:
      'The proof verification step and the size comparison are reproducible against the draft; the CT-log step shows the ML-DSA-65 signing that anchors the tree.',
  },
  '/learn/migration-program': {
    executive:
      'Build the roadmap with milestones on the regulatory deadlines for your countries, the stakeholder communication plan and the KPI tracker: the operating model that turns a mandate into shipped systems.',
    grc: 'The roadmap overlays framework deadlines on your milestones and the KPI tracker pulls live data; the execution checklist covers pre-migration, migration and validation, which is the evidence trail.',
    researcher:
      "The roadmap's deadlines come from the live compliance data and the KPI tracker scores from the migrate catalogue, so both are checkable against their sources.",
    ops: 'The step-by-step execution checklist from pre-migration through validation is the runbook; the roadmap and KPI tracker are what the programme office reports from.',
    curious:
      'A migration is a project with dates, people to tell and numbers to watch; the module builds each of the three in turn.',
  },
  '/learn/pqc-101': {
    executive:
      "Start here: why lattice, hash-based and code-based algorithms resist quantum computers, then the side-by-side algorithm comparison; 'harvest now, decrypt later' is the reason the deadline is today, not when the computer arrives.",
    grc: 'The algorithm comparison and the key-size step give the vocabulary every framework and mandate in this site uses; the ground floor for reading a compliance deadline.',
    developer:
      'Generate a real key pair with OpenSSL and see the size difference, then sign a message: the two operations your code will make with new algorithms.',
    architect:
      'The side-by-side comparison of classical and post-quantum algorithms with key and signature sizes is the first design input; the rest of the curriculum assumes it.',
    researcher:
      'The three algorithm families and the NIST standards are introduced with their security basis; the workshop generates real keys and signatures to measure.',
    ops: 'Generate a key pair and see the size difference in the third step: bigger keys and signatures are what change in your certificates, configs and logs.',
    curious:
      'Start here: what a quantum computer can and cannot break, why data captured today is at risk, and what the new algorithms are, in four short steps with a real key pair at the end.',
  },
  '/learn/network-security-pqc': {
    architect:
      'Simulate TLS-intercept proxy behaviour with PQC certificate chains, design a quantum-safe zero-trust network access architecture, and analyse PQC payload sizes against TCP initial congestion windows.',
    researcher:
      'The initcwnd analysis and the DPI-with-larger-certificates simulation quantify what PQC handshakes do to inspection appliances; the vendor comparison across Cisco, Palo Alto, Fortinet, Juniper and Check Point records the schedules.',
    ops: 'Analyse NGFW cipher suites and the impact of enabling PQC, configure IDS/IPS rule categories for PQC traffic, and read the vendor roadmaps: the appliances migrate on different schedules you plan around.',
  },
  '/learn/os-pqc': {
    developer:
      'Audit the OS crypto components, then configure system-wide TLS policy on RHEL, Ubuntu and Windows, migrate SSH host keys to ML-DSA-65 with the sshd_config changes, and move RPM and DEB signing from RSA-4096 to ML-DSA-65.',
    architect:
      'FIPS 140-3 module PQC inclusion and the hybrid FIPS design in Step 5 decide what the platform layer can offer applications; the audit in Step 1 is the inventory.',
    researcher:
      'The FIPS 140-3 PQC inclusion analysis and the package-signing migration are the two areas where distribution support is still moving; the module records the current state.',
    ops: "System crypto-policies, sshd_config for ML-DSA host keys and package-signing keys are the three changes you roll out; Step 1's audit lists what each host runs today.",
  },
  '/learn/ops-quantum-impact': {
    ops: 'Score your operational exposure across nine criteria, then build the action plan from infrastructure inventory onward: certificate scaling, fleet upgrades, VPN and SSH key exchange and monitoring recalibration are rollout problems, and the plan treats them that way.',
  },
  '/learn/pki-enrollment-protocols': {
    developer:
      'EST (RFC 7030) and CMP (RFC 9810) enrollment with real OpenSSL 3.6 WASM crypto against an in-browser mock CA, including the KEM key update: the exchanges a client library implements.',
    architect:
      'The CMP KEM key update with an encrypted-certificate proof of possession is how enrollment works when the key cannot sign; the module shows both protocols against the same CA.',
    researcher:
      'Compare the EST and CMP enrollments of the same key against the RFCs, with the composite enrollment and certificate inspection steps the tool page defers to here.',
    ops: 'EST and CMP are how certificates get issued at scale; the module shows the requests and responses your enrollment endpoints will exchange with devices after the switch.',
  },
  '/learn/pki-workshop': {
    developer:
      'Create a CSR, generate a root CA, sign the CSR, inspect the certificate and issue a CRL, then compare with Merkle Tree Certificates and walk the RFC 8555 ACME issuance with an ML-DSA key.',
    architect:
      'The chain comparison with Merkle Tree Certificates and the storage, bandwidth and CPU model for migrating a PKI to PQC are the two design inputs after the five-step basics.',
    researcher:
      'The ACME (RFC 8555) issuance flow with a real ML-DSA key and the PKI migration cost model are the parts to reproduce; the session artifacts panel keeps what each step produced.',
    ops: 'Issue, inspect and revoke in the first five steps, then model storage, bandwidth and CPU for your PKI under PQC: the certificate operations you run, with their new sizes.',
  },
  '/learn/pqc-business-case': {
    executive:
      'See the six costing models diverge on one scenario, calculate the ROI, simulate breach costs today against quantum-enabled breaches, model the cost of delay and assemble the board brief: the funding case in five steps.',
    researcher:
      'The six costing models are stated with their assumptions and the breach simulator cites its baseline; the comparison shows how far estimates diverge on the same inputs.',
  },
  '/learn/pqc-candidates': {
    developer:
      'Sort and filter the nine signature on-ramp candidates by use case in Step 3, and read the cryptanalysis timeline: choosing the wrong scheme means migrating twice.',
    architect:
      'The Standardisation Lifecycle step advances a candidate through the NIST rounds, and the Future Rounds Forecaster says where each is likely to land: the basis for not betting a design on one scheme.',
    researcher:
      'The animated visualisers for MPCitH, multivariate, isogeny and lattice families, the cryptanalysis timeline with every attack and reparameterisation, and the worldwide map of KpqC, CACR and ISO/IEC tracks.',
    curious:
      'How a new cryptographic algorithm becomes a standard: pick a candidate and advance it through the rounds, watching what an attack does to it along the way.',
  },
  '/learn/pqc-governance': {
    executive:
      "Define roles and responsibilities, generate the policy templates and design the governance KPI dashboard for board reporting: without a policy naming owners, deadlines and exceptions, migration is everyone's job and no one's.",
    grc: 'The RACI step, the policy generator and the escalation-tier step that evaluates exception requests are the governance controls a framework expects, each producing an exportable artefact.',
    researcher:
      "The governance model's roles, policy structure and exception criteria are explicit and map to the Command Center tools the module hands off to.",
  },
  '/learn/pqc-risk-management': {
    executive:
      'Model when a cryptographically relevant quantum computer could arrive, build the risk register, assign treatments and read the residual risk: priority without waiting for a certainty that will never come.',
    grc: 'The register with likelihood and impact, the treatment step with residual risk, and the Compliance Gap Analysis against CNSA 2.0 and NIST IR 8547 deadlines are the risk artefacts an audit expects.',
    researcher:
      'The CRQC timeline scenarios are parameterised and the register is built from real threat data on this site; the heatmap method is explicit.',
    curious:
      "Nobody knows when a quantum computer will break today's encryption; the module shows how to decide what to fix first anyway, with a simple risk table.",
  },
  '/learn/pqc-testing-validation': {
    developer:
      'Run an active PQC readiness scan against simulated endpoints, build the interoperability matrix of client and server combinations and run the NIST KATs against the SoftHSMv3 WASM engine.',
    architect:
      "Design the performance test plan comparing classical, hybrid and PQC, then compose the complete validation programme from your migration scope: what 'PQC-working' rather than 'PQC-capable' has to prove.",
    researcher:
      'The TVLA side-channel assessment visualiser for ML-KEM and ML-DSA and the KAT runs against the WASM engine are the measurable parts; the passive tap classifier shows what discovery can see.',
    ops: 'The passive tap and SPAN classifier and the active endpoint scan are what you run on the network; the interoperability matrix says which client and server pairs complete.',
  },
  '/learn/platform-eng-pqc': {
    developer:
      'Inventory every cryptographic primitive in the CI/CD pipeline, compare OCI artifact signing tools by PQC readiness, and write the OPA and Kyverno rules that block quantum-vulnerable algorithm OIDs.',
    architect:
      "The Quantum Threat Timeline models HNDL risk per pipeline asset under different CRQC arrival years; the Policy-as-Code Enforcer is where the architecture's algorithm decisions become enforceable.",
    researcher:
      'The four-panel Crypto Posture Monitor (Prometheus metrics, SIEM queries, capacity) shows what a measured pipeline posture looks like; the signing-tool comparison records current PQC readiness.',
    ops: 'The Crypto Posture Monitor and the container-signing migration are the operational pieces; the pipeline inventory in Step 1 finds the defaults nobody chose deliberately.',
  },
  '/learn/pqc-grc': {
    executive:
      'Assign each Key Risk Indicator to the board, the CISO or the operational level: a KRI that never reaches the board is a spreadsheet, and the cascade is what turns a SOC finding into a decision.',
    grc: 'Cascade the KRIs across the three levels, then triage the deferral exception register into the SOC suppression list, escalating what should not be suppressed: the GRC-to-SOC handoff, made auditable.',
  },
  '/learn/qkd': {
    architect:
      'Integrate QKD keys into TLS 1.3, IKEv2, MACsec and SSH as nonce or PSK material in Part 4, and use a QKD secret as SP 800-108 key material inside an HSM in Part 5: where QKD fits beside PQC rather than instead of it.',
    researcher:
      'The BB84 visual simulation, the error-correction and privacy-amplification post-processing and the worldwide deployment explorer are the reference; the HSM step runs the derivation over PKCS#11.',
  },
  '/learn/quantum-threats': {
    executive:
      'Calculate your migration deadline and when signing credentials must rotate, and track logical-qubit progress against what is needed to break elliptic curves: which algorithms Shor and Grover break is what separates risk from vendor hype.',
    grc: 'The Security Level Degradation step and the deadline calculators put a number on the exposure; the qubit tracker is the evidence line for a risk register entry.',
    developer:
      "See how quantum attacks reduce each algorithm's security level and compare two algorithms side by side: which of the primitives your code calls survive.",
    architect:
      'The full algorithm-versus-attack comparison and the credential-rotation calculator set the order in which key exchange and signatures have to move.',
    researcher:
      'The qubit tracker sets logical-qubit progress against the requirement to break ECC, and the degradation model states its assumptions; both are checkable against the sources cited.',
    ops: 'The two calculators, migration deadline and credential rotation, give the dates your certificate and key rotation plans have to meet.',
    curious:
      "How a quantum computer actually breaks today's encryption, which algorithms survive, and a calculator that turns it into a date for you.",
  },
  '/learn/research-quantum-impact': {
    researcher:
      'Score your quantum risk exposure across nine research-specific criteria, from long-lived data confidentiality to publication integrity, then build the action plan from data risk assessment to PQC publication practice.',
  },
  '/learn/slh-dsa': {
    developer:
      'Generate SLH-DSA key pairs across all twelve FIPS 205 parameter sets, sign in Pure and HashSLH-DSA modes, explore context strings and deterministic signing, and compare LMS, XMSS and SLH-DSA side by side.',
    architect:
      'The parameter explorer shows the size-versus-speed trade-off across the twelve sets, and the LMS/XMSS/SLH-DSA comparison says when a stateless scheme is worth its signature size.',
    researcher:
      'FIPS 205 §9.2 context strings for domain separation and the deterministic mode are explored directly; the KAT tool verifies the implementation against the published vectors.',
  },
  '/learn/sbom': {
    executive:
      'SPDX against CycloneDX mapped onto the NTIA minimum elements, then the Generation Tool Picker: the software inventory that vulnerability management, licensing and the CBOM all build on.',
    grc: "The NTIA minimum-elements mapping is the check for whether a supplier's SBOM is usable; the tool picker matches build artifact types to generators and formats.",
    developer:
      'Match your build artifact type to a generator and format in Step 2: the SBOM is what the CBOM and VEX triage read, so it has to come out of the build, not a spreadsheet.',
    architect:
      'SPDX or CycloneDX, and which generator per artifact type: the two decisions that make the dependency graph reusable downstream.',
    ops: 'Pick the generator per artifact type and keep the SBOM regenerated per build: it is the inventory that vulnerability triage with VEX closes the loop on.',
  },
  '/learn/secrets-management-pqc': {
    developer:
      'Classify secret types by HNDL exposure, simulate Vault transit operations with PQC algorithms, and integrate PQC-safe secrets into Kubernetes, GitHub Actions and Terraform in the Pipeline Integration Lab.',
    architect:
      'The Rotation Policy Designer with automated TTL recommendations and the cloud provider comparison across AWS, Azure, GCP and Vault are the design decisions; a five-year rotation policy needs a plan now.',
    researcher:
      'The provider comparison records current PQC readiness of the secrets managers, and the Vault transit simulator shows the operations with PQC algorithms.',
    ops: 'The rotation policy designer and the pipeline integration steps are the operational changes; the classification step says which secrets go first.',
  },
  '/learn/secure-boot-pqc': {
    architect:
      'Analyse the UEFI PK, KEK and db hierarchy, explore TPM 2.0 key hierarchies with the hybrid RSA TPM plus ML-DSA approach, and design attestation flows for Measured Boot, TPM Quote and DICE.',
    researcher:
      'The vendor readiness comparison across AMI, Insyde, EDK2 and Dell and the live TPM 2.0 V1.85 key generation in the sandbox are the current state of firmware PQC; the TPM playground runs the commands.',
    ops: 'Walk the four-step ML-DSA-65 firmware signing migration from inventory onward: it is the rollout across the fleet, and the vendor comparison says which firmware can take it.',
  },
  '/learn/skills-team-structure': {
    executive:
      'Convert the estate size into an FTE estimate with the 1-FTE-per-500-instances heuristic, then build the Crypto Champion roster: who does the migration, by when.',
    grc: "The Team Sizing Calculator and the champion roster with each champion's four readiness commitments are the staffing evidence behind the programme's training and ownership controls.",
  },
  '/learn/soc-implementation-pqc': {
    grc: 'The five detection use cases (hybrid downgrade, crypto drift, certificate-lifecycle anomalies, signature integrity, HNDL indicators) and the coverage planner are the monitoring controls to evidence; the readiness score across nine criteria is the gap.',
    architect:
      "The posture registry the detections depend on and the phased SOC implementation plan are the design work; the coverage planner sets each capability's target state.",
    ops: 'Plan coverage across the five detection use cases and score SOC readiness across nine criteria: a SOC that cannot detect hybrid downgrade misses a PQC incident even after a perfect migration.',
  },
  '/learn/standards-bodies': {
    executive:
      'Classify twelve organisations by type, scope and authority, then trace the chain from algorithm standard to certification programme to compliance mandate: who requires what, where.',
    grc: "The Standards, Certification and Compliance chain and the five-region by four-type coverage grid are the map of which body's requirement applies in each jurisdiction; the scored scenarios test it.",
    researcher:
      'Twelve bodies with founding, scope and authority, the standard-to-certification-to-compliance chain and the regional grid: the reference for citing the right body.',
    ops: 'The regional coverage grid says which certification programme a product in a given region has to hold; the scenarios show how to pick the right body for a question.',
    curious:
      'Who decides which cryptography is allowed, who checks products, and who makes rules: the module sorts the alphabet soup of organisations into three jobs and five regions.',
  },
  '/learn/stateful-signatures': {
    developer:
      'Explore LMS parameter sets and Merkle-tree structure, compare XMSS with LMS at equal security, simulate signing, key exhaustion and state loss, then generate real SLH-DSA keys over PKCS#11 for comparison.',
    architect:
      'The state-loss simulation is the design constraint: a reused one-time key voids the scheme, which decides where these keys may live; the Haystack coalition step shows distributed key control.',
    researcher:
      'The parameter explorer, the XMSS-versus-LMS comparison at equal security levels, and the Haystack coalition construction are the material to reproduce; the LMS tool runs cross-engine verification.',
    ops: 'The exhaustion and state-loss simulation shows the operational failure mode: state must be tracked correctly, forever, and backups cannot restore it.',
  },
  '/learn/tls-basics': {
    developer:
      'The TLS 1.3 handshake, certificates and cipher suites, then the simulator: choose a hybrid key share and an ML-DSA certificate and read every message in TXT and HEX, with the OpenSSL config that produced it.',
    architect:
      'The handshake is the prerequisite for every hybrid-PQC rollout; the simulator shows what a PQC certificate chain and a hybrid key share add to each connection.',
    researcher:
      'The simulator supports pure ML-DSA certificates and the IETF hybrid key shares; inspect the encodings against the drafts listed at the top of the tool.',
    ops: "Set the server side as your edge is configured and run the simulator: the Config File tab and the module's Apache, nginx, HAProxy and Caddy snippets are what you deploy.",
    curious:
      'The padlock in your browser is TLS; the module shows what happens in the handshake and what changes when the algorithms inside it go post-quantum.',
  },
  '/learn/trust-services-pqc': {
    executive:
      'A qualified signature made today may be evaluated in 2050: the Signature Longevity Calculator shows which parts degrade first, and the ETSI standards explorer shows what changed when PQC arrived.',
    developer:
      'The longevity calculator sets how long a signature must remain evaluable; the ETSI TS 119 312 hybrid combinations step lists the algorithm pairings to implement.',
    architect:
      'Timestamping, proof of existence, long-term validation and re-timestamping are the mechanisms; the standards supersession explorer shows the same ETSI standard before and after PQC.',
    ops: 'The longevity calculator and the re-timestamping mechanism define the maintenance a long-lived signature archive needs; the ETSI hybrid table says which combinations conform.',
  },
  '/learn/vpn-ssh-pqc': {
    developer:
      'Step through IKEv2 in Classical, Hybrid and Pure PQC modes, compare SSH key exchange with curve25519, sntrup761 and mlkem768, and compare IKEv2, SSH, WireGuard and TLS 1.3 sizes and round trips.',
    researcher:
      'The protocol comparison of sizes, RTTs and features across IKEv2, SSH, WireGuard and TLS 1.3 is the measurement; the VPN and SSH simulators produce the packets.',
    ops: 'The IKEv2 modes and the SSH KEX comparison are what your VPN and SSH configurations will carry; the simulators produce the strongSwan config and the sshd changes.',
  },
  '/learn/vendor-risk': {
    executive:
      'Select the products you run from the Migrate catalogue, score the vendors on PQC readiness from real product data, and read the three scenarios: a critical vendor without a roadmap is the one to act on.',
    grc: 'Score vendors from product data rather than marketing pages, generate the contract clauses, and map dependencies across infrastructure layers; the FIPS-validation-gap scenario is the audit finding to look for.',
    researcher:
      "The scoring uses the migrate catalogue's product records, so every score can be traced to a row with its evidence.",
    ops: 'Map vendor dependencies across your infrastructure layers in Step 4: the appliance vendors on your critical path are the ones whose roadmaps decide your cutover dates.',
  },
  '/learn/verification-closure': {
    executive:
      'Retire one classical asset through deprecate, remove, verify removed and close, plan which systems to verify with what proof per tier, and hand standing capabilities to permanent owners: done means proven, not ticketed.',
    grc: 'The Verification Coverage Planner sets the proof per tier, and the Closure & Handover Register records the transfer of standing capabilities: the closure evidence the Migration Verification tool collects.',
    ops: 'The Decommission Checklist is the runbook for retiring a classical asset; the coverage planner says which systems need observed-behaviour proof and which a lighter check.',
  },
  '/learn/web-gateway-pqc': {
    developer:
      'Build a gateway architecture and mark the PQC upgrade points, compare terminate, passthrough, re-encrypt and split TLS under PQC, and calculate handshake sizes and bandwidth.',
    researcher:
      'The handshake-size and bandwidth calculation and the four termination patterns under PQC quantify what the edge pays; the product assessment records vendor readiness.',
    ops: 'Plan the certificate migration across edge nodes with a phased rollout and assess your gateway products against PQC readiness criteria: if the gateway breaks, every application behind it inherits the outage.',
  },
}

export function personaBlocksFor(route: string): PersonaBlockSet | undefined {
  // eslint-disable-next-line security/detect-object-injection -- route is a literal from the calling component
  return PERSONA_BLOCKS[route]
}
