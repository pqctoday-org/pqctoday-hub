# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

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
