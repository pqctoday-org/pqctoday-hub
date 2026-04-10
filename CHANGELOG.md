# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.97.0] - 2026-04-09

### Added

- **Embed SDK — policy enforcement**: VendorPolicy is now fully enforced at runtime.
  `EmbedRouteGuard` enforces route, module, tool, and `maxDifficulty` restrictions from the cert.
  `EmbedLayout` seeds the persona/region/industry stores from cert policy on mount (single source of
  truth). `PersonalizationSection` filters persona/region/industry pickers to cert-allowed values in
  embed mode. `verifySignature` clamps the URL `persona` param to cert-allowed personas.

- **Embed SDK — VendorPolicy X.509 format**: `certParser.ts` now reads a single JSON-encoded
  `VendorPolicy` object from OID `.1`, with backward-compatible fallback to the legacy 8-OID CSV
  format. `vendorRegistry.ts` auto-discovers vendor certs from `pki/vendors/*.pem` at build time.

- **Embed SDK — module/tool path validation**: `verifySignature` validates `/learn/<moduleId>` and
  `/playground/<toolId>` paths against cert `policy.routes.modules` / `policy.routes.tools` at
  verification time (Step 6). `EmbedRouteGuard` enforces the same restrictions at navigation time.

- **GA4 analytics — embed mode coverage**: New events `Embed / Session Start`, `Embed /
Verification Error`, `Embed / Route Blocked` (with `reason` label), `Embed / Policy Applied`
  wired to `main.tsx`, `EmbedRouteGuard`, and `EmbedLayout`. Captures vendor ID, kid, presets,
  test mode flag, and policy restrictions.

- **GA4 analytics — assessment wizard**: `Assessment / Start`, `Assessment / Step` (step
  number + label), `Assessment / Complete` (persona result), `Assessment / Reset` wired to
  `AssessWizard.tsx`.

- **GA4 analytics — persona/personalization**: `Persona / Selected` (with `picker`/`assessment`/
  `embed` source), `Persona / Region`, `Persona / Industry` wired to `PersonalizationSection.tsx`
  handlers.

- **GA4 analytics — module tab switches**: `Learning / Tab Switch` fires via `useSyncDeepLink` on
  every learn↔workshop tab change across all 51 PKI learning modules. Skips the initial mount to
  avoid counting deep-link navigations as user tab switches.

### Fixed

- **`EmbedVerificationError` TypeScript compile error**: `public readonly` constructor parameter
  shorthand rejected by `erasableSyntaxOnly` strict mode. Fields now declared explicitly.

- **`crypto.subtle.verify()` type error**: `Uint8Array<ArrayBufferLike>` not assignable to
  `BufferSource`. Fixed by passing `.buffer as ArrayBuffer`.

- **Pre-existing analytics test failures**: Three tests asserted `console.log/warn` output that
  analytics helpers silently suppress on localhost. Tests updated to assert `ReactGA` method calls.

- **`consoleLogSpy` unused variable lint error** in `analytics.test.ts`: Removed the unused spy
  after test assertions were corrected to not depend on console output.

## [2.96.0] - 2026-04-09

### Added

- **Embed SDK — vendor iframe integration**: New `/embed/*` route tree renders any app view inside a
  slim `EmbedLayout` (compact nav, no full-page shell) for embedding in third-party vendor iframes.
  Embed URLs are cryptographically signed with ECDSA P-256 and verified via X.509 vendor certificates
  (`@peculiar/x509`). Vendor registry supports dev/prod separation (`vendorRegistry.dev.ts`).

- **Embed SDK — persistence and auth**: `useEmbedPersistence` syncs all Zustand stores via
  `api` (REST) or `postMessage` modes. `useEmbedAuth` handles token refresh on `pqc:authExpired`
  events. `EmbedPersistenceService` provides three backends: `ApiPersistence`,
  `PostMessagePersistence`, `NoPersistence`.

- **Embed SDK — `PQCEmbed` JS client**: `public/embed/sdk.js` (ESM bundle) — drop-in vendor wrapper
  for bridging auth, snapshot load/save, events, and resize messages across the iframe boundary.
  Built via `npm run build:sdk` (esbuild, ES2020 target).

- **Service worker — embed COOP header**: `withCOIHeaders()` now sets
  `Cross-Origin-Opener-Policy: unsafe-none` for `/embed/*` paths (required for postMessage with
  parent frames) and `same-origin` everywhere else.

### Fixed

- **Safari blank page**: Embed verification imports (`@peculiar/x509`, `certParser`, vendor registry)
  are now lazy-loaded via dynamic `import()` only on `/embed/` paths, so they are never evaluated on
  normal page loads. Fixes Safari's strict ES module binding resolution that caused a blank page.

- **Safari `EmbedState` binding error**: `EmbedState`, `EmbedConfig`, `PqcMessage`,
  `IEmbedPersistenceService`, and `PersonaId` were imported as values; corrected to `import type`
  throughout the embed module tree.

- **Nested `<button>` in MobileThreatsList**: The outer card element was a `<button>` containing
  `EndorseButton` and `FlagButton` (also buttons). Replaced with a `<div role="button">` with
  `tabIndex={0}` and keyboard handler for full accessibility compliance.

- **Leader avatars — CORP violation**: `ui-avatars.com` images were blocked by
  `Cross-Origin-Embedder-Policy: require-corp` (the service doesn't set CORP headers). External
  avatar URLs are now stripped at data load time; components fall back to the local User icon.

- **CSP — `flagcdn.com` and `frame-ancestors`**: Added `https://flagcdn.com` to `img-src` (country
  flags in Assess step 2). Added `frame-ancestors *` to permit embedding in vendor iframes.

- **Analytics noise**: Removed `console.log` from `analytics.ts` (localhost detection, GA init,
  page view, event logging). Only the missing-ID warning remains.

- **`sdk.ts` memory leak**: `PQCEmbed.destroy()` was calling `.bind(this)` again, creating a new
  function reference that didn't match the registered listener. Bound function is now stored as an
  instance property so `removeEventListener` correctly removes it.

## [2.95.0] - 2026-04-08

### Added

- **EUDI Wallet — pluggable CryptoProvider architecture**: All Digital ID components (PID Issuer,
  Attestation Issuer, QES Provider, Relying Party, Wallet) now use a unified `CryptoProvider`
  interface instead of inline HSM/OpenSSL branching. Three implementations: `OpenSSLCryptoProvider`,
  `HsmCryptoProvider` (PKCS#11), and `DualCryptoProvider` (parallel execution of both). Factory
  function `getCryptoProvider()` selects the active backend.

- **EUDI Wallet — X.509 certificate generation**: New `generateX509Certificate()` utility produces
  self-signed X.509 v3 certificates (ES256/ES384) via `@peculiar/asn1-schema`, used by the
  Attestation Issuer and QES Provider for qualified certificate issuance.

- **EUDI Wallet — native CBOR encoding**: mDoc structures now use `cborg` for ISO 18013-5 compliant
  CBOR/COSE binary encoding. Added `cborg` v5.1.0 as a production dependency.

- **Entropy — HMAC_DRBG Architecture Demo**: Interactive SP 800-90A HMAC_DRBG lifecycle visualization
  with three phases (Instantiate → Generate → Reseed), real-time (K, V, reseed counter) state
  tracking, configurable entropy/nonce/personalization inputs, and action history log. Available as
  `drbg-demo` in the Playground workshop registry.

- **Entropy — danger-zone gauge arc**: The entropy gauge visualization now includes a visual
  "danger zone" arc highlighting sub-threshold entropy regions.

- **Entropy — QRNG "Simulated" badge**: The QRNG demo card now shows a "Simulated" badge to
  distinguish it from hardware-backed quantum random sources.

- **Deep linking — `?flow=` URL parameter**: `useModuleDeepLink` now parses and syncs a `?flow=`
  parameter, enabling direct navigation to specific sub-flows within modules (e.g., selecting a
  blockchain chain in Digital Assets via `?flow=btc`).

- **Digital ID E2E test**: New Playwright spec (`e2e/digitalid.spec.ts`) validates the Digital ID
  module rendering and PID issuance workflow.

### Changed

- **Playground workshop registry**: Removed `wip` flags from 7 tools now considered production-ready
  (Envelope Encrypt, Token Migration, TEE Channel, Firmware Signing, QRNG Demo, Entropy Test,
  Source Combining). Removed `hybrid-signing` tool (consolidated into PKILearning modules). Added
  `drbg-demo` tool.

- **PKCS#11 Log Panel**: Refactored to exclude `C_GetAttributeValue` from default display,
  reducing log noise. Added sticky column headers (Time, Function, Arguments, Return Value,
  Duration), increased max height to 500px, and improved chronological grouping (newest sections
  first).

- **Workshop HSM key tracking**: HybridEncryptionDemo, EnvelopeEncryptionDemo, and
  HSMKeyDerivationDemo now register intermediate derived secrets (ML-KEM decap, ECDH shared secret,
  HKDF output) into the HSM key registry for inspection.

- **EdDSA PKCS#11 bindings**: Added `buildEdDSAParams()` helper constructing `CK_EDDSA_PARAMS`
  (phFlag, context data) and `CKA_EC_PARAMS` OID attribute in EdDSA key generation templates.

### Fixed

- **`useModuleDeepLink` test suite**: Updated all 11 test expectations to include the new
  `initialFlow` field; added a `?flow=` parsing test.

### Internal

- **RAG corpus regenerated**: Updated to reflect new EUDI crypto provider content and DRBG demo.

## [2.94.2] - 2026-04-08

### Fixed

- **Rust WASM binary updated to v0.4.17**: The deployed `softhsmrustv3_bg.wasm` was built from
  v0.4.15 source (v0.4.16 updated constants in Rust source but never rebuilt the binary).
  The new binary, built with `wasm-bindgen 0.2.117`, correctly exposes `CKM_HASH_ML_DSA`,
  `CKM_HASH_SLH_DSA`, and `CKM_EDDSA_PH` in `C_GetMechanismList`. This also fixes the
  "Length out of range of buffer" crash in the VPN simulation cert generation flow — the
  v0.4.15 RSA `CKA_MODULUS` / `CKA_PUBLIC_EXPONENT` fix is now active in the production
  WASM binary.

### Changed

- **PKCS#11 Walkthrough removed from Playground**: The `pkcs11-sim` workshop entry has been
  removed from the registry.

### Internal

- **SBOM: `@pqctoday/softhsm-wasm` updated to v0.4.17**: Vendor `package.json` bumped;
  `wasm-bindgen` entry in About SBOM updated to v0.2.117.

## [2.94.1] - 2026-04-08

### Fixed

- **About page SBOM — softhsmv3 link and version updated to v0.4.16**: The softhsmv3 entry
  in the About page SBOM previously linked to v0.4.13 and the Rust WASM Bindings / Rust Crypto
  Crates sections showed v0.4.15. All three references now point to v0.4.16.

### Internal

- **SBOM: `@pqctoday/softhsm-wasm` updated to v0.4.16**: Synced vendor constants with
  softhsmv3 v0.4.16 release. New mechanism constants now available in-app:
  `CKM_HASH_ML_DSA` (base), `CKM_HASH_SLH_DSA` (base), `CKM_EDDSA_PH` (Ed25519ph),
  `CKM_SHA3_256`, `CKM_SHA3_256_HMAC`, `CKM_KMAC_128`, `CKM_KMAC_256`, plus all 10
  specific `CKM_HASH_ML_DSA_SHA*/SHAKE*` and `CKM_HASH_SLH_DSA_SHA*/SHAKE*` variants.
  TypeScript declarations in `constants.d.ts` updated to match.

## [2.94.0] - 2026-04-07

### Added

- **New SLH-DSA learning module** (`/learn/slh-dsa`): A dedicated 4-step module covering FIPS 205
  SLH-DSA end-to-end — WOTS+, FORS, and hypertree architecture (§3–5); all 12 parameter sets with
  the FIPS 205 §6 internal parameter table (n, h, d, h/d, a, k, lg_w, m); context strings for
  domain separation (§9.2); deterministic signing mode (§10); and a side-by-side comparison of
  LMS, XMSS, and SLH-DSA.

- **SLH-DSA Playground — context string support (FIPS 205 §9.2)**: The Sign & Verify tab now
  includes an optional context string field. The string is encoded as UTF-8 bytes (max 255 B) and
  bound to the signature — supplying a mismatched context at verify time returns
  `CKR_SIGNATURE_INVALID`. Only available in Pure SLH-DSA mode (not HashSLH-DSA).

- **SLH-DSA Playground — deterministic mode toggle (FIPS 205 §10)**: A new checkbox switches
  between randomized signing (`opt_rand` from RNG, default) and deterministic signing
  (`opt_rand = PK.seed`). Toggle it to observe: off = a new signature each click; on = the same
  bytes every time for the same (SK, M, context) triple. Pure SLH-DSA only.

- **SLH-DSA Playground — FIPS 205 §6 internal parameter table**: Expand the collapsible
  "FIPS 205 §6 internal parameters" row to see the full n/h/d/h′/a/k/lg_w/m values for the active
  parameter set with explanations of the -s (small signature) vs -f (fast signing) trade-off.

- **SLH-DSA — FIPS 205 §11 compliance labels on pre-hash options**: Pre-hash variants that are
  not approved for HashSLH-DSA by FIPS 205 §11 (SHA-384, SHA3-\*, SHA-224) are now labelled
  "(Non-FIPS 205)" in the dropdown. Selecting one shows an amber warning pointing to the four
  approved hashes: SHA-256, SHA-512, SHAKE-128, SHAKE-256.

- **KMS Envelope Encryption — three new KAT specs**: The KAT panel now includes an ML-KEM-512
  encap/decap round-trip test, an ML-KEM-1024 encap/decap round-trip test, and an ML-KEM-768
  decapsulation test against a NIST ACVP vector (FIPS 203 §7.2).

- **KMS Envelope Encryption — envelope blob hex viewer**: After running the demo, a new
  "Stored Envelope Blobs" section renders the raw hex of every blob the recipient would need to
  store: KEM ciphertext, wrapped DEK, and GCM nonce. Includes a one-click "Copy hex" button for
  each blob.

- **PKCS#11 v3.2 hedge variant constants**: `CKH_HEDGE_PREFERRED` (0x00), `CKH_HEDGE_REQUIRED`
  (0x01), and `CKH_DETERMINISTIC_REQUIRED` (0x02) are now exported from the vendor constants
  module alongside `CK_SIGN_ADDITIONAL_CONTEXT_SIZE` (12 B) for correct WASM buffer allocation.

- **SLH-DSA Playground — SHA-2 vs SHA-3 hardware hint**: The parameter set info panel now shows
  a one-line note explaining when to prefer SHA-2 variants (no SHA-3 hardware) vs SHA-3/SHAKE
  variants (with acceleration).

### Fixed

- **KMS Envelope Encryption — HKDF salt now follows SP 800-56C Rev 2 §4.1**: The wrapping key
  derivation previously omitted the HKDF salt (`undefined`). It now uses a fixed 32-byte salt
  (`"kms-envelope-salt-v1"` right-padded to 32 B), meeting the SP 800-56C requirement that the
  salt length is ≥ the hash output length (SHA-256 → 32 B). Both the encapsulation and
  re-derivation paths use the same salt.

- **SLH-DSA Workshop — `C_GetAttributeValue` removed from live PKCS#11 log**: The logging proxy
  now bypasses `C_GetAttributeValue` so internal attribute reads no longer appear as operations in
  the step-by-step log, reducing noise.

- **SLH-DSA Stateful Signatures Workshop — prehash options unified with Playground**: The
  dropdown now reuses `PREHASH_OPTIONS` from `SoftHsmUI`, eliminating a duplicate list that could
  drift out of sync.

- **Playground — default engine in URL state changed from `cpp` to `rust`**: The URL param is now
  omitted when the engine is `rust` (the default) and written when it differs, preventing stale
  `?engine=cpp` links from appearing in shared URLs.

- **VPN Simulation and Token Setup panels migrated to Rust WASM module**: `VpnSimulationPanel`,
  `TokenSetupDemo`, and `algorithmEngineResolver` all now use `getSoftHSMRustModule()` instead of
  `getSoftHSMCppModule()`, consistent with the rest of the Playground.

- **HsmSetupPanel label corrected**: The subtitle now reads "SoftHSMv3 Rust WASM · OpenSSL 3.6 ·
  PKCS#11 v3.2" (was "SoftHSM3 WASM").

### Internal

- **softhsmv3 Rust WASM** — updated C++ WASM module (`softhsm.js`) and Rust glue
  (`softhsmrustv3_bg.js`). New PKCS#11 v3.2 functions: `_C_GetSessionValidationFlags`,
  `_C_AsyncJoin`, `_C_AsyncGetID`, `_C_AsyncComplete`, `_C_MessageEncryptInit/Final`,
  `_C_MessageDecryptInit/Final`, `_C_VerifySignatureInit/Update/Final/FinalWithSignature`, and
  `_set_kat_seed`. Parameter names in `C_InitToken`, `C_Login`, `C_OpenSession`, `C_GetSlotList`
  changed from `_`-prefixed stubs to real names, reflecting full Rust implementation.

- **`index.d.ts` trailing-comma cleanup**: All parameter lists now use trailing commas for
  consistent Prettier formatting. `_C_CreateObject` and `_C_FindObjects` reformatted to multi-line.

- **SLH-DSA workshop link updated in Playground registry**: The SLH-DSA Sign & Verify tool now
  links to the new `/learn/slh-dsa` module (was `/learn/stateful-signatures`) and the `wip: true`
  flag is removed — the tool is production-ready.

- **RAG corpus regenerated** to include the new SLH-DSA module content.

## [2.93.0] - 2026-04-07

### Added

- **PKI Workshop now in the Playground**: You can now launch the full PKI certificate chain
  workshop (CSR → Root CA → Sign → Parse → CRL) directly from the Playground's "Certificates &
  Proofs" tab — no need to navigate to the Learn module.

- **Bitcoin Flow — quantum threat warning on public key export**: When you export your Bitcoin
  public key (Step 2), an amber warning now explains the "harvest now, decrypt later" (HNFL)
  risk: once your public key is visible on-chain, a future quantum computer could derive your
  private key and forge transactions. Spend addresses are most exposed.

- **Bitcoin Flow — clearer address and transaction explanations**: The address derivation steps
  now call out the mainnet vs testnet version bytes (`0x00` vs `0x6f`). The transaction step
  explains the Bitcoin UTXO model — why transactions consume full outputs and return change.

- **HD Wallet Flow — expanded to 5 steps with live derivation tree**: The HD Wallet module now
  walks through five steps: generate a mnemonic, derive the root seed, compare hardened vs
  non-hardened key derivation live, derive addresses for Bitcoin/Ethereum/Solana, and assess the
  quantum threat surface of the whole wallet stack. Step 4 shows an inline ASCII derivation tree
  displaying the BIP-44 path and truncated live addresses for all three chains.

- **HD Wallet Flow — hardened vs non-hardened live demo (Step 3)**: A side-by-side known-answer
  test shows exactly how hardened derivation (using the parent private key in HMAC-SHA512) differs
  from non-hardened derivation (using the parent public key). Includes an Ed25519 enforcement
  check — Solana wallets can only use hardened paths.

- **Solana Flow — explains how real wallet apps derive keys**: Step 1 now explains how Phantom,
  Solflare, and other Solana wallets actually work: BIP-39 mnemonic → PBKDF2 seed → SLIP-0010
  hardened derivation at `m/44'/501'/0'/0'`. The demo generates the same Ed25519 seed directly
  via the HSM; all signing steps from there are identical to a real wallet.

- **Solana Flow — Ed25519 public key format explained**: Step 2 now explains that the HSM returns
  the public key wrapped in a DER/SPKI envelope (not raw bytes), and why PKCS#11 v3.2 requires
  this format for portability across hardware vendors. The raw 32-byte key is extracted from the
  end of the structure.

- **CRL Generator — revocation reasons and human-readable output**: The CRL generator now lets
  you choose from all 8 RFC 5280 revocation reason codes (e.g. keyCompromise, superseded,
  cessationOfOperation) when revoking a certificate. The output panel shows both the PEM and a
  parsed human-readable view side-by-side.

- **PKI Workshop — NIST security level shown next to algorithm picker**: When selecting an
  algorithm in Root CA Generator, the selector now shows the corresponding NIST security level
  (e.g. "NIST Level 3 — ~AES-192 security") so you know what protection level you're choosing.

- **PKI Workshop — ML-DSA and SLH-DSA labels updated to final standard names**: Algorithm labels
  previously said "(Dilithium)" — they now say "(FIPS 204)" and "(FIPS 205)" to reflect the
  final published NIST standards.

- **Cert Parser — fingerprint, CSR verify, and CRL verify**: The certificate parser now computes
  a SHA-256 fingerprint for any loaded certificate. It also verifies CSR self-signatures and
  validates CRL signatures against a Root CA from your session — with auto-detection of whether
  the pasted input is a certificate, CSR, or CRL.

- **Hybrid Cert Formats — generated PEMs flow into Cert Parser and OpenSSL Studio**: After
  generating a hybrid certificate (SLH-DSA, ML-DSA, composite, or dual), the PEM file is
  automatically added to the OpenSSL Studio virtual filesystem. You can immediately paste it into
  Cert Parser or use it in OpenSSL Studio without any copy-paste.

- **New in-app glossary tooltips for Solana transaction concepts**: Added tooltips for Program-
  Derived Addresses (PDA), fee payers, the System Program, compact-u16 encoding, ECDSA nonce
  risks, and DER signature encoding — inline wherever these concepts appear in the flows.

- **Blockchain Playground tools marked production-ready**: The "WIP" badge has been removed from
  Bitcoin Transaction, Solana Transaction, and HD Wallet in the Playground. All three flows are
  fully functional.

### Fixed

- **PKCS#11 log panel — step header now appears above its commands**: Previously the log was
  strictly newest-first, which put the step label below the calls that belonged to it. Each step's
  header now correctly leads its group of commands, while newer steps still appear at the top.

- **Step results accumulate newest-first**: Results shown after completing each step were
  appending below older results (oldest at top). They now prepend above, matching the log panel
  and making the most recent output the first thing you see.

- **TLS comparison table — ML-DSA-65 signature size corrected**: The algorithm size table in TLS
  Basics was showing 3,293 B for ML-DSA-65 signatures. The correct FIPS 204 value is 3,309 B.

- **TLS Introduction — SLH-DSA-SHA2-128s signature size now shows exact byte count**: The
  description now reads "~7.9 KB (7,856 B)" rather than just the approximate figure.

- **TLS Handshake Diagram — removed misplaced encryption boundary marker**: The "Encrypted from
  here" label was positioned incorrectly relative to the actual TLS handshake message sequence
  and has been removed to avoid teaching the wrong concept.

- **Internal: PKCS#11 `CKA_PUBLIC_KEY_INFO` constant corrected**: The attribute code was set to
  `0x248` instead of the correct `0x129` per the PKCS#11 v3.2 specification. This affected public
  key retrieval for Ed25519 keys in the Bitcoin and Solana flows.

## [2.90.0] - 2026-04-07

### Added

- **MTC Workshop — shared tree state across Steps 1→2→3**: Steps 1, 2, and 3 now share a
  continuous Merkle tree. When a tree is built in Step 1, `MerkleWorkshopSteps` captures it via
  `onTreeBuilt` callback and passes `sharedLevels`/`sharedCerts` to both `InclusionProofGenerator`
  (Step 2) and `ProofVerifier` (Step 3). Each step shows a "Your tree from Step 1 is loaded"
  callout and adapts its button label (e.g. "Build Tree with 8 Certificates from Step 1"). Steps
  fall back to 8 sample certificates when no prior tree is present.
- **MTC Workshop — Landmark MTC column in Step 4 size comparison**: `SizeComparison` now shows a
  third column alongside Traditional X.509 and Standalone MTC — Landmark MTC (proof + metadata
  only, zero embedded signatures). Includes reduction badge for both standalone and landmark modes.
- **MTC Workshop — Step 4→5 bridge text**: `SizeComparison` description now ends with "In Step 5,
  you'll see the CA sign a real Merkle root with ML-DSA-44 — that single signature is what makes
  these size savings possible." `CTLogSimulator` adds a "Bringing it together" paragraph at the top
  of the Submission panel connecting Steps 1–4 to the live PKCS#11 signing demo.
- **MTC Workshop — production-use context in ProofVerifier**: Added explanatory sentence that in
  the MTC model the inclusion proof is embedded in the certificate and used by relying parties to
  verify batch inclusion without downloading the full tree.
- **MTC Workshop — padding divergence disclosure**: `MerkleTreeBuilder` now shows an amber callout
  when the leaf count is not a power of two, explaining the simplified duplicate-last-leaf padding
  vs. RFC 9162 §2.1.2's unbalanced binary tree and noting the root hashes will differ.
- **MTC — Landmark MTC functions in `mtcConstants.ts`**: Added `mtcLandmarkChainSize()`,
  `landmarkReductionPercent`, `mtcLandmark`, and `mtcLandmarkTotal` fields to `SizeBreakdown`
  and `getSizeBreakdown()`. `mtcChainSize()` now accepts an optional `proofBytes` parameter.

### Fixed

- **MTC Workshop — KAT signing spec corrected**: `MerkleTreeBuilder` KAT for tree-root signing
  was incorrectly referencing SLH-DSA (FIPS 205). Fixed to ML-DSA-44 (FIPS 204) with
  `kind: { type: 'mldsa-functional', variant: 44 }` — matching the actual CT Log simulator which
  signs with ML-DSA-44 via SoftHSMv3.
- **MTC Workshop — ECDSA standalone savings corrected**: Static text in `MTCExercises` and
  `rag-summary.md` now correctly states ~3% standalone savings for ECDSA P-256 (was incorrectly
  ~15% after a prior round of fixes). Arithmetic: traditional 1,225 B → standalone 1,193 B = 2.6%.
- **MTC Workshop — SCT count and traditional total corrected**: `MTCIntroduction` static table
  footnote corrected from "4 SCTs (476 B)" to "2 SCTs (238 B)". Traditional ML-DSA-44 total
  corrected from 12,272 B to 12,034 B throughout all static text.
- **MTC Workshop — ML-DSA-44 savings corrected to 60%**: All static text references ("61%",
  "62%") unified to 60% matching `getSizeBreakdown()` output.
- **MTC Workshop — `PROOF_VERIFIER_CERTS` stabilised with `useMemo`**: The derived cert list in
  `ProofVerifier` was recomputed as a new array reference on every render, causing `handleSetup`
  (which had it in its `useCallback` deps) to be recreated unnecessarily. Wrapped in `useMemo`.
- **MTC Workshop — "Step 1 — Generate CA Key" label conflict**: Label inside `CTLogSimulator`
  SubmissionPanel renamed to "Generate CA Key" to avoid collision with the workshop's global Step 1.
- **MTC Workshop — CA key label now includes size**: `CTLogSimulator` registers the CA public key
  with label "CT Log CA Public Key (ML-DSA-44, 1,312 B)" in the key inspector.
- **MTC Workshop — Step 1 stats bar clarified**: Bar label updated to "3× ML-DSA-44 Sigs (sig
  bytes only)" and footnote updated to direct users to Step 4 for the full chain breakdown.
- **MTC Workshop — draft status disclosed**: `MTCIntroduction` IETF section now includes an amber
  "Draft — not yet an RFC" badge and a timeline note: "Status: Active IETF draft — not yet
  standardized as an RFC. Not recommended for production deployment without vendor support."

## [2.89.5] - 2026-04-07

### Fixed

- **Playground — 5G SUCI Profile C hybrid mode URL sync**: Profile C now always sets
  `?pqcMode=hybrid` explicitly in the URL (previously omitted, causing the Hybrid button
  to appear unselected). All four states now have fully explicit URLs:
  - `/playground/suci-flow?profile=A` — Profile A
  - `/playground/suci-flow?profile=B` — Profile B
  - `/playground/suci-flow?profile=C&pqcMode=hybrid` — Profile C hybrid
  - `/playground/suci-flow?profile=C&pqcMode=pure` — Profile C pure PQC
- **Playground — fixed race condition on Profile C switch**: `changeProfile('C')` was
  calling both `onProfileChange` and `onPqcModeChange`, triggering two concurrent
  `setSearchParams` calls that could race and revert the profile update. Suppressed
  the second call — `handleProfileChange` in `SuciFlowRoute` atomically sets both
  `profile=C` and `pqcMode=hybrid` in a single update.
- **Playground — SuciFlow pqcMode state sync**: Added `useEffect` in `SuciFlow` to
  keep internal `pqcMode` in sync with the `initialPqcMode` prop when the same component
  instance is reused across profile switches (React key reuse).
- **Playground — SuciFlowRoute extracted to dedicated file**: Moved inline `SuciFlowRoute`
  out of `workshopRegistry.tsx` lazy callback into `src/components/Playground/SuciFlowRoute.tsx`,
  fixing hook instability under React StrictMode.

## [2.89.4] - 2026-04-07

### Fixed

- **Playground — 5G SUCI URL stays in sync when switching profiles/modes**: `SuciFlowRoute`
  now uses `useSearchParams` to both read initial values and write back changes via
  `onProfileChange` / `onPqcModeChange` callbacks. Switching Profile A→B→C updates
  `?profile=` in the URL in real time. Profile A (default) keeps a clean URL with no
  param. `pqcMode=pure` is written only when Profile C pure is active; hybrid (default)
  removes the param. All changes use `replace: true` to avoid polluting browser history.

## [2.89.3] - 2026-04-07

### Fixed

- **Playground — suci-flow deep-link actually works now**: `suci-flow` was registered
  in `ONBACK_COMPONENTS` via `makeLazyWithOnBack`, whose `WorkshopWrapper` only forwards
  `onBack` — dropping `initialProfile` and `initialPqcMode`. Moved `suci-flow` to
  `TOOL_COMPONENTS` as a self-contained `SuciFlowRoute` wrapper that reads `?profile=`
  and `?pqcMode=` from the URL directly and passes them to `SuciFlow`.

## [2.89.2] - 2026-04-07

### Added

- **Playground — 5G SUCI deep-link profile/pqcMode support**: `PlaygroundToolRoute`
  now reads `?profile=` and `?pqcMode=` from the URL and passes them to `SuciFlow`
  as `initialProfile` / `initialPqcMode`. Direct URLs now work from Playground:
  - `/playground/suci-flow` → Profile A (default)
  - `/playground/suci-flow?profile=B` → Profile B
  - `/playground/suci-flow?profile=C` → Profile C hybrid
  - `/playground/suci-flow?profile=C&pqcMode=pure` → Profile C pure PQC

## [2.89.1] - 2026-04-07

### Fixed

- **5G SUCI — deep-link URL now actually updates in the browser**: `getModuleDeepLink`
  was called without `validTabs`, so the default list contained `'workshop'` instead
  of `'simulate'`. A direct load with `?tab=simulate&profile=C` fell back to `'learn'`,
  leaving `activeTab !== 'simulate'` and suppressing the URL sync effect. Fixed by
  passing the correct `validTabs` array explicitly.

## [2.89.0] - 2026-04-07

### Fixed

- **5G SUCI — Profile C pure PQC no longer shows hybrid code snippets**: Step 1
  (Home Network Key Generation) and Step 5 (Compute Shared Secret) now display
  pure-PQC-specific code when `pqcMode === 'pure'`. Step titles are also patched
  to reflect the pure mode context. The static `SUCI_STEPS_C` array defaults to
  hybrid; overrides are applied in `SuciFlow` at the step-mapping layer.

### Added

- **5G SUCI — deep-link URL encodes profile and pqcMode**: The URL now reflects
  the active profile and PQC mode when on the SUCI Workshop tab:
  - Profile A: no `?profile=` param (default)
  - Profile B: `?tab=simulate&profile=B`
  - Profile C hybrid: `?tab=simulate&profile=C`
  - Profile C pure PQC: `?tab=simulate&profile=C&pqcMode=pure`
    Navigating to any of these URLs restores the correct profile and mode
    immediately. The Share button picks up the live URL, so shared links land
    directly on the right profile/mode combination.

## [2.88.0] - 2026-04-07

### Fixed

- **VPN Simulation — C_CloseSession and C_Verify now emit RPC log entries**: The IKEv2 responder
  thread previously dispatched no log for `C_CloseSession` (cmd 13) or `C_Verify` (cmd 49); both
  now call `strongSwanEngine.dispatchLog` so the RPC trace is complete. `C_Verify` log level is
  `error` when `rv !== 0` for immediate visibility of failed signature checks.

- **VPN Simulation — PKCS#11 log panel no longer shows bookkeeping operations**: `C_GetAttributeValue`,
  `C_Finalize`, `C_Logout`, and `C_FindObjectsFinal` are now filtered from the HSM log panel via a
  `VPN_LOG_SKIP` set. These are internal plumbing calls with no educational value; key-extraction
  detail is already captured in the crypto-op log entries above.

### Data

- **Compliance — ANSSI catalog re-scraped**: `compliance-data.json` refreshed (2,386 records); ANSSI
  catalog hash updated to reflect the latest product catalog state.

- **RAG corpus updated**: 5,818 chunks (was 5,817).

## [2.87.0] - 2026-04-07

### Added

- **5G SUCI — Profile B (P-256) dedicated step content**: Profile B now has its own `SUCI_STEPS_B`
  constant with step titles, descriptions, and code snippets tailored to P-256 (secp256r1) —
  previously it displayed Profile A (X25519) labels throughout.

- **5G SUCI — Profile B compressed key encoding**: The scheme output for Profile B now uses the
  33-byte COMPRESSED P-256 ephemeral public key (02/03 prefix + x-coordinate) per TS 33.501
  Annex C.4, down from 65 bytes. ECDH inside the HSM still uses the full uncompressed form.

- **5G SUCI — educational content: compressed vs uncompressed EC point encoding**: Steps 9, 10
  and terminal output for Profile B now show both encoding forms side by side, explaining when each
  is used and why. Includes the application-layer compression formula (no `C_CompressECPoint` in
  PKCS#11) and how the SIDF recovers y via the P-256 curve equation y²=x³−3x+b (mod p).

- **5G SUCI — PKCS#11 mechanism accuracy**: Code snippets for all X25519 operations now correctly
  cite `C_DeriveKey(CKM_EC_MONTGOMERY_KEY_DERIVE)` per PKCS#11 v3.2, distinguishing it from
  `CKM_ECDH1_DERIVE` which applies to Weierstrass curves (P-256/P-384). Affected: Profile A
  step 5, Profile A step 11, Profile C hybrid steps 5 and 11.

### Fixed

- **5G SUCI — profile transitions always reset to step 1**: Switching between Profile A → B → C
  (hybrid) → C (pure) now lands on step 1 each time. The `useStepWizard` hook gained a `reset()`
  method called at all transition sites (onClick handlers and `onComplete`).

- **5G SUCI — profile state set before every step executes**: `fiveGService.state.profile` is now
  assigned at the top of every `executeStep` call, preventing `computeMAC` and
  `visualizeStructure` from seeing a stale or undefined profile on early steps.

- **5G SUCI — B→C transition no longer double-cleans**: `changeProfile('C')` now internally sets
  `pqcMode` to `'hybrid'`, so `onComplete` can call it once without a redundant `changePqcMode`.

## [2.85.0] - 2026-04-07

### Added

- **5G SUCI — Profile C visualization corrected**: The SUCI structure panel now correctly shows
  the hybrid Profile C output format — the scheme output starts with the ML-KEM ciphertext, not
  an ephemeral key. The abbreviated SUCI string and description both reflect the actual
  `kemCiphertext ‖ msinCiphertext ‖ macTag` layout per 3GPP TS 23.003.

- **Library — 3 new records with proper titles and download links**:
  - _Study of Post Quantum Status of Widely Used Protocols_ (Cisco Research, arXiv 2603.28728, Mar 2026) — PQC migration survey across TLS, IPsec, BGP, DNSSEC, SSH, QUIC, OpenID Connect, OpenVPN, and Signal.
  - _Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities_ (Google Quantum AI + Ethereum Foundation, Mar 2026) — new resource estimates for breaking secp256k1 with a quantum computer; on-spend attack analysis.
  - _Protecting Subscriber Identifiers with SUCI_ (NIST CSWP 36A ipd, Aug 2024) — NIST guidance on enabling 5G subscriber identity concealment to prevent IMSI-catching.

- **5G SUCI — removed WIP badge**: The 5G SUCI Construction tool is now complete and no longer
  marked as Work in Progress in the Playground.

### Fixed

- **5G SUCI — HSM and OpenSSL cross-check now agree on key derivation**: The dual-engine
  comparison was previously using different ephemeral key bytes for the KDF — the HSM used its
  internal EC point while OpenSSL used an SPKI-wrapped version. The HSM key bytes are now synced
  into the shared state before derivation runs, so both engines produce matching output.

- **HSM — AES-GCM per-message encrypt/decrypt enabled on Rust engine**: The per-message AEAD
  functions (`C_MessageEncryptInit`, `C_EncryptMessage`, etc.) are now fully wired to the Rust
  WASM engine, which implements them in softhsmv3 v0.4.10. Previously they returned an error.

## [2.84.0] - 2026-04-07

### Added

- **VPN Simulation — SKEYSEED key derivation step**: After the ML-KEM shared secret is verified,
  a new panel shows exactly how IKEv2 derives the session master key (SKEYSEED) — using
  `prf(Ni ‖ Nr, shared_secret)` with the actual KEM secret bytes displayed. Pure-PQC and hybrid
  modes each show their respective PRF inputs. References RFC 9370 and the ML-DSA IKEv2 draft.

- **VPN Simulation — IKE exchange phase labels on logs**: Each line in the charon.log panel is now
  tagged with its IKE exchange phase (SETUP / IKE_SA_INIT / IKE_INTERMEDIATE / IKE_AUTH). This
  makes it easy to see where ML-KEM fits into the handshake — encapsulation happens during
  IKE_INTERMEDIATE in hybrid mode, IKE_SA_INIT in pure-PQC mode.

- **VPN Simulation — payload size note**: A callout explains that PQC key exchange payloads are
  10–16× larger than classical ECDH (ML-KEM-768 public key: 1,184 bytes vs P-256: 64 bytes),
  and why IKEv2 uses the IKE_INTERMEDIATE exchange to handle the extra fragmentation load.

- **VPN Simulation — QKD toggle clarified**: The QKD PSK option now shows
  "(informational — not simulated)" so it is clear this is a display label, not an active feature.

### Fixed

- **5G SUCI — dual-engine comparison uses real HSM output**: The encrypted MSIN and MAC tag
  shown in the comparison panel now come directly from the HSM rather than the parallel
  OpenSSL computation, giving an accurate side-by-side result. The MAC tag is correctly
  truncated to 8 bytes per 3GPP TS 33.501.

- **5G SUCI Profile C — KEM ciphertext carried forward correctly**: The HSM-produced ML-KEM
  ciphertext is now stored in the shared state after the key encapsulation step, so downstream
  SUCI assembly and visualization use the real ciphertext.

- **Stateful Signatures — default message aligned across panels**: Both the XMSS key generation
  demo and the Stateful Signatures workshop now default to `"Hello, world!"`, making cross-engine
  verification work without any manual input change.

## [2.83.0] - 2026-04-07

### Added

- **VPN Simulation — full IKEv2 + ML-KEM-768 handshake working end-to-end**: The VPN simulator
  now completes a real PKCS#11-based ML-KEM-768 key encapsulation through the HSM, including
  key generation, encapsulation, shared secret extraction, and SKEYSEED derivation. This is the
  first full IKEv2 post-quantum handshake running entirely inside the browser HSM.

### Fixed

- **VPN Simulation — engine stability**: Switched back to the C++ HSM engine for VPN simulation
  after finding that the Rust WASM engine has compatibility issues in the browser's secure context
  that prevent it from running correctly in this scenario.

- **HSM — encapsulation bug fixed in softhsmv3**: A bug in the C++ HSM engine caused key
  encapsulation to return an error when reading standard key attributes. The WASM binary has been
  updated with the fix.

- **HSM — 8 additional Rust engine functions now active**: Pre-bound signature verification
  (`C_VerifySignatureInit/Final/Update`) and PKCS#11 v3.2 session functions that were previously
  disabled are now fully wired to the Rust engine.

## [2.82.0] - 2026-04-06

### Added

- **5G SUCI — 3GPP TS 33.501 reference vectors modal**: A "Reference Vectors" button on the SUCI
  flow panel opens an expandable modal with the official 3GPP TS 33.501 Annex C.4 test vectors
  for Profile A (X25519) and Profile B (P-256) — including home network keys, ephemeral keys,
  scheme output breakdown (EphPub ‖ Ciphertext ‖ MAC), and copyable hex fields.
- **Profile C hybrid mode — full TR 33.841 §5.2.5.2 implementation**: Hybrid Profile C now
  generates two separate HN keypairs (ML-KEM-768 + X25519), derives Z_ecdh via ECDH and Z_kem
  via ML-KEM encapsulation, then combines them as `Z = SHA256(Z_ecdh ‖ Z_kem)` inside the HSM
  using `C_Digest`. Key derivation uses ANSI X9.63-KDF with SHA3-256 producing AES-256 + HMAC-SHA3-256 keys.
- **Stateful Signatures — cross-engine sign and verify**: The Stateful Signatures workshop can now
  sign on the Rust engine and verify on the C++ engine. Public key bytes are cached at generation
  time, imported into the C++ session via `C_CreateObject`, and verified with `C_VerifyInit` /
  `C_Verify`. Includes tamper-detection toggles (flip message / flip signature) and a live
  verification result indicator.
- **VPN Simulation — RSA-3072 certificate generation and inspection**: The VPN panel now generates
  a real RSA-3072 key pair via the HSM, constructs a TBS certificate using `@peculiar/asn1-x509`,
  signs it with `C_Sign` (SHA256withRSA), and shows a certificate inspector modal with full field
  breakdown. A warning badge notes that RSA-3072 is classical (not quantum-safe) per
  draft-ietf-ipsecme-ikev2-mldsa.

### Changed

- **5G SUCI — spec-correct ANSI X9.63-KDF replaces HKDF**: Key derivation now follows 3GPP TS
  33.501 §C.3.3 exactly — `block1 = SHA-256(Z ‖ 0x00000001 ‖ sharedInfo)`,
  `K_enc = block1[0:16]`, `K_mac = block1[16:] ‖ block2[0:16]`. HKDF was never in the 3GPP spec.
- **5G SUCI — AES-128-CTR with zero IV (was AES-GCM)**: MSIN encryption now uses AES-128-CTR per
  TS 33.501 §C.3.3 with a zero 16-byte IV. BCD encoding (nibble-swap per TS 23.003) applied to
  MSIN digits before encryption.
- **5G SUCI — authenticate-then-decrypt at SIDF**: The SIDF decryption step now verifies the
  MAC before decrypting — SUCI is rejected if the tag does not match. MSIN BCD decoding and
  full SUPI reconstruction are shown in the result panel.
- **HSM slot initialization — reuses existing slot on conflict**: The HSM context no longer
  crashes with "no free slot" when all slots are already initialized (e.g. Playground page
  reopened without reload). It now falls back to the first initialized slot automatically.
- **softhsmv3 WASM updated**: C++ engine (v0.4.8+) and Rust engine rebuilt with latest
  softhsmv3 changes.

## [2.81.1] - 2026-04-06

### Fixed

- **VPN Simulation works on the live site**: The VPN simulation panel was showing "SharedArrayBuffer disabled" and blocking the simulation on the production deployment. Fixed by injecting the required Cross-Origin Isolation headers through the PWA service worker — the simulation now works in Chrome and Edge with no action required from users. (Safari is not affected; this was a Chrome/Edge-only production issue.)

## [2.81.0] - 2026-04-06

### Added

- **Download hybrid certificates**: Each certificate card in the Hybrid Cryptography workshop now has a download button alongside the copy button. Save the certificate as a `.pem` file or as a `.txt` file depending on the active view.

### Changed

- **5G SUCI flow matches the real spec**: The SUCI encryption and MAC steps now correctly reuse key material derived in the HKDF step, matching 3GPP TS 33.501. The key family label was corrected from "ML-KEM (Kyber)" to "ML-KEM (FIPS 203)".
- **Envelope Encryption — accurate sizes and wrap overhead**: The PQC column always shows correct ML-KEM reference sizes regardless of which key-encryption algorithm is selected. AES-KWP wrap overhead corrected to 48 bytes (per RFC 5649 §4.2).
- **Bitcoin Playground — pure HSM path**: The Bitcoin key derivation flow no longer relies on OpenSSL — all operations now run entirely through the in-browser PKCS#11 HSM.
- **Firmware Signing wizard**: The Firmware Signing step wizard now uses the same step-wizard UI pattern as other workshops for a consistent experience.
- **Key Derivation panel labels**: KBKDF entries now include the spec revision date ("SP 800-108 Rev1 (Aug 2022)"); PBKDF2 use-case description updated to "low-entropy key stretching".

### Data

- **RAG corpus regenerated**.

## [2.80.0] - 2026-04-05

### Added

- **Algorithm region and status filters**: Filter PQC algorithms by geopolitical region (NIST/US, IETF/Global, BSI/ANSSI/Europe, ETSI, KpqC/Korea, CACR/China) or certification status (Certified, Candidate, To Be Checked). Region and Status columns added to the algorithm comparison table. Multivariate and Isogeny families added to the crypto-family filter.
- **Algorithm implementations**: A code icon on each algorithm card opens a list of open-source reference implementations and libraries, with direct links to Migrate catalog entries and Library references.
- **Work-in-progress badges on Playground tools**: Tools currently under development show an orange Wrench badge. WIP tools are hidden by default — use the new WIP filter to show or exclusively view them.
- **Migrate WIP filter**: Products currently under review are hidden by default in the Migrate catalog. A new WIP filter lets you include or exclusively show them.
- **XMSS deterministic keygen test**: A known-answer test (KAT) for XMSS-SHA2_10_256 verifies that key generation is fully reproducible — the same seed always produces the same key pair.

### Changed

- **VPN Simulation — isolated HSM slot management**: VPN slot initialization is now independent of other HSM panels, preventing conflicts when multiple Playground tools are open simultaneously.
- **Hybrid Encryption Demo**: Redesigned from a tab-based UI to a guided 5-step wizard for a clearer, more linear walkthrough.
- **SLH-DSA sign panel**: Streamlined interface — pre-hash mechanism labels, PKCS#11 log, and key inspector are now shown inline without extra navigation.

### Removed

- **Standalone SLH-DSA demo**: Removed a duplicate SLH-DSA demo that was redundant with the unified HSM Sign & Verify panel.

### Data

- New algorithm reference data with Region and Status fields.
- New algorithm implementations cross-reference.
- RAG corpus regenerated.

## [2.79.0] - 2026-04-05

### Fixed

- **Stateful Signatures workshop — key generation no longer crashes**: LMS and XMSS key generation was hitting an internal error. Both now use the Rust WASM engine, which handles these algorithms correctly.

## [2.78.0] - 2026-04-05

### Added

- **VPN simulation — all crypto through the in-browser HSM**: ECDH key exchange and random number generation during the IKEv2 handshake now run entirely through the in-browser SoftHSMv3 PKCS#11 module. OpenSSL is no longer used for IKE crypto — every cryptographic operation is visible in the PKCS#11 log.
- **Complete LMS/LMOTS parameter support**: Expanded from 9 to the full IANA registry — 20 LMS parameter sets and 16 LMOTS parameter sets, covering all SHA-256, SHA-256/24, SHAKE, and SHAKE/24 variants with correct signature size tables.

### Fixed

- **LMOTS W4 signature size lookups corrected**: The wrong constant value for the W4 Winternitz parameter was causing incorrect signature size calculations. Fixed to match the IANA registry.

### Data

- RAG corpus regenerated.

## [2.77.0] - 2026-04-05

### Added

- **VPN Simulation with ML-KEM-768**: A complete IKEv2 handshake now runs entirely in your browser — no server required. Two Web Worker instances of strongSwan 6.0.5 (initiator and responder) negotiate a post-quantum secure tunnel using ML-KEM-768 key exchange, completing IKE_SA_INIT and IKE_AUTH across 4 packets. Watch every PKCS#11 call, packet exchange, and key agreement step in real time.
- **Configurable VPN pre-shared key**: Set your own PSK for both the client and server sides. A mismatch warning appears when the keys differ, mirroring what happens in a real IKEv2 deployment when authentication fails.
- **Stateful Hash-Based Signatures Workshop**: LMS, HSS, and XMSS key generation and signing now run through the in-browser PKCS#11 HSM. Remaining signature capacity is tracked live — H5 trees are limited to 32 signatures, matching the real-world constraint on stateful schemes.

### Fixed

- **VPN simulation no longer crashes on start**: Fixed a threading incompatibility in the strongSwan WASM build that caused an "Unreachable" crash in single-threaded Emscripten mode.

### Data

- **strongSwan product entry updated**: ML-DSA experimental support added with 5 verified source URLs. Validation status: VALIDATED.
- **RAG corpus regenerated**.

## [2.76.0] - 2026-04-02

### Added

- **Collapsible Analysis section in the Gantt chart modal**: Clicking a Gantt bar now shows an "expand ▾ / collapse ▴" toggle when enrichment data is available. The collapsed state shows the main topic with mandate/urgency/sector badges; expanding reveals the full `TimelineAnalysisPanel` with all 8 enrichment dimensions. The panel resets to collapsed whenever a new bar is opened.

### Changed

- **Unified bookmark icon across all pages**: All "My" toggle buttons (Library, Compliance, Threats, Playground, Timeline, Migrate) now use `BookmarkCheck` (active) and `Bookmark` (inactive) from lucide-react, replacing the former `CheckSquare`/`Square` pattern for a consistent metaphor throughout the app.
- **Migrate catalog table cleanup**: Removed the redundant "My" and "Hide" columns from the table view. The Bookmark column now drives the "My" filter (same `useMigrateSelectionStore`), so bookmarking a product in the table immediately adds it to the My selection. The Compare column was updated to use the `Scale` icon.
- **My filter connected to bookmark store (Migrate)**: The bookmark action in both the card grid and the table now writes to `useMigrateSelectionStore` (`myProducts`). The "My (N)" filter button is now positioned on the right side of the toolbar, grouped with the view toggle.
- **Stack view collapses empty layers when My filter is active**: In Infrastructure Stack and CISA Stack views, layers with zero matching products are automatically hidden when the My filter (or a vendor filter) is active, reducing visual noise. Layers reappear when the filter is cleared.
- **BookmarksPanel uses unified product store**: The Migrate section in the Bookmarks right panel now reads from `useMigrateSelectionStore.myProducts` instead of the deprecated `migrateBookmarks` field. Clear All wipes selections across all sections including Migrate. JSON and CSV export include the product name extracted from the `name::categoryId` key format.
- **Export CSV button icon-only**: The "Export CSV" text label was removed from the Gantt chart toolbar; only the download icon remains.

## [2.75.0] - 2026-04-02

### Added

- **ACVP tests 23 & 24 — X25519/X448 ECDH round-trip**: The HSM ACVP compliance suite now covers Montgomery-curve Diffie-Hellman. Test 23 generates two X25519 keypairs, derives shared secrets from each side, and asserts they match. Test 24 does the same for X448. Both tests run on both the C++ and Rust engines in dual-mode (40 total assertions). A `extractMontgomeryPubKey` helper abstracts the engine difference: Rust stores raw bytes in `CKA_VALUE`; C++ stores a DER-wrapped point (`04 len raw`) in `CKA_EC_POINT`.
- **ACVP test 25 — X9.63 KDF with SHA3-256 / SHA3-512 (PKCS#11 v3.2 §5.2.12)**: Verifies `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA3_256_KDF)` and `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA3_512_KDF)` produce matching derived keys on both engines. Constants `CKD_SHA3_256_KDF = 0x0B` and `CKD_SHA3_512_KDF = 0x0D` are now exported from `softhsm/constants.ts`.
- **`hsm_pqcEncap` / `hsm_pqcDecap` wrappers (PKCS#11 v3.2 §6.3)**: String-variant API (`'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'`) over the existing `hsm_encapsulate` / `hsm_decapsulate` functions, for compatibility with the 5G SUCI Profile C UI layer.
- **`hsm_generateX25519KeyPair`**: PKCS#11 v3.2 compliant X25519 keypair generation via `CKM_EC_MONTGOMERY_KEY_PAIR_GEN` with `CKA_DERIVE=true` on the private key. Exported from `src/wasm/softhsm/classical.ts`.
- **`hsm_importECPrivateKey`**: Injects an EC private key scalar into the HSM via `C_CreateObject` for use in GSMA SUCI known-answer test injection. Supports P-256, P-384, P-521. Includes an inline warning documenting the `C_UnwrapKey` path that real hardware HSMs require.
- **`DerivedKeyProfile` interface + `buildDerivedKeyTemplate`**: Flexible PKCS#11 v3.2 attribute builder for `C_DeriveKey` templates. Replaces hardcoded `CKK_GENERIC_SECRET` templates in `hsm_ecdhDerive` and `hsm_ecdhCofactorDerive` — callers now pass a profile (`{ keyLen, derive, encrypt, decrypt, … }`) that maps 1-to-1 to `CKA_*` entries. Unspecified optional attributes are omitted from the template per §4.1.
- **ML-KEM keygen and import: optional `CKA_LABEL` support**: `hsm_generateMLKEMKeyPair` and `hsm_importMLKEMPublicKey` accept an optional `label` string that is stored in `CKA_LABEL` when provided. Template attribute counts are now dynamic (not hardcoded) so labels do not cause `CKR_TEMPLATE_INCONSISTENT`.
- **GSMA TS 33.501 Annex C.4 Profile B KAT**: Known-answer test vectors for 5G SUCI Profile B (P-256 ECDH + AES-128-CTR + HMAC-SHA-256 deconcealment) sourced directly from 3GPP TS 33.501. Stored in `src/data/kat/gsma_suci_ts33501_annex_c.json`. KAT runner extended with `suci-profile-b` test type covering 7 discrete steps (key import, ECDH, KDF, encrypt, MAC, end-to-end).
- **5G SUCI dual-engine output viewer**: The SUCI flow workshop panel now shows a tabbed output view — **SoftHSM3 (KAT)**, **OpenSSL Engine**, and **GSMA Vector Validation** — whenever a step produces dual-engine output. The GSMA tab renders the TS 33.501 Annex C reference value alongside the SoftHSM3 result and marks a pass/fail indicator.
- **Threats dashboard multi-view mode**: The Threats page now supports three view modes — **Table** (existing), **Cards** (new compact card grid), and **Industry Stack** (layered stack grouped by industry sector with inline table expansion). A view-mode toggle appears in the desktop header; the active mode is synced to the URL (`?mode=`). New components: `ThreatsCardGrid`, `ThreatsTable`, `ThreatsViewToggle`, `IndustryStack`, `ThreatCard`, `threatsHelper`.
- **Leaders sector stack view**: The Leaders page gains a **Sector Stack** view mode alongside the existing card grid. The stack groups leaders by organisation type (Government, Industry, Academia) with per-layer card expansion. A `LeadersViewToggle` and `SectorStack` component are introduced; the active mode is URL-synced.

### Fixed

- **`CKK_EC_MONTGOMERY` value corrected to `0x41`** (was `0x45`): The wrong constant caused `CKR_TEMPLATE_INCONSISTENT (0xD1)` on every X25519 and X448 keygen call to the C++ engine. Fixed in `src/wasm/softhsm/constants.ts` per PKCS#11 v3.2 pkcs11t.h (`CKK_EC_EDWARDS=0x40`, `CKK_EC_MONTGOMERY=0x41`).

### Changed

- **softhsm-wasm C++ engine rebuilt (0.4.3)**: `public/wasm/softhsm.{js,wasm}` rebuilt from source. Fixes `CKR_MECHANISM_PARAM_INVALID` on `C_DeriveKey` when `CKD_SHA3_256_KDF` or `CKD_SHA3_512_KDF` is requested — the KDF validation block in `SoftHSM_keygen.cpp::deriveEDDSA` / `deriveEC` now explicitly accepts both SHA3 KDF variants (PKCS#11 v3.2 §5.2.12).
- **softhsm-wasm Rust engine rebuilt (0.4.3)**: `public/wasm/rust/softhsmrustv3.{js,d.ts,_bg.wasm}` rebuilt with `CKD_SHA3_256_KDF` / `CKD_SHA3_512_KDF` constants in `constants.rs` and SHA3 dispatch arm in the X9.63 KDF block in `ffi.rs`.
- **`HsmKeyInspector` display names updated**: `CKK_EC_MONTGOMERY (0x41)` and `CKM_EC_MONTGOMERY_KEY_PAIR_GEN (0x1056)` now render their symbolic names in the key attribute inspector panel instead of showing raw hex.
- **Product catalog updated** (`pqc_product_catalog_04022026_r1.csv`): April 2026 r1 revision.
- **Library updated** (`library_04022026.csv`): April 2026 snapshot.

## [2.74.0] - 2026-04-01

### Changed

- **Compliance Module Refactoring**: The compliance view has been fully unified across mobile and desktop. The nested tab hierarchy was removed in favor of a single `ComplianceTable` component that dynamically utilizes CSS grid arrays to render cards on mobile viewports and a horizontal data-table on desktop viewports.
- **Global Filter Consolidation**: Filter menus have been refactored out of table headers and consolidated into a persistent Active Filters bar (desktop) and a `MobileFilterDrawer` (mobile) to significantly enhance usability and discoverability on smaller screens.
- **Resilient UI Testing**: E2E validation scripts for the compliance module have been updated to support the new flat responsive hierarchy.

## [2.73.0] - 2026-04-01

### Added

- **CISA Stack view for the Migrate catalog**: A new "CISA Stack" view mode organises the product catalog into the 15 CISA-designated critical infrastructure categories (Cloud Services, Networking Hardware/Software, Endpoint Security, ICAM, Telecom, Storage, and more). Switch between the enterprise layer stack and the CISA taxonomy using the view toggle at the top of the Migrate page.
- **PQC readiness progress bars in Infrastructure Stack**: Every layer card now shows a compact colour-coded progress bar breaking down products into Established (green), In Progress (amber), and No Capability (grey) based on their PQC support status. An overall readiness summary bar appears above the stack when no layer is selected.
- **License type filter in Migrate catalog**: A new "All Licenses" dropdown in the filter bar lets you narrow the product list to Open Source or Commercial entries. The selection is preserved in the URL so filtered views can be shared.
- **Quantum technology badges**: Products that incorporate quantum hardware (QKD, QRNG, or both) now display a colour-coded badge in both the card grid and the expanded table row. The `quantum_tech` field is sourced directly from the product catalog.

### Changed

- **CISA category field added to all products**: Every product in the migration catalog now carries a `cisa_category` field mapping it to one of the 15 CISA categories. Products without a specific mapping default to "Other / Unclassified".
- **Timeline data updated to April 2026** (`timeline_04012026.csv`): Latest government and industry PQC milestones incorporated; March 2026 snapshot retired.
- **Product catalog updated** (`pqc_product_catalog_04012026_r4.csv`): April 2026 catalog revision with enriched CISA category and quantum-tech annotations across the full 622-product dataset.
- **Enrichment merge improved**: Timeline enrichments now aggregate all historical enrichment files (not just the latest) so older entries are never silently dropped on subsequent runs. The shared `mergeEnrichmentFiles` utility is now used by both library and timeline enrichment loaders.

## [2.72.0] - 2026-04-01

### Added

- **Share links for library documents**: A share button in the library document detail modal copies a direct link — `/library?ref=<ID>` — to your clipboard. The browser URL also updates to include `?ref=` when the modal opens and clears when it closes, so the address bar is always shareable. Deep links open the modal automatically.
- **Share links for migrate products**: A share button appears in each expanded product row in the migration catalog table. Clicking it copies `/migrate?product=<name>::<category>&mode=table` to your clipboard. The URL updates to reflect the open row while browsing, and sharing the link re-opens the same row with the table view active and scrolled into view.
- **Share country timeline links**: A copy-link icon appears next to the country dropdown (desktop Gantt chart and mobile list) whenever a specific country is selected. Clicking it copies `/timeline?country=<Country>` to your clipboard — send it to a colleague to open the timeline pre-filtered to that country's roadmap.
- **Share buttons in all HSM Playground panels**: Every operational HSM panel (Hashing, Key Derivation, Key Agreement, Symmetric Crypto, Sign & Verify, Key Wrap) now has a share button in its header. Because the Playground already syncs `?tab=` and `?algo=` to the URL on every selection, sharing copies a fully-resolved deep link — e.g. `/playground?tab=hashing&algo=SHA3-256` — that lands a recipient directly on the right panel and algorithm.

## [2.71.0] - 2026-04-01

### Added

- **SLH-DSA context string support (FIPS 205 §9.2)**: The SLH-DSA sign and verify operations in the HSM Playground now accept an optional context string — a short byte sequence that is cryptographically bound to the signature. A signature produced with context "A" will not verify with context "B", giving you a built-in domain-separation primitive for multi-protocol deployments.
- **SLH-DSA deterministic signing (FIPS 205 §10)**: A new "Deterministic" option in the SLH-DSA panel forces the HSM to derive its randomness from the key itself (using PK.seed as opt_rand). Signing the same message twice with the same key produces identical signature bytes, making it easier to build reproducible test vectors and auditable log entries.
- **ACVP tests 21 & 22 — SLH-DSA context binding and deterministic mode**: The ACVP compliance test suite now covers the two new FIPS 205 capabilities. Test 21 verifies that context-bound signatures reject cross-context and no-context verification. Test 22 verifies that deterministic signing produces bit-identical signatures across two calls and that the result still verifies correctly. Both tests run on both the C++ and Rust engines in dual mode (44 total assertions).
- **Copy button on ACVP execution log**: A clipboard button in the ACVP log header lets you copy the full test output with one click — useful for attaching results to issue reports or compliance evidence packages.

### Fixed

- **SLH-DSA multi-message signing correctness**: The C++ HSM engine's message-API path (`C_MessageSignInit` / `C_SignMessage`) incorrectly lost session parameters (context string, deterministic flag) between the mandatory PKCS#11 size-query call and the actual signing call. Context binding and deterministic mode had no effect when using the message API. Parameters are now preserved across both steps.

## [2.70.1] - 2026-04-01

### Changed

- **Product catalog expanded to 622 entries**: 101 new products added in the latest audit pass. Validation coverage increased — 338 of 622 products are now independently confirmed as valid.

## [2.70.0] - 2026-04-01

### Added

- **Proof details popup**: Clicking "View Proof" on any product now opens a focused dialog showing the validation outcome, a written summary of findings, the publication date, and a link to the original source document. Works on both mobile and desktop.
- **Expanded validation status badges**: Products now show one of 8 color-coded status badges — Validated (green), FIPS Verified (green), Validated — No PQC (gray), Corrected (amber), Partially Validated (amber), Needs Review (amber), Not Validated (red), FIPS Issue (red).

### Changed

- **All 521 catalog entries now have validation results**: The full product catalog completed a validation pass. Results: 237 Validated, 171 Validated without PQC support, 81 Corrected, 9 Needs Review, 8 Not Validated, 7 Partially Validated, 5 FIPS Issues, 3 FIPS Verified.

## [2.69.2] - 2026-04-01

### Added

- **Visual infographics for all 49 learning modules**: Every module now has a dedicated NLLM-format infographic available in the Visual tab.
- **"Next Stack" navigation in Curious mode**: When you reach the last module in a track while browsing in Curious Explorer mode, a "Next Stack" button appears — clicking it automatically moves you to the next track so you can continue exploring without backtracking.

## [2.69.1] - 2026-04-01

### Fixed

- **Chatbot blank screen after API key error**: If you had previously connected the chatbot with a Gemini API key that was later rejected, sending a new message would silently clear your typed text and show a blank chat. Now shows a clear error message and restores your typed text so you can reconnect without losing your query.

## [2.69.0] - 2026-04-01

### Added

- **Source verification data in product catalog**: Each product now shows whether it has been independently verified, along with a link to the source document and a summary of what was confirmed.
- **Validation badges in product expanded view**: A color-coded badge (green/amber/red) appears next to the "Last Verified" date so you can assess product credibility at a glance.
- **AI assistant aware of validation results**: The chatbot can now reference a product's validation status and source proof when answering questions about specific tools.

## [2.68.0] - 2026-03-31

### Changed

- **Improved AI assistant navigation links**: Links returned by the chatbot now navigate more precisely — classical algorithm links open the Transition tab directly, compliance links open the Standards tab, and product links apply the correct infrastructure layer filter automatically.

## [2.67.1] - 2026-03-31

### Changed

- **Data quality improvements across multiple datasets**: Fixed broken source organization references in the library, product catalog, and timeline datasets. Added 12 new trusted organizations (200 total). Fixed 3 data integrity issues in the priority matrix.
- **New document enrichments**: 67 new library analysis entries (covering blockchain/DeFi protocols, NSA CNSA 2.0, Signal PQXDH, Apple PQ3, and more) and 10 new timeline entries (Bitcoin quantum testnet, Algorand PQC, OpenSSL 3.6.1, DoD PQC memorandum, and others). Library document coverage: 92% (386 of 419). Timeline coverage: 100% (213 of 213).

### Fixed

- **Data integrity**: Resolved all 8 outstanding data errors — all cross-references between datasets are now consistent.

## [2.67.0] - 2026-03-31

### Added

- **Certificate Transparency Log Simulator**: New interactive step in the Merkle Tree Certificates workshop — simulate a real CT log with ML-DSA-44 signing, append and look up certificates, generate consistency proofs, and detect certificate misissuance.
- **TLS 1.3 Simulator**: New Playground workshop tool — simulate a full TLS 1.3 handshake with configurable cipher suites and key exchange groups, including X25519, ML-KEM hybrid, and mutual TLS (mTLS). Supports PQC and hybrid certificates.
- **Algorithm comparison sub-tab deep links**: The Performance, Security, Key Sizes, and Use Cases sub-tabs in the Algorithms comparison view now remember your position in the URL, so sharing or navigating back restores the exact sub-tab you were viewing.
- **Compliance migrate-category filter**: A new filter in the Compliance view lets you jump directly to products in a specific category (e.g., Databases, Operating Systems) and see which migration catalog entries correspond.
- **Library taxonomy refresh**: The library sidebar now uses 6 more precise categories — Government & Policy, NIST Standards, International Frameworks, Migration Guidance, Algorithm Specifications, and Industry & Research — replacing the generic "General Recommendations" bucket.
- **Migration catalog "Work in Progress" notice**: An animated banner at the top of the Migrate view lets you know the catalog is actively being reviewed and updated.
- **HSM key inspection improvements**: Keys in the HSM Playground now show semantic purpose labels (Attestation, TLS, Key Encryption, Application, General) with per-purpose color coding.

### Changed

- **Firmware Signing Migrator rewritten**: The Secure Boot PQC workshop now supports RSA-2048/3072, ECDSA P-256/P-384, ML-DSA-44/65/87, and SLH-DSA-SHA2-128S with a 4-step guided wizard (algorithm selection → key generation → signing → verification).
- **Envelope Encryption Demo expanded**: The KMS-PQC workshop now includes RSA-2048 and RSA-4096 key encryption in addition to ML-KEM variants. The wrapping mechanism is now selectable.
- **PKCS#11 call log — expandable entries**: Log entries with inspect data now show an expandable row — click to decode mechanism IDs, attribute types, and return codes inline.

### Fixed

- **HSM attribute read errors resolved**: The key attribute inspector no longer tries to read attributes that don't apply to a given key type, eliminating spurious error messages in the PKCS#11 log.
- **Duplicate "Code Signing" tool removed from Playground**: The standalone tool was a duplicate of the Secure Boot PQC workshop — it has been removed from the registry; the workshop itself remains fully accessible.

## [2.66.0] - 2026-03-30

### Added

- **Evidence warnings on products**: Expanded product rows now display warning notices when a product's PQC claims have data quality issues — for example, a release date before the FIPS standards were finalized, or a FIPS certificate that only covers classical algorithms.
- **Verification status filter**: New filter in the Migrate view to show only Verified, Partially Verified, or Needs Verification products.
- **Evidence flags affect trust score**: Products with data quality warnings receive a lower composite trust score — reflected in the trust badge shown on each product card.

### Changed

- **415 products in catalog** (was 394): 21 new products added, including Cisco Catalyst Center, DigiCert ONE, and Fortinet FortiManager.
- **72 products independently verified**: Products were web-searched and cross-referenced against vendor sources, FIPS, and ACVP certifications.

### Fixed

- **21 products corrected to Unknown**: Products claiming PQC support without any verifiable proof or certification are now honestly marked Unknown.
- **4 products upgraded**: Fortinet FortiGate-Rugged, Zscaler ZTE, AppViewX CERT+, and Broadcom Avi all ship PQC — updated from Planned to Yes with supporting evidence.
- **Node.js corrected**: Was listed as awaiting PQC — actually has ML-KEM + ML-DSA since v24.7 via OpenSSL 3.5.
- **Cisco IOS XE corrected**: Was listed as "Yes (ML-KEM)" — native ML-KEM not yet shipped; corrected to Partial.
- **Algorithm names standardized**: CRYSTALS-Kyber updated to ML-KEM and CRYSTALS-Dilithium to ML-DSA throughout all product descriptions.
- **FIPS scope clarifications**: 14 products with classical-only FIPS certificates now note that PQC is not in scope.

## [2.65.3] - 2026-03-29

### Added

- **Envelope encryption via HKDF**: The KMS-PQC workshop now derives the wrapping key from the ML-KEM shared secret using a real HKDF step, rather than generating a fresh AES key.
- **SLH-DSA pre-hash mismatch warning**: The Playground now shows a warning when the pre-hash algorithm selected in the UI differs from the one used to sign.
- **PKCS#11 mechanism flag reference**: Step 8 of the PKCS#11 Walkthrough now explains all mechanism flags (SIGN, ENCAPSULATE, WRAP, etc.) with references to the PKCS#11 v3.2 specification.
- **KDF tool scenarios expanded**: The Key Derivation Function tool now illustrates KEM, pre-shared key, and password-based derivation scenarios side by side.
- **Trust score badges**: Trust score indicators added across the Library, Compliance, Threats, Timeline, Algorithms, Leaders, and Migrate views.
- **9 new achievements**: New milestones for completing 5, 10, and 25 modules; completing 3 tracks; scoring 100% on a quiz; exploring 3 or 10 Playground tools; and finishing the Business Center.
- **Curious learning path expanded**: 8 new modules and a new checkpoint added to the Curious Explorer path (estimated time increased from 280 to 680 minutes).

### Fixed

- **Hybrid KEM + ECDH key derivation error**: Fixed an issue where the ECDH-derived key was missing a required attribute, causing the HKDF combine step to fail in the Hybrid KEM workshop.
- **Google sign-in flow corrected**: Fixed an OAuth configuration issue that prevented the Google consent screen from loading correctly.

## [2.65.2] - 2026-03-29

### Fixed

- **FrodoKEM benchmark crash**: FrodoKEM-640 algorithm name resolved correctly — benchmark now runs without errors.
- **secp256k1 benchmark crash**: secp256k1 now runs using the Noble curves library (Web Crypto does not support it).
- **Ed448 and X448 benchmarks removed**: No portable browser engine supports these — removed from the benchmarkable set to avoid misleading errors.
- **Diffie-Hellman benchmark crash**: No browser handler exists for DH benchmarking — removed from the benchmarkable set.

## [2.65.1] - 2026-03-29

### Added

- **Google Drive CSRF protection**: The OAuth sign-in flow now includes a nonce parameter to prevent session impersonation attacks.

### Fixed

- **SoftHSM WASM import errors**: Fixed invalid TypeScript syntax across 8 internal WASM modules that caused build failures in strict mode.

## [2.65.0] - 2026-03-29

### Added

- **Business Center export improvements**: CRQC Scenario Planner, Supply Chain Risk Matrix, and Deployment Playbook now export full markdown reports with algorithm impact tables, compliance deadlines, and assessment context.
- **Audit Checklist expanded**: New Risk Assessment section (6 items) covering HNDL exposure, data classification, crypto risk registers, and threat modeling. All 30 checklist items now include descriptions and references to NIST, FIPS, ISO, and CISA standards. Export includes per-section maturity scoring (5 levels: Not Started → Optimized).
- **Deployment Playbook new sections**: Added Hybrid Mode Deployment (5 items: hybrid TLS config, backward compatibility, cert chain validation, performance benchmarking, interop testing) and Post-Deployment Validation (5 items).
- **RACI Builder multi-accountable warning**: A red warning now appears when more than one role is assigned as "Accountable" for the same activity.
- **Business Center keyboard navigation**: Full arrow-key navigation across Business Center tabs (ArrowLeft/Right to cycle, Home/End to jump to first/last).
- **Persona-aware Business Center**: All 14 Business Center tools now adapt content to your selected industry, geography, and regulatory context.

### Fixed

- **ROI Calculator unrealistic defaults**: The "Products to Migrate" slider was defaulting to the full catalog (~375 products) — now capped at 50, with the slider minimum lowered to 1.
- **CNSA 2.0 deadline labels corrected**: Fixed 2025 and 2027 milestone descriptions; added the missing 2035 full-enforcement milestone.
- **Roadmap Builder export**: Export now respects your selected deadline checkboxes rather than including all deadlines.

## [2.64.0] - 2026-03-29

### Added

- **Real X.509 certificates in Hybrid Cryptography module**: All 6 hybrid certificate formats (Composite, Alt-Sig/Catalyst, Related Certificates, Chameleon, Pure ML-DSA-65, Pure SLH-DSA-128s) now generate structurally correct, standards-compliant DER-encoded X.509 certificates — not simulations. Certificates are signed via the in-browser HSM using real PKCS#11 operations.

### Fixed

- **RFC 9763 Related Certificates OID corrected**: Fixed an OID typo (`.35` → `.36`) that was inconsistent with the actual RFC specification.

## [2.63.0] - 2026-03-29

### Added

- **Alt-Sig / Catalyst as a distinct certificate format**: The Hybrid Cryptography module now covers all 6 hybrid certificate approaches, with Alt-Sig (a classical certificate carrying a PQC key and signature in extensions) correctly distinguished from Related Certificates (two separately paired certs). Previously these were conflated.
- **SLH-DSA learn card**: The learn section now shows all 6 certificate formats across two groups — PQC-only (ML-DSA, SLH-DSA, Composite) and hybrid-with-classical-fallback (Alt-Sig, Related Certs, Chameleon).
- **SLH-DSA IETF reference certificate**: A real 8,241-byte SLH-DSA-SHA2-128s certificate from RFC 9909 is now included as a test vector in the Certificate Inspector.

### Fixed

- **Alt-Sig factual error corrected**: The IETF test vector for Alt-Sig was incorrectly labeled as Related Certificates in the inspector. The NSA Catalyst approach is Alt-Sig, not RFC 9763 — the glossary and test vectors now reflect this correctly.
- **Certificate format count inconsistency**: Removed all hardcoded counts ("Three", "Four", "Five") that were inconsistent across the module — there are 6 distinct formats. Headings no longer include numbers to prevent future drift.

## [2.59.0] - 2026-03-28

### Added

- **Bookmarks**: Save Library documents and Migrate products for quick access. Bookmarks are accessible from a new Bookmarks tab in the right panel and can be exported as JSON or CSV.
- **Product comparison panel**: Compare up to 3 products side-by-side in the Migrate catalog. Click the scale icon on any product to add it to the comparison queue; a sticky bar at the bottom shows your queue and opens an inline comparison table.
- **Breadcrumb navigation**: A breadcrumb trail now appears above page content for nested routes (e.g., inside a learning module), making it easy to navigate back.
- **Mobile Playground**: The Playground is now fully interactive on mobile — ML-KEM encapsulation/decapsulation and ML-DSA signing/verification are available on small screens with real WASM-powered operations.
- **Automated content integrity checks in CI**: Every deployment now runs a content quality gate that checks for accuracy issues and graph consistency errors before going live.

### Changed

- **Page descriptions visible on more screen sizes**: Page subtitles now appear at the medium breakpoint instead of only on large screens.

## [2.58.0] - 2026-03-28

### Fixed

- **Compliance framework website links corrected**: Fixed broken or unstable URLs for DORA, ENISA, and Bank of Israel records.

## [2.57.0] - 2026-03-27

### Added

- **Migrate view URL sync**: All active filters in the Migrate view — search, industry, migration step, and infrastructure layer — are now reflected in the URL. You can share a filtered view or bookmark it and return to the same state.

### Changed

- **Comprehensive mobile layout improvements (70+ components)**: Fixed multi-column grid layouts that were too cramped on small screens across the Learning workshops, About page, Algorithm Comparison, Assessment wizard, and OpenSSL Studio.

## [2.56.0] - 2026-03-27

### Added

- **Google Drive cloud backup**: Optionally back up and restore your learning progress, bookmarks, and settings to your personal Google Drive. Data is stored privately in a hidden app folder — not visible in your Drive file list. Access tokens are stored in browser memory only and never sent to any server. You can revoke access at any time.
- **Cloud sync privacy details on About page**: A dedicated panel explains exactly what data is synced, what is excluded (API keys), and how to disconnect.

### Changed

- **Navigation scrollbar restored**: A CSS regression introduced in v2.55.0 was hiding the navigation scrollbar, making right-side nav icons inaccessible on smaller screens. Fixed.

## [2.55.0] - 2026-03-24

### Added

- **Algorithm comparison — security level and key size badges**: The PQC column in the comparison table now shows the security level (e.g., L3) and public key size (e.g., 1184 bytes) for each algorithm, replacing the generic "Find tools" link.
- **Mobile algorithm cards — function type and key size chips**: Algorithm cards on mobile now show the function type and key size as compact chips below the algorithm name.
- **OpenSSL Studio collapsible workbench**: The command builder panel in OpenSSL Studio can now be collapsed on mobile to free up screen space.

### Changed

- **Navigation header — text-only branding**: The logo image has been removed from the nav header; the "PQC Today" text gradient is now the sole identifier.

## [2.54.0] - 2026-03-24

### Added

- **Curious Explorer persona content**: Every learning module now has a dedicated "Curious" summary written in plain language (~8th grade reading level) with real-world analogies, plus a matching infographic in the Curious Explorer style. All 50 modules covered.
- **Curious context banners**: The Compliance and Leaders pages now include a brief plain-language explanation of what you're looking at when Curious Explorer mode is active.
- **Key size display in Playground**: The Key Store and HSM Key Registry now show a Size column. The header shows total key count and combined byte size.
- **Mobile compliance improvements**: Certificate type filter pills and "Load more" pagination now work on mobile.
- **Mobile migration phase selector**: A dropdown for selecting migration phases is now available on mobile, replacing the desktop step rail that was hidden on small screens.
- **Page header actions menu on mobile**: A three-dot menu on mobile consolidates the Sources, Share, Glossary, Export, and AI Assistant buttons into a single tap.

### Changed

- **Curious Explorer auto-completes onboarding**: Selecting Curious Explorer in the persona picker now skips the Region and Industry steps automatically.
- **Playground simplified for Curious and Executive personas**: The PKCS#11 mode selector and ACVP tab are hidden for non-technical personas. Auto-resets if you switch to a simplified persona while in advanced mode.

## [2.53.0] - 2026-03-24

### Changed

- **Faster app updates**: The app now checks for new deployments every 15 minutes (was 60 minutes). You will see fresh content sooner when a new version is released.

## [2.52.0] - 2026-03-24

### Fixed

- **App stayed on old version after deployment**: Especially on iOS Safari, the app could remain on a cached version for hours after a new release. Now the app reloads automatically when a new version is detected — within ~1 hour on desktop, or on next foreground return on mobile.

## [2.51.0] - 2026-03-24

### Fixed

- **HSM product PQC algorithm details corrected**: Standardized algorithm names across all HSM product entries (Thales Luna HSM, Utimaco SecurityServer, Marvell LiquidSecurity 2, Futurex CryptoHub, AWS CloudHSM, Google Cloud HSM, Crypto4A QxHSM). Removed embedded FIPS numbers from algorithm name strings for consistency. Clarified that AWS CloudHSM hardware does not support ML-KEM (only ML-DSA in preview).

## [2.50.0] - 2026-03-24

### Fixed

- **Entrust nShield PQC support details corrected**: Updated the product entry to list specific algorithm support (ML-KEM 512/768/1024, ML-DSA 44/65/87, SLH-DSA all 12 parameter sets, LMS/XMSS) rather than the generic "Hybrid PQC" description.

## [2.49.0] - 2026-03-23

### Changed

- **Trail of Bits ml-dsa added to catalog**: New side-channel resistant ML-DSA library in Go added under Cryptographic Libraries. Supports all three ML-DSA parameter sets, designed for constant-time execution, and has passed 51 conformance tests.

## [2.48.0] - 2026-03-23

### Added

- **ACVP Testing expanded**: The HSM ACVP Testing tab now includes an Ed25519 signature verification test and full-coverage functional tests for all 12 SLH-DSA parameter sets.
- **Standard reference links in ACVP results**: Each test result now links to the canonical NIST or IETF standard for the tested algorithm.
- **Crucible conformance harness added to PQC Testing module**: The PQC Testing & Validation learning module now covers Crucible — a language-agnostic test harness with 78 ML-KEM and 51 ML-DSA targeted conformance tests.

### Changed

- **HSM vendor accuracy update**: Verified and updated production data for all 6 HSM vendors — Thales Luna 7, Entrust nShield 5, Utimaco Quantum Protect, AWS CloudHSM, Azure Dedicated HSM, and Crypto4A QxHSM. Key updates: Azure Dedicated HSM now in production (no new customers after Aug 2025); Utimaco CAVP certificates added; AWS CloudHSM ML-KEM clarification.

## [2.47.0] - 2026-03-23

### Fixed

- **HKDF mechanism constants corrected**: Fixed incorrect constant values for HKDF derive operations that could cause failures when running against a compliant PKCS#11 token.

## [2.46.0] - 2026-03-22

### Added

- **Key Check Values (KCV) for all key types**: The HSM Key Store now shows a 3-byte hex fingerprint for every key (ML-KEM, ML-DSA, SLH-DSA, RSA, ECDSA, EdDSA) — useful for verifying key identity without exposing the key material.
- **ACVP multi-algorithm test suite**: The HSM ACVP Testing tab now validates AES-GCM-256, HMAC-SHA-256, RSA-PSS-2048, ECDSA P-256, and ML-KEM-768 alongside ML-DSA — all running in parallel against both C++ and Rust engines in Dual Mode.
- **Visual tab for all 48 learning modules**: Every module now has a Visual tab showing its infographic and "In Simple Terms" summary, accessible at all experience levels without switching to Curious mode.
- **WIP badge with community feedback**: Modules currently under peer review show a pulsing "WIP" chip. Clicking it opens a review-status panel with automated cross-check results, editorial progress, and peer-review status — with Endorse/Flag buttons and a link to GitHub Discussions.
- **Enrichment previews in Timeline**: Gantt phase popovers now show a compact analysis preview (mandate level, migration urgency, sector tags). Timeline document popovers show a full 8-dimension analysis and a cross-link to the Library when the source matches a library record.
- **PQC Testing & Validation learning module**: New advanced module (120 min) covering passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, side-channel assessment, and NIST ACVP validation.
- **"What's New" modal**: A persona-aware modal auto-opens on your first visit after a new release, highlighting the updates and data changes most relevant to your role and industry.
- **Terms of Service page** (`/terms`): 11-section legal page covering licensing, educational crypto disclaimers, export compliance, acceptable use, privacy, and warranty.
- **Curious Explorer glossary**: 24 plain-language definitions with interactive inline tooltips for the Curious Explorer persona.

### Changed

- **"In Simple Terms" summaries rewritten across all 48 modules**: All plain-language summaries were rewritten at an ~8th-grade reading level with a consistent structure (what it is, why it matters, what you'll learn) and real-world analogies. Previous summaries contained inaccuracies and inconsistent depth.
- **Module infographics standardized to 640×640**: All module infographics replaced with new single-panel square designs.
- **Tools & Products tab sources from live catalog**: The Tools tab in each learning module now pulls directly from the current product catalog, filtered by module relevance, with PQC support badge, FIPS badge, and a deep-link to the full catalog entry.

### Fixed

- **Library "Relevant Features" links broken**: Fixed two bugs that caused enrichment feature links to be broken or missing — case-sensitivity in lookups and incorrect list separator handling are now both corrected.
- **Snapshot backup/restore data loss**: 14 settings fields were silently dropped when exporting and re-importing a snapshot. Assessment wizard flags, persona settings, migrate preferences, and chat settings now all round-trip correctly.

## [2.45.2] - 2026-03-13

### Changed

- **Library document popover — mobile sheet layout**: On small screens the document detail popover now slides up as a bottom sheet with a drag handle and scrollable content, replacing the cramped centered dialog.
- **Endorse and Flag buttons visible on mobile**: The Endorse and Flag buttons on Library, Threats, Leaders, and Timeline pages were only visible on large screens. Now also shown on mobile, directly below the page description.
- **Airplane Mode in mobile nav**: The Airplane Mode toggle is now accessible from the mobile More menu, showing current On/Off state.

## [2.45.1] - 2026-03-14

### Added

- **Stateful Endorse/Flag with discussion links**: Endorsing or flagging a resource now saves your action locally and opens a pre-filled GitHub Discussion form. Re-clicking an activated button opens a search for the discussion you created previously, so you can follow up.

### Fixed

- **Flag button missing from several views**: The Flag button was absent from Timeline document cards, the Gantt country row, the page header for Threats/Leaders/Timeline pages, and the learning module navigation bar. Added consistently across all affected locations.

## [2.45.0] - 2026-03-13

### Added

- **Flag issue button**: A new Flag button (red flag icon) appears across Library, Threats, Leaders, and Learning views. Clicking it opens a pre-filled GitHub Discussion to report inaccuracies, broken links, or outdated content.
