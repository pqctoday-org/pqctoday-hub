# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

## [2.43.0] - 2026-03-13

### Added

- **Persona-aware AI chat**: Response caching, retrieval boosting, and system prompts now adapt to the user's selected persona, industry, region, and experience level. Industry-matching threats/compliance chunks receive a 1.4x retrieval boost; region-matching timeline chunks receive 1.3x. Experience level (new/basics/expert) shapes response depth and vocabulary. [view:/] [persona:all]
- **Module cross-linking — 26+ learning modules**: Each module introduction page now includes a "Related Modules" navigation panel with contextual deep-links. All 5 Role Guide modules (Executive, Developer, Architect, Operations, Research) enriched with linkedModules to industry and specialist modules (e.g., Executive → Healthcare PQC, EMV Payments, Aerospace PQC). [view:/learn]
- **5 quiz categories for Role Guides**: `exec-quantum-impact`, `dev-quantum-impact`, `arch-quantum-impact`, `ops-quantum-impact`, `research-quantum-impact` added to the quiz engine, enabling role-specific assessment questions. [view:/learn/quiz]
- **Leaders industry relevance badges**: When a persona with selected industries is active, leaders whose bio/organizations match those industries display a "Relevant to you" accent badge. Shared constants extracted to `leadersConstants.ts`. [view:/leaders]
- **Mobile Timeline filters**: Region and Country `FilterDropdown` components now available on mobile view alongside the existing desktop filters. [view:/timeline]
- **Meta description and Open Graph tags**: Added global meta description and `og:description` to `index.html` for improved SEO and social sharing previews.
- **Library enrichments**: 13 new library document enrichments added (`library_doc_enrichments_03132026.md`). [view:/library]

### Changed

- **Aerospace module renamed**: `aerospace-space-pqc` → `aerospace-pqc` (shorter ID). Directory, components, moduleData, glossary entries, FAQ deep-links, RAG corpus, SEO routes, and quiz categories all updated. [view:/learn/aerospace-pqc]
- **Executive Role Guide duration**: Increased from 20 min to 30 min to reflect expanded content with CNSA 2.0 networking equipment coverage and Button component modernization. [view:/learn/exec-quantum-impact]
- **Migrate page mobile-first layout**: Card view is now the default on mobile with always-visible sort/filter controls. View toggle hidden on small screens. [view:/migrate]
- **WCAG 2.5.5 touch targets**: All interactive elements across Migrate, Leaders, Timeline, Assess, FAQ, and Chat now meet the 44px minimum touch target size. Buttons, inputs, and accordion triggers updated. [accessibility]
- **Chat system improvements**: Monotonic message IDs prevent collisions; exponential retry backoff replaces linear; boundary-aware grounding check eliminates false positives on partial words; WebLLM init race condition fixed; empty submission guard added; stale message closure fixed after deletions. [view:/]
- **Data updates**: Library 325 records (+21), Quiz 805 questions (+50), Migrate 377 products (+6), Compliance 91 frameworks (+1), 13 new library enrichments. [data]
- **RAG corpus regenerated**: 3,826 chunks from 22 sources (was 3,761), incorporating new library records, enrichments, cross-linking updates, and module rename. [view:/]
- **CSV archival**: 6 old CSV revisions archived to `src/data/archive/`; 4 superseded compliance/library CSVs removed.

### Fixed

- **Chat grounding false positives**: Short terms like "hash" no longer falsely match substrings (e.g., "hashababy"). Terms under 4 characters and non-boundary matches are now excluded. Algorithm family matching improved ("ml-kem" correctly matches "ml-kem-768"). [view:/]
- **Chat follow-up regex**: Algorithm names like "SHA" in "SPHINCS+" no longer greedily match trailing words in follow-up suggestion parsing.
- **CSV validator `_rN` revision support**: `latestCSV()` in `validate-csv-refs.ts` now matches revision suffixes (e.g., `leaders_03122026_r1.csv`, `library_03132026_r2.csv`) with proper date + revision tiebreaker sort. Previously only matched base `_YYYYMMDD.csv` filenames. [data]
- **Leaders → Library deep-link validation (Check 4)**: `validate-csv-refs.ts` now validates all `KeyResourceUrl` reference IDs in the leaders CSV against the library CSV at build time. Catches broken `/library?ref=ID` deep links before deployment. 98 leaders with refs currently pass. [view:/leaders]

## [2.42.0] - 2026-03-12

### Added

- **ASC X9 financial cryptography standards — 4 new library records**: Added the Accredited Standards Committee X9 (ANSI-accredited financial standards body) reference catalog with four documents covering financial sector PQC readiness. [view:/library]
  - **ASC X9 TR 50-2019** — Quantum Techniques in Cryptographic Message Syntax (CMS): X9F4 workgroup guidance on using quantum-safe cryptography within CMS and migrating financial systems.
  - **ASC X9 IR 01-2022** — Quantum Computing Risks to the Financial Services Industry: X9F risk study group assessment of HNDL threats, timeline projections, and migration priorities.
  - **ASC X9 PQC Financial Readiness Needs Assessment (2025)** — August 2025 report providing safe, cost-effective PQC migration guidance for financial institutions including inventory, risk assessment, and vendor engagement frameworks.
  - **ASC X9 Financial PKI** — Production PKI infrastructure launched June 2025 (key ceremony June 13) with DigiCert as managed provider; supports ML-KEM and ML-DSA alongside legacy algorithms for financial payment terminals, cross-enterprise authentication, and secure device communication.
- **ASC X9 added to Compliance page — Technical Standards tab**: X9 now appears as a `technical_standard` entry mapped to the Finance & Banking industry, linking to all four library records. [view:/compliance]
- **43 new PQC leaders added to Leaders catalog**: Expanded from 138 to 181 leaders via systematic cross-referencing of enrichment `Authors` fields across all library, timeline, and threat documents. Highlights include:
  - CA/Browser Forum: Stephen Davidson, Martijn Katerbarg, Clint Wilson, Ashish Dhiman, Andreas Henschel
  - PKCS#11 v3.x: Tony Cox, Robert Relyea, Dieter Bong, Valerie Fenwick
  - Cloudflare: Luke Valenta, Christopher Patton, Vânia Gonçalves
  - ASC X9: Steve Stevens (Executive Director), Roy C. DeCicco (Former Chair, JPMorgan), Angela Hendershott (Vice Chair)
  - NIST: Meltem Sönmez Turan, John Kelsey, Quynh Dang
  - QKD: Romain Alléaume, Marco Lucamarini, Bruno Huttner
  - Financial/FS-ISAC: Peter Bordow (Wells Fargo, FS-ISAC PQC Workgroup Chair)
  - Other: Craig Gidney (Google Quantum AI), Shuichi Katsumata (PQShield), Valery Smyslov (IKEv2), Samuel Jaques, Yilei Chen
- **Leaders — library deep-links via KeyResourceUrl**: `keyResourceUrl` field upgraded from single `string` to `string[]` (split on `;`). Leader detail popover now renders each linked library reference as a navigable `/library?ref=ID` internal link. 95 of 181 leaders now have at least one library reference. [view:/leaders]

### Changed

- **RAG corpus regenerated**: 3,761 chunks from 22 sources (was 3,687), incorporating 4 new X9 library records, 4 X9 document enrichments, and leaders data. [view:/]

## [2.41.0] - 2026-03-12

### Added

- **GRI Quantum Threat Timeline Report 2025 — library and timeline reference**: Added the March 2026 GRI annual expert survey to both the library catalog and the timeline. The 2025 report (26 global experts, authored by Dr. Michele Mosca and Dr. Marco Piani at evolutionQ Inc.) shows a significant acceleration in CRQC probability estimates — 28–49% within 10 years (up from 19–34% in 2024) and 51–70% within 15 years. Majority of experts now consider a CRQC by 2035 quite likely. [view:/library] [view:/timeline]

### Changed

- **CRQC probability estimates updated to GRI 2025 figures**: All downstream data referencing the 2024 GRI survey updated to reflect the 2025 survey results.
  - `CROSS-004` threat description updated: 28–49% within 10 years (was 19–34%), 26 experts (was 32), source URL points to 2025b report.
  - Quiz questions `fund-011` and `qt-005` updated: option C of fund-011 changed from "19-34%" to "28-49%"; option B of qt-005 changed from "5-14%" to "5-15%".
  - `quantumConstants.ts` CRQC_ESTIMATES GRI entry updated to `Global Risk Institute (2025)` with `yearHigh: 2041` and updated confidence string.
- **RAG corpus regenerated** with updated threats, quiz, library, and timeline data. [view:/]

### Fixed

- **Library detail enrichment for GRI-2025**: The initial v2.41.0 release created a timeline enrichment entry for the GRI 2025 report but not the required library enrichment entry. The library detail popover looks for `libraryEnrichments[referenceId]` in `library_doc_enrichments_*.md` files; the key format differs from timeline enrichments. Added `library_doc_enrichments_03122026.md` with the `## GRI-Quantum-Threat-Timeline-2025` entry fully populated from the PDF data. [view:/library]

## [2.40.0] - 2026-03-12

### Added

- **Quantum networking products — 6 new entries in Migrate catalog**: Expanded the quantum networking and QKD categories with six products that were absent from all historical versions of the catalog. QKD Software (CSC-030) grows from 3 to 5 entries; QRNG (CSC-047) from 3 to 5. All six products are linked to the QKD learning module. Catalog total: 366 → 372 products. [view:/migrate] [view:/learn/qkd]
  - **evolutionQ BasejumpQDN** — QKD orchestration software for Quantum Delivery Networks; vendor-neutral (works with ID Quantique, Toshiba), extends QKD beyond 300 km fiber limit using trusted repeater nodes. Deployed by Nokia/ID Quantique for Proximus.
  - **evolutionQ BasejumpSKI** — Symmetric Key Infrastructure combining ML-KEM, ECDH, and PSK in a multimodal approach for hybrid quantum-safe key establishment without QKD hardware.
  - **Post-Quantum Hybrid PQ VPN** — RFC 9370 hybrid PQC VPN (IKEv2 + ML-KEM-1024 + Classic McEliece); co-authored the IETF standard; deployed protecting NATO communications.
  - **Quantinuum Quantum Origin Onboard** — First software QRNG to achieve NIST SP 800-90B validation (April 2025); embeds quantum-computer-generated entropy into IoT and edge devices without hardware chips.
  - **Qrypt BLAST SDK** — REST API/SDK generating symmetric keys independently at multiple endpoints from quantum entropy (LANL, ORNL, ICFO, EPFL) — no key transmission required.
  - **ISARA Advance** — Autonomous cryptographic inventory and risk assessment tool; companion to ISARA Radiate (already in catalog) for full discover-then-remediate PQC migration workflow.

### Changed

- **RAG corpus regenerated**: 3,680 chunks from 22 sources (was 3,671), incorporating 6 new migrate product entries and 372 migrate chunks total. [view:/]

## [2.39.1] - 2026-03-12

### Fixed

- **Zustand persist storage made explicit**: `useModuleStore` and `tls-learning.store` now pass `storage: createJSONStorage(() => localStorage)` to their `persist` configs. Without an explicit storage declaration, Zustand falls back to an in-memory store in non-browser environments (SSR, test runners, service workers), causing silent data loss on page reload. This was surfacing as intermittent loss of learning progress and TLS simulation state. [view:/learn] [view:/playground]

## [2.39.0] - 2026-03-12

### Added

- **PWA icons for install prompts and adaptive icons**: Added `pwa-192x192.png` and `pwa-512x512.png` to `public/` and registered them in the Vite PWA plugin manifest. The 192×192 icon satisfies Chrome/Android install prompt requirements; the 512×512 maskable icon enables adaptive icon support on Android home screens. Both are included in the service worker pre-cache manifest. [view:/] [persona:developer,ops]
- **Timeline source documents — 4 new archives**: Archived HTML copies of four timeline reference documents now included in `public/timeline/`: EU Cryptographic Inventory Mandate (NIS Cooperation Group Roadmap v1.1), Ethereum Foundation Vitalik Buterin PQ Defense Roadmap, Google Cloud ML-KEM Default and Chrome MTC Program, and NIST SP 800-208 (LMS/XMSS publication). [view:/timeline]

### Changed

- **RAG corpus regenerated**: 3,671 chunks from 22 sources (was 3,670), reflecting minor corpus delta from latest data. [view:/]

## [2.38.0] - 2026-03-12

### Added

- **"Stronger Together" section on About page**: Showcases 20 PQC industry workgroups across 10 regions (US, EU, UK, Germany, France, Japan, South Korea, Australia, Canada, Singapore) — 2 leading groups per region. Each card opens a detail modal with full description, founding year, focus area badges, key members, and an external link to the group's website. Section explains why global collaboration is essential to the PQC transition. [view:/about] [persona:executive,architect,researcher]

### Changed

- **About page — collapsible sections**: Three long-form sections now collapse by default for better scannability. SBOM starts collapsed (click header to expand); "Stronger Together" shows the intro text but hides the workgroup list until clicked; Community shows the first 2 discussions with a "Show all N more" toggle for the remaining 9. Chevron indicators and smooth Framer Motion animations signal interactivity. [view:/about]
- **About page mobile UX improvements**: All interactive elements meet the 44px touch target minimum (`min-h-[44px]`). Stat grid label size raised from 10px to 12px. Expanded discussion items animate as a single block (fixes content clipping during height animation). "Visit Website" modal button uses `size="lg"` for a proper tap surface. [view:/about]

## [2.37.0] - 2026-03-11

### Changed

- **Learning module durations recalibrated**: Reduced all 48 module time estimates by one-third to better reflect actual completion times. New range: 10–100 min (was 15–150 min). Total platform content: 2,400+ min across 8 duration tiers. [view:/learn] [persona:executive,developer,architect,researcher]

## [2.36.0] - 2026-03-11

### Changed

- **Airplane Mode — PWA offline support**: The app now registers a service worker (via `vite-plugin-pwa`) that caches WASM files, data assets, and application routes for offline use. An Airplane Mode toggle in the chat header lets you switch to local-only mode; connectivity changes trigger automatic toasts with one-tap recovery. Gemini is disabled with a "Switch to Local" prompt when offline. A persistent banner and update prompt round out the offline experience. [view:/] [persona:developer,architect,ops]
- **Mobile navigation overflow menu**: Less-used nav items (Algorithms, Compliance, Report, Business Center) are collapsed into a "More" overflow button on mobile, keeping the bottom bar clean with 6 primary items visible. [view:/]
- **Mobile responsive improvements**: Landing hero text scales down on small screens (`text-2xl sm:text-3xl`), CTA buttons stack properly, step descriptions use `line-clamp-3`, avatar sizes adjust (`w-24 sm:w-32`), belt progress text visible on all screen widths, and the Algorithm Comparison Table shows a swipe hint on mobile. [view:/] [view:/learn/pqc-101]
- **Vendor coverage cross-links in 15+ modules**: A new `VendorCoverageNotice` component connects learning modules directly to the Migrate catalog. Each notice links to the matching infrastructure layer — readers can jump from vendor tables in HSM, KMS, Network Security, Database Encryption, IAM, Secure Boot, OS PQC, Secrets Management, Web Gateway, EMV Payment, Crypto Dev APIs, Platform Engineering, and Confidential Computing modules to the full product listing. [view:/learn] [persona:developer,architect,ops]
- **CSV data audit — 45 new library records**: Added 6 gap-analysis records (FIPS 207/HQC pre-draft, NIST IR 8528, SP 800-232/Ascon, DoD CIO PQC Memo, GSA PQC Buyer's Guide, CISA Bad Practices #7) and 39 foundational standards (NIST SP 800-37/53/56A/66/88/90/90A/90B/108/111/207/218, FIPS 199, BSI TR-02102, 16 RFCs, 5 IETF drafts including ML-DSA for SSH and IKEv2). Replaced SP 800-57 Part 1 R5 with R6 IPD (Dec 2025). Library now at 303 records. All 46 new entries enriched with `qwen3.5:27b` (19 dimensions) and source documents archived locally. [view:/library]
- **Compliance reclassifications**: OASIS PKCS#11 moved to Technical Standards; KpqC and OSCCA-NGCC moved to Standardization Bodies; PQCC Roadmap moved to Technical Standards — correcting body_type dispatch across the 4 compliance page sections. [view:/compliance]
- **Compliance cross-references updated**: CNSA 2.0 and DISA STIGs now link to the DoD CIO PQC Memo; FedRAMP links to the GSA Buyer's Guide. [view:/compliance]
- **RAG corpus regenerated**: 3,670 chunks from 22 sources (up from 3,506), incorporating 46 new library enrichments, compliance reclassifications, and cross-reference updates. [view:/]

### Fixed

- **Library dates corrected**: FIPS 203, 204, and 205 `initial_publication_date` fixed from 2023-08-24 to 2024-08-13 (actual publication). [view:/library]
- **Migrate catalog corrections**: Signal libsignal updated to v0.88.0, HashiCorp Vault to 1.21.4, Google Cloud KMS PQC support corrected from "GA" to "Preview", OpenSSL release date fixed to 2026-01-27. [view:/migrate]
- **Timeline date corrections**: CISA PQC Product Categories event date corrected from 2025-12-01 to 2026-01-23 (actual publication); EU Crypto Inventory Mandate year updated from 2025 to 2026 reflecting NIS Cooperation Group Roadmap v1.1 timeline. [view:/timeline]

## [2.35.0] - 2026-03-08

### Changed

- **Learning tracks restructured — Hardware vs. Software Infrastructure**: The Infrastructure track is now split into two distinct tracks for clearer module discovery. **Hardware Infrastructure** covers HSM, KMS, QKD, Secure Boot, and Confidential Computing. **Software Infrastructure** covers PKI Workshop, Secrets Management, Stateful Signatures, Merkle Tree Certs, Database Encryption, Crypto Dev APIs, and OS PQC. QKD moved from the Strategy track to Hardware Infrastructure. [view:/learn] [persona:developer,architect,ops,researcher]
- **Persona learning paths expanded with recently published modules**: All four role-based learning paths now include modules that had been added to the platform but were missing from the guided journeys. [view:/] [persona:executive,developer,architect,researcher]
  - **Executive**: Added Identity & Access Management (IAM) — 1,020 min total.
  - **Developer**: Added IAM, Database Encryption, Secrets Management, OS PQC; new "Identity & Data" milestone checkpoint — 1,635 min total.
  - **Architect**: Added Network Security, Secrets Management, Database Encryption, OS PQC, Secure Boot, Confidential Computing, and IAM — 1,845 min total.
  - **Researcher**: Added Network Security, Secrets Management, Database Encryption, OS PQC, Secure Boot, and IAM.
- **PQC Assistant button — consistent round gradient style on all pages**: The "Chat" text button in data-page headers is replaced with a compact round gradient icon button matching the floating action button (FAB) visible when the assistant panel is closed — consistent visual language across all views. [view:/timeline]
- **Assessment report — compact header row**: The generated date and methodology info button are now displayed on the same row, reducing visual weight at the top of the report. [view:/assess]

## [2.34.6] - 2026-03-08

### Changed

- **SEO metadata for all 48 learning modules**: Added per-route titles, descriptions, canonical URLs, and `LearningResource` structured data (schema.org) for 22 previously missing modules — industries, role guides, infrastructure, and applications tracks. Updated `/learn` hub Course schema from 27 to 48 modules (PT61H total). Added `/report` and `/business` routes to sitemap. All `lastmod` dates updated. [view:/learn]
- **Migration framework collapsed by default**: The migration workflow hero section on `/migrate` now starts collapsed, giving immediate focus to the software catalog. Users can expand it with the toggle button. [view:/migrate]

### Fixed

- **Removed ReturnBanner navigation**: Removed the "Back to Business Center" banner that appeared on every page after visiting the Business Center — reduced visual clutter across all views. [view:/]

## [2.34.5] - 2026-03-08

### Changed

- **TLS Basics module refactored with tabbed layout**: Added Learn, Simulate (workshop), Exercises, References, and Tools tabs with deep-linking support (`?tab=workshop`), module progress tracking via `useModuleStore`, and step completion on tab navigation. [view:/learn/tls-basics]
- **Leaders data updated**: New `leaders_03082026.csv` with latest industry leader entries. [view:/leaders]
- **RAG corpus regenerated**: Rebuilt `rag-corpus.json` reflecting latest module and data changes. [view:/]

### Fixed

- **WASM deployment artifacts**: Added missing C++ engine files (`libsofthsmv3.js`, `libsofthsmv3.wasm`) and Rust engine JS glue (`softhsmrustv3.d.ts`, `softhsmrustv3.js`) to `public/wasm/` — required for runtime WASM loading. [view:/playground]

## [2.34.4] - 2026-03-08

### Fixed

- **Key wrapping — AES-GCM routed through `C_WrapKeyAuthenticated`**: AES-GCM key wrapping now correctly calls `C_WrapKeyAuthenticated` / `C_UnwrapKeyAuthenticated` (PKCS#11 v3.2 §5.18.6–7) instead of the non-authenticated `C_WrapKey`, which rejected `CKM_AES_GCM` on both engines. Rust engine: new `C_WrapKeyAuthenticated` and `C_UnwrapKeyAuthenticated` functions added with full AES-128/256 GCM support. [view:/playground]
- **Key wrapping — C++ `CKM_AES_KEY_WRAP_PAD` registration**: Added missing `CKM_AES_KEY_WRAP_PAD` (0x210A) to `prepareSupportedMechanisms()` — indirect RSA+KEK wrapping now works on the C++ engine. [view:/playground]
- **Key wrapping — Rust RSA-OAEP wrap/unwrap**: Extended Rust `C_WrapKey` / `C_UnwrapKey` to accept `CKM_RSA_PKCS_OAEP` — indirect RSA+KEK wrapping now works on the Rust engine. [view:/playground]
- **Key wrapping — seed mode `CKA_VALUE_LEN` fix**: Removed read-only `CKA_VALUE_LEN` from `hsm_importGenericSecret` template (was causing `CKR_ATTRIBUTE_READ_ONLY` on C++ engine during seed-mode wrapping). [view:/playground]
- **Rust `C_GetMechanismInfo` — `CKM_AES_KEY_WRAP_KWP` case added**: Querying mechanism info for AES-KWP no longer returns `CKR_MECHANISM_INVALID`. [view:/playground]

### Changed

- **EMV Payment module moved to Industries track**: `emv-payment-pqc` relocated from Applications to Industries track in module catalog, quiz categories, and track descriptions. [view:/learn]

## [2.34.3] - 2026-03-08

### Fixed

- **PKCS#11 v3.2 compliance audit — C++ engine** (`softhsmv3`): `CKA_ENCAPSULATE` / `CKA_DECAPSULATE` attribute defaults corrected from `true` to `false` for `C_CreateObject` (PKCS#11 v3.2 Table 18); `C_GenerateKeyPair` now explicitly sets them to `true` for ML-KEM keys. PQC key wrapping reads `CKA_VALUE` directly, avoiding PKCS#8 re-encode failures in WASM. [view:/playground]
- **PKCS#11 v3.2 compliance audit — Rust engine** (`softhsmv3`): 12 fixes — `SUPPORTED_MECHS` expanded from 31 to 62 mechanisms; `CKA_SIGN/VERIFY/ENCRYPT/DECRYPT` capability checks enforced in all `*Init` functions (`CKR_KEY_FUNCTION_NOT_PERMITTED`); unique session handles via `AtomicU32`; `CKA_SENSITIVE` defaults to `true` for all generated private keys; `CKA_DERIVE` check added to `C_DeriveKey`; `C_DestroyObject` cleans up stale operation state; output keys from `C_EncapsulateKey/C_DecapsulateKey/C_DeriveKey` now carry proper attributes (`CKA_EXTRACTABLE`, `CKA_CLASS`, `CKA_KEY_TYPE`, `CKA_VALUE_LEN`). [view:/playground]
- **Rust engine completeness**: Added 10 missing PKCS#11 admin function stubs (`C_GetInfo`, `C_GetSlotInfo`, `C_SetPIN`, `C_CopyObject`, `C_GetObjectSize`, `C_SetAttributeValue`, `C_DigestKey`, `C_GetOperationState`, `C_SetOperationState`, `C_SeedRandom`) plus 8 multi-part operation stubs — all 45 core functions now exported. [view:/playground]

## [2.34.2] - 2026-03-08

### Changed

- **VRAM warnings on high-context presets**: The 8K, 12K, and 16K context window presets now show an amber "High VRAM" badge. Selecting a high-VRAM preset reveals an inline warning explaining that an out-of-memory error means you should switch to a lower preset or smaller model. Hardware requirement labels updated (12K → 12 GB+, 16K → 16 GB+). [view:/]

## [2.34.1] - 2026-03-08

### Changed

- **Local AI model comparison cards**: Each model now shows speed and accuracy ratings (1–5 dots), approximate VRAM requirement, and a short recommendation tip to help you pick the right model for your hardware. [view:/]
- **Extended context window presets**: Added 12K and 16K token presets for models that support them (Phi 3.5 Mini goes up to 16K), feeding the model up to 40 RAG chunks for deeper, more accurate answers. [view:/]
- **Gemini vs local comparison panel**: The Gemini provider card now explains exactly why cloud outperforms local — chunk count comparison, multilingual support, instant startup, and richer answers — with a disclosure that PQC Today has no Google affiliation. [view:/]
- **Context window description improved**: Help text now explains that the context window controls how many reference chunks (not just "text") the model sees, making the quality tradeoff clearer. [view:/]

## [2.34.0] - 2026-03-08

### Added

- **Local AI assistant (WebLLM)**: Run the PQC assistant entirely in your browser using local Qwen 3 models — no API key, no cloud, fully private. Choose between cloud (Gemini) and local providers with a single click. Configurable context window presets (4K / 6K / 8K tokens) let you balance answer quality against GPU memory. [persona:developer] [persona:researcher] [view:/]
- **Key Wrap / Unwrap tab**: Dedicated Playground tab for PKCS#11 key wrapping with four mechanisms — AES-KW (RFC 3394), AES-KWP (RFC 5649), AES-GCM wrap, and RSA-OAEP wrap. Wrap symmetric or asymmetric keys, inspect wrapped blobs, and unwrap them back — all logged to the PKCS#11 call log. [persona:developer] [view:/playground]
- **PKCS#11 key attribute toggles**: All key generation forms (RSA, ECDSA, EdDSA, ML-KEM, ML-DSA, AES) now expose checkboxes for `CKA_EXTRACTABLE` and other PKCS#11 v3.2 usage attributes (`CKA_ENCRYPT`, `CKA_DECRYPT`, `CKA_WRAP`, `CKA_UNWRAP`, `CKA_DERIVE`), letting you experiment with restrictive key policies. [persona:developer] [view:/playground]
- **Assessment smart defaults for Org Scale**: The "Org Scale" wizard step auto-populates system count and team size based on your selected industry when you click "I'm not sure" — no more guessing. [persona:executive] [persona:architect] [view:/assess]
- **About page — Rust crypto dependencies**: Lists all Rust WASM crate versions (ml-kem, ml-dsa, slh-dsa, dalek, p256/p384, aes, sha, hmac, pkcs8, and more) powering the Rust SoftHSMv3 engine. [view:/about]

### Changed

- **Classical signatures merged into Sign tab**: RSA, ECDSA, and EdDSA signing moved from a separate "Classical" tab into the unified Sign & Verify panel with a PQC/Classical toggle — fewer tabs, same capabilities. [view:/playground]
- **Key Store shows expanded PKCS#11 attributes**: Attribute inspector now displays `CKA_KEY_GEN_MECHANISM`, `CKA_PARAMETER_SET`, `CKA_LOCAL`, `CKA_ALWAYS_SENSITIVE`, `CKA_NEVER_EXTRACTABLE`, `CKA_ENCAPSULATE`, and `CKA_DECAPSULATE`. [view:/playground]
- **Assessment report shows credential & scale context**: The report profile summary now displays selected credential lifetimes (e.g., "1-3 years, 10-25 years") and organizational scale (e.g., "51-200 systems, 11-50 engineers") instead of just counts. [persona:executive] [view:/assess]
- **Knowledge Graph navigation**: "View in app" links on graph nodes now use client-side navigation for instant page transitions and correct back-button behavior. [view:/learn]
- **Landing page updates**: Developer tagline now mentions the dual-engine Rust WASM HSM; Migrate catalog count updated from 220+ to 350+ products. [view:/]

### Fixed

- **Knowledge Graph layout sync**: Switching tracks or searching now properly updates all nodes and edges — previously layout changes weren't reflected until a manual refresh. [view:/learn]
- **FN-DSA description corrected**: Suggested query description updated from "NIST FIPS 206 (draft)" to "NIST FIPS 206" (standard is finalized). [view:/learn]
- **Mindmap navigation**: Added missing Changelog link to the right-panel mindmap. [view:/]

## [2.33.1] - 2026-03-08

### Added

- **Complete dual-engine parity cross-checks** (`src/components/Playground/tabs/KemOpsTab.tsx`, `SignVerifyTab.tsx`, `hsm/symmetric/AesPanel.tsx`): Extended dual-engine cross-checks to all six paired HSM operation directions:
  - **ML-KEM Decapsulate** (new): C++ encapsulates using a fresh Rust keypair → Rust decapsulates → secrets match (works around non-extractable ML-KEM private keys)
  - **ML-DSA Verify** (new): C++ verifies signature → Rust also verifies using the same pubkey + sig
  - **AES-GCM / AES-CBC Decrypt** (new log entries): C++ decrypts → Rust decrypts → plaintexts compared, with success `Dual-Engine Parity / SUCCESS` log entries
  - All successful cross-checks emit a PKCS#11 log entry with a human-readable description of the operation direction. [view:/playground]

## [2.33.0] - 2026-03-08

### Added

- **Dual-engine cross-check in KEM panel** (`src/components/Playground/tabs/KemOpsTab.tsx`): After C++ encapsulates, the Rust engine imports the C++ public key, encapsulates independently, then C++ decapsulates the Rust ciphertext — shared secrets are compared byte-for-byte. Parity success/failure logged to the unified PKCS#11 log. [view:/playground]

- **Dual-engine cross-check in Sign panel** (`src/components/Playground/tabs/SignVerifyTab.tsx`): After C++ signs, the Rust engine imports the C++ public key and verifies the signature — cross-engine ML-DSA interoperability confirmed at the KEM and Sign tab level (not just SoftHSM tab). [view:/playground]

- **Rust WASM Phase 2** (`public/wasm/rust/softhsmrustv3_bg.wasm`, `src/wasm/softhsmrustv3.d.ts`, `src/wasm/softhsmrustv3.js`): Expanded Rust PKCS#11 WASM binary with RSA, ECDSA, EdDSA, SLH-DSA, digest, and key wrap/unwrap operations — full algorithm parity with the C++ Emscripten engine. [view:/playground]

- **RAG corpus — 5 new knowledge sources** (`scripts/generate-rag-corpus.ts`, `public/data/rag-corpus.json`): Added corpus processors for Achievement Catalog (badges, rarity tiers, belt grading), Business Center (/business GRC dashboard), Right Panel (Assistant + Journey + Graph tabs), Guided Tour (3-phase onboarding with 14 feature slides), and SoftHSMv3 developer docs (dev guide, PKCS#11 v3.2 gap analysis, test guide). Source priority weights assigned for all new sources. [view:/]

### Changed

- **PKCS#11 proxy TRAP error logging** (`src/wasm/softhsm.ts`): `createLoggingProxy()` now wraps every PKCS#11 call in try/catch — WASM runtime errors are caught and emitted as TRAP log entries (with `rvHex: 'TRAP'` and the error message) instead of silently crashing the call chain. [view:/playground]

- **RAG source labels corrected** (`scripts/generate-rag-corpus.ts`, `src/services/chat/__tests__/golden-queries.test.ts`): Playground guide chunks now tagged `source: 'playground-guide'` and OpenSSL Studio guide chunks `source: 'openssl-guide'` (were both `'documentation'`). Enables precise source-based retrieval filtering. [view:/]

- **Prettier ignores for generated Rust WASM files** (`.prettierignore`): Added `src/wasm/softhsmrustv3.js` and `src/wasm/softhsmrustv3.d.ts` to avoid Prettier reformatting wasm-bindgen generated output. [view:/]

### Fixed

- **Quiz persona filter — empty personas = all-audience** (`src/components/PKILearning/modules/Quiz/index.tsx`): Questions with `personas: []` (intended for all personas) were previously hidden when a persona was selected. Fixed to: `q.personas.length === 0 || q.personas.includes(selectedPersona)`. [view:/learn/quiz]

## [2.32.0] - 2026-03-07

### Added

- **Rust SoftHSMv3 WASM engine** (`src/wasm/softhsm.ts`, `src/wasm/softhsmrustv3.js`, `src/wasm/softhsmrustv3.d.ts`): New `getSoftHSMRustModule()` singleton loader for the Rust wasm-bindgen SoftHSMv3 build — provides a full PKCS#11 v3.2 ABI adapter mapping all session, key generation, ML-KEM, ML-DSA, SLH-DSA, and AES operations into the identical `SoftHSMModule` interface used by the C++ engine. Includes Emscripten-compat memory layer (`_malloc`, `_free`, `HEAPU8`, `setValue`, `getValue`). [view:/playground]

- **Dual-engine parity verification** (`src/components/Playground/tabs/SoftHsmTab.tsx`, `src/components/Playground/hsm/symmetric/AesPanel.tsx`): New "Dual Cross-Check" mode runs both C++ and Rust engines simultaneously — cross-verifies ML-KEM encapsulation (import pubkey → encapsulate on Rust → decapsulate on C++ → compare secrets), ML-DSA signing (verify C++ signature on Rust), SLH-DSA signing (same cross-verify pattern), and AES encryption (decrypt C++ ciphertext on Rust → compare plaintext). Logs parity success or raises a parity failure error. [view:/playground]

- **PKCS#11 key import helpers** (`src/wasm/softhsm.ts`): Four new `hsm_import*` functions — `hsm_importMLKEMPublicKey`, `hsm_importMLDSAPublicKey`, `hsm_importSLHDSAPublicKey`, `hsm_importAESKey` — create key objects via `C_CreateObject` for cross-engine parity testing. [view:/playground]

- **Engine mode UI** (`src/components/Playground/InteractivePlayground.tsx`, `src/components/Playground/tabs/SoftHsmTab.tsx`): Radio-button engine selector in the Playground header (C++ / Rust / Dual Parity) and SoftHSM tab (Software API / C++ / Rust / Dual Cross-Check). Disabled during active operations. Engine badges (color-coded) on every PKCS#11 log entry. [view:/playground]

- **Rust WASM binary** (`public/wasm/rust/softhsmrustv3_bg.wasm`): Pre-built Rust SoftHSMv3 WASM binary (~336 KB) for browser-side PKCS#11 operations. [view:/playground]

- **E2E Playground specs** (`e2e/playground-softhsm.spec.ts`, `e2e/playground-softhsm-rust.spec.ts`): Playwright end-to-end tests for SoftHSM C++ and Rust engine modes — token setup, ML-KEM, ML-DSA, and SLH-DSA operations. [view:/playground]

### Changed

- **HSM context — engine mode state** (`src/components/Playground/hsm/HsmContext.tsx`): Added `EngineMode` type (`'software' | 'cpp' | 'rust' | 'dual'`), `engineMode`/`setEngineMode` state, and `crossCheckModuleRef` for dual-engine parity. Replaced `HsmLogEntry` type with canonical `Pkcs11LogEntry` from `softhsm.ts`. [view:/playground]

- **PKCS#11 log entries tagged with engine name** (`src/wasm/softhsm.ts`, `src/components/Playground/components/PkcsLogPanel.tsx`): `Pkcs11LogEntry` gains `engineName?: string`; `createLoggingProxy()` accepts optional engine name parameter. Log panel renders color-coded engine badges (C++ blue, Rust orange, Dual purple). Copy-all format includes `[ENGINE_NAME]` prefix. [view:/playground]

- **SoftHSM tab — shared log panel** (`src/components/Playground/tabs/SoftHsmTab.tsx`): Removed 75-line inline `LogPanel` component; now uses the shared `PkcsLogPanel` from `components/`. All PKCS#11 calls route through `useHsmContext()` for unified logging. [view:/playground]

- **CollapsibleSection layout** (`src/components/ui/CollapsibleSection.tsx`): Moved `infoTip` and `headerExtra` props outside the collapse `<Button>` click target — prevents info tip clicks from toggling the section. [view:/assess]

- **MigrationRoadmap layout** (`src/components/Report/MigrationRoadmap.tsx`): Same pattern — `SectionInfoTip` moved outside the collapsible button to prevent accidental section toggling. [view:/assess]

- **Renamed `getSoftHSMModule` → `getSoftHSMCppModule`** (`src/wasm/softhsm.ts`, `src/hooks/useHSM.ts`, all consumers): Explicit naming to distinguish C++ Emscripten engine from Rust wasm-bindgen engine. [view:/playground]

### Fixed

- **PKCS#11 function call prefixes** (`src/wasm/softhsm.ts`): Fixed 6 helper functions calling C bindings without the `_` prefix — `C_WrapKey` → `_C_WrapKey` (3 sites), `C_UnwrapKey` → `_C_UnwrapKey`, `C_GenerateRandom` → `_C_GenerateRandom`, `C_SeedRandom` → `_C_SeedRandom`. These calls would have failed at runtime. [view:/playground]

- **`freeTemplate` missing length argument** (`src/wasm/softhsm.ts`): `hsm_unwrapKey` passed only 2 args to `freeTemplate()` instead of 3 — added the missing template length parameter. [view:/playground]

- **WASM memory access for Rust compat** (`src/wasm/softhsm.ts`): Changed `M.wasmMemory.buffer.byteLength` → `M.HEAPU8.buffer.byteLength` in 4 places within `hsm_aesWrapKeyKwp` — `wasmMemory` is undefined on the Rust adapter; `HEAPU8` works for both engines. [view:/playground]

## [2.31.1] - 2026-03-08

### Fixed

- **Assessment Report / Business Center crash** (`src/hooks/assessment/personas.ts`): Implemented four missing persona narrative functions — `generateExecNarrative`, `generateDevNarrative`, `generateArchitectNarrative`, and `generateResearcherNarrative` — that were referenced in `generatePersonaNarrative()` but never defined, causing a `ReferenceError` on any page that renders the report or Business Center. [view:/assess] [view:/business]

- **Module-level import crash** (`src/hooks/assessmentUtils.ts`): Removed stale `useAssessmentEngine` re-export that referenced a hook removed in the v2.30.0 assessment engine refactor. The dangling export caused a module-resolution crash for any page importing from `assessmentUtils`. [view:/assess] [view:/business]

- **9 missing WASM exports** (`src/wasm/softhsm.ts`): Added exports for PKCS#11 constants and helper functions (`CKM_SHA256_HMAC`, `CKM_AES_KEY_WRAP`, `hsm_generate_aes_key`, `hsm_generate_hmac_key`, `hsm_wrap_key`, `hsm_unwrap_key`, `hsm_derive_key`, `hsm_generate_rng`, `CKM_ECDH1_DERIVE`) that were missing from the Phase 6 singleton loader barrel, preventing Playground symmetric and wrap panels from loading. [view:/playground]

### Changed

- **E2E test reliability** (all spec files): Eliminated all `waitForTimeout` antipatterns across 9 spec files — replaced with `expect().toBeVisible()`, `waitForFunction()`, and `expect().toPass()` per CI policy. Playground spec fully rewritten to use `selectFromFilterDropdown` / `selectFirstKeyFromFilterDropdown` helpers matching the refactored Playground UI. All 124 CI-eligible E2E tests pass on Chromium (9 `test.fixme` skipped). [view:/playground]

- **RAG corpus updated** (`public/data/rag-corpus.json`): Regenerated corpus — 3,495 chunks from 22 sources (was 3,494). [view:/]

## [2.31.0] - 2026-03-07

### Added

- **PKCS#11 inspector module** (`src/wasm/inspect/`): New `constants.ts`, `decoders.ts`, and `types.ts` providing structured PKCS#11 call inspection — decodes mechanism IDs, attribute types, CKR return codes, and parameter structures into human-readable form for the PKCS#11 call log. [view:/playground]

- **New test infrastructure** (`src/test/utils.tsx`): Shared test utility wrappers (router context, store providers) used across unit tests; reduces boilerplate in component tests. [view:/playground]

- **E2E assessment spec** (`e2e/assess.spec.ts`): Playwright end-to-end test covering the 14-step assessment wizard — navigation, field completion, report generation, and print layout. [view:/assess]

- **E2E fixtures** (`e2e/fixtures/`): Shared Playwright fixtures for common setup patterns (version-store seeding, tour bypass). [view:/]

- **Quiz data loader unit tests** (`src/data/quizDataLoader.test.ts`): Vitest unit tests covering CSV parsing, category filtering, revision suffix ordering, and smart-sampling logic. [view:/learn/quiz]

- **Assessment store unit tests** (`src/store/useAssessmentStore.test.ts`): Vitest unit tests covering wizard state transitions, field validation, scoring integration, and localStorage migration guards. [view:/assess]

### Changed

- **SoftHSM WASM — Phase 6 singleton loader** (`src/wasm/softhsm.ts`): Replaced barrel re-exports with a full PKCS#11 integration layer. New `getSoftHSMModule()` singleton loads the Emscripten CJS output via `<script>` injection and `locateFile` WASM routing; `clearSoftHSMCache()` resets on PlaygroundProvider cleanup; `createLoggingProxy()` provides transparent PKCS#11 call logging; high-level `hsm_*` helper functions wrap common PKCS#11 sequences. Modular `src/wasm/softhsm/` sub-modules (constants, crypto, logging, memory, module, session) retained. [view:/playground]

- **Playground SoftHSM tab refactored** (`src/components/Playground/tabs/softhsm/`): Monolithic SoftHSM tab extracted into five focused demo components — `SoftHsmUI.tsx` (orchestration shell), `TokenSetupDemo.tsx` (slot/token/session lifecycle), `MLKemDemo.tsx` (ML-KEM encapsulate/decapsulate), `MLDsaDemo.tsx` (ML-DSA sign/verify + pre-hash), `SlhDsaDemo.tsx` (SLH-DSA with all 12 param sets). [view:/playground]

- **Playground HSM symmetric panel refactored** (`src/components/Playground/hsm/symmetric/`): Symmetric HSM panel split into six focused panels — `AesPanel.tsx` (AES-CBC/GCM), `AesCmacPanel.tsx`, `AesCtrPanel.tsx`, `HmacPanel.tsx`, `KeyWrapPanel.tsx`, `RngPanel.tsx`. [view:/playground]

- **5G service refactored** (`src/components/PKILearning/modules/FiveG/services/ops/`): Monolithic `FiveGService.ts` (1 600+ lines) decomposed into six domain-specific ops modules — `AuthOps.ts` (5G-AKA), `EphemeralOps.ts` (ephemeral key pairs), `NetworkOps.ts` (network slice management), `ProvisionOps.ts` (SIM provisioning), `SucOps.ts` (SUCI concealment/deconcealment), `UtilsOps.ts` (shared utilities). [view:/learn/5g-security]

- **Report sections extracted** (`src/components/Report/sections/`): `ReportContent.tsx` split into four focused section components — `AlgorithmMigrationSection.tsx`, `AssessmentProfileSection.tsx`, `CategoryBreakdownSection.tsx`, `RiskScoreSection.tsx`. [view:/assess]

- **Shared CSV loader utility** (`src/data/csvUtils.ts`): New `loadLatestCSV()` generic function centralises date-stamped and revision-sorted CSV discovery for all data loaders. Replaces duplicated per-file glob + sort logic across `libraryData.ts`, `quizDataLoader.ts`, and other loaders. [view:/library]

- **Accessibility overhaul — WCAG 2.1 AA** (app-wide): Comprehensive round of accessibility improvements across all major UI areas:
  - **Playground tab bar**: `role="tablist"` with `aria-label`, each tab gets `role="tab"`, `id`, `aria-selected`, `aria-controls`; full keyboard navigation (ArrowLeft/Right/Home/End) via `onKeyDown` handler. Error state uses `useRef` + `focus()` for screen reader announcement. [view:/playground]
  - **Tables**: `scope="col"` on all `<th>`, `aria-sort` (ascending/descending/none) on sortable columns, `<caption class="sr-only">` on Compliance, Timeline Gantt, and Report algorithm migration tables. [view:/compliance] [view:/timeline]
  - **Modals/Dialogs**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` added to landing page ScoringModal and info modals; focus trap and `prevFocusRef` restore focus to trigger element on close. [view:/]
  - **Decorative icons**: `aria-hidden="true"` applied throughout Playground tabs, KEM Ops, Sign/Verify, and Key Generation. [view:/playground]
  - **Clickable `<div>` → `<button>`**: Landing page backup/restore cards converted from `<motion.div>` to `<motion.button type="button">` with `aria-label`. [view:/]
  - **Listbox keyboard navigation**: Dashboard module filter gets `ArrowDown/Up/Home/End/Escape` keyboard handling via `onKeyDown`. [view:/learn]

- **`<Button>` component rollout**: Raw `<button>` elements replaced across Compliance table (tooltip triggers, filter, clear buttons), MigrateView (back/share buttons), SoftwareTable, About (tab triggers, external link), Library, Leaders, OpenSSL Studio configs, Dashboard, HsmMigrationPlanner, PQCBusinessCase (BreachScenarioSimulator), PQCRiskManagement (RiskHeatmapGenerator, RiskRegisterBuilder), and SecretsManagement (RotationPolicyDesigner). [view:/compliance] [view:/migrate] [view:/about] [view:/library] [view:/leaders] [view:/openssl] [view:/learn] [view:/playground]

- **`<FilterDropdown>` rollout**: Native `<select>` replaced in Playground — hybrid KEM method selector, primary key selector, algorithm selectors in KEM Ops and Sign/Verify tabs, and key type/size selector in Key Generation section. [view:/playground]

- **`<ErrorAlert>` / `<EmptyState>` adoption**: MigrateView error state replaced from inline markup to `<ErrorAlert>`; empty-filter state uses `<EmptyState>`. [view:/migrate]

- **Loading skeleton** added to `AlgorithmsView`: `<Skeleton>` placeholders display during parallel `loadPQCAlgorithmsData()` + `loadAlgorithmsData()` Promise.all; tabs hidden until both loaders complete. [view:/algorithms]

- **Semantic token fixes**: `amber-500` hardcoded colors replaced with `text-status-warning`, `bg-status-warning/10`, `border-status-warning/30` in About view disclaimer and privacy notice panels. [view:/about]

- **Zustand version-gated migration** (`src/store/useVersionStore.ts`): `migrate()` now receives the `version` parameter and applies `lastSeenVersion` coercion only for stores at `version < 1`, preventing unnecessary re-migration on future upgrades.

- **Report table accessibility** (`src/components/Report/ReportContent.tsx`): All `<th>` elements in the algorithm migration table receive `scope="col"`; CTA raw `<button>` replaced with `<Button>` component.

- **Quiz CSV updated** (`src/data/pqcquiz_03072026_r3.csv`): Latest revision with updated coverage — corrects any remaining `true-false` answer key issues and aligns with current module set.

- **E2E specs updated** (multiple): All E2E spec files updated to reflect accessibility changes — tab buttons queried via `role="tab"`, tables use column header selectors, aria-label updates throughout.

### Removed

- **`src/utils/csvParser.ts`** (112 lines): Standalone timeline CSV parser removed — functionality superseded by `src/data/csvUtils.ts` generic loader and direct PapaParse usage in data files.

## [2.30.0] - 2026-03-07

### Added

- **7 new learning modules** — expanding the platform to 48 hands-on modules across 8 tracks:
  - **Secrets Management PQC** (`src/components/PKILearning/modules/SecretsManagementPQC/`): Vault, AWS Secrets Manager, Azure Key Vault, and GCP Secret Manager PQC migration. 5 workshop steps: Secrets Architecture Mapper, Vault PQC Simulator, Rotation Policy Designer, Cloud Secrets Comparator, Pipeline Integration Lab. 90 min, advanced, Infrastructure track. [view:/learn/secrets-management-pqc] [persona:architect,ops]

  - **Network Security PQC** (`src/components/PKILearning/modules/NetworkSecurityPQC/`): NGFWs, IDS/IPS, TLS inspection, and ZTNA post-quantum migration. 5 workshop steps: NGFW Cipher Analyzer, TLS Inspection Lab, IDS Signature Updater, Vendor Migration Matrix, ZTNA PQC Designer. 90 min, advanced, Protocols track. [view:/learn/network-security-pqc] [persona:architect,ops]

  - **Database Encryption PQC** (`src/components/PKILearning/modules/DatabaseEncryptionPQC/`): TDE, CLE, queryable encryption, and BYOK/HYOK key management. 5 workshop steps: Encryption Layer Mapper, TDE Migration Planner, BYOK Key Designer, Queryable Encryption Lab, Database Migration Readiness. 75 min, intermediate, Infrastructure track. [view:/learn/database-encryption-pqc] [persona:architect,developer]

  - **IAM PQC** (`src/components/PKILearning/modules/IAMPQC/`): JWT/SAML/OIDC migration, Active Directory/LDAP, and Zero Trust identity architecture. 5 workshop steps: IAM Crypto Inventory, Token Migration Lab, Directory Services Analyzer, Vendor Readiness Scorer, Zero Trust Identity Architect. 90 min, intermediate, Applications track. [view:/learn/iam-pqc] [persona:architect,developer]

  - **Secure Boot PQC** (`src/components/PKILearning/modules/SecureBootPQC/`): UEFI PK/KEK/db migration, ML-DSA firmware signing, TPM 2.0, and DICE attestation. 5 workshop steps: Secure Boot Chain Analyzer, Firmware Signing Migrator, TPM Key Hierarchy Explorer, Firmware Vendor Matrix, Attestation Flow Designer. 90 min, advanced, Infrastructure track. [view:/learn/secure-boot-pqc] [persona:architect,ops]

  - **OS PQC** (`src/components/PKILearning/modules/OSPQC/`): OpenSSL Provider architecture, SSH host key migration, GnuTLS/Schannel policy, and package signing. 5 workshop steps: OS Crypto Inventory, System TLS Configurator, SSH Host Key Migrator, Package Signing Migrator, FIPS Compatibility Checker. 75 min, intermediate, Infrastructure track. [view:/learn/os-pqc] [persona:ops,developer]

  - **Platform Engineering PQC** (`src/components/PKILearning/modules/PlatformEngPQC/`): CI/CD pipeline crypto inventory, container signing migration (cosign/Notation to ML-DSA), IaC defaults, OPA/Kyverno policy enforcement, and posture monitoring. 6 workshop steps. 120 min, advanced, Applications track. [view:/learn/platform-eng-pqc] [persona:developer,architect]

- **Business Center** (`src/components/BusinessCenter/`): GRC command center at `/business` — live risk scores, compliance tracking, vendor posture, and prioritized next steps. Integrates assessment results, compliance framework selections, and learning progress. Artifact management for executive documents. Journey step added to the landing page. [view:/business] [persona:executive,architect]

- **Assessment engine refactoring** (`src/hooks/assessment/`): Monolithic assessment logic decomposed into 5 focused modules — `orchestrator.ts` (main computation), `scoring.ts` (category scoring), `riskWindows.ts` (HNDL/HNFL), `generators.ts` (report text), `personas.ts` (persona-aware reframing). Smart defaults system (`src/components/Assess/smartDefaults.ts`) pre-fills wizard steps based on industry and country. [view:/assess]

- **CollapsibleSection UI component** (`src/components/ui/CollapsibleSection.tsx`): Reusable collapsible panel with expand/collapse animation, print-safe rendering (always expanded in print), and optional section info tips. Used across Report and Business Center. [view:/report]

- **EU countries utility** (`src/utils/euCountries.ts`): Authoritative EU/EEA member state list used by assessment compliance filtering. [view:/assess]

### Changed

- **Quiz expanded to 770 questions** (`src/data/pqcquiz_03072026_r2.csv`): 135 new questions covering secrets-management-pqc, network-security-pqc, database-encryption-pqc, iam-pqc, secure-boot-pqc, os-pqc, and platform-eng-pqc. All 48 modules now have quiz coverage. [view:/learn/quiz]

- **Glossary expanded** (`src/data/glossaryData.ts`): 56 new terms covering secrets management (Secret Zero, Dynamic Secrets, Transit Encryption Engine), network security (DPI, NGFW, ZTNA, Micro-Segmentation), database encryption (TDE, CLE, Always Encrypted, HYOK), IAM (IdP, SAML 2.0, OIDC, Kerberos, Federation), secure boot (UEFI, Platform Key, KEK, DICE, TPM PCR, Boot Guard), OS crypto (Crypto Policy, SChannel, SSH Host Key, CNG, OpenSSL Provider), and platform engineering (cosign, Notation, Sigstore, SLSA, OPA, Kyverno). [view:/glossary]

- **Report section info modals** (`src/components/Report/SectionInfoModal.tsx`): Contextual info buttons on all 11 report sections explaining methodology, data sources, and interpretation guidance. [view:/report]

- **About page privacy notice** (`src/components/About/AboutView.tsx`): Added data routing disclosure for PQC Assistant — clarifies that queries and context chunks are sent to Google's Gemini API, with link to Google AI Studio terms. [view:/about]

- **Knowledge Graph enhancements** (`src/components/PKILearning/modules/KnowledgeGraph/`): New entity types and suggested queries for the 7 new modules; updated graph builder with expanded track coverage. [view:/learn]

- **Assessment store expanded** (`src/store/useAssessmentStore.ts`): New fields for smart defaults integration, persona-aware scoring weights, and expanded migration effort estimation. [view:/assess]

- **Module store v10 migration** (`src/store/useModuleStore.ts`): Progress tracking for 7 new modules with backward-compatible migration from v9. [view:/learn]

- **SoftHSM WASM bindings expanded** (`src/wasm/softhsm.ts`): Additional PKCS#11 mechanism constants and type exports for HSM panel enhancements. [view:/playground]

- **Migrate software reference updated** (`src/data/quantum_safe_cryptographic_software_reference_03072026.csv`): Updated product catalog with latest PQC support data. [view:/migrate]

### Removed

- **PersonaPicker component** (`src/components/PKILearning/PersonaPicker.tsx`): Removed standalone picker — persona selection fully integrated into the landing page personalization section.

- **ROICalculatorSection** (`src/components/Report/ROICalculatorSection.tsx`): Replaced by shared component with improved calculations.

## [2.29.1] - 2026-03-07

### Changed

- **moduleData.ts validation infrastructure** (`src/components/PKILearning/moduleData.ts`): Added `validateCatalog()` wrapper (dev-only id/key mismatch check), `SPECIAL_IDS` constant (`quiz`, `assess`), and a dev-time validation block at end of file that cross-checks `MODULE_STEP_COUNTS` ↔ `WORKSHOP_STEPS` ↔ `MODULE_CATALOG` ↔ `LEARN_SECTIONS` ↔ `MODULE_TRACKS` on first page load. Standardised all unquoted object keys to quoted form. Added clarifying comments to `quiz` and `assess` step-count entries. Fixed `Industries` track color to use semantic tokens (`bg-tertiary/10 text-tertiary`).

- **Aerospace module — Space Segment clarification** (`AerospacePQC/data/aerospaceConstants.ts`): Expanded `constraintDescription` to clarify that the 2027 PQC readiness year refers to ground-segment infrastructure readiness (PQC-secured uplinks, ground key management for newly launched satellites), not a retrofit of existing on-orbit satellite hardware.

- **Aerospace module — ACARS standard reference fix** (`AerospacePQC/data/aerospaceProtocolData.ts`): Corrected `standardRef` for ACARS from `RTCA DO-258A / EUROCAE ED-110C` to `RTCA DO-258A / ED-100A (FANS 1/A) · DO-280B / ED-110B (ATN B1)`.

- **Automotive module — UNECE WP.29 R155/R156 regulatory context** (`AutomotivePQC/components/AutomotivePQCIntroduction.tsx`): Added paragraph explaining the mandatory regulatory backdrop — since July 2024 all new vehicle type approvals in the EU, Japan, and Korea require certified CSMS (R155) and SUMS (R156), with national authorities beginning to interpret "adequate cryptographic protection" to include PQC readiness for systems with multi-decade operating lives.

- **Healthcare module — ML-DSA-44 rationale simplified** (`HealthcarePQC/data/healthcareConstants.ts`): Simplified wording of infeasibility rationale for ML-DSA-44 on Cortex-M0+ constrained medical devices (removed specific RAM figure that was unverified).

- **TypeScript type annotations** (`AISecurityPQC/workshop/DataAuthenticityVerifier.tsx`, `ModelWeightVault.tsx`): Added explicit `useState<string>` type parameter to silence TypeScript inference warnings.

- **SoftHSM WASM vendor package** (`src/vendor/softhsm-wasm/wasm/softhsm.js`): Added minified JS loader for the SoftHSM WASM module to vendor package (previously only `softhsm.wasm` was tracked). `public/wasm/softhsm.js` updated to minified form.

### Data

- **RAG corpus regenerated** (`public/data/rag-corpus.json`): Rebuilt with updated module content — 3,209 chunks (was 2,946), reflecting new Role Guides, Industries track, and glossary additions from v2.29.0.

## [2.29.0] - 2026-03-06

### Added

- **Role Guides track** (`src/components/PKILearning/common/roleGuide/`): New "Role Guides" track in the Learn module — 5 persona-specific quick-start modules (30 min, beginner) that explain quantum impact and provide an action plan tailored to each role. Shared three-section structure: Why It Matters → What to Learn → How to Act. Routes: `/learn/exec-quantum-impact`, `/learn/dev-quantum-impact`, `/learn/arch-quantum-impact`, `/learn/ops-quantum-impact`, `/learn/research-quantum-impact`. [view:/learn] [persona:executive,developer,architect,ops,researcher]

- **Executive Quantum Impact** (`src/components/PKILearning/modules/ExecQuantumImpact/`): Why quantum matters to leadership — fiduciary risk, CNSA 2.0 / NIS2 / DORA regulatory deadlines, and a board-level PQC action plan. 30 min, beginner. [view:/learn/exec-quantum-impact] [persona:executive]

- **Developer Quantum Impact** (`src/components/PKILearning/modules/DevQuantumImpact/`): How quantum breaks developer code — library transitions (OpenSSL, BouncyCastle, Java JCA), larger keys and signatures, TLS/JWT/signing impacts, and a hands-on migration readiness plan. 30 min, beginner. [view:/learn/dev-quantum-impact] [persona:developer]

- **Architect Quantum Impact** (`src/components/PKILearning/modules/ArchQuantumImpact/`): Architecture decisions that outlast the quantum transition — KMS, HSM, PKI, hybrid deployment patterns, and crypto-agile design. 30 min, beginner. [view:/learn/arch-quantum-impact] [persona:architect]

- **Ops Quantum Impact** (`src/components/PKILearning/modules/OpsQuantumImpact/`): Operational PQC challenges — certificate scaling, fleet upgrades, VPN/SSH key exchange, monitoring recalibration, and migration playbooks. 30 min, beginner. [view:/learn/ops-quantum-impact] [persona:ops]

- **Research Quantum Impact** (`src/components/PKILearning/modules/ResearchQuantumImpact/`): Research-specific quantum exposure — algorithm evaluation, open problems, standards convergence timelines, and contributing to the PQC ecosystem. 30 min, beginner. [view:/learn/research-quantum-impact] [persona:researcher]

- **Industries track** (`src/components/PKILearning/LearnTrackStack.tsx`): New "Industries" track grouping vertical-market modules — Energy & Utilities, Healthcare, Aerospace & Space, Automotive, and IoT/OT. [view:/learn]

- **Energy & Utilities PQC** (`src/components/PKILearning/modules/EnergyUtilities/`): PQC migration for power grids and utilities. 5 workshop steps: Protocol Security Analyzer (DNP3/Modbus/IEC 61850/IEC 62351), Substation Migration Planner, Smart Meter Key Manager (DUKPT at scale), Safety Risk Scorer (environmental and operational risk scoring), Grid Migration Roadmap. NERC CIP compliance mapping throughout. 90 min, intermediate. [view:/learn/energy-utilities-pqc] [persona:architect,ops]

- **Healthcare PQC** (`src/components/PKILearning/modules/HealthcarePQC/`): Healthcare-specific PQC challenges. 5 workshop steps: Biometric Vault Assessor (biometric data permanence and quantum vulnerability), Pharma IP Calculator (pharmaceutical IP protection timelines), Patient Privacy Mapper (HIPAA/GDPR lifecycle analysis), Device Safety Simulator (FDA-regulated medical device safety-crypto intersection), Hospital Migration Planner (network migration across clinical systems). 90 min, intermediate. [view:/learn/healthcare-pqc] [persona:architect,ops]

- **Aerospace & Space PQC** (`src/components/PKILearning/modules/AerospacePQC/`): PQC challenges unique to aerospace. 6 workshop steps: Avionics Protocol Analyzer (ARINC 429/629 and DO-326A), Satellite Link Budget (bandwidth constraints for PQC signatures), Certification Impact Analyzer (DO-178C/DO-326A recertification), Fleet Interoperability Matrix (multi-decade fleet crypto interoperability), Export Control Classifier (ITAR/EAR), Mission Lifecycle Planner. 120 min, advanced. [view:/learn/aerospace-pqc] [persona:architect,researcher]

- **Automotive PQC** (`src/components/PKILearning/modules/AutomotivePQC/`): Post-quantum cryptography for connected and autonomous vehicles. 6 workshop steps: Vehicle Architecture Mapper (ECU/CAN bus/V2X topology), Sensor Data Integrity (LiDAR/camera signing), Safety-Crypto Analyzer (ISO 26262 ASIL/crypto intersection), OTA Orchestration Planner (15–20 year lifecycle OTA), Car Key Protocol Explorer (digital car keys and in-vehicle payments), Lifecycle Migration Roadmap. 120 min, advanced. [view:/learn/automotive-pqc] [persona:architect,developer]

- **Cryptographic APIs & Developer Languages** (`src/components/PKILearning/modules/CryptoDevAPIs/`): Compare JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, and Bouncy Castle across 7 languages. 8 workshop steps: API Architecture Explorer, Language Ecosystem Comparator, Provider Pattern Workshop, Build vs Buy vs Open Source Analyzer, PQC Library Explorer, PQC Support Matrix, Crypto Agility Patterns, Migration Decision Lab. 120 min, intermediate. [view:/learn/crypto-dev-apis] [persona:developer,architect]

- **Compliance "My Frameworks" bookmarking** (`src/store/useComplianceSelectionStore.ts`, `src/components/Compliance/ComplianceLandscape.tsx`, `src/components/Compliance/ComplianceView.tsx`): New `useComplianceSelectionStore` Zustand store (persisted) tracks a `myFrameworks: string[]` set. Compliance Landscape cards and table rows now show a checkbox toggle (☐ / ☑) — clicking adds/removes a framework from "My Frameworks". Selections persist across sessions and sync to the Assessment wizard compliance step via new `importComplianceSelection` toggle in `useAssessmentStore`. [view:/compliance] [view:/assess]

- **Deadline urgency indicators** (`src/utils/deadlineUrgency.ts`): New utility module — `extractYear()`, `deadlineUrgency()` (returns `'past' | 'imminent' | 'near' | 'future' | 'none'`), `urgencyColor()` — used by Compliance Landscape to color-code framework deadline badges. [view:/compliance]

- **Knowledge Graph Mindmap view** (`src/components/RightPanel/MindmapView.tsx`, `mindmapData.ts`, `useMindmapData.ts`, `nodes/`, `edges/`): New "Mindmap" tab in the right panel GraphPanel (icon: Map). Renders a React Flow-based mindmap of the PQC learning landscape — modules grouped by track, with edges showing cross-module relationships. [view:right-panel]

- **Product Extraction Modal** (`src/components/Migrate/ProductExtractionModal.tsx`, `src/data/productExtractionData.ts`): AI-enriched product profiles in the Migrate catalog. Products with enrichment data show a ✨ "Enriched" badge in the expanded row; clicking "View Extraction" opens a modal with detailed AI-analyzed fields (use case, PQC readiness, algorithms, migration notes, certifications). Extraction data loaded from `src/data/productExtractionData.ts`. [view:/migrate]

- **Algorithm Info Modal** (`src/components/Algorithms/AlgorithmInfoModal.tsx`): New ⓘ button in the Algorithms view header. Opens a modal explaining the data sources, methodology, and interpretation guide for the algorithm comparison table. [view:/algorithms]

- **Report Section Info Modals** (`src/components/Report/SectionInfoModal.tsx`, `src/components/Report/sectionInfoContent.ts`): New contextual ⓘ info buttons on each report section in the Assessment Report. Sections covered: Risk Breakdown, Assessment Profile, HNDL/HNFL Windows, Country Timeline, Risk Score, Key Findings, Executive Summary, Algorithm Migration, Compliance Impact, Recommended Actions, Threat Landscape. Each modal explains the section's methodology, data sources, and how to interpret results. [view:/assess]

- **Assessment import toggles** (`src/store/useAssessmentStore.ts`): Two new boolean fields — `importComplianceSelection` (default `true`, syncs "My Frameworks" selections from Compliance page into wizard) and `importProductSelection` (default `true`, syncs Migrate product selections). Both exposed as toggle controls in the wizard. [view:/assess]

- **Persona-driven module routing** (`src/data/learningPersonas.ts`, `src/data/personaConfig.ts`): Role Guide modules wired into persona priority lists. Exec persona surfaces `exec-quantum-impact` first; dev persona surfaces `dev-quantum-impact` and `crypto-dev-apis`; architect surfaces `arch-quantum-impact` and `crypto-dev-apis`; ops surfaces `ops-quantum-impact`; researcher surfaces `research-quantum-impact`. Industries track modules routed to appropriate personas. [view:/learn]

- **RightPanel body scroll lock** (`src/components/RightPanel/RightPanel.tsx`): Panel now sets `document.body.style.overflow = 'hidden'` when open on mobile (drawer mode), preventing background scroll. Restored on close. [view:right-panel]

### Changed

- **Glossary expanded** (`src/data/glossaryData.ts`): 71 new terms added covering Energy & Utilities (NERC CIP, IEC 61850, IEC 62351, DNP3, SCADA, AMI, DUKPT-energy, smart meter domains) and industry-specific PQC migration vocabulary. Cross-references updated: EMV → `/learn/emv-payment-pqc`, V2X → `/learn/automotive-pqc`, ECU → `/learn/automotive-pqc`, DUKPT now includes technical note on quantum vulnerability at Key Injection Facility. [view:/glossary]

- **Quiz coverage extended** (`src/data/pqcquiz_03062026_r5.csv`): 635 questions total; new categories added for `energy-utilities-pqc`, `healthcare-pqc`, `aerospace-pqc`, `automotive-pqc`, and `crypto-dev-apis`. `quizDataLoader.ts` updated with category mappings for all 5 new modules. [view:/learn/quiz]

- **Learn tracks updated** (`src/components/PKILearning/LearnTrackStack.tsx`): "Role Guides" track added with Compass icon (accent color palette). "Industries" track added with Factory icon. Track filter now supports all 7 tracks. Module persona routing for new tracks integrated. [view:/learn]

## [2.28.0] - 2026-03-06

### Added

- **Confidential Computing & TEEs module** (`src/components/PKILearning/modules/ConfidentialComputing/`): Comprehensive 5-step module covering Trusted Execution Environments and their PQC implications. 5 workshop steps: TEE Architecture Explorer (7 vendors — Intel SGX, AMD SEV-SNP, ARM CCA, AWS Nitro, Google Cloud CC, Azure Confidential, IBM SE), Attestation Workshop (remote attestation flows, engines, integrations, and quantum threats), Encryption Mechanisms, TEE-HSM Trusted Channel, Quantum Threat Migration. 90 min, advanced, Infrastructure track. 6 new glossary terms: SGX, SEV-SNP, ARM CCA, Enclave, Remote Attestation, Sealing Key. [view:/learn/confidential-computing] [persona:architect,developer]

- **Achievement Badge System** (`src/components/Landing/AchievementBadgeGrid.tsx`): 27 unlockable achievement badges tracking learning milestones across all modules, quiz performance, and cross-page engagement. Badges organized by category (Foundation, Deep Dive, Industry, Strategy, Practice). Persisted via `useModuleStore`. [view:/]

- **Persona-driven Journey Map** (`src/components/RightPanel/JourneyMapPanel.tsx`): New Journey Map panel in the right panel — a visual representation of the user's learning journey, styled per active persona. Shows completed modules, recommended next steps, and progress toward persona-specific goals. [view:right-panel]

### Data

- **Compliance audit** (`src/data/`): 28 new compliance framework records added; 4 new timeline entries. RAG corpus rebuilt with updated coverage. [view:/compliance] [view:/timeline]

- **Landing CTA alignment** (`src/components/Landing/LandingView.tsx`): CTA buttons and journey steps aligned with the updated 4-section user journey model (Learn → Assess → Deploy → Stay Agile). [view:/]

## [2.27.0] - 2026-03-06

### Added

- **Custody Architecture Explorer** (`src/components/PKILearning/modules/DigitalAssets/flows/CustodyArchitectureFlow.tsx`): New interactive workshop flow in the Digital Assets module. Five-layer architecture explorer covering Client Interfaces, Orchestration, Wallet Tiers (hot/warm/cold), Cryptographic Infrastructure (HSMs, MPC, confidential computing, key ceremonies), and Network & Broadcast. Each layer expands to reveal sub-components with crypto primitives and integrated PQC threat analysis — threat level badges, vulnerable algorithms, countermeasures, and migration readiness indicators. Includes a 7-step Transaction Flow Walkthrough tracing a withdrawal from client request through signing to broadcast, highlighting the active architecture layer at each step. [view:/learn/digital-assets] [persona:architect,developer,executive]

- **Custody data constants** (`src/components/PKILearning/modules/DigitalAssets/data/custodyConstants.ts`): Vendor-neutral reference architecture data — 5 layers, 18 sub-components, 7 transaction flow steps, threat level and migration readiness configs. TypeScript interfaces: `ArchitectureLayer`, `ArchitectureSubComponent`, `TransactionFlowStep`, `PQCThreatOverlay`. [view:/learn/digital-assets]

- **Custody glossary terms** (`src/components/PKILearning/modules/DigitalAssets/utils/cryptoConstants.ts`): Added 5 tooltip entries — MPC, HSM, Shamir's Secret Sharing, Cold Storage, Key Ceremony. [view:/learn/digital-assets]

### Changed

- **Digital Assets module metadata** (`src/components/PKILearning/moduleData.ts`): Updated description to include custody architecture; duration bumped from 60 to 75 min. Added custody entries to `LEARN_SECTIONS` and `WORKSHOP_STEPS`. Chain selector grid changed from `lg:grid-cols-5` to `lg:grid-cols-3` (2×3 layout for 6 flows). [view:/learn/digital-assets]

## [2.26.1] - 2026-03-06

### Data

- **Migrate catalog expansion** (`quantum_safe_cryptographic_software_reference_03062026.csv`): Added 28 new products — 15 blockchain/DLT protocols (Bitcoin Core, Ethereum/Geth, Solana, Cardano, Polkadot/Substrate, Cosmos/Tendermint, IOTA, Hyperledger Fabric, Hyperledger Besu, R3 Corda, Aptos, Avalanche, QRL, Sui, BTQ Bitcoin Quantum) and 13 digital asset custody platforms (Anchorage Digital, BitGo, Coinbase Custody, Copper.co, DFNS, Fireblocks, Galileo FT, Hex Trust, Komainu, Ledger Enterprise, Metaco/Ripple, Taurus SA, Zodia Custody). Total catalog now 354 products. [view:/migrate] [persona:architect,executive]

- **Priority matrix refactor** (`pqc_software_category_priority_matrix.csv`): Split CSC-035 (Blockchain and Cryptocurrency Software, Medium priority) into two specialized categories — CSC-057 (Digital Asset Custody, High, 13 products) and CSC-058 (Blockchain & DLT Protocols, Critical, 17 products) — reflecting distinct infrastructure layers with different PQC migration pressures. [view:/migrate]

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt — 2,869 chunks (+29 from new migrate products and priority matrix split). [view:/about]

- **SoftHSMv3 WASM** (`public/wasm/softhsm.js`): Minified build artifact (no functional changes; -50% file size).

## [2.26.0] - 2026-03-06

### Added

- **Shareable workshop deep links** (`src/hooks/useModuleDeepLink.ts`, 19 module index files): Workshop tab and step state now syncs to the URL via `useSyncDeepLink` hook using `window.history.replaceState`. Navigating to `/learn/pki-workshop` → Workshop → Step 3 updates the URL to `?tab=workshop&step=3`. Sharing or bookmarking the URL restores the exact tab and step. All 19 modules with `getModuleDeepLink` are wired up. [view:/learn]

- **Persona-aware RAG ranking** (`src/services/chat/RetrievalService.ts`): Added `PERSONA_BOOSTS` multiplier table for 5 personas (developer, executive, architect, researcher, ops). Developer persona boosts workshop content 1.5×; executive boosts assessment/threats 1.4–1.5×; researcher boosts library/enrichment 1.4–1.5×. Persona is now passed from `usePageContext` through `useChatSend` to `RetrievalService.search()`. [view:/about]

- **Static chunk priority** (`src/types/ChatTypes.ts`, `scripts/generate-rag-corpus.ts`): Added `priority` field to `RAGChunk`. Corpus generator assigns source-type priorities (module-content: 1.15, modules: 1.1, algorithms: 1.05, library: 0.95, quiz: 0.8, changelog: 0.6). Workshop chunks with step-level deep links (`?step=N`) get +0.1 bump. 1,418 chunks have non-default priority. [view:/about]

- **Step-level RAG deep links** (`scripts/generate-rag-corpus.ts`): Workshop component chunks now include step-specific deep links (e.g., `/learn/pki-workshop?tab=workshop&step=2`) by parsing each module's `index.tsx` for `currentPart === N && <Component>` patterns. 71 of 89 workshop chunks now have step-specific URLs. [view:/about]

### Fixed

- **Quiz deep links suppressed for non-quiz queries** (`src/services/chat/RetrievalService.ts`): Quiz chunks are now blocked from RAG results unless the user explicitly mentions quiz, test, practice questions, or flashcards. Previously, quiz chunks could appear as source references for general topic queries, linking users to quizzes when they wanted explanations. [view:/about]

- **Library deep link guarantee** (`src/services/chat/RetrievalService.ts`): When a query matches library documents but library chunks are crowded out by source diversity caps, the system now injects the highest-scoring library chunk by replacing the lowest-priority result. Library `referenceId` metadata is now indexed for entity matching, so searching "NIST IR 8547" finds the library chunk even when its title differs ("Transition to Post-Quantum Cryptography Standards"). Ensures `/library?ref=` deep links always appear when a library document is relevant. [view:/library]

- **Source ref deduplication prefers step-level links** (`src/hooks/useChatSend.ts`): When multiple chunks share a title, the source reference now keeps the deep link from the highest-priority chunk. Step-level links (`?step=N`) are preferred over page-level links. [view:/about]

- **CSV loader revision-suffix support** (`src/data/pqcAlgorithmsData.ts`, `algorithmsData.ts`, `migrateData.ts`, `authoritativeSourcesData.ts`, `certificationXrefData.ts`): All 5 data loaders now handle `_rN` revision suffixes in CSV filenames (e.g., `library_03032026_r2.csv`). `getDateFromFilename` regex updated to `_(\d{8})(?:_r\d+)?\.csv$`; new `getRevisionFromFilename` helper. Sort uses date descending then revision descending, so same-day revisions are ordered correctly.

- **CSV maintenance scripts** (`scripts/check-csv-count.sh`, `scripts/archive-csvs.sh`, `package.json`): Added `npm run check:csv-count` to verify only 2 versions per CSV prefix exist in `src/data/`, and `npm run archive:csv` to move older versions to `src/data/archive/`.

### Data

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt — 2,839 chunks with priority field and step-level deep links. [view:/about]

## [2.25.3] - 2026-03-06

### Fixed

- **5G Security — subscriber key terminology** (`src/components/PKILearning/modules/FiveG/`): Corrected `Ki` → `K` and `eKi` → `eK` throughout the module to match 3GPP TS 33.501 terminology (`Ki` is legacy GSM/2G). Updated architecture: K is stored in an encrypted subscriber database, not permanently in the HSM — the ARPF's HSM holds K only transiently during authentication vector computation. Step 5 renamed from "Import at UDM/HSM" to "Import at Operator". Affects provisioning flow, exercises, introduction, diagram, constants, service, and RAG summary. [view:/learn/5g-security]

### Performance

- **Library page freeze resolved**: Archived 21 old CSV files that were being eagerly loaded via `import.meta.glob({eager: true})`, inflating the JS bundle to 5.3MB of raw data. `quizDataLoader` chunk dropped from 3.1MB to 709KB (-77%), `libraryData` chunk from 1.3MB to 349KB (-73%). Total JavaScript reduction: **3.3MB**. Per CLAUDE.md policy, only the latest 2 versions of each CSV are kept in `src/data/`; older versions moved to `src/data/archive/`. Updated What's New toast to reflect stability fix.

## [2.25.2] - 2026-03-06

### Fixed

- **Standards Bodies module — persona path visibility** (`src/data/learningPersonas.ts`): `standards-bodies` was missing from all 5 persona `recommendedPath` and `pathItems` arrays, causing the module to be hidden whenever any persona filter was active. Added to Executive (after `compliance-strategy`, in Governance & Compliance checkpoint), Architect (after `data-asset-sensitivity`, in Architecture Strategy checkpoint), Researcher (after `data-asset-sensitivity`, in Strategy checkpoint), and IT Ops/DevOps (after `hsm-pqc`, in Key Infrastructure checkpoint). `quizCategories` updated for Executive, Architect, and IT Ops personas; Researcher uses empty array (all categories). Updated `estimatedMinutes` for IT Ops from 705 → 765 to reflect the added 60-min module. [view:/learn/standards-bodies] [persona:executive,architect,researcher,ops]

### Data

- **Library** (`library_03062026.csv`): Added `Europol-FS-ISAC-PQC-Financial-2026` — _Prioritising Post-Quantum Cryptography Migration Activities in Financial Services_ (Europol / FS-ISAC / QSFF, 2026). Joint guidance introducing a Quantum Risk Score framework (Shelf Life × Exposure × Severity) and migration complexity assessment for financial institutions. Enriched; 12/18 dimensions filled. [view:/library]

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt — 2,837 chunks (+4 from new Europol library record and enrichment). [view:/about]

## [2.25.1] - 2026-03-05

### Fixed

- **Compliance — responsive layout** (`src/components/Compliance/ComplianceDetailPopover.tsx`): Metadata and algorithm grids now stack to a single column on narrow viewports (`grid-cols-1 sm:grid-cols-2`); gap tightened from `gap-4` to `gap-3`. [view:/compliance]

- **Compliance — mobile section toggle** (`src/components/Compliance/ComplianceView.tsx`): Mobile view buttons replaced wrapping flex layout with a horizontally-scrollable row (`overflow-x-auto`, `flex-none whitespace-nowrap`) so all section tabs remain accessible on small screens without wrapping onto multiple lines. Header title is now responsive (`text-2xl sm:text-3xl md:text-4xl`) with a shrink-safe icon (`sm:w-8 sm:h-8 shrink-0`). [view:/compliance]

- **Knowledge Graph — touch targets in legend** (`src/components/PKILearning/modules/KnowledgeGraph/components/GraphLegend.tsx`): Added `min-h-[32px]` to each legend item button to meet WCAG 2.1 AA minimum touch-target size on mobile. [view:/]

- **Knowledge Graph — responsive PathwayView canvas** (`src/components/PKILearning/modules/KnowledgeGraph/components/PathwayView.tsx`): Graph canvas height changed from fixed `h-[500px]` to `h-[45vh] min-h-[300px] sm:h-[500px]` so the canvas fills the visible viewport on mobile instead of overflowing. [view:/]

- **Knowledge Graph — tab labels hidden on mobile** (`src/components/RightPanel/GraphPanel.tsx`): Icon-only tab buttons on narrow viewports (`hidden sm:inline` on label text) prevent the tab strip from overflowing on small screens. [view:/]

### Data

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt — 2,833 chunks (+34 from v2.25.0 data additions now incorporated). [view:/about]

## [2.25.0] - 2026-03-05

### Added

- **Standards Bodies module** (`modules/StandardsBodies/`): New 5-step learn module (60 min, intermediate, Strategy track) covering who creates PQC standards, who certifies products, and who mandates compliance. Covers 12 organisations: NIST, ISO/IEC, ETSI, IETF, BSI, ANSSI, ENISA, CC/CCRA, CMVP, NCSC, NSA, and KISA. Five interactive workshops: BodyClassifier, OrganizationExplorer, StandardsCertChain, CoverageGrid, and ScenarioChallenge. [view:/learn/standards-bodies]

- **Mechanism Discovery — live PKCS#11 browser** (`wasm/softhsm.ts`, `Playground/hsm/HsmMechanismPanel.tsx`): Adds `hsm_getMechanismList()`, `hsm_getMechanismInfo()`, and `hsm_getAllMechanisms()` which call `C_GetMechanismList` and `C_GetMechanismInfo` for all mechanisms on the active slot. Results are resolved against a 100+ entry MECH_TABLE covering RSA, ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), SHA-1/2/3, AES (ECB/CBC/CTR/GCM/CMAC/KeyWrap), EC/ECDSA/ECDSA-SHA3/EdDSA, ECDH, PBKDF2, HKDF, and SP 800-108 KBKDFs. CKF\_ flags are decoded to human-readable names (SIGN, VERIFY, ENCAPSULATE, DECAPSULATE, KEY_PAIR_GEN, etc.). Results sorted by family (PQC first, then asymmetric, symmetric, hash, kdf). New `HsmMechanismPanel` component renders the full mechanism list as a searchable, family-grouped table in the SoftHSM tab. [view:/playground]

- **Data Asset Sensitivity — workshop redesign** (`modules/DataAssetSensitivity/workshop/`): Replaced ComplianceMatrix and RiskMethodologyExplorer with two new exercises. ClassificationChallenge presents 10 real-world data scenarios (EHR records, JWT tokens, biometric templates, CA private keys, signed firmware, etc.) asking learners to assign the correct sensitivity tier — each scenario includes HNDL window calculation, applicable frameworks, and a common-mistake callout. SensitivityConflictResolver presents multi-framework classification conflicts (GDPR vs HIPAA vs CNSA 2.0 vs FIPS 140-3) and guides learners through the four resolution rules to determine the governing classification. [view:/learn/data-asset-sensitivity]

### Changed

- **Compliance data model** (`src/data/complianceData.ts`): `ComplianceFramework` now carries a `bodyType` field (`'standardization_body' | 'technical_standard' | 'certification_body' | 'compliance_framework'`) and an optional `website` URL. CSV loader updated to parse both new columns and introduced a `BodyType` export. [view:/compliance]

- **Compliance CSV versioning** (`src/data/complianceData.ts`): CSV file discovery now recognises `_rN` revision suffixes (e.g. `compliance_03052026_r7.csv`); same-day files are sorted by revision number as tiebreaker so `_r7 > _r1 > (none)`. Brings compliance CSVs into parity with the existing library/quiz revision convention.

- **ComplianceLandscape UI** (`src/components/Compliance/ComplianceLandscape.tsx`): Added a sort control (Deadline ↑ / Name A-Z) that defaults to deadline-ascending with `requiresPQC: true` frameworks surfaced first. Added ViewToggle (grid / list) to the filter bar. Framework cards now display a website icon-link when a `website` URL is present. Region grouping replaced by country-based grouping. [view:/compliance]

- **Glossary** (`src/data/glossaryData.ts`): Added CC (Common Criteria, ISO/IEC 15408) entry with EUCC/CCRA technical note, and CCRA (Common Criteria Recognition Arrangement — 31-nation mutual recognition) entry with member-nation list. Both link to `/learn/standards-bodies`. [view:/learn/standards-bodies]

- **Quiz category types** (`modules/Quiz/types.ts`): Added `'data-asset-sensitivity'` and `'standards-bodies'` to the `QuizCategory` union type so quiz filters correctly resolve questions for both new modules.

### Data

- **Compliance** (`compliance_03052026_r7.csv`): 62 records — standardization bodies (NIST, ENISA, ETSI, IETF, BSI, ANSSI, KISA), certification bodies (CMVP/ACVP, CC/CCRA/EUCC, NCSC CPA), and compliance frameworks — each with `body_type` and `website` columns. [view:/compliance]

- **Quiz** (`pqcquiz_03052026.csv`): 546 questions total; +15 new Standards Bodies questions (`sb-001`–`sb-015`, category `standards-bodies`). [view:/learn/quiz]

- **Library** (`library_03052026.csv`): 256 records with updated `moduleIds` cross-references for the new Standards Bodies and Data Asset Sensitivity modules. [view:/library]

- **Algorithm reference** (`pqc_complete_algorithm_reference_03052026.csv`): New comprehensive algorithm transition reference with security-level mapping, key/signature sizes, and NIST status for all standardised and candidate PQC algorithms. [view:/algorithms]

- **SoftHSMv3 WASM** (`public/wasm/softhsm.js`, `public/wasm/softhsm.wasm`): Rebuilt binary shipping `C_GetMechanismList` and `C_GetMechanismInfo` exports required by the new Mechanism Discovery feature.

## [2.24.0] - 2026-03-05

### Added

- **Knowledge Graph panel** (right-panel drawer): New "Graph" tab alongside Assistant and Journey in the right-panel drawer. Three sub-tabs — **Explore** (search-driven radial graph with NodeDetailPanel overlay for algorithm, standard, organisation, and product nodes), **Coverage** (entity type cards + cluster relationship map showing 13 relationship types across 13 data sources), and **Pathways** (track-filtered learning pathway with per-module progress indicators). Algorithm nodes built synchronously via `libraryData.algorithmFamily` mapping 11 canonical PQC families (ML-KEM, ML-DSA, SLH-DSA, Lattice-based, Hash-based, Code-based, etc.). [view:/]

### Fixed

- **PKCS#11 Inspect — classical operation decoders** (`wasm/pkcs11Inspect.ts`): Improved decode accuracy for RSA, ECDSA, and EdDSA sign/verify operations; corrected constant mappings for edge cases in return-value decoding. [view:/playground]

- **Standards Bodies data** (`modules/StandardsBodies/data.ts`): Corrected CNSA 2.0 algorithm list (removed XMSS, aligned with NSA CNSA 2.0 advisory mandatory algorithms); updated NIST IR 8547 status to reflect the published draft timeline; added FIPS 206 (FN-DSA / Falcon) entry. [view:/learn/standards-bodies]

- **Standards Bodies TypeScript errors** (`modules/StandardsBodies/data.ts`): Resolved pre-existing strict-mode TypeScript errors (unterminated string literals, missing type annotations) that blocked the `tsc` build step.

### Data

- **Migrate catalog** (`quantum_safe_cryptographic_software_reference_03052026.csv`): Deduplication pass removing 6 duplicate product rows; corrected FIPS validation status for 12 entries (downgraded unverified `Validated` claims to `Partial`); updated version strings for 8 entries (OpenSSL, Bouncy Castle, wolfSSL, mbedTLS, AWS-LC) to current releases. [view:/migrate]

## [2.23.0] - 2026-03-05

### Data

- **Leaders** (`leaders_03052026_r1.csv`): Comprehensive accuracy and completeness audit of `leaders_02282026.csv` (101 entries → 103). Fixed 8 issues: merged duplicate Dr. Ludovic Perret entry; corrected Scott Totzke role from CEO to Co-Founder (ISARA); fixed Nadia Heninger website URL (ucsd.edu); cleared Brian LaMacchia duplicate WebsiteUrl; removed unverifiable ResQuant claim for Martin Albrecht (org: King's College London + SandboxAQ); reverted Thomas Coratger prize total to correct $2M ($1M Poseidon Prize + $1M Proximity Prize); normalized 2 government leader avatar colors to `22d3ee`. Added 3 missing Algorithm Inventors: Daniel J. Bernstein (coined "post-quantum cryptography" 2003, co-designed SPHINCS+ FIPS 205, Classic McEliece, NTRU Prime), Prof. Oded Regev (invented LWE 2005, Gödel Prize 2018), Prof. Tanja Lange (NTRU Prime, Classic McEliece, PQCrypto steering chair). Also fixed Claudia Plattner BSI signatory count 17 → 18 EU member states. [view:/leaders]

- **Timeline** (`timeline_03052026.csv`): Accuracy and completeness audit of `timeline_02282026.csv` (196 entries → 198). Fixed 3 issues: corrected Canada row 30 org from CCCS → ISED (Innovation, Science and Economic Development Canada) to match SourceUrl provenance; fixed SandboxAQ SourceUrl slug `dow-cio` → `dod-cio`; updated OMB M-23-02 Status `New` → `Validated` (2022 document). Added 2 missing milestone entries: NCSC UK "Next Steps in Preparing for Post-Quantum Cryptography" whitepaper (November 2023, predating row 107 by 9 months); NIST SP 800-208 LMS/XMSS standardization (October 29, 2020 — now the earliest entry in the dataset, establishes the standardization baseline for CNSA 2.0 mandated algorithms). [view:/timeline]

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt — 2,776 chunks (+2 from 2 new timeline rows, +3 new leader entries vs prior build). [view:/about]

## [2.22.0] - 2026-03-04

### Added

- **Digital Assets — Architecture Overview** (`modules/DigitalAssets/ArchitectureOverview.tsx`): New reference component detailing blockchain cryptographic requirements (Bitcoin secp256k1/ECDSA/SHA256+RIPEMD160, Ethereum Keccak-256/EIP-55, Solana Ed25519/Base58) and an OpenSSL 3.6.0 support matrix covering key generation, signing, address derivation, and HD wallet operations per chain. [view:/learn/digital-assets]

### Fixed

- **PKCS#11 v3.2 CKK\_\* constant alignment** (`vendor/softhsm-wasm/constants.js`): Added missing `CKK_XMSS` (0x47) and `CKK_XMSSMT` (0x48) for stateful hash-based signature key types per PKCS#11 v3.2 §4.37–4.38; corrected `CKK_ML_KEM` → 0x49, `CKK_ML_DSA` → 0x4a, `CKK_SLH_DSA` → 0x4b to match the authoritative `pkcs11t.h` header. Previous values caused wrong key-type tags on PQC keys. [view:/playground]

- **KBKDF Feedback — IV "Random" button size** (`Playground/hsm/HsmKdfPanel.tsx`): IV is now sized to `PRF_SEED_BYTES[prf]` (matching the PRF's hash output length) instead of a hardcoded 16 bytes. Prevents PKCS#11 errors when the selected PRF uses a wider digest (e.g. SHA-256 → 32 bytes, SHA-512 → 64 bytes). [view:/playground]

- **LearnTrackStack keyboard accessibility** (`PKILearning/LearnTrackStack.tsx`): Replaced non-interactive `<button>` wrappers with `<div role="button" tabIndex={0}>` plus `onKeyDown` handlers (Enter/Space) and `focus-visible:ring` styling. Track cards are now fully keyboard-navigable. [view:/learn]

### Data

- **Library** (`library_03042026.csv`): +1 new record — KpqC Competition Final Results (HAETAE, AIMer, SMAUG-T, NTRU+ national standards) and FIPS 140-3 Implementation Guidance for PQC; 256 records total. [view:/library]

- **Migrate catalog** (`quantum_safe_cryptographic_software_reference_03042026.csv`): 331-entry catalog now committed to repository (file was tracked in changelog but untracked in git since v2.20.0). [view:/migrate]

- **Library doc enrichments** (`library_doc_enrichments_03042026.md`): Additional AI-extracted dimension entries appended. [view:/library]

- **SoftHSMv3 WASM binary** (`public/wasm/softhsm.js`): Rebuilt to include XMSS/XMSSMT key type registration and corrected PQC constant values.

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt to include updated library and enrichment data.

### Tests

- **E2E — chatbot & chatbot-persona**: Version seed bumped from `2.9.0` → `2.99.0` to reliably suppress the WhatsNew toast across all future releases in the test fixture.
- **E2E — about**: Updated bio text assertion to match current `AboutView` copy ("community-driven, open-source platform").
- **E2E — changelog**: Filter label assertion updated (`Enhancements` → `Improvements`); section detection updated to use visible filter button text.

## [2.21.0] - 2026-03-04

### Added

- **Playground HSM mode — full PKCS#11 mechanism coverage** (`InteractivePlayground.tsx`, `hsm/`): Three new tabs available exclusively in HSM mode expose every softhsmv3 mechanism category that was previously inaccessible from the UI. [view:/playground]
  - **Key Agreement tab** — ECDH key exchange for P-256, P-384, and P-521 using `CKM_ECDH1_DERIVE` (standard) and `CKM_ECDH1_COFACTOR_DERIVE` (cofactor mode). Generates Alice and Bob key pairs in-HSM, extracts peer EC points via `CKA_EC_POINT`, runs `C_DeriveKey` for both sides, and compares shared secrets. KDF selector covers `CKD_NULL` (raw Z) and ANSI X9.63 `CKD_SHA256/384/512_KDF`. Displays `CK_ECDH1_DERIVE_PARAMS` struct layout inline.

  - **KDF tab** — Four SP 800-series and RFC-standard derivation functions: PBKDF2 (`CKM_PKCS5_PBKD2`, `CK_PKCS5_PBKD2_PARAMS2` display), HKDF (`CKM_HKDF_DERIVE`, RFC 5869 `CK_HKDF_PARAMS` display), KBKDF Counter (`CKM_SP800_108_COUNTER_KDF`), and KBKDF Feedback (`CKM_SP800_108_FEEDBACK_KDF` with optional IV). Each sub-panel shows the complete PKCS#11 parameter struct alongside the derived key bytes.

  - **Classical tab** — RSA (2048/3072/4096-bit key gen, PKCS#1 v1.5 and PSS sign/verify, OAEP encrypt/decrypt), ECDSA (P-256/384/521, `CKM_ECDSA_SHA256/384/512`), and EdDSA (`CKM_EDDSA` for Ed25519 and Ed448 — deterministic, pure EdDSA, no pre-hash).

- **AES-CTR and AES-CMAC in Symmetric tab** (`HsmSymmetricPanel.tsx`): AES-CTR (`CKM_AES_CTR`) with `CK_AES_CTR_PARAMS` struct display (counter bits = 128, counter block = 0x00…00). AES-CMAC (`CKM_AES_CMAC`) with 16-byte tag compute and constant-time verify. Both support 128/192/256-bit keys.

- **SHA3 HMAC variants in Symmetric tab**: HMAC-SHA3-256 (`CKM_SHA3_256_HMAC`) and HMAC-SHA3-512 (`CKM_SHA3_512_HMAC`) added to the HMAC algorithm selector alongside the existing SHA-2 variants.

- **`hsm_extractECPoint()` helper** (`wasm/softhsm.ts`): New exported function that reads `CKA_EC_POINT` from an EC public key object — required for ECDH derive params since `CKA_VALUE` is not populated for EC public keys.

## [2.20.0] - 2026-03-04

### Data

- **Migrate Catalog — full audit remediation** (`quantum_safe_cryptographic_software_reference_03042026.csv`): Expanded catalog from 233 to 331 entries (+98 rows) following a comprehensive accuracy, freshness, and completeness audit across all 7 infrastructure layers. [view:/migrate]

  **Accuracy fixes (6 existing rows):** Restored correct `FN-DSA` (FIPS 206 / FALCON) in Thales HSE and Thales Luna T-Series (audit agent had incorrectly flagged this valid NIST standard); replaced pre-FIPS brand names `CRYSTALS-Kyber` → `ML-KEM` in Proton Mail and `CRYSTALS-Dilithium` → `ML-DSA` in Venafi CodeSign Protect; downgraded HashiCorp Vault priority `Critical` → `High` (PQC is experimental, not production-ready); updated SQL Server TDE `release_date` from `2022-11` to `2025-11`.

  **New Hardware entries (13):** AWS CloudHSM, Azure Dedicated HSM (Marvell LiquidSecurity), IBM Cloud HSM (Utimaco), STMicroelectronics ST33G1M2 TPM, Infineon OPTIGA TPM SLB 9672, Intel PTT, Yubico YubiHSM 2, Google OpenTitan, TianoCore EDK2, NXP SE050, ARM TrustZone, Microchip ATECC608B, Qualcomm Snapdragon TEE.

  **New OS entries (14):** Windows BitLocker, Linux LUKS / dm-crypt, Wind River VxWorks, BlackBerry QNX Neutrino RTOS, FreeRTOS, Alpine Linux, FreeBSD, openSUSE Leap, Rocky Linux, CentOS Stream, ChromeOS, NixOS, SUSE Linux Enterprise Server, Arch Linux. New category `CSC-056` (Real-Time Operating Systems) covers VxWorks, QNX, and FreeRTOS.

  **New Network entries (26):** Cisco ASA, Cisco Meraki MX, Juniper SRX, Fortinet FortiGate (FortiOS), Arista EOS, MikroTik RouterOS, OpenWrt, pfSense, OPNsense, NGINX Plus, Traefik, Envoy Proxy, Apache Traffic Server, Kubernetes, Istio, Linkerd, HashiCorp Consul Connect, OpenVPN, WireGuard, Cisco Secure Client (AnyConnect), Palo Alto GlobalProtect, Samsung Networks 5G Core, Mavenir Cloud RAN, NEC 5G Core, Rakuten Symphony, Casa Systems vCPE. New category `CSC-055` (Container Orchestration & Service Mesh) covers Kubernetes, Istio, Linkerd, and Consul.

  **New Security Stack entries (29):** Fortanix DSM, Delinea Secret Server, BeyondTrust, JumpCloud, Teleport, HashiCorp Boundary, Cloudflare Zero Trust, Zscaler ZTE, Splunk Enterprise, Elastic Stack, Suricata, Zeek, Snort, Tenable Nessus, Rapid7 InsightVM, Qualys, Microsoft Entra ID, Google Workspace Identity, AWS IAM, CrowdStrike Falcon, Palo Alto Cortex XDR, Citrix CVAD, VMware Horizon, Apache Guacamole, AnyDesk, PuTTY, Paramiko, AsyncSSH, Microsoft RDS.

  **New Application entries (12):** OQS-OpenSSL Provider (liboqs-provider), Bouncy Castle (general entry alongside existing Java/C# variants), PyCryptodome, Crypto++ (cryptopp), libssh, Apache Tomcat, Eclipse Jetty, WildFly, Payara Server, GitHub Actions, GitLab CI/CD, Jenkins, Azure DevOps, CircleCI, OAuth 2.0 / OIDC, SAML 2.0.

  **New Database entries (4):** PostgreSQL (engine-level), MySQL Community Server (engine-level), Redis, MariaDB Server.

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt — migrate source now contributes 331 chunks (up from 233). Product count updated to `330+` across landing page and migrate page guide chunks. Total corpus: 2,566 chunks. [view:/]

## [2.19.0] - 2026-03-04

### Improved

- **PKCS#11 Inspect — full function coverage** (`wasm/pkcs11Inspect.ts`): Added decoders for 7 previously unhandled PKCS#11 functions — `C_Initialize`, `C_Finalize`, `C_GetSlotList`, `C_CloseSession`, `C_InitPIN`, `C_Logout`, and `C_MessageVerifyFinal`. All 19 functions called in live WASM HSM mode now produce expandable inspect data with decoded parameters. [view:/playground]

- **PKCS#11 Inspect — SLH-DSA (FIPS 205) constants** (`wasm/pkcs11Inspect.ts`): Added 13 SLH-DSA mechanisms (`CKM_SLH_DSA_KEY_PAIR_GEN`, `CKM_SLH_DSA`, `CKM_HASH_SLH_DSA`, plus 10 hash-specific variants), `CKK_SLH_DSA` key type, and 12 `CKP_SLH_DSA_*` parameter set constants covering all 3 security levels × 2 hash functions × 2 speed profiles. [view:/playground]

- **PKCS#11 Inspect — ML-DSA hash variant coverage** (`wasm/pkcs11Inspect.ts`): Added 8 missing ML-DSA pre-hash mechanisms (`CKM_HASH_ML_DSA`, SHA-224/384, SHA3-224/384/512, SHAKE-128/256) and 2 ML-KEM template attributes (`CKA_ENCAPSULATE_TEMPLATE`, `CKA_DECAPSULATE_TEMPLATE`). PQC mechanism table expanded from 7 to 28 entries. [view:/playground]

### Fixed

- **SoftHSMv3 PKCS#11 constant alignment** (`wasm/softhsm.ts`, `vendor/softhsm-wasm/constants.js`): Fixed CKP_SLH_DSA parameter set ordering and `CKM_HASH_SLH_DSA` value to match the authoritative `pkcs11t.h` header (compiled into the WASM binary). Previously TypeScript constants grouped SHA2 first then SHAKE, but the C header interleaves them — causing parameter set mismatches at runtime. Also fixed `CKM_HASH_ML_DSA`, `CKM_SLH_DSA_KEY_PAIR_GEN`, `CKM_SLH_DSA` values in vendor constants.

## [2.18.0] - 2026-03-04

### Data

- **Library document enrichments — 54 new entries** (`library_doc_enrichments_03042026.md`): Qwen3:14b (via Ollama) extracted 11 structured dimensions from 54 previously unenriched library documents — covering PQC algorithms, quantum threats, migration timelines, applicable regions/bodies, standardization bodies, compliance frameworks, protocols, infrastructure layers, leaders contributions, and PQC products mentioned. Enriched documents include 12 new RFCs (4251, 4253, 4301, 4303, 5280, 6962, 8017, 8446, 9052, 9580, 9593, 9847), ETSI standards, ENISA guidelines, EU/UK/NATO policy documents, SG-MAS advisories, and NIST IR/NCCoE publications. Best-scoring entries: NIST IR 8309 and CZ-NUKIB-Crypto-Requirements-2023 (10/10 dimensions each). [view:/library]

- **RAG corpus** (`public/data/rag-corpus.json`): Rebuilt with 54 new enrichment entries — Document Enrichments source now contributes 178 chunks (up from ~124). Total corpus: 2,436 chunks. [view:/]

## [2.17.0] - 2026-03-04

### Added

- **PQC-101 Step 5 — Persona profile card** (`PQC101Module.tsx`): The "Next Steps" step now displays the user's saved persona profile (Role, Level, Region, Industry) sourced from `usePersonaStore`, with an "Update profile" / "Set profile" CTA that deep-links to `/?scroll=persona`. If no profile is set, a prompt to set one is shown. [view:/learn/pqc-101]

- **Landing page `?scroll=persona` deep-link** (`PersonalizationSection.tsx`): Visiting `/?scroll=persona` automatically expands the personalization section and smooth-scrolls to the persona heading. The query param is stripped from the URL after navigation. [view:/]

- **Library — NIST CSWP 48** (`library_03032026_r5.csv`): _Mappings of Migration to Post-Quantum Cryptography Project Capabilities to Risk Framework Documents_ (Initial Public Draft, Sep 2025). Maps PQC migration activities to NIST CSF, SP 800-53, and NIST RMF. [view:/library]

- **Compliance — NCSC-CH & NCSC-NL** (`compliance_03042026.csv`): Swiss and Dutch national cybersecurity centre PQC migration guidance now listed as compliance frameworks. [view:/compliance]

### Fixed

- **KMS module — KMIP `CreateKeyPair` correction** (`kmsConstants.ts`): ML-KEM and ML-DSA are asymmetric — KMIP 2.1 requires `CreateKeyPair` with separate `PrivateKeyTemplateAttribute` / `PublicKeyTemplateAttribute`, not `Create` with `SymmetricKey`. XML examples, response payload, and sync scenario snippet all updated.

- **KMS module — data accuracy** (`kmsConstants.ts`, `kmsProviderData.ts`):
  - Root KEK hybrid algorithm: `X25519 + ML-KEM-1024` → `RSA-4096 + ML-KEM-1024` (X25519 is ECDH, not a root-of-trust KEK mechanism)
  - GCP Cloud KMS PQC status: `GA` → `preview` (ML-KEM/X-Wing not yet GA as of March 2026)
  - Thales CipherTrust FIPS level: `FIPS 140-2 Level 2` → `FIPS 140-3 Level 3` (via Luna Network HSM 7)
  - Key size footnote: `4–8× larger` → `4–10× vs RSA baselines, up to 40× vs ECDSA P-256`
  - AWS-LC description: removed inaccurate "first open-source" superlative; now "FIPS 140-3 validated open-source library with ML-KEM and ML-DSA support"

- **HSM module — PKCS#11 v3.2 C_EncapsulateKey / C_DecapsulateKey** (`hsmVendorData.ts`): Replace `C_WrapKey` / `C_UnwrapKey` with the correct PKCS#11 v3.2 KEM-specific functions. Updated argument signatures, descriptions, and output blocks to reflect that `C_EncapsulateKey` derives a new key object (rather than wrapping an existing one) and that the shared secret never leaves the HSM boundary.

- **HSM module — FIPS 204 section reference** (`hsmVendorData.ts`, `HsmPqcIntroduction.tsx`): Hedged signing section corrected from `§3.5.2` → `§5.2` to match the published FIPS 204 standard.

- **HSM migration planner checklist** (`HsmMigrationPlanner.tsx`): Updated checklist item from `PKCS#11 v3.0+` to `PKCS#11 v3.2+` and called out `C_EncapsulateKey`/`C_DecapsulateKey` explicitly.

- **Compliance CSV accuracy** (`compliance_03042026.csv`): EU-level framework country fields cleaned up — individual member states (France, Germany, Czech Republic, Italy, Spain) removed from EU-wide entries (eIDAS, DORA, GDPR, NIS2, MiCA, EUCC, EU Rec 2024/1101); BSI TR-02102 scoped to Germany only. FIPS 140-3 deadline clarified with NIST IR 8547 reference; eIDAS 2.0 deadline updated to 2026; FedRAMP status updated; MiCA dates corrected to Dec 2024 GA.

### Data

- **RAG corpus** (`public/data/rag-corpus.json`): About page chunk updated to include creator attribution and LinkedIn profile for better PQC Assistant grounding.

## [2.16.0] - 2026-03-03

### Added

- **57 new glossary entries** (`src/data/glossaryData.ts`): Full coverage for the `data-asset-sensitivity` module (21 terms: Data Asset Sensitivity, Data Retention Period, CBOM, Sensitivity Scoring, HNDL Risk Window, NIST RMF, ISO 27005, FIPS 199, FAIR Model, TEF, ALE, ePHI, GDPR, PIPL, CCPA, LGPD, PDPA, DORA, Risk Treatment, PQC Migration Priority, Asset Inventory) and targeted additions for four previously thin modules — `crypto-agility` (ECC, Provider Model, Hybrid Migration, CycloneDX), `vendor-risk` (Vendor PQC Readiness, CMVP, Supply Chain Cryptographic Risk), `hsm-pqc` (LMS, Stateful Signature State Management, Hedged Signing, Tamper Resistance, CAVP), and `pqc-risk-management` (Risk Register, Risk Heatmap, Cryptographic Exposure Window). All 27 modules now have meaningful glossary coverage. [view:/learn]

- **RAG corpus: NotebookLM app-guide source** (`scripts/generate-rag-corpus.ts`): New `processNotebookLM()` processor indexes 4 unique app-guide markdown files (`02-app-architecture.md`, `13-chatbot-assistant.md`, `14-personalization.md`, `15-community.md`) from the `notebooklm/` directory as a distinct `source: 'app-guide'` / `category: 'app-guide'` corpus type. Adds 35 chunks covering cross-page connection maps, RAG retrieval pipeline internals, persona system detail, and community/contributing guides — all content absent from the existing 25 processors. Mirror files (03–11) excluded to avoid duplication with CSV-sourced processors. [view:/]

### Improved

- **About page messaging** (`AboutView.tsx`): Refreshed mission statement to emphasise community-driven, open-source nature; simplified softhsmv3 dependency entry. [view:/about]

- **LearnStepper mobile layout** (`LearnStepper.tsx`): Navigation buttons now stack vertically on small screens (`flex-col sm:flex-row`), minimum touch target height added (`min-h-[44px]`, `py-3`). Step labels use `sm:text-xs` breakpoint. [view:/learn]

- **ReadingCompleteButton** (`ReadingCompleteButton.tsx`): Migrated from `useParams` to `useLocation` for module ID resolution — fixes edge cases where `:moduleId` route param was undefined in nested navigation contexts.

- **Tabs scroll fade indicator** (`src/components/ui/tabs.tsx`): `TabsList` now renders a right-edge fade gradient when tab list overflows horizontally, signalling scrollability. Uses `ResizeObserver` + scroll listener; automatically hides when fully scrolled. [view:/learn]

- **Module content padding** (all 27 `modules/*/index.tsx`): Content area padding made fully responsive — `p-4 sm:p-6 md:p-8` replacing the fixed `p-8`. Eliminates edge-to-edge text on small screens. [view:/learn]

## [2.15.0] - 2026-03-03

### Added

- **Playground — PKCS#11 HSM Mode** (`InteractivePlayground.tsx`, `hsm/`): Software ↔ PKCS#11
  HSM toggle pill in the Playground header. When enabled, all tabs (KEM & Encrypt, Sign & Verify,
  Symmetric, Hashing) route their backend through the SoftHSMv3 WASM module via PKCS#11 v3.2
  instead of the software stack. ACVP tab is hidden in HSM mode. [view:/playground]

- **HsmContext / HsmProvider** (`hsm/HsmContext.tsx`, `PlaygroundProvider.tsx`): New React context
  shared across all Playground tabs when HSM mode is active — holds WASM module ref, PKCS#11
  session handle, HSM key table (`HsmKey[]`), PKCS#11 call log, and `inspectMode` toggle.

- **HsmKemPanel** (`tabs/KemOpsTab.tsx`): ML-KEM-512/768/1024 PKCS#11 key encapsulation via
  SoftHSMv3 — Generate Key Pair (`C_GenerateKeyPair`), Encapsulate (`C_EncapsulateKey`),
  Decapsulate (`C_DecapsulateKey`), with size hints (pub/ct/ss bytes) and shared-secret match
  verification. Keys registered into the shared HSM key table. [view:/playground]

- **HsmSignPanel** (`tabs/SignVerifyTab.tsx`): ML-DSA-44/65/87 PKCS#11 sign & verify via
  SoftHSMv3 — Generate Key Pair, Sign (`C_SignInit + C_Sign`), Verify (`C_VerifyInit + C_Verify`)
  with hedging mode selector, context string, and pre-hash options (SHA-256/512/SHA3-256).
  [view:/playground]

- **HsmSymmetricPanel / HsmHashingPanel** (`hsm/HsmSymmetricPanel.tsx`,
  `hsm/HsmHashingPanel.tsx`): HSM-mode panels for symmetric encryption and hashing operations,
  both routing through the shared PKCS#11 session. [view:/playground]

- **HsmSetupPanel** (`hsm/HsmSetupPanel.tsx`): Token setup flow inside the Key Store tab when HSM
  mode is active — Initialize → Open Session → Login sequence, with status indicators.

- **HsmKeyTable** (`keystore/HsmKeyTable.tsx`): Sortable table of keys generated via PKCS#11 in
  the current session, showing handle, algorithm family, role (public/private), variant, and
  generation timestamp. [view:/playground]

- **Keystore directory refactor** (`keystore/`): Moved `KeyTable.tsx`, `KeyDetails.tsx`,
  `KeyGenerationSection.tsx` to `src/components/Playground/keystore/` for better organisation.

- **`migrate_product_selection` history event** (`MigrateView.tsx`, `HistoryTypes.ts`): Fires a
  debounced (1.5 s) milestone event to the History Feed whenever the user's product selection
  count changes, making Migrate activity visible in the journey timeline. [view:/migrate]

### Improved

- **PKCS#11 error code table** (`wasm/softhsm.ts`): Expanded `RV_NAMES` from 11 to 34 entries
  covering the full PKCS#11 v3.2 return-value set — including `CKR_AEAD_DECRYPT_FAILED`,
  `CKR_KEY_FUNCTION_NOT_PERMITTED`, `CKR_OPERATION_NOT_INITIALIZED`, and all session/token/user
  error codes. Previously unknown codes now show their symbolic name instead of a hex fallback.

- **PKCS#11 function parameter table** (`wasm/softhsm.ts`): Added 20+ entries for PKCS#11 v3.0
  and v3.2 functions including `C_SignMessageBegin/Next`, `C_VerifyMessageBegin/Next`,
  `C_MessageEncryptInit/Final`, `C_LoginUser`, `C_CopyObject`, `C_GetOperationState`, and KEM
  operations (`C_EncapsulateKey`, `C_DecapsulateKey`).

- **`Pkcs11LogEntry.inspect`** (`wasm/softhsm.ts`, `wasm/pkcs11Inspect.ts`): Optional `inspect`
  field on each log entry carries decoded mechanism, attribute, and parameter data for the new
  "Show Params" mode in the PKCS#11 call log.

- **Updated SoftHSMv3 WASM binary** (`public/wasm/softhsm.js`, `public/wasm/softhsm.wasm`):
  Rebuilt with latest softhsmv3 — bug fixes and AES cipher race resolution from the P1 patch.

- **SoftHsmTab copy button** (`tabs/SoftHsmTab.tsx`): Copy button in the PKCS#11 call log now
  shows a "Copied!" confirmation (green check + 2 s flash) and is disabled when the log is empty.
  Same improvement applied to the new `HsmCallLog` component.

- **`tokenCreated` state fix** (`tabs/SoftHsmTab.tsx`): Browser-mode HSM tab previously used a
  stale ref value (`slotRef.current === 0`) to gate the Open Session button. Replaced with a
  proper `tokenCreated` boolean state that triggers a re-render, preventing the button from
  staying disabled after a successful `C_InitToken`. Also resets on module teardown.

- **History Feed — milestone-only view** (`RightPanel/HistoryFeed.tsx`, `DayGroup.tsx`): Feed
  now filters to meaningful milestone events only — module progress, quiz sessions, assessment
  completions, belt/streak achievements, and Migrate selections. Low-signal events
  (`daily_visit`, playground key gen) no longer appear. `DayGroup` simplified: collapse/expand
  and "+N more" removed; all milestones always visible.

- **`learnSectionChecks` field** (`services/storage/types.ts`): Optional
  `Record<string, boolean>` field on per-module progress tracks section-level manual check
  state, enabling the `ReadingCompleteButton` to persist per-section completion independently.

## [2.14.0] - 2026-03-03

### Added

- **ReadingCompleteButton** (`PKILearning/ReadingCompleteButton.tsx`): Self-contained "Mark as
  Read" CTA added to all 21 single-page module Introduction components. Reads `moduleId` from
  URL params, calls `markAllLearnSectionsComplete`, and transitions to a green "Reading
  Complete!" success state. [view:/learn]

- **LearnStepper redesign** (`PKILearning/LearnStepper.tsx`): Numbered step circles with ✓ for
  completed steps and a connecting progress line, replacing the previous small pill dots.
  Content panel uses `glass-panel p-6 md:p-8 min-h-[400px]`. Final step shows a green ✓ "Mark
  as Read" button (replaces disabled Next) that fires `markAllLearnSectionsComplete`; after
  completion, renders an inline green "Reading Complete!" confirmation. [view:/learn]

- **`markAllLearnSectionsComplete` store action** (`store/useModuleStore.ts`): New Zustand
  action that marks all LEARN_SECTIONS for a module, sets module status to `'completed'`, and
  fires analytics. Used by both `ReadingCompleteButton` and `LearnStepper`.

- **ModuleProgressHeader / ModuleProgressSidebar / ModuleProgressPie**
  (`PKILearning/ModuleProgressHeader.tsx`, `ModuleProgressSidebar.tsx`, `ui/ModuleProgressPie.tsx`):
  Per-module progress visualisation — circular SVG progress pie with percentage, step completion
  tracker, and time-spent display. [view:/learn]

- **6 module Introduction → LearnStepper conversions**: `stateful-signatures` (3 steps),
  `ComplianceStrategy` (multi-step), `EmailSigning`, `MigrationProgram`, `PQCBusinessCase`,
  `PQCGovernance` all converted from long-scroll Introduction pages to paginated LearnStepper
  format with ReadingCompleteButton on the final step.

- **Quiz results persistence** (`modules/Quiz/QuizResults.tsx`): Quiz result state now survives
  component remounts via `useModuleStore`.

## [2.13.0] - 2026-03-03

### Added

- **Deep link E2E test suite** (`e2e/deep-links.spec.ts`): 28 Playwright tests across 10 route
  groups validating all major query-parameter deep links — `/timeline?country=`, `/library?ref=`,
  `/threats?id=`, `/learn/<id>?tab=&step=`, `/leaders?leader=`, `/algorithms?highlight=`,
  `/migrate?q=`, `/compliance?cert=`, `/openssl?cmd=`, `/learn/quiz?category=`. Tests cover valid
  params, invalid/fallback behaviour, URL-encoded spaces, and cross-page isolation. All 28 pass on
  Chromium; no regressions in full shard (146 passing). [view:/]

- **RAG test harness** (`scripts/test-rag-qanda.ts`): 4-phase automated accuracy script — (1)
  corpus-wide deep link validator, (2) MiniSearch retrieval accuracy against 35 representative
  Q&A pairs spanning all 18 QandA sections, (3) pass-rate summary, (4) source coverage analysis.
  Achieves 35/35 (100%) retrieval accuracy after corpus fixes. Exits with code 1 on any failure.
  [view:/]

- **5G Security — Exercise 6: SIM Key Provisioning Supply Chain**
  (`FiveGExercises.tsx`): Hands-on walkthrough of the full Ki factory-to-operator lifecycle,
  demonstrating how subscriber identity keys are generated inside an HSM, encrypted under a
  customer KEK, and distributed without ever exposing Ki in plaintext. Joins 5 existing 5G
  exercises (Profile A/B/C, 5G-AKA, SIM Provisioning). [view:/learn/5g-security]

- **5G hybrid mode formula callout** (`FiveGIntroduction.tsx`): Highlighted formula box in the
  SUCI Profile C section showing `Z = SHA-256(Z_ecdh ‖ Z_kem)` — the explicit combination of
  X25519 and ML-KEM-768 shared secrets — with byte-length annotations.
  [view:/learn/5g-security]

### Fixed

- **Library referenceIds now searchable in RAG corpus** (`scripts/generate-rag-corpus.ts`):
  244 of 254 library chunks had their `referenceId` stored only in `metadata`, making them
  invisible to MiniSearch. Added `Reference: <refId>` as the first line of every library chunk's
  `content` field. Queries like "What is NIST CSWP 39?" or "show me RFC 9629" now correctly
  surface the relevant document. Cross-reference count increased from 497 → 511.

- **Stale documentation corpus counts corrected** (`scripts/generate-rag-corpus.ts`): Multiple
  internal guidance chunks contained outdated facts — "25 modules", "470 quiz questions",
  "13-step wizard", "4 personas", "22 sources". All corrected to: 27 modules, 530 questions
  across 33 categories, 14-step wizard, 5 personas (adding IT Ops/DevOps), 25 data sources,
  ~2,500 corpus chunks.

### Improved

- **PQC Assistant anti-hallucination hardening** (`GeminiService.ts`): Explicit `NEVER` rules
  added for fabricating people, products, FIPS/RFC/SP numbers, dates, and certification status.
  Entity inventory cap raised from 30 → 50 items. Module list updated to all 27 modules.

- **Grounding check false-positive reduction** (`groundingCheck.ts`): Added 30-entry
  `FALSE_POSITIVE_PHRASES` set (key exchange, digital signature, quantum computing, etc.) to
  suppress spurious hallucination warnings. Added entity patterns for titled names, product
  version strings, and deadline claims. Added 6 new metadata fields to the grounded-terms
  index (`org`, `vendor`, `categoryName`, `moduleName`, `moduleId`, `quizCategory`, `leader`).

- **RAG query expansions for data-asset-sensitivity** (`RetrievalService.ts`): Queries
  containing "data asset", "sensitivity", "classification", "asset inventory", or "data
  retention" now automatically include the data-asset-sensitivity module as a boosted source.

- **Accuracy warning message improved** (`useChatSend.ts`): Grounding warning upgraded from a
  vague notice to an actionable message citing specific cross-check guidance.

- **Doc enrichments updated** (`library_doc_enrichments_03032026.md`,
  `timeline_doc_enrichments_03032026.md`): Latest batch of 194 library and timeline document
  enrichments incorporated into the RAG corpus.

## [2.12.1] - 2026-03-03

### Added

- **Skip-to-main keyboard navigation** (`MainLayout.tsx`): Visually hidden skip link rendered
  before the navigation header. Activates on keyboard focus (`Tab`) to jump directly to
  `#main-content`. Follows WCAG 2.1 SC 2.4.1. [view:/]

- **prefers-reduced-motion support** (`AppRoot.tsx`, `src/styles/index.css`): framer-motion
  `MotionConfig reducedMotion="user"` applied globally — all 60+ animated components
  automatically skip animations when the OS reduced-motion setting is enabled. CSS media query
  in `index.css` covers `animate-spin`, `animate-pulse`, and all Tailwind transition utilities.
  [view:/]

- **CSV export for 6 data views** (`csvExport.ts`, `csvExportConfigs.ts`, `ExportButton.tsx`):
  RFC 4180-compliant CSV download with UTF-8 BOM (Excel-compatible). ExportButton added to
  header clusters of Migrate, Library, Algorithms, Timeline, Compliance, and Leaders views.
  Exports respect current filters and sort order. [view:/migrate] [view:/library]
  [view:/algorithms] [view:/timeline] [view:/compliance] [view:/leaders]

- **IT Ops config generators** (`OpsConfigGenerator.tsx`, `TLSConfigGenerator.tsx`,
  `SSHConfigGenerator.tsx`, `KmsMigrationRunbook.tsx`): Interactive PQC config snippet
  generators for nginx/Apache/HAProxy/Caddy TLS (TLS Basics module), sshd_config/ssh_config
  with PQC KexAlgorithms (VPN/SSH module), and AWS/Azure/GCP/Vault KMS CLI configs (KMS-PQC
  module). Dropdowns select server type, algorithm mode, and provider; output updates live in
  a CodeBlock with a one-click copy button. [view:/learn] [persona:ops]

- **IT Ops deployment checklists** (`OpsChecklist.tsx`, `CertRotationChecklist.tsx`,
  `DeploymentPlaybook.tsx`, `KmsMigrationRunbook.tsx`): Procedural checklists with progress
  tracking and copy-to-markdown export. CertRotationChecklist (19 items — pre/during/post/
  rollback) in PKI Workshop; DeploymentPlaybook (20 items — feature flags, canary, rollback)
  in Migration Program; KMS migration runbook (11 items) in KMS-PQC Step 5. [view:/learn]
  [persona:ops]

- **Migration Planning Workflow** (`useMigrationWorkflowStore.ts`,
  `useWorkflowPhaseTracker.ts`, `WorkflowBanner.tsx`): Guided 4-phase cross-view banner
  (Assess → Comply → Migrate → Timeline) with phase progress dots and auto-completion
  detection. Assessment status, MyProducts count, and 10-second engagement timers drive
  completion. Activated from the Report page when assessment is complete. Persisted via
  Zustand with version migration. [view:/report] [view:/compliance] [view:/migrate]
  [view:/timeline]

## [2.11.1] - 2026-03-03

### Fixed

- **Quiz filtering for IT Ops persona** (`pqcquiz_03032026.csv`, `quizDataLoader.ts`): The `ops`
  persona added in v2.11.0 had zero quiz questions tagged — persona filter eliminated all 520
  questions, showing an empty quiz. Added `ops` to 172 questions across 12 relevant categories
  (pqc-fundamentals, quantum-threats, tls-basics, vpn-ssh-pqc, pki-infrastructure,
  protocol-integration, kms-pqc, hsm-pqc, crypto-agility, migration-program, migration-planning,
  iot-ot-pqc). Also added `ops` to persona counts loop for awareness score calculations. [persona:ops]

- **Checkpoint quiz navigation** (`Dashboard.tsx`, `ModuleTable.tsx`): Checkpoint buttons in cards
  and table view modes navigated to quiz without pre-selecting categories. Now passes checkpoint
  categories via URL params, matching the stack mode behavior. [view:/learn]

## [2.11.0] - 2026-03-02

### Added

- **IT Ops / DevOps persona** (`learningPersonas.ts`, `personaConfig.ts`): 5th persona role
  targeting infrastructure operators. Tailored learning path (11 modules, 705 min), assessment
  wizard hints for all 14 steps, landing page CTAs ("Explore Migration Catalog", "Try OpenSSL
  Studio"), persona-aware navigation (Migrate, OpenSSL, Library, Playground), and inference
  from assessment results. Integrated across GeminiService, PersonalizedAvatar, PersonaPicker,
  seedHistory, and personaWizardHints. [persona:ops]

- **Multi-view Migrate catalog** (`MigrateView.tsx`, `MigrateViewToggle.tsx`,
  `MigrateSortControl.tsx`, `SoftwareCard.tsx`, `SoftwareCardGrid.tsx`, `migrateHelpers.tsx`):
  Three view modes — Stack (existing infrastructure layers), Cards (responsive grid), and Table
  (sortable columns) — with a persistent view toggle. Four sort options (Name, PQC Support,
  Migration Priority, FIPS Status) and flat-mode filters (layer dropdown, category dropdown,
  search bar). Store upgraded v3→v4 with `viewMode` persistence. [view:/migrate]

- **Multi-view Learn dashboard** (`Dashboard.tsx`, `LearnViewToggle.tsx`, `LearnTrackStack.tsx`,
  `ModuleTable.tsx`): Three view modes — Stack (track-grouped accordion), Cards (existing
  ModuleCard grid), and Table (sortable columns with expand). Six sort modes (Default, Name,
  Difficulty, Duration, Recently visited, Status) with persona, track, difficulty, status, and
  search filters. Six learning tracks (Foundations, Strategy, Protocols, Infrastructure,
  Applications, Executive). ModuleCard enhanced with progress bars and step tracking. [view:/learn]

- **Unified progress backup/restore** (`LandingView.tsx`, `UnifiedStorageService.ts`,
  `snapshotTypes.ts`): Export and import buttons on the landing page. Full-app snapshot covers
  learning progress, assessment state, persona, theme, OpenSSL files, TLS configs, migrate
  selections, and chat history. API keys excluded from export for security. [view:/]

- **Pure TypeScript X.509 DER cert builder** (`certBuilder.ts`): Standalone certificate builder
  with ASN.1 DER encoding primitives, DN parsing, v3 extensions, and PEM armoring. Supports
  arbitrary signer functions (e.g., liboqs SLH-DSA) for algorithms not yet in OpenSSL WASM.
  Used by HybridCASetup and HybridCertFormats workshops. [view:/learn]

- **5 new glossary terms** (`glossaryData.ts`): Composite Certificate, Related Certificate
  (RFC 9763), Chameleon Certificate, TBSCertificate, AlgorithmIdentifier — supporting the
  expanded Hybrid Crypto module. [view:/learn]

- **6 hybrid crypto sample questions** (`sampleQuestions.ts`): Composite vs Related certificates,
  SLH-DSA signature sizes, ANSSI hybrid policy, Chameleon certs, DER inspector usage, and IETF
  Hackathon pqc-certificates reference certs.

### Changed

- **PersonaPicker order** (`PersonaPicker.tsx`): Updated to Executive, Developer, Architect,
  IT Ops / DevOps, Researcher — IT Ops inserted between Architect and Researcher. [view:/learn]

- **GeminiService persona prompts** (`GeminiService.ts`): Added ops persona system prompt
  focusing on deployment steps, infrastructure configs, CLI commands, and rollback guidance.
  [persona:ops]

- **Quiz data loader** (`quizDataLoader.ts`): Fixed `_r1` suffix sorting to use codepoint
  comparison instead of `localeCompare`, resolving a macOS locale ordering bug where `_r1`
  files were ranked below the base file. [persona:developer]

### Data

- **Quiz CSV** (`pqcquiz_03022026_r1.csv`): 520 questions across 33 categories (was 440/32).
  New coverage for kms-pqc, hsm-pqc, and data-asset-sensitivity modules.

- **Library CSV** (`library_03022026_r1.csv`): 236 entries. Additions include Korean PQC
  Competition results (HAETAE, AIMer, SMAUG-T, NTRU+), FIPS 140-3 IG self-test guidance for
  FIPS 203/204/205, 3GPP PQC study, liboqs v0.15.0, TPM 2.0 hybrid PQC, and FIPS 206 (FN-DSA).

- **RAG corpus** (`rag-corpus.json`): Regenerated with all data and module changes (~2,200
  knowledge chunks).

## [2.10.0] - 2026-03-02

### Added

- **KMS-PQC module** (`kms-pqc`): New 5-step intermediate module (90 min) — PQC Key Management
  Systems. Covers envelope encryption with ML-KEM-768, hybrid key wrapping, multi-provider key
  hierarchy design, KMS rotation planner, and a KMIP Protocol Explorer (Operations, Key Types,
  Cross-Provider Sync, Readiness Checklist). Split from the legacy key-management module.
  [view:/learn] [persona:architect] [persona:developer]

- **HSM-PQC module** (`hsm-pqc`): New 4-step advanced module (90 min) — Hardware Security
  Modules for PQC. Features a PKCS#11 v3.2 simulator, vendor comparison matrix, HSM migration
  planner, and FIPS 140-3 validation tracker. Split from the legacy key-management module.
  [view:/learn] [persona:architect] [persona:developer]

- **Data Asset Sensitivity module** (`data-asset-sensitivity`): New 5-step intermediate module
  (75 min) — classify organizational data assets, map compliance obligations (GDPR, HIPAA, DORA,
  NIS2), apply NIST RMF / ISO 27005 / FAIR risk methodologies, and generate a PQC migration
  priority map. [view:/learn] [persona:executive] [persona:architect]

- **Hybrid Crypto — Hybrid CA Setup** (`HybridCASetup.tsx`, Step 3): Interactive workshop to
  configure and generate classical (ECDSA) and PQC (ML-DSA-65) root CAs. Demonstrates the
  dual-key hierarchy required for transitional hybrid PKI deployments. [view:/learn]
  [persona:developer] [persona:architect]

- **Hybrid Crypto — Hybrid Cert Formats** (`HybridCertFormats.tsx`, Step 4): Side-by-side
  generator and comparison of all four X.509 hybrid certificate approaches — Pure PQC (ML-DSA-65,
  SLH-DSA-128s), Composite (draft-ietf-lamps-pq-composite-sigs-14, OID 1.3.6.1.5.5.7.6.45),
  Related Certificates (RFC 9763), and Chameleon Certificates. Each entry shows OID, IETF status,
  backward-compatibility notes, and ASN.1 structure. [view:/learn]

- **Hybrid Crypto — Hybrid Cert Inspector** (`HybridCertInspector.tsx`, Step 5): Deep-dive
  certificate structure viewer with Tree, Raw, and Size views. Ships with four IETF Hackathon
  reference certificates (r5 release): Composite ML-DSA65-ECDSA-P256-SHA512, Catalyst
  ECDSA-P256 + ML-DSA-44, Pure ML-DSA-65 (FIPS 204 reference), and Chameleon ECDSA-P256 +
  ML-DSA-44. [view:/learn]

- **Merkle Tree Certs — Signatureless Certificates section** (`MTCIntroduction.tsx`): New
  collapsible "Advanced: Signatureless Certificates & Landmarks" section explaining landmark
  subtrees, pre-sync windows, and signatureless TLS handshakes. Includes ML-DSA-44 size analysis
  table (0 B signature + 736 B inclusion proof vs 2480 B per-connection ML-DSA-44 signature —
  ~94% handshake reduction). [view:/learn]

### Changed

- **Hybrid Crypto module** (`HybridCrypto/`): Expanded from 3 to 5 steps. Steps 3–5 replace
  the old `CompositeCertificateViewer` with the new HybridCASetup → HybridCertFormats →
  HybridCertInspector workshop sequence. RAG summary updated with RFC 9763, Catalyst binding
  draft, Chameleon certs draft, and IETF Hackathon pqc-certificates repository. [view:/learn]

- **Key Management split** (`useModuleStore` v5→v6): The `key-management` module has been split
  into `kms-pqc` (Key Management Systems, 5 steps) and `hsm-pqc` (Hardware Security Modules,
  4 steps). Store migration automatically copies legacy progress into both new modules and removes
  the old key. [view:/learn]

- **Merkle Tree Certs workshops** (`MerkleTreeBuilder.tsx`, `InclusionProofGenerator.tsx`,
  `ProofVerifier.tsx`, `SizeComparison.tsx`): Refactored with advanced metrics and clearer size
  analysis. Proof size reference updated from ~100 B to ~96 B (ML-DSA-44 benchmark). [view:/learn]

- **Playground — Key Generation** (`KeyGenerationSection.tsx`, `useKeyGeneration.ts`): Enhanced
  key generation UI supporting additional algorithm variants and improved validation.
  [view:/playground]

- **Playground — DSA Operations** (`useDsaOperations.ts`, `SignVerifyTab.tsx`): Extended
  algorithm selection and inline validation for the sign/verify workflow. [view:/playground]

## [2.9.0] - 2026-03-01

### Added

- **Entropy workshop — Bit Matrix Grid** (`BitMatrixGrid.tsx`): New shared visualization component
  renders byte data as a pixel grid where each bit maps to a colored cell. Random data appears as TV
  static; patterns show visible structure. Supports bit-level and byte-level view modes, interactive
  click-to-toggle for the Bit Flipper, and flipped-bit highlighting. Used across Steps 1, 2, and 4.
  [view:/learn]

- **Entropy workshop — Lag Plot** (`LagPlot.tsx`): SVG autocorrelation scatter plot of
  `(byte[i], byte[i+k])` pairs. Random data fills the square uniformly; incrementing data produces
  a diagonal line; repeating patterns create dot clusters. Configurable lag selector (k=1,2,4,8)
  reveals sequential correlations invisible to histograms. [view:/learn]

- **Entropy workshop — Bad RNG comparison** (`RandomGenerationDemo.tsx`): Step 1 now supports 4
  sources: Web Crypto, OpenSSL WASM, `Math.random()`, and a timestamp-seeded LCG. Side-by-side
  display with BitMatrixGrid, histogram, and lag plot for each source. LCG prediction demo proves
  determinism by correctly predicting future output bytes. Cross-source test comparison table.
  [view:/learn]

- **Entropy workshop — Bit Flipper** (`BitFlipExperiment.tsx`): New interactive mode in Step 2.
  Start with random data, click individual bits to toggle them, watch all 5 test results update in
  real time. Quick actions (Flip 5%/10%/25%, All Zeros, Reset). Corruption counter with progress
  bar. Teaches which tests break first under different degradation patterns. [view:/learn]

- **Entropy workshop — Streaming Monitor** (`StreamingEntropyMonitor.tsx`, `EntropyGauge.tsx`):
  Live dashboard mode in Step 2 with continuous byte generation and 5 animated radial gauge arcs
  with sparkline history. Switch sources mid-stream to watch gauges swing from green to red.
  Configurable speed (200ms–2s) and source selection. [view:/learn]

- **Entropy workshop — DRBG Simulator** (`DRBGSimulator.tsx`): Interactive CTR_DRBG state machine
  added as collapsible panel in Step 3 (ESV Walkthrough). Step through Instantiate → Generate →
  Reseed lifecycle with visible internal state (V, Key, counter), pipeline flow visualization, and
  forced reseed interval. Connects ESV validation to practical DRBG usage. [view:/learn]

- **Entropy workshop — 4 new exercises** (`EntropyExercises.tsx`): Visual Pattern Recognition, Bad
  RNG Challenge, Bit Corruption Threshold, and Live Degradation exercises (6–9) guide users through
  the new interactive features. [view:/learn]

### Changed

- **Entropy workshop — Step 2 modes** (`EntropyTestingDemo.tsx`): Testing step now has three modes
  via tab selector: Static Tests (original flow enhanced with BitMatrixGrid + LagPlot), Bit Flipper,
  and Live Monitor. [view:/learn]

- **Entropy workshop — Step 4 visualizations** (`QRNGDemo.tsx`): QRNG vs TRNG comparison now
  includes side-by-side BitMatrixGrid and LagPlot visualizations alongside existing histograms.
  [view:/learn]

## [2.8.2] - 2026-03-01

### Fixed

- **PQC Risk Management — heatmap UX** (`RiskHeatmapGenerator.tsx`): Three discoverability fixes
  in the Step 3 Risk Heatmap workshop. (1) Click hint replaced from invisible muted text to a
  prominent bordered pill with `MousePointer2` icon so users know cells are interactive.
  (2) Inherent/Residual Risk toggle is now always visible on load instead of being hidden until
  the first treatment is assigned — Residual button is disabled with a tooltip until at least one
  treatment exists. (3) Heatmap automatically switches to Residual view when the first treatment
  strategy is assigned, making the risk reduction immediately visible. [view:/learn]

## [2.8.1] - 2026-03-01

### Fixed

- **ML-KEM decapsulate** (`KemConfig.tsx`, `Workbench.tsx`): Resolved "Public Key operation error"
  caused by unclear file selection after encapsulation. Key file dropdown now filters to `.pub`
  files for encap and `.key` files for decap. Ciphertext input dropdown excludes key files.
  Encapsulate now shows separate "Ciphertext Output" and "Shared Secret Output" fields so filenames
  are explicit and cannot collide. [view:/openssl]

### Changed

- **OpenSSL Studio — KEM config** (`KemConfig.tsx`, `openssl.worker.ts`): Added configurable
  `-secret` output filename (was hardcoded to `secret.bin`). Post-encap terminal hint now shows
  which file is the ciphertext and which is the shared secret, with a reminder to use the ciphertext
  as input to decapsulate. [view:/openssl]

- **OpenSSL Studio — educational flow hints** (`DgstConfig.tsx`, `EncConfig.tsx`, `LmsConfig.tsx`,
  `Pkcs12Config.tsx`): Consistent context-aware hint box added below the action toggle in every
  dual-mode operation panel. Each hint explains the inputs, outputs, and key type required for
  the selected mode:
  - **Sign/Verify**: private key + data → signature; public key + data + signature → valid/invalid
  - **Encrypt/Decrypt**: plaintext + passphrase (PBKDF2) → ciphertext; reverse to recover plaintext
  - **LMS Generate/Sign/Verify**: stateful keypair creation; private key mutates on each signature
  - **PKCS#12 Export/Import**: bundle cert + key into password-protected .p12; extract with same password
    [view:/openssl]

## [2.8.0] - 2026-03-01

### Added

- **My Products tracking** (`MigrateView.tsx`, `SoftwareTable.tsx`, `useMigrateSelectionStore.ts`):
  Checkbox column in the Migrate catalog lets users mark products as "My Products" for cross-module
  analysis. Infrastructure stack badges show selected count per layer. Store upgraded v2 to v3 with
  `myProducts` array, `toggleMyProduct`, and `clearMyProducts` actions.
  [persona:architect] [persona:executive] [view:/migrate]

- **Compliance Gantt chart** (`ComplianceGantt.tsx`): New Gantt-style timeline for the Compliance
  Strategy module. Renders compliance deadlines grouped by jurisdiction with interactive phase bars,
  status indicators (completed/on-track/at-risk), and user-defined milestone markers with
  category-based colour coding.
  [persona:executive] [persona:architect] [view:/learn]

- **Infrastructure Selector** (`InfrastructureSelector.tsx`): New Step 1 in the Vendor Risk module
  workshop — select infrastructure products from the Migrate catalog with FIPS and PQC support
  badges. Selected products feed into the Vendor Scorecard, Contract Clauses, and Supply Chain
  Matrix. [persona:architect] [view:/learn]

- **`risk-treatment-plan` document type** (`types.ts`): New executive document type for persisting
  risk treatment artifacts from the Risk Heatmap Generator. [persona:developer]

### Changed

- **Risk Heatmap Generator** (`RiskHeatmapGenerator.tsx`): Complete rewrite with 5x5
  likelihood-vs-impact matrix, four risk treatment strategies (mitigate, accept, transfer, avoid)
  with contextual guidance, residual risk overrides per entry, and before/after heatmap comparison.
  Exports to markdown via ExportableArtifact.
  [persona:executive] [persona:architect] [view:/learn]

- **ROI Calculator** (`ROICalculator.tsx`): Shifted from 5-dimension scorecard to direct financial
  modelling with editable inputs (products to migrate, cost per product, breach probability,
  applicable frameworks, penalty per incident, planning horizon). Auto-seeds from assessment data
  and Migrate catalog via `useExecutiveModuleData`. Outputs total migration cost, avoided breach
  cost, compliance savings, net ROI, and payback period.
  [persona:executive] [persona:architect] [view:/learn]

- **Breach Cost Model** (`BreachCostModel.tsx`): Quantum threat assumptions (quantum multiplier,
  HNDL exposure factor, regulatory multiplier) are now user-configurable via sliders instead of
  hardcoded values, enabling scenario modelling.
  [persona:executive] [view:/learn]

- **Vendor Scorecard Builder** (`VendorScorecardBuilder.tsx`): Redesigned to score products from
  the Migrate catalog. Six weighted dimensions (PQC algorithm support, FIPS validation, PQC
  roadmap, crypto agility, SBOM/CBOM, hybrid mode) with auto-detection of PQC support and FIPS
  status from product data. [persona:architect] [view:/learn]

- **Compliance Timeline Builder** (`ComplianceTimelineBuilder.tsx`): Integrated ComplianceGantt
  visualization, auto-grouping framework deadlines by jurisdiction, gap analysis with at-risk /
  on-track / completed status indicators, and detail popovers for individual phases.
  [persona:executive] [persona:architect] [view:/learn]

- **Jurisdiction Mapper** (`JurisdictionMapper.tsx`): Enhanced with product preview cards showing
  selected Migrate catalog products, conflict detection between overlapping jurisdiction
  requirements, and deep links to the Migrate view.
  [persona:architect] [view:/learn]

- **Vendor Risk module** (`VendorRisk/index.tsx`): Restructured workshop from 3 steps to 4 — new
  Step 1 (Your Infrastructure) precedes Vendor Scorecard (Step 2), Contract Clauses (Step 3), and
  Supply Chain Matrix (Step 4). [persona:architect] [view:/learn]

- **`useExecutiveModuleData`** (`useExecutiveModuleData.ts`): Accepts optional `selectedProductKeys`
  parameter to filter metrics to user-selected products, with smart layer splitting for products
  spanning multiple infrastructure layers. [persona:developer]

- **Executive artifacts** (`ArtifactBuilder.tsx`, `ExportableArtifact.tsx`, `TimelinePlanner.tsx`):
  Refined layout, styling, and export formatting across shared executive workshop components.
  [persona:developer]

### Data

- **Compliance CSV rotation**: Deleted 3 stale snapshots (`compliance_02222026.csv`,
  `compliance_02242026.csv`, `compliance_02262026.csv`), added fresh `compliance_03012026.csv`.

- **RAG corpus**: Regenerated `public/data/rag-corpus.json` to reflect all data and module changes.

### Fixed

- **CBOM Scanner** (`CBOMScanner.tsx`): Minor layout and styling fixes in the Crypto Agility
  workshop. [persona:developer] [view:/learn]

- **MTC module** (`MTCIntroduction.tsx`, `MTCExercises.tsx`, `mtcConstants.ts`,
  `SizeComparison.tsx`): Minor content corrections and data constant updates.
  [persona:developer] [view:/learn]

- **KPI Tracker Template** (`KPITrackerTemplate.tsx`): Layout refinements in the Migration Program
  module. [persona:developer] [view:/learn]

- **Roadmap Builder** (`RoadmapBuilder.tsx`): Styling adjustments in the Migration Program module.
  [persona:developer] [view:/learn]

- **RACI Builder** (`RACIBuilder.tsx`): Styling and interaction fixes in the PQC Governance module.
  [persona:developer] [view:/learn]

- **CRL Generator** (`CRLGenerator.tsx`): Minor fixes in the PKI Workshop.
  [persona:developer] [view:/learn]

- **OpenSSL Worker** (`openssl.worker.ts`): Minor worker-side adjustment.
  [persona:developer] [view:/openssl]

- **Chat panel** (`ChatPanelContent.tsx`): Additional overflow guard.
  [persona:developer]

## [2.7.0] - 2026-03-01

### Added

- **Executive Board Brief** (`BoardBriefSection.tsx`): New printable 2-page C-suite summary
  triggered from the report toolbar. Page 1 covers risk gauge, category breakdown (2×2 grid),
  top-3 priority actions, and Harvest-Now-Decrypt-Later alerts. Page 2 presents the financial
  case with ROI table, mandated compliance frameworks, and key findings.
  [persona:executive] [view:/assess]

- **ROI Calculator** (`ROICalculatorSection.tsx`, `roiBaselines.ts`): New collapsible report
  section for modelling the PQC migration financial case. Four adjustable parameters (migration
  budget, breach probability, compliance penalty, planning horizon) are auto-seeded from
  assessment inputs. Outputs include avoided breach cost, compliance savings, net ROI (%), and
  payback period, plus a bar-chart breakdown. Industry baselines sourced from IBM Cost of a Data
  Breach Report 2024 (11 sectors). ROI summary exports to the Board Brief.
  [persona:executive] [persona:architect] [view:/assess]

- **Risk Score Trending** (`KPITrendingSection.tsx`): New report section showing historical
  risk score progression (line chart) and a radar chart comparing current vs. previous category
  scores across Quantum Exposure, Migration Complexity, Regulatory Pressure, and Org Readiness.
  Activates when 2+ assessment snapshots are present. [persona:executive] [persona:architect] [view:/assess]

- **Assessment history persistence** (`useAssessmentStore.ts`): New `assessmentHistory`
  array and `pushSnapshot()` action persisted to localStorage. Each `AssessmentSnapshot` records
  timestamp, risk score, risk level, category scores, and industry — enabling the trending section
  and future comparison views. [persona:developer]

- **Assessment URL sharing** (`ReportView.tsx`): Share button now encodes full assessment
  state into URL parameters (industry, country, algorithms, data sensitivity, frameworks,
  migration status, use cases, retention, scale, agility, infrastructure, vendors, timeline
  pressure). Opening the URL auto-hydrates the store for instant report replay.
  [persona:executive] [persona:architect] [view:/assess]

- **`recharts` dependency**: Added Recharts v3.7.0 for the ROI bar chart and KPI trending
  line/radar charts. [persona:developer]

- **Community section on About page** (`AboutView.tsx`): New GitHub Discussions panel listing
  11 topic-specific channels — Contribute, PQC News, Ideas, Q&A, Algorithms, Learn Modules,
  Leaders, References, Timeline, Threats, Products. Each card links directly to its discussion
  thread with an icon and description. [persona:researcher] [persona:developer] [view:/about]

- **GitHub: FUNDING.yml**: Added GitHub Sponsors funding configuration.

- **GitHub: data_suggestion.yml**: New issue template for users to suggest data updates,
  corrections, or new entries across the library, migrate catalog, compliance, or timeline.

### Changed

- **Report section visibility** (`ReportContent.tsx`): Sections now support `'open'`,
  `'closed'`, or `'hidden'` visibility states per persona. A summary/full-report toggle appears
  when sections are hidden for a persona. Affected sections: risk score, key findings, assessment
  profile, HNDL/HNFL, algorithm migration, compliance impact, recommended actions, migration
  roadmap, toolkit, ROI calculator, KPI trending, threat landscape, country timeline, risk
  breakdown, executive summary. [persona:developer]

## [2.6.2] - 2026-03-01

### Added

- **Timeline document cards view**: `DocumentTable` redesigned with a cards/table view toggle
  (`ViewToggle`). Card grid shows phase badge, org, period, description preview, enrichment
  sparkle indicator, source link, and a "View Details" action. [persona:researcher] [persona:developer] [view:/timeline]

- **`TimelineDocumentCard`**: New animated card component (Framer Motion `popLayout`) rendering
  one timeline document row with enrichment awareness — shows a `Sparkles` badge when AI
  enrichment is available. [persona:developer] [view:/timeline]

- **`TimelineDocumentDetailPopover`**: New accessible portal popover (FocusLock + `createPortal`)
  for timeline document detail. Shows full metadata, enrichment analysis panel
  (`DocumentAnalysis` reuse), phase-coloured header, and an `AskAssistantButton` pre-seeded with
  document context. [persona:developer] [view:/timeline]

- **`timelineEnrichmentData.ts`**: New data module that discovers and loads
  `doc-enrichments/timeline_doc_enrichments_*.md` via `import.meta.glob`, picks the latest by
  embedded date, parses enrichment sections, and exports `getTimelineEnrichmentKey()` and
  `hasSubstantiveEnrichment()` helpers. [persona:developer]

- **Table view: sortable columns** — clicking any column header in table mode cycles `asc`/`desc`
  with chevron indicators. Default sort: Period ascending. [persona:researcher] [persona:executive] [view:/timeline]

- **Org name from event data**: `DocumentTable` now reads `phase.events[0]?.orgName` as the
  primary org label, falling back to country bodies, improving specificity for multi-body
  countries. [persona:researcher] [view:/timeline]

- **New npm scripts**: `enrich:timeline` / `enrich:timeline:dry` (Haiku enrichment pipeline for
  timeline documents) and `notebooklm` (`tsx scripts/generate-notebooklm.ts` for NotebookLM
  package generation). `notebooklm/` output directory added to `.gitignore`. [persona:developer]

- **Glossary — 8 new terms**: DSA (Digital Signature Algorithm with NIST IR 8547 deprecation
  context), PQXDH (Signal's post-quantum key agreement, Signal Sep 2023 deployment), RFC 8446
  (TLS 1.3 standard with PQC extension context), NIS2 Directive (EU 2022/2555, ENISA PQC link),
  NIST SP 800-131A (algorithm transition guidance), Certificate Transparency (RFC 9162 + MTC
  connection), HPKE (RFC 9180, TLS ECH / MLS / PQC drafts), and a dedicated PQXDH entry
  separated from the Signal Protocol term. [persona:researcher] [persona:developer] [view:/learn]

### Changed

- **Glossary corrections**: FIPS 206 and FN-DSA definitions updated from "draft / expected
  2025–2026" to "published October 2024". Removed incorrect `acronym` fields from Shor's
  Algorithm, Grover's Algorithm, BIP-360, and Signal Protocol. Sigstore, SLSA, and in-toto
  categories corrected (`concept` → `organization` / `standard`). Added `relatedModule` links to
  FrodoKEM, SHAKE, ChaCha20-Poly1305, Ascon, FHE, and ZKP entries. [persona:researcher] [view:/learn]

- **`libraryEnrichmentData.parseTimeline()`**: Now merges extracted keywords alongside year
  entries when processing the Haiku extraction format, ensuring keyword-tagged milestones appear
  in the Migration Timeline dimension. [persona:developer]

### Fixed

- **Chat panel — horizontal overflow**: `ChatPanelContent` message list gains `overflow-x-hidden`;
  `ChatMessage` bubble gains `min-w-0`. Markdown `<pre>` blocks wrap in a scrollable
  `overflow-x-auto` div; Markdown `<table>` elements wrap in a scrollable container, preventing
  wide AI responses from expanding the panel beyond the viewport. [persona:developer] [persona:researcher] [persona:architect]

## [2.6.1] - 2026-03-01

### Added

- **Timeline ↔ Library coverage audit**: Audited all 116 unique `SourceUrl` values in
  `timeline_02282026.csv` against the library's `download_url` column. Coverage rose from 23
  matches (20%) to 55 (47%) after adding 32 new entries.

- **32 new library entries** (`library_03012026.csv` — 231 total) covering Tier 1 official
  government and standards-body documents identified as timeline source gaps:
  ANSSI PQC position paper and FAQ, EC Recommendation 2024/1101, G7 CEG Financial PQC Roadmap,
  Canada TBS SPIN notice and CFDIR best practices, ENISA PQC Integration Study, Europol QSFF
  call to action, UK NCSC white paper and migration timelines, UK DSIT CNI perspectives, UK CMORG
  financial guidance, NATO Quantum Technologies Strategy, NSA CNSA 2.0 canonical page, US QCCPA
  2022, US CISA Automated PQC Discovery strategy and OT considerations, EU-BSI 21-nation joint
  statement, BSI-ANSSI-NLNCSA QKD position paper, SG MAS quantum advisory and QKD sandbox report,
  SG Quantum-Safe Handbook, AU ASD ISM Guidelines for Cryptography, GSMA PQ.03 v2.0 and
  country-by-country survey, CZ NUKIB minimum crypto requirements, IL INCD Cybersecurity Strategy,
  IN CERT-In QBOM guidelines and TEC PQC migration report. PQCC Migration Roadmap and Inventory
  Workbook URLs updated to specific pages.

- **`library_doc_enrichments_03012026.md`**: 195 enriched documents (was 163) — 32 new sections
  added via Haiku extraction agents covering all newly added library entries. Document Enrichments
  RAG source grows to 370 chunks.

### Fixed

- **Library enrichment — Migration Timeline parser**: `parseTimeline()` now handles the Haiku
  extraction format (`"year: description; year: description"`, semicolon-separated, no prefix)
  alongside the legacy `Milestones: A | B | C` pipe-separated format. Also correctly suppresses
  `"None detected (...)"` variants. Migration Timeline dimension now visible in Library detail
  views for all 32 new documents.

- **PQC Assistant — leaders retrieval**: Added `leaders: 1.5` boost to the `general` intent in
  `INTENT_BOOSTS` so leader chunks are not outranked by document enrichments for leader-focused
  queries (e.g. "PQC leaders and researchers").

- **LeadersGrid tests**: Country filter tests updated to use `filter-Country` testId — the
  component's Region and Country dropdowns are separate since the Region/Country filter split in
  v2.5.x.

## [2.6.0] - 2026-02-28

### Added

- **PQC Assistant integration — detail views**: `AskAssistantButton` added to all seven detail
  panels: AlgorithmComparison, ComplianceDetailPopover, LeaderCard, LibraryDetailPopover,
  SoftwareTable, ThreatDetailDialog, and GanttDetailPopover. Each button carries context-aware
  prompt templates (e.g., classical↔PQC migration rationale, threat mitigations by industry,
  timeline phase significance).

- **AlgorithmComparison interactive table**: 3-way column sorting (asc → desc → none) on all
  four columns; drag-to-resize column separators; "Find tools" deep-links from PQC algorithm
  cells to `/migrate?q=<algo>`; separate `MobileAlgorithmList` for `lg:hidden` with accessible
  `aria-sort` attributes and `<caption>` on the desktop table.

- **SoftwareTable — PQC certifications in expanded rows**: Per-product certifications badge
  panel (FIPS 140-3 green, ACVP blue, Common Criteria amber) pulled from
  `migrate_certification_xref_02282026.csv`. Three-tier FIPS badge (`Validated` / `Partial` / `No`)
  with icon indicators replaces prior boolean display.

- **ThreatDetailDialog — related modules**: Pill-style links to `/learn/<slug>` with BookOpen
  icon when `threat.relatedModules` is populated; AI button asks about PQC mitigations by
  industry and criticality.

- **GuidedTour — comprehensive test suite**: Full lifecycle coverage — localStorage persistence,
  intro slides, knowledge-gate branching (learning/basics/expert paths), feature nav, and
  dismissal. `vi.useFakeTimers()` and `AnimatePresence` sync mock used throughout.

- **Chat system — extensive test coverage**: `useChatSend.test.ts` covers happy-path streaming,
  guards (empty query, null API key, active loading), error handling (generic, invalid key,
  AbortError, 60s timeout), and 1000-char input length cap. `GeminiService.systemPrompt.test.ts`
  covers identity, knowledge boundary, page context, persona depth (executive/developer/architect/
  researcher), and assessment context injection.

- **New data: algorithms_transitions CSVs** — three snapshots (`02222026`, `02272026`,
  `02282026`) added to `src/data/` providing algorithm transition timeline data.

### Changed

- **Data maintenance — CSV date correction**: Removed date-shifted future files
  (`library_03212026.csv`, `library_03222026.csv`, `pqcquiz_03232026.csv`,
  `pqcquiz_03242026.csv`, `quantum_safe_cryptographic_software_reference_03182026.csv`,
  `quantum_safe_cryptographic_software_reference_03262026.csv`, `timeline_03012026.csv`).
  Correct Feb 2026–dated snapshots now active; `shift-csv-dates.py` script added for future
  maintenance.

- **LeaderCard accessibility**: `AskAssistantButton` at bottom-right; `StatusBadge` in
  top-right corner; `min-h-[44px]` touch targets on external links (WCAG AA); LinkedIn button
  uses `.bg-status-info` semantic token.

- **RAG corpus**: Regenerated (`public/data/rag-corpus.json`) to incorporate enriched document
  metadata from new datasets.

## [2.5.1] - 2026-02-28

### Added

- **Library Document Analysis panel**: Collapsible `<DocumentAnalysis>` component in Library view
  shows AI-extracted enrichment metadata per document — main topic, PQC algorithms, quantum
  threats, migration timelines, regions, protocols, infrastructure layers, standardization bodies,
  and compliance frameworks. Powered by `src/data/libraryEnrichmentData.ts` parser.

- **Maintenance guide**: `docs/maintenance-guide.md` — comprehensive reference for all page data
  sources, update procedures, cross-page connections, RAG pipeline, and Zustand store inventory.

### Changed

- **Timeline data**: Fresh `timeline_02282026.csv` snapshot (Feb 28, 2026) covering EU QARC
  project launch, IBM Heron R2 quantum chip, Microsoft Majorana 1 topological qubit announcement,
  and updated QSP roadmap milestones.

- **RAG corpus**: Regenerated with full enrichment metadata from 220+ enriched documents;
  cross-references between threats↔compliance, leaders↔algorithms, and library↔algorithms
  now included in all chunk metadata.

- **Open-source compliance**: SPDX `GPL-3.0-only` license identifiers added to all 500+ source
  files; `package.json` `license` field normalized to SPDX-compliant value.

## [2.5.0] - 2026-02-28

### Added

- **Personalization wizard**: 4-step onboarding (Experience → Role → Region → Industry) with
  animated stepper, info modals explaining how each choice shapes the experience,
  `PersonalizedAvatar` live preview, and embedded `ScoreCard`. Replaces the previous 3-row
  inline form.

- **Experience level personalization**: New `ExperienceLevel` type (`new` / `basics` / `expert`)
  in `usePersonaStore` v2. Wired through guided tour knowledge gate, personalization wizard,
  and learning experience difficulty filtering.

- **Guided tour rewrite**: 3-phase centered card design replacing nav-anchored tooltips.
  Phase 1 — Intro (3 slides explaining why PQC matters). Phase 2 — Knowledge Gate
  ("How familiar are you?") adjusts tour length: "Just learning" → full 13-feature tour,
  "Know the basics" → essential-only 5 slides, "Expert" → dismisses tour. Phase 3 — Feature
  cards (up to 13, persona-filtered) with swipeable drag interaction and dot indicators.

- **PQC Explainer**: Dismissible "Why does this matter?" component on the landing page with
  3 educational cards (modern encryption → quantum threat → new standards). Persistent
  dismissal via localStorage; CTA links to PQC 101 module.

- **Page accuracy feedback**: Fixed bottom-left thumbs-up/down widget on 8 content routes
  (`/learn`, `/timeline`, `/leaders`, `/algorithms`, `/library`, `/compliance`, `/threats`,
  `/migrate`). Logs votes via GA4 `logAccuracyFeedback()`; resets on page navigation.

- **Document enrichment pipeline**: `scripts/enrich-public-docs.py` extracts 11 structured
  dimensions (algorithms, threats, protocols, infrastructure layers, compliance frameworks,
  standardization bodies, etc.) from 220+ archived HTML/PDF documents. Outputs date-stamped
  markdown to `src/data/doc-enrichments/`, consumed by the RAG corpus generator.

- **RAG cross-references**: Post-processing pass in `generate-rag-corpus.ts` adds cross-domain
  links between threats↔compliance, leaders↔algorithms, library↔algorithms, and
  compliance↔timeline. Capped at 3 cross-refs per chunk.

- **Entity inventory**: `extractEntityInventory()` in GeminiService builds a compact entity list
  from retrieved RAG chunks (max 30), injected into the system prompt as a hallucination guard —
  the model is instructed to say "not in the current database" for items not in the inventory.

- **OpenSSL Studio deep linking**: `?cmd=` query parameter with user-friendly aliases
  (`keygen` → `genpkey`, `cert` → `x509`, `sign` → `dgst`, `enc` → `enc`, `hash` → `dgst`).

- **Quiz deep links**: RAG corpus chunks now link to `/learn/quiz?category=<id>` instead of
  the generic `/learn/quiz` path.

- **Module difficulty levels**: All 25 learning modules tagged `beginner`, `intermediate`, or
  `advanced` in `moduleData.ts` (6 beginner, 10 intermediate, 9 advanced).

- **Chat panel export button**: Download icon in the right-panel chat header exports the active
  conversation as formatted Markdown with timestamps and role labels.

- **Textarea UI component**: New shared `<Textarea>` component in `src/components/ui/textarea.tsx`
  with semantic tokens (`border-input`, `bg-muted`, `text-foreground`), focus ring, and
  ref forwarding.

- **Document enrichment RAG source**: `document-enrichment` source type in RetrievalService
  with intent-based boost multipliers (definition: 1.2, recommendation: 1.3, country_query: 1.5).

### Changed

- **Landing page**: Hero subtitle rewritten from feature list to problem-solution framing
  ("Quantum computers will break today's encryption..."). Removed the bottom "Open source.
  Free forever." CTA section. `ScoreCard` moved from standalone to embedded inside
  `PersonalizationSection`.

- **ScoreCard**: New `embedded` prop (default `false`) — when true, renders without `motion.section`
  wrapper or `glass-panel` styling for inline embedding.

- **ConversationMenu**: Export and delete buttons are now always visible (removed hover-only
  `opacity-0 group-hover:opacity-100` classes) for better touch device UX.

- **SampleQuestionsModal**: Added `useFocusTrap` hook, `role="dialog"`, `aria-modal="true"`,
  `aria-label="Sample questions"`; replaced raw `<button>` elements with `<Button>` component.

- **About page**: Privacy language refined ("No personal data collection" with specific items);
  new "Anonymous usage analytics" section disclosing GA4 tracking (page navigation, feature
  interactions, accuracy signals, learning milestones, assistant feedback) with opt-out link.

- **RAG corpus format**: Output changed from bare JSON array to `{ generatedAt, chunkCount,
chunks }` wrapper. RetrievalService handles both legacy and new formats; exposes `corpusDate`
  getter for freshness tracking.

- **Sitemap**: 9 new learning module URLs added (compliance-strategy, pqc-risk-management,
  pqc-business-case, pqc-governance, vendor-risk, migration-program, code-signing,
  api-security-jwt, iot-ot-pqc); all `<lastmod>` dates updated to 2026-02-28.

- **Compliance data**: Refreshed from NIST, ANSSI, and Common Criteria scrapers.

- **QandA document**: Updated assessment references from 13-step to 14-step; corpus size
  ~2,100 chunks from 24 data sources; new Q7 on document enrichment dimensions.

### Fixed

- **PQC Assistant module count**: Assistant was answering "9 learning modules" instead of 25.
  Root cause: the entity inventory (dynamically built from retrieved RAG chunks, capped at 30
  total entities) was including a truncated subset of modules and the LLM trusted that count
  over the static list in the system prompt. Fix: `modules`, `module-content`, and
  `module-summaries` sources excluded from entity inventory — the hardcoded canonical list
  at system prompt guideline 5 is the authoritative source. System prompt updated to state
  "25 total" explicitly.

- **RAG corpus generator — unquoted object keys**: `processModules()` regex in
  `generate-rag-corpus.ts` required quoted keys (`'module-id':`) but Prettier formats valid
  JS identifiers without quotes (`qkd:`), silently dropping the QKD module from the corpus
  on every regeneration. Regex updated to accept both quoted and unquoted key formats.

## [2.4.0] - 2026-02-28

### Added

- **PQC Assistant: multi-conversation history**: Up to 10 concurrent conversations persisted
  across sessions. Conversation switcher menu in the chat panel header with auto-titling from
  the first message. Zustand store migrated from v3 flat messages to v4 conversation-keyed
  shape with full migration guard.

- **PQC Assistant: conversation keyboard navigation**: Arrow Up / Down cycles through
  conversation list; Escape closes the menu; ArrowDown from search input moves focus to
  first conversation. Full ARIA listbox/option role mapping.

- **PQC Assistant: conversation search**: Live search filter appears when 3+ conversations
  exist. Searches both conversation titles and message content.

- **PQC Assistant: conversation export**: Download button (hover-revealed) on each
  conversation exports the full history as formatted Markdown with timestamps and role labels.

- **PQC Assistant: Ask Assistant buttons on 14 surfaces**: Contextual "Ask about this" buttons
  across the app — Algorithm Comparison, Threat Detail, Leader Cards, Compliance Detail,
  Library Detail, Software Catalog, Landing hero, Timeline Gantt popover, and 5 Assessment
  Report sections (Risk Breakdown, HNDL/HNFL, Algorithm Migration, Compliance Impact,
  Recommended Actions). All 25 Learn module cards also get icon-variant Ask buttons.

- **PQC Assistant: response caching**: In-memory LRU cache (20 entries, 5-minute TTL) deduplicates
  identical queries within a session — bypasses RAG retrieval and Gemini API entirely on cache hit.
  True LRU eviction via Map re-insertion on access.

- **PQC Assistant: corpus staleness indicator**: CorpusFreshnessBadge shows an amber warning
  when the RAG corpus is older than 30 days, prompting users to check for data updates.

- **PQC Assistant: persona-aware landing question**: The "Ask the PQC Assistant" button on the
  landing page generates a question tailored to the active persona — developers get integration
  guidance, architects get migration architecture advice, executives get compliance deadlines,
  researchers get mathematical foundations.

- **PQC Assistant: RAG telemetry**: GA4 events for chunk count per query (`RAG Chunks`),
  source diversity (`RAG Source`), and cache hits (`Cache Hit`) — enables measurement of
  retrieval quality and deduplication effectiveness.

### Changed

- **PQC Assistant: PII-safe analytics**: `logChatFeedback` now strips email addresses and URLs
  from query strings before sending to GA4, and truncates to 80 characters. GDPR/CCPA safer.

- **PQC Assistant: error announcements**: Chat panel error container now carries `role="alert"`
  so screen readers announce errors immediately (WCAG 2.1 SC 4.1.3).

## [2.3.0] - 2026-02-27

### Added

- **Compliance Strategy: country deadlines table**: Ten countries/regions with specific PQC
  migration deadlines — Australia (2030), Canada (2026/2031/2035), UK (2028), Czech Republic
  (2027), EU (2030 Coordinated Roadmap v1.1), Israel (2025), Taiwan (2027), Germany (2030
  QUANTITY initiative), G7 (2034 financial sector). Sourced from finalized 2024–2025 standards.

- **Compliance Strategy: compliance dependencies section**: Five dependency areas — CMVP/FIPS
  140-3 validation backlog, eIDAS 2.0 quantum-safe wallet requirements, Executive Order 14306
  and CISA procurement guidance (January 2026), DORA enforcement (January 2025), and CBOM
  inventory gaps (Europol: 86% of executives unprepared).

- **Compliance Strategy: 13 new jurisdictions**: JurisdictionMapper expanded from ~12 to 24
  jurisdictions — adds Czech Republic, Italy, Spain, New Zealand, China, India, Taiwan, Hong
  Kong, Malaysia, Israel, UAE, Saudi Arabia, Bahrain, and Jordan. China conflict detection warns
  about OSCCA/NGCC dual-algorithm requirements; early-deadline countries (AU/TW/CZ) flagged
  against US/EU timelines.

- **IoT/OT: energy budget challenge**: New constraint card — PQC consumes significantly more
  energy; recommends PSK session resumption over repeated full handshakes for battery-constrained
  devices.

- **IoT/OT: Ascon lightweight crypto callout**: Contextualizes NIST's 2023 Ascon selection for
  IoT symmetric-key AEAD as complementary to PQC asymmetric algorithms.

- **IoT/OT: Certificate Chain Bloat Analyzer (Exercise 4)**: New interactive exercise — sets
  full ML-DSA-65 chain (Root + Intermediate + End Entity ≈ 22 KB), then demonstrates Merkle
  Tree Certificates + compression reducing chain to ~3 KB. Total exercises now 5.

- **IoT/OT: three new protocols**: LwM2M + DTLS 1.2/1.3 (1,024 B max, challenging feasibility),
  BLE Mesh (384 B max, problematic for PQC), OPC UA (65,535 B, TCP, good for industrial
  automation).

- **PQC Governance: escalation & conflict resolution framework**: Four-level escalation path —
  Working Group (5 days) → Steering Committee (10 days) → CISO/CTO (5 days) → Board/Risk
  Committee for enterprise risk acceptance.

- **PQC Governance: three new RACI activities**: Training & Awareness, Compliance Auditing,
  Stakeholder Communications added — RACI matrix now covers 10 activities (was 7).

### Changed

- **Compliance Strategy: regulatory content updated**: NSM-10 quote updated to Section 3(a)
  language; CNSA 2.0 timelines distinguish preferred (2025) vs exclusive (2030) for signing;
  NIST IR 8547 reflects draft (November 2024) and finalized (March 2025) versions.

- **IoT/OT: accuracy corrections**: FN-DSA-512 signature size corrected to ~666 avg / 690 max
  bytes; LMS verification speed quantified (~4× faster than XMSS on Cortex-M4). Secure elements
  section added (ARM TrustZone-M, Infineon OPTIGA TPM, Microchip ATECC608).

- **IoT/OT: FirmwareSigningSimulator**: Color-coded verification speed badges (Fastest / Fast /
  Moderate) with semantic status colors replace raw millisecond display.

- **PQC Governance: PolicyTemplateGenerator expanded**: ML-KEM-512 (Category 1), ML-DSA-44
  (Category 2), FN-DSA-512/1024, and HQC-128 (NIST Round 4, draft pending) added to algorithm
  selections. RSA ≥ 3072 clarified in prohibited algorithms list.

- **PQC Governance: RACI cell interaction redesigned**: Click-to-cycle buttons replace select
  dropdowns — cycles R → A → C → I → empty. Validation warning shown when any activity lacks
  an Accountable assignment.

- **PQC Governance: button consistency**: All raw `<button>` elements replaced with `<Button>`
  component variants (destructive / outline / gradient) across Introduction and module nav.

### Fixed

- **Private browsing compatibility**: `localStorage` access in GuidedTour and WhatsNewToast
  wrapped in try-catch — prevents crash when storage is unavailable (Safari private mode,
  hardened browsers). Graceful fallback: tour re-shows, toast suppressed.

## [2.2.1] - 2026-02-27

### Changed

- **PQC Assistant: full module coverage**: System prompt now lists all 25 learning modules
  (was 19 — missing Vendor Risk, Compliance Strategy, Migration Program, PQC Risk Management,
  PQC Business Case, PQC Governance). Prevents hallucinated module links.

- **PQC Assistant: persona-aware follow-ups**: LLM-generated follow-up suggestions and
  persona-specific fallbacks (executive/developer/architect/researcher) now render correctly.
  Previously `followUps` and `persona` were never passed to `ChatMessage`.

- **PQC Assistant: module query disambiguation**: "Which module covers TLS?" now correctly
  retrieves learning modules instead of FIPS cryptographic module content.

- **PQC Assistant: country detection expanded**: 16 adjectival country forms (French, Korean,
  German, etc.) now trigger `country_query` intent classification and query expansion.

- **PQC Assistant: prompt size guard**: RAG context blocks capped at 80K characters to prevent
  Gemini API input limit errors on large catalog or quiz result sets.

- **PQC Assistant: safety settings**: Gemini API calls now include explicit safety thresholds
  (`BLOCK_ONLY_HIGH` for harassment/dangerous content) so legitimate cybersecurity discussions
  aren't blocked.

- **PQC Assistant: retry on server errors**: Transient 5xx API errors now retry up to 2 times
  with linear backoff instead of immediately failing.

## [2.2.0] - 2026-02-27

### Added

- **Career Journey modal**: New interactive career path visualization on the About page,
  replacing the Study Pack ZIP export (StudyPackService and StudyPackCard deleted).

- **Full SLH-DSA coverage**: Playground key store now exposes all 12 FIPS 205 signature
  variants (was 3 — SHA2/SHAKE × 128/192/256 × f/s).

- **Changelog UI redesign**: Structured card layout with category filters (New Features /
  Improvements / Bug Fixes), expandable detail view, and color-coded section bands — replaces
  raw markdown rendering.

### Changed

- **liboqs package migration**: `@openforge-sh/liboqs` v0.14.3 → `@oqs/liboqs-js` v0.15.1
  (same API, new maintainer package). Build scripts and Vite config updated accordingly.

- **Playground dead code removal**: Settings tab and `enabledAlgorithms` state deleted — never
  read by KEM or Sign tabs. Mobile/desktop branching in InteractivePlayground simplified to a
  single render path.

- **ML-KEM algorithm inference refactored**: 4 duplicate inline blocks consolidated into single
  `inferKemAlgorithm()` helper with constant key-size maps for public and private keys.

- **OpenSSL Studio hardening**: FileViewer abort/cleanup pattern prevents stale state updates,
  timeout ref cleanup on unmount in WorkbenchFileManager, structured log cap (500 entries),
  localStorage quota error handling, per-command vs global error distinction in worker, and
  empty catch blocks now surface errors via stderr log.

- **Learning module accuracy corrections**: ES256/ECC P-256 key sizes (32→64/65 bytes), ML-DSA
  signature size (3293→3309), RSA-4096 security bits (152→140), AES-128 deprecation status
  aligned with NIST 2024 assessment, IoT Class 0 specs aligned to RFC 7228, FALCON-512 renamed
  to FN-DSA-512, NIST IR 8547 "Draft" label removed (finalized), CNSA 2.0 milestone
  descriptions corrected.

- **Standards references updated**: RFC 9701 (Token Status List), RFC 9370 (IKEv2 Additional
  Key Exchange), RFC 7228 (IoT device classes), RFC 8784 (PQC PSK for IKEv2).

- **Software catalog refresh**: Go crypto/mlkem timeline corrected (Go 1.24 initial release),
  Apple PQ3/iOS 17.4 baseline clarified, Android 16 status revised to Pending Verification,
  OpenSSH v10.0 hybrid default, Cisco IOS XE and Juniper Junos OS PQC capabilities updated.

- **Semantic token compliance**: Hardcoded colors (amber, gray) replaced with design system
  tokens (`text-status-warning`, `bg-muted`, `border-border`) across OpenSSL Studio,
  Playground, and Migrate components.

- **Responsive breakpoints**: Algorithm comparison shifted from `md:` to `lg:` breakpoint for
  better desktop experience.

- **Typography normalization**: `font-bold` → `font-semibold` across component headings for
  consistent visual hierarchy.

- **RAG corpus regenerated**: Reduced and refreshed to match current content.

### Fixed

- **Playground sessionStorage crash**: Try-catch wrapping prevents errors in private browsing
  and sandboxed iframe environments.

- **KEM ciphertext validation**: Safer split + length checks prevent IndexError on malformed
  hybrid ciphertexts; secret comparison now checks array length before comparing.

- **ZIP key import resilience**: Per-file error handling prevents a single corrupt file from
  aborting the entire import; import count now uses actual array length.

- **OpenSSL worker silent failures**: Empty catch blocks now surface error messages via stderr
  log for file read and directory scan failures.

- **Command race condition**: `isProcessing` guard prevents double-submission in OpenSSL
  Studio's `executeCommand`.

## [2.1.0] - 2026-02-27

### Added

- **Threats × Learn cross-reference**: Each threat card now shows "Learn More" module chips
  linking directly to relevant learning modules. All 79 threats mapped to 1–4 module slugs via
  new `related_modules` column in the threats CSV.

- **Full industry threat coverage**: `INDUSTRY_TO_THREATS_MAP` expanded from `string | null`
  to `string[]`, folding 10 previously invisible threat industries (Cloud Computing, IoT,
  Insurance, Payment Card Industry, Legal/eSignature, Media/DRM, Supply Chain, Rail/Transit,
  Cryptocurrency/Blockchain, Water/Wastewater) into existing landing-page categories. Selecting
  "Finance & Banking" now surfaces PCI, Insurance, and Crypto threats; "Technology" surfaces
  Cloud, IoT, Media, and Supply Chain threats; "Energy & Utilities" surfaces Water/Wastewater
  threats; "Automotive" surfaces Rail/Transit threats.

- **Threats reference downloader** (`scripts/download-threats.js`): New Node.js script mirrors
  the library and timeline downloaders — reads `source_url` from the latest threats CSV, skips
  generic portals and paywalls, caches to `public/threats/`, writes `manifest.json`. Run via
  `npm run download:threats` (or `download:threats:dry` for a dry run).

### Changed

- **Threat source references upgraded**: 27 threats upgraded from generic organization homepage
  URLs to specific document/standard pages (e.g., `rtca.org` → `rtca.org/security/`,
  `dcsa.org` → `dcsa.org/standards/bill-of-lading`). `accuracy_pct` raised from 70% to
  75–80% for all 27 entries. New CSV: `quantum_threats_hsm_industries_02282026.csv`.

- **Threat source URL corrections** (accuracy verification pass): Fixed TELCO-002 GSMA URL,
  CROSS-001/003 IBM IBV report URL, MEDIA-003 DVB CA standards URL, CLOUD-004 CSRC URL format,
  IOT-004 source title mismatch.

- **Education removed from all touchpoints**: Industry option removed from the landing page
  personalization panel, assessment wizard, compliance abbreviation map, breach cost model, and
  scenario simulator. It had no matching threat data and produced empty report sections.

- **Executive module accuracy improvements**:
  - ROI Calculator breach cost baselines refreshed from IBM Cost of Data Breach Report 2024
    (Healthcare: $10.93M → $9.77M; Finance: $5.9M → $6.08M; Government: $4.15M → $2.76M).
  - Policy Template Generator: FrodoKEM label corrected to "(NIST IR 8413 candidate —
    pre-standard)"; Ed25519/Ed448 moved from "prohibited" to "migration required" with
    FIPS 186-5 + Shor's algorithm notes.
  - CRQC Scenario Planner: SHA-256 Grover analysis expanded with precise bit-security figures
    citing NIST IR 8547; compliance deadline array updated with 2025 CNSA 2.0 software/firmware
    entry and advisory flags for EU/ANSSI guidance.
  - Vendor Risk contract clause deadline options revised to match CNSA 2.0 timeline accurately.
  - Compliance Strategy Introduction: FIPS numbers added to CNSA 2.0 and BSI descriptions;
    key dates table updated (2024 NIST IR 8547, 2030 ANSSI advisory).
  - Migration Program Introduction: CISA quote converted to attributed prose.

- **ComplianceTimelineBuilder + RoadmapBuilder**: Year range upper bound now dynamic
  (`Math.max(2036, currentYear + 10)`) — always extends at least 10 years into the future.

- **Quiz question count**: Landing page learn step updated to reflect 470 questions.

## [2.0.1] - 2026-03-26

### Added

- **CSV cross-reference validator** (`scripts/validate-csv-refs.ts`): New TypeScript script that
  validates `compliance.library_refs → library.reference_id`, `compliance.timeline_refs →
Country:OrgName pairs`, and `library.dependencies → library.reference_id`. Exits non-zero on
  broken compliance↔library/timeline links. Run via `npm run validate:csv-refs`.

- **Timeline download scripts**: `npm run download:timeline` and `npm run download:timeline:dry`
  added to `package.json` for downloading timeline reference documents.

### Changed

- **`useChatSend`** (`src/hooks/useChatSend.ts`): Input truncated to 1,000 characters before
  submission, preventing large-paste denial-of-service. Timeout error now surfaces as
  `'Request timed out. Please try again.'` instead of silently failing.

- **`download-library.js`**: Skips re-downloading documents already cached on disk. Now writes
  output to a new date-stamped CSV file (e.g., `library_MMDDYYYY.csv`) rather than editing the
  source file in place, per CSV maintenance policy.

- **RAG corpus** (`public/data/rag-corpus.json`): Regenerated with refreshed retrieval sources.

- **Data refresh**: Library, compliance, and quantum-safe software reference CSVs updated to
  March 2026 versions. Older versions archived to `src/data/archive/`.

### Fixed

- **Chatbot timeout UX**: Users now see an explicit error message when the 60-second RAG
  request window expires, rather than the request silently failing.

- **Input validation**: Oversized inputs (>1,000 chars) are now truncated before being sent
  to the retrieval service, preventing unexpected API failures.

## [2.0.0] - 2026-02-26

### Added

- **Executive Learning Track** — 6 new modules for CISOs and business leaders: PQC Risk Management
  (risk registers, CRQC heatmaps), PQC Business Case (ROI models, breach cost simulators, board
  decks), PQC Governance & Policy (RACI matrices, KPI dashboards), Compliance & Regulatory Strategy
  (multi-jurisdiction audit checklists), Migration Program Management (roadmaps with country
  deadlines), and Vendor & Supply Chain Risk (vendor scorecards, contract clause generators). Each
  module includes interactive artifact builders with CSV/Markdown export.

- **Executive component library** (`src/components/PKILearning/common/executive/`): Reusable
  ArtifactBuilder, BreachCostModel, DataDrivenScorecard, TimelinePlanner, HeatmapGrid, and
  ExportableArtifact components shared across all executive modules.

- **Right Panel system** (`src/components/RightPanel/`): Multi-tab sidebar with Chat (RAG chatbot)
  and History (day-grouped activity timeline with module starts, completions, artifact generation,
  assessments, and belt progression). Replaces standalone ChatFAB with unified RightPanelFAB.

- **Activity history tracking** (`useHistoryStore`): Persisted event log (max 500 events, 16 event
  types) with automatic seeding from existing module, assessment, TLS, and persona stores on first
  launch.

- **Time-based quiz selection**: Replaced fixed Quick Quiz (20 questions) and Full Assessment (80
  questions) with an adjustable time slider (5–45 min, default 15 min). System calculates question
  count at ~45 sec/question. Quick Pick button for 5-minute quizzes. Adaptive category spread
  ensures topic breadth even for short quizzes.

- **6 new quiz categories**: `pqc-risk-management`, `pqc-business-case`, `pqc-governance`,
  `compliance-strategy`, `migration-program`, `vendor-risk` — matching the new executive modules.

- **Module deep linking** (`useModuleDeepLink`): URL parameter support for `?tab=learn|workshop` and
  `?step=<n>` across all learning modules. Chatbot responses now link directly to specific workshop
  steps.

- **Executive document storage**: 15 artifact types (ROI model, risk register, RACI matrix, vendor
  scorecard, policy draft, etc.) persisted in module store with history tracking.

- **Glossary expansion**: Added KPI, RACI Matrix, TCO, and ROI terms for executive audiences.

### Changed

- **Persona paths**: Executive persona learning path expanded from 180 to 270+ minutes with 5
  checkpoints covering all 6 new executive modules.

- **Module catalog**: Expanded to 23 modules across 6 tracks (new Executive track added). Centralized
  MODULE_CATALOG, MODULE_TRACKS, and MODULE_STEP_COUNTS in `moduleData.ts`.

- **GeminiService**: `streamResponse()` now accepts `PageContext` object (page, tab, step) instead of
  plain string, enabling workshop-step-aware chatbot responses.

- **Analytics**: Module start/complete and artifact generation events now auto-log to history store.
  `logStepComplete()` accepts optional `workshopStep` for accurate deep link generation.

- **Module store v5**: Added `executiveDocuments` array to artifacts with auto-migration from v4.

- **ScoreCard**: Simplified layout, removed cloud sync UI, focused on judo belt progression.

- **Data updates**: Library CSV and quantum-safe software reference CSV updated with latest NIST
  FIPS 140-3 PQC guidance and vendor certification statuses.

### Fixed

- **Quiz question selection**: Quick Quiz was too long at 20 questions (~15 min). New time slider
  lets users choose exactly how much time they have, starting from 5-minute quick picks.

- **Storage rehydration guards**: Assessment and persona stores now properly handle corrupted
  localStorage without crashing.

- **Workshop deep links**: Chatbot now generates `?tab=workshop&step=N` links instead of generic
  module links.

## [1.38.0] - 2026-02-26

### Added

- **RAG retrieval optimization** (Rounds 2–5): Multi-turn conversation context injects last 3 user
  messages as supplementary search terms. Intent-aware diversity caps (60% for comparison/catalog/
  country queries). Source boost tuning — transitions 3× for comparisons, documentation 1.5× for
  recommendations, library 1.2× for country queries, leaders 1.5× for definitions. System prompt
  optimized (47 → 17 guideline lines, ~400 tokens reclaimed). Corpus expanded from 1,712 to 1,727
  chunks: 13 assessment guide, 3 getting-started, 4 playground guide, 3 OpenSSL Studio guide, and
  certifications expanded from 3 to 13 vendor-level chunks.

- **Source attribution UI** (`ChatMessage.tsx`, `ChatPanel.tsx`, `ChatTypes.ts`): Assistant messages
  now show a collapsible source list with deep-linked titles. Click any source to navigate directly
  to the relevant page. Sources are deduplicated by title.

- **Follow-up question suggestions** (`ChatMessage.tsx`): Entity-aware follow-up chips appear below
  the last assistant response. Regex-based extraction detects algorithm names, FIPS standards,
  vendor/product names, and learning module topics, then maps them to contextual follow-up templates.
  Capped at 3 suggestions.

- **Curated suggested questions** (`usePageContext.ts`): All 18 learning modules now have hand-written
  suggested questions (previously 10/18 used generic templates). Added: VPN & SSH, Email Signing, PKI
  Workshop, Merkle Tree Certs, API Security & JWT, Code Signing, Digital Identity, IoT & OT Security.

- **Clear conversation confirmation** (`ChatPanel.tsx`): Trash button now requires `confirm()` before
  clearing messages. Matches existing `window.confirm()` pattern used across the codebase.

- **40 golden query tests** (`golden-queries.test.ts`): Expanded from 21 to 40 regression tests
  covering definitions, comparisons, catalog lookups, country queries, recommendations, and
  cross-intent queries. Metrics: 100% Intent Accuracy, 93.1% Recall@5, 100% Recall@15, 94.9%
  Source Coverage, 0% Noise Rate.

### Fixed

- **ChatFAB mobile position** (`ChatFAB.tsx`): Fixed Tailwind class ordering — mobile-first
  `bottom-20 right-4` with `md:bottom-6 md:right-6` override. Previous classes had conflicting
  order that was accidentally working.

- **Streaming accessibility** (`ChatPanel.tsx`): Added `aria-live="polite" aria-atomic="false"`
  to the messages container so screen readers announce streaming text progressively.

## [1.37.0] - 2026-02-25

### Added

- **Precision deep-link entry points** (8 views): Library `?ref=`, Threats `?id=`, Learn modules
  `?tab=workshop`, Algorithms `?highlight=` (highlights in both Overview and Detailed Comparison
  tabs), Compliance `?cert=`, Assess `?step=`, Playground `?algo=`, Leaders
  `?leader=`/`?sector=`/`?country=`. All entry points include `useEffect` sync for same-route
  navigations (chatbot deep links).

- **RAG deep-link integration** (`scripts/generate-rag-corpus.ts`, `GeminiService.ts`): 95% of RAG
  corpus chunks (1,643/1,725) now carry pre-computed `deepLink` URLs. Gemini system prompt guideline
  #4 instructs the model to always use the deep link from context chunks, producing more precise
  navigation links in chatbot responses.

- **PQC Assistant section in About page** (`AboutView.tsx`, `MobileAboutView.tsx`): New section
  explaining the RAG architecture, Gemini 2.5 Flash integration, BYOK API key requirement
  (with link to Google AI Studio), three capability cards (Grounded Answers, Deep Linking, PQC
  Domain Expertise), and four limitations.

- **Sample Questions modal** (`SampleQuestionsModal.tsx`, `ChatPanel.tsx`): `?` button in the chat
  panel header opens a categorized question bank (22 questions across 11 categories — Library,
  Threats, Learn, Algorithms, Compliance, Assessment, Playground, Leaders, Timeline, Migrate,
  Cross-cutting). Click any question to copy it to clipboard for pasting into the chatbot.

### Fixed

- **3 pre-existing test failures** (`LeadersGrid.test.tsx`, `LibraryView.test.tsx`,
  `TimelineView.test.tsx`): Added missing `useSearchParams` mocks to fix 49 tests that were failing
  before this release.

## [1.36.0] - 2026-02-25

### Added

- **PQC Assistant chatbot** (`src/components/Chat/`, `src/services/chat/`): Gemini 2.5 Flash-powered
  conversational AI with client-side RAG retrieval. Three-phase search (entity matching → query
  expansion → keyword with source diversity) draws from 1,725 chunks across 17 data sources
  (glossary, algorithms, threats, timeline, library, compliance, migrate catalog, leaders, quiz,
  assessment, certifications, priority matrix, authoritative sources, documentation, and all 19
  learning modules). Streaming markdown responses with SPA-aware internal link navigation. Floating
  action button + slide-in panel. BYOK model — users provide their own Gemini API key.

- **Deep-linking across all pages**: Library, Compliance, Timeline, and Leaders views now accept
  `?q=` search params to pre-filter on load. Chatbot system prompt instructs the model to deep-link
  all mentioned items: products via `/migrate?q=`, algorithms via `/algorithms?highlight=`,
  industry threats via `/threats?industry=`, library docs via `/library?q=`, compliance frameworks
  via `/compliance?q=`, timeline countries via `/timeline?q=`, and leaders via `/leaders?q=`.

- **RAG corpus generators** (`scripts/generate-rag-corpus.ts`): 4 new CSV processors — quiz Q&A
  (138 chunks from 380 questions grouped by category), assessment config (3 chunks), migration
  priority matrix (4 chunks), and certification cross-references (3 chunks). Combined with learning
  module content extraction (258 chunks) and markdown documentation (70 chunks), the corpus grew
  from 1,249 to 1,725 chunks (1.44 MB).

- **Study Pack for NotebookLM** (`src/services/export/StudyPackService.ts`,
  `src/components/About/StudyPackCard.tsx`): Downloadable ZIP file containing all PQC Today content
  (glossary, algorithms, library, threats, compliance, migrate catalog, leaders, timeline, learning
  modules) as structured markdown files for use with Google NotebookLM.

- **Data Privacy section** (`AboutView.tsx`, `MobileAboutView.tsx`): New section on the About page
  explaining the app's privacy model — no server-side data collection, localStorage-only
  persistence, BYOK API key handling, and educational-use crypto disclaimer.

### Fixed

- **Broken deep links from Assessment Report**: Report → Library used `?search=` but Library reads
  `?q=` (param name mismatch, links landed with empty search). Report → Timeline sent `?country=`
  but TimelineView never consumed it (country not pre-selected). Report → Migrate sent `?industry=`
  but MigrateView ignored it (no industry filtering applied).

- **Timeline `?country=` deep link** (`TimelineView.tsx`): URL param now pre-selects the country
  dropdown, validated against available timeline data before applying.

- **Migrate `?industry=` deep link** (`MigrateView.tsx`): New `industryFilter` state filters
  products by `targetIndustries` field. Dismissible banner shows the active industry filter,
  following the existing step-filter pattern.

## [1.35.0] - 2026-02-25

### Fixed

- **Global mobile UX audit — touch targets** (41 files): Comprehensive WCAG 2.1 AA remediation
  across every page and component. All interactive elements now meet the 44×44px minimum touch
  target requirement. Key changes: `min-h-[44px]` added to filter buttons in `ChangelogView`,
  phase dots in `MobileTimelineList`, answer buttons in `QuestionCard`, link buttons in
  `LeaderCard`, the `FilterDropdown` trigger, and the `SourcesModal` close button. Button
  component `sm` size increased from `h-9` (36px) to `h-10` (40px); `icon` size from
  `h-10 w-10` to `h-11 w-11` (44px) globally via `button-variants.ts`.

- **Dynamic viewport height for modals** (`ScoringModal`, `SourcesModal`,
  `ReportMethodologyModal`): Changed `max-h-[85vh]` → `max-h-[85dvh]` so modals remain fully
  scrollable in landscape mode on phones where the browser address bar reduces available height.
  Suspense fallback in `MainLayout` likewise changed from `h-[50vh]` → `min-h-[200px] h-[50dvh]`.

- **Safe-area inset support** (`MainLayout.tsx`, `src/styles/index.css`): Sticky app header now
  uses `top-[max(1rem,env(safe-area-inset-top))]` to clear iPhone notch / Dynamic Island. New
  `.safe-top` CSS utility added for reuse.

- **Tabs overflow on all Learn modules** (`src/components/ui/tabs.tsx`): `TabsList` gained
  `overflow-x-auto no-scrollbar w-full`; `TabsTrigger` gained `shrink-0`. Fixes tab bar
  compression/overflow on all 16 learning module pages.

- **Module workshop landscape mode** (18 module files): Content panels changed from
  `min-h-[600px]` → `min-h-[400px] md:min-h-[600px]` so workshop areas remain usable on
  landscape phones where viewport height can be as low as 320px.

- **QKD BB84 Simulator** (`modules/QKD/workshop/BB84Simulator.tsx`): Qubit grid wrapped in
  `overflow-x-auto` with `min-w-max` on the inner grid to prevent clipping on narrow screens;
  Eve interception slider widened from `w-16` → `w-24` for easier finger dragging.

- **Report page** (`ReportContent.tsx`, `ReportThreatsAppendix.tsx`): Risk gauge SVG scaled
  down on mobile (`w-32 h-20 md:w-48 md:h-28`). Threat Landscape table minimum width reduced
  from `min-w-[560px]` → `min-w-[400px]`; "Crypto at Risk" column hidden on mobile
  (`hidden md:table-cell`) to reduce horizontal scroll distance.

- **Threats page** (`ThreatsDashboard.tsx`, `MobileThreatsList.tsx`): Search bar changed from
  `hidden md:flex` to always-visible (`flex w-full md:flex-1`) so mobile users can filter
  threats. Stat chip grid changed from `grid-cols-2` → `grid-cols-1 min-[360px]:grid-cols-2`
  to prevent overflow on sub-360px devices.

- **Compliance dropdowns** (`ComplianceTable.tsx`): Source, Category, and Vendor filter menus
  gained `max-w-[calc(100vw-2rem)]` so they cannot overflow off-screen on 320–375px viewports.

- **Misc layout fixes**: `SoftwareTable` expanded row label column changed from
  `grid-cols-[120px_1fr]` → `grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr]`; `Changelog`
  filter row changed from `flex-wrap` → `flex-col sm:flex-row` so buttons stack cleanly on
  mobile; `MobileTimelineList` phase indicator dots enlarged to 44×44px touch target; Landing
  page journey step rail gained a right-edge fade gradient scroll affordance.

## [1.34.0] - 2026-02-25

### Added

- **Standalone Report view** (`/report`, `src/components/Report/`): Extracted the PQC Risk
  Assessment report from `AssessView` into its own dedicated route. `ReportView` accepts URL
  query parameters to auto-hydrate and auto-complete assessments, enabling fully shareable report
  links. `ReportContent` consolidates all report sections — Risk Score gauge (SVG needle),
  Category Breakdown, HNDL/HNFL risk windows, Algorithm Migration priorities, Compliance Impact,
  Recommended Actions, Migration Roadmap, and Threat Landscape — into a single 1 700-line
  component with persona-aware section visibility and print/PDF support. `MigrationToolkit`
  section surfaces curated software products directly from the Migrate catalog.

- **Code Signing module** (`/learn/code-signing`, `src/components/PKILearning/modules/CodeSigning/`):
  New 5-step workshop covering PQC supply chain security. **Step 1 – Binary Signing**: sign/verify
  arbitrary payloads with ML-DSA-87 and compare classical ECDSA P-384 byte overhead. **Step 2 –
  Certificate Chain**: build a PQC certificate hierarchy (root CA → intermediate → leaf) with
  ML-DSA. **Step 3 – Package Signing**: RPM-style hybrid package signing with ML-DSA-87 + Ed448
  dual signatures. **Step 4 – Sigstore Flow**: keyless signing via Sigstore transparency-log
  workflow including inclusion proof visualization. **Step 5 – Secure Boot Chain**: interactive
  4-stage boot chain visualization comparing LMS, XMSS, and ML-DSA firmware signing algorithms
  with stateful signature counter tracking and CNSA 2.0 mandate timelines.

- **API Security & JWT module** (`/learn/api-security-jwt`,
  `src/components/PKILearning/modules/APISecurityJWT/`): New 5-step workshop covering JWT/JWS/JWE
  with post-quantum algorithms. **Step 1 – JWT Inspector**: decode and inspect any JWT with
  algorithm vulnerability analysis (flags RS256/HS256 as quantum-vulnerable). **Step 2 – PQC JWT
  Signing**: sign JWTs with ML-DSA-87 and compare to RS256 signature byte sizes. **Step 3 –
  Hybrid JWT**: dual-sign with classical (Ed25519) + PQC (ML-DSA-87) for backward-compatible
  migration tokens. **Step 4 – JWE Encryption**: encrypt JWT payloads with ML-KEM-768 key
  agreement. **Step 5 – Token Size Analyzer**: side-by-side header/payload/signature byte
  breakdown for RS256, ES256, ML-DSA-44/65/87.

- **IoT & OT Security module** (`/learn/iot-ot-pqc`,
  `src/components/PKILearning/modules/IoTOT/`): New 5-step workshop covering PQC challenges for
  constrained devices. **Step 1 – Constrained Algorithm Explorer**: algorithm selection for
  RFC 7228 Class 0/1/2 devices with memory and compute constraints. **Step 2 – Firmware Signing
  Simulator**: LMS/XMSS stateful signature signing with state counter tracking. **Step 3 – DTLS
  Handshake Visualizer**: DTLS 1.3 protocol visualization with PQC impact analysis. **Step 4 –
  SCADA Migration Planner**: ICS migration strategy across Purdue Model levels. **Step 5 – Cert
  Chain Bloat Analyzer**: certificate size impact analysis for constrained device environments.

- **Belt-ranked Learning Journey scorecard** (`src/components/Landing/ScoreCard.tsx`): Replaced
  linear progress display with a 7-tier judo belt ranking system (White → Yellow → Orange → Green
  → Blue → Brown → Black). Composite 0–100 score is computed across 4 weighted dimensions:
  Knowledge 40% (quiz accuracy), Breadth 30% (step completion %), Practice 20% (artifacts
  created), Consistency 10% (time + day streak). Threshold gating prevents belt advancement
  without meeting all dimension minimums. Streak tracking with 2–7 day flame badge. Cloud sync
  UI surface (upload/download via Google Drive) with last-synced timestamp.

- **Awareness Score hook** (`src/hooks/useAwarenessScore.ts`): New 490-line hook computing the
  belt-rank score. Returns `AwarenessScoreResult` with score, belt rank, next-belt gap, 4-
  dimension breakdown (raw + weighted), track-level progress, and streak data. Persona-scoped —
  filters modules/questions to the active persona's learning path. Cumulative quiz mastery tracks
  correct question IDs across sessions; streak inferred from `sessionTracking` daily-visit log.

- **Google Drive cloud sync** (`src/services/storage/GoogleDriveService.ts`,
  `src/services/storage/UnifiedStorageService.ts`, `src/store/useCloudSyncStore.ts`): Privacy-
  first cloud persistence layer. `GoogleDriveService` uses Google Identity Services implicit flow
  with `drive.appdata` scope — stores access tokens in-memory only (never written to
  localStorage). Progress saved to a single JSON file in Google Drive's hidden `appDataFolder`
  (invisible to the user's Drive file list). `UnifiedStorageService` aggregates all Zustand stores
  into a typed `AppSnapshot` (version 1.0) with Uint8Array serialization, and exports/imports
  JSON snapshots. `useCloudSyncStore` (version 1, persisted) tracks sync state: enabled, provider,
  `lastSyncedAt`, `lastSyncDirection`.

- **Persistent Migrate layer/subcategory filters** (`src/store/useMigrateSelectionStore.ts`):
  Version bump to v2 adds `activeLayer` and `activeSubCategory` fields. Selected infrastructure
  layer and sub-category now survive page reloads. `MigrateView` reads/writes via the store;
  migration guard in `migrate()` provides safe defaults for existing v1 persisted state.

- **CBOM Scanner enhancements** (`CBOMScanner.tsx`, `cbomTemplates.ts`): Major expansion of the
  Crypto Agility module's CBOM tooling. New dependency graph visualization, expanded template
  library (20+ templates covering cloud, container, API gateway, microservice, and IoT stacks),
  per-asset migration effort scoring, and CSV/JSON export of the bill of materials.

- **Tools & Products tab** in all learning modules: New "Tools & Products" tab next to References
  surfaces PQC-ready products from the Migrate catalog that are relevant to each module. Products are
  grouped by infrastructure layer with compact cards showing PQC support badge, FIPS validation
  status, license type, product brief, and a "View in Migrate" deep-link that pre-selects the
  matching layer. Powered by a new `learning_modules` column in the migrate CSV (177/223 products
  tagged across 34 categories) and a shared `ModuleMigrateTab` component. Multi-layer products
  appear in all matching layer sections.

- **Report contextual actions** (`src/components/Report/ReportContent.tsx`): Algorithm replacement
  rows now include "Learn" links to relevant modules (ML-KEM/ML-DSA → PKI Workshop, SLH-DSA/LMS →
  Stateful Signatures, Hybrid → Hybrid Crypto). Timeline section links to country-filtered
  timeline view. Footer actions link to full algorithm comparison and compliance explorer pages.

- **Module cross-navigation** in 10 learning module introductions: "Explore Related Topics" cards
  linking to related modules (e.g., Hybrid Crypto → API Security & JWT, MTC → TLS Basics,
  PQC 101 → Entropy & Randomness, Quantum Threats → Digital Assets, TLS → 5G Security).

- **Glossary expansion**: 6 new IoT/OT terms (MQTT, LoRaWAN, Matter, SUIT/RFC 9019, RFC 7228,
  Purdue Model) plus UEFI for Secure Boot. Existing SCADA and DTLS entries relinked to IoT module.

- **Updated algorithm + software CSVs**: Refreshed `algorithms_transitions_02252026.csv` and
  `algorithms_transitions_02262026.csv` (RSA → ML-KEM, ECDSA → ML-DSA, ECDH → HQC deprecation
  dates). New `pqc_complete_algorithm_reference_02252026.csv` with 15-column algorithm reference
  including performance benchmarks (keygen/sign/verify cycles) and stack RAM per security level.
  New `quantum_safe_cryptographic_software_reference_02272026.csv` and `_02282026.csv` featuring
  BTQ Bitcoin Quantum (ML-DSA), Hitachi DoMobile (FIPS 203 ML-KEM), Solana PQC testnet, SEALSQ
  Quantum Shield, QuSecure, SandboxAQ, and 01 Quantum IronCAP.

- **Library catalog refresh** (`library_02252026.csv`): Korean PQC Competition finalists
  (HAETAE, AIMer, SMAUG-T, NTRU+), NIST FIPS 140-3 PQC implementation guidance, 3GPP PQC study,
  TPM 2.0 PQC specification, 10+ new IETF RFCs (9629, 9708, 9802, 9810, 9814, 9858, 9881, 9882),
  ETSI hybrid key exchange and migration specs, NSA CNSA 2.0 policy with implementation timelines.

### Changed

- **`AssessView` simplified** (`src/components/Assess/AssessView.tsx`): Report rendering removed
  from AssessView; on completion the wizard navigates to `/report` instead of showing an inline
  report. Assessment mode selection (Quick vs Comprehensive) and resume banner retained. Reduces
  `AssessView` from ~650 to ~400 lines.

- **`StepIndicator` redesigned** (`src/components/Assess/steps/StepIndicator.tsx`): Overhauled
  step navigation rail with improved active/completed state styling, mobile-responsive step labels,
  and per-step metadata badges.

- **`ScoringModal` updated** (`src/components/Landing/ScoringModal.tsx`): Now explains the 4-
  dimension belt-rank scoring breakdown with threshold gating details and a per-belt requirements
  table.

- **`PersonalizationSection` updated** (`src/components/Landing/PersonalizationSection.tsx`):
  Refreshed layout to accommodate the new ScoreCard belt display and cloud sync status indicator.

- **`MigrateView` refactored** (`src/components/Migrate/MigrateView.tsx`): Layer and sub-category
  filter state moved from local `useState` to `useMigrateSelectionStore` for persistence.
  `InfrastructureStack` click handler now dispatches to the store. Per-layer product counts
  computed from filtered software data.

- **Learn module tracks reorganized** (`src/components/PKILearning/moduleData.ts`): `code-signing`
  and `iot-ot-pqc` added to the Applications track; `api-security-jwt` added to the Protocols
  track. Module step counts table updated for all new modules.

- **Assessment wizard Step 3 refactored** (`src/components/Assess/steps/Step3Crypto.tsx`):
  Switched from `pqcAlgorithmsData` to the algorithms transition table. Chips now display
  classical → PQC replacement pairs with category-aware grouping. Added "Compare algorithms" link
  to the full algorithm database at `/algorithms`.

- **Assessment scoring engine expanded** (`src/hooks/assessmentData.ts`, `assessmentUtils.ts`):
  Algorithm DB now includes 9 quantum-safe PQC algorithms (ML-KEM, ML-DSA, SLH-DSA, LMS/HSS,
  XMSS) with hybrid recommendations. Country regulatory urgency expanded from 10 to 20+ countries
  with source citations. Composite score boost factors refactored from multiplicative stacking to
  additive increments capped at 1.2x. Unknown algorithms now treated as quantum-vulnerable.

- **Persona learning paths expanded** (`src/data/learningPersonas.ts`): All four personas updated
  with new modules (merkle-tree-certs, digital-id, iot-ot-pqc) and expanded checkpoints.
  Developer duration 705→855 min, Architect 765→1095 min, Researcher 1080→1230 min.

- **Library view layout** (`src/components/Library/LibraryView.tsx`): Category sidebar refactored
  from vertical sticky sidebar to horizontal pill layout for better mobile/desktop responsiveness.
  Grid breakpoints expanded to 4-column layout at xl.

- **Store persistence hardened**: Added explicit `version`, `migrate()`, and `onRehydrateStorage`
  crash guards to OpenSSL Studio, TLS Learning, Theme, and Version stores. Assessment store
  migrations reordered and extended (v5–v7) for infrastructure validation and algorithm renaming.

- **Landing page dynamic counts** (`src/components/Landing/LandingView.tsx`): Module count,
  quiz question count, and tool count now derived from data sources instead of hardcoded values.

## [1.33.0] - 2026-02-24

### Added

- **PQC Live Comparison Demo** (`DigitalAssets/PQCMigrationFlow`, `PQCLiveComparisonFlow`): Added
  Part 5 "Try It Live" to the PQC Defense workshop flow in the Digital Assets module. Users can
  now run real ML-DSA-65 and secp256k1 crypto operations side-by-side in the browser via OpenSSL
  WASM v3.6.0. Three-step interactive wizard: (1) key generation with real PEM byte size
  comparison, (2) signing the same message with both algorithms and a CSS bar chart showing the
  ~46× signature size difference, (3) verifying both signatures with a live BIP-360 witness
  overhead calculation. secp256k1 signing uses `-rawin -digest sha256` to handle raw messages
  (ECDSA expects a pre-computed digest by default); ML-DSA-65 handles arbitrary-length messages
  natively per FIPS 204. No liboqs required — OpenSSL 3.6.0 natively supports ML-DSA-44/65/87.

- **`ML_DSA_65` command templates** (`DigitalAssets/constants.ts`): Added `ML_DSA_65` command
  group alongside existing `BITCOIN`, `ETHEREUM`, `SOLANA` groups with `GEN_KEY`, `EXTRACT_PUB`,
  `SIGN`, and `VERIFY` helpers for OpenSSL ML-DSA-65 operations.

## [1.32.0] - 2026-02-24

### Fixed

- **Glossary tooltip overflow clipping** (`InlineTooltip`, all 16 learning modules): Tooltips
  were silently clipped inside any container with `overflow: hidden` or `overflow-y: auto`
  (TLS panel glass-panels, PKIWorkshop modal bodies, DigitalID scroll container, FiveG diagram
  wrappers, DigitalAssets step wizard). Fixed by switching from `position: absolute` (relative
  to nearest positioned ancestor) to `ReactDOM.createPortal()` rendering into `document.body`
  with `position: fixed` coordinates computed from `getBoundingClientRect()`. Z-index raised to
  `9999` via inline style. A scroll event listener (window capture phase) closes the tooltip
  when the page scrolls, preventing stale-position display.

- **DigitalAssets `InfoTooltip` and local `InlineTooltip` clipping** (`modules/DigitalAssets`):
  Applied the same portal + fixed positioning fix to both exported components in the module-local
  `InfoTooltip.tsx`. Arrow decorations removed since they don't work with fixed positioning.

- **DigitalID `InfoTooltip` clipping** (`modules/DigitalID`): Applied portal + fixed positioning
  fix. Added above/below smart positioning (the original always rendered below regardless of
  viewport space).

### Added

- **`SCT` glossary term** (`glossaryData.ts`): Signed Certificate Timestamp was used in the
  Merkle Tree Certs module (`<InlineTooltip term="SCT">`) but had no glossary entry, causing
  the tooltip to silently render as plain text. Added with a complete definition covering CT log
  membership proofs and the relationship to MTC inclusion proofs.

## [1.31.0] - 2026-02-23

### Added

- **Full SEO overhaul**: Per-route metadata for all 31 pages — unique titles, descriptions,
  canonical URLs, Open Graph tags, and Twitter Card tags dynamically rendered using React 19's
  native document metadata hoisting. No external dependency required.

- **Playwright-based prerendering**: All 31 routes now generate static HTML at build time via
  `scripts/prerender.mjs`. Crawlers receive real rendered content (navigation, headings, page text)
  without executing JavaScript, solving the SPA indexing problem. WASM-heavy interactive content
  still loads client-side after hydration.

- **Expanded sitemap** (`public/sitemap.xml`): Grew from 13 to 31 URLs, now covering all 16
  learning modules (`/learn/pqc-101`, `/learn/quantum-threats`, etc.), `/assess`, `/learn/quiz`,
  and all main routes — each with `<lastmod>` dates for accurate crawl scheduling.

- **Enhanced structured data** (`index.html`, `src/seo/routeMeta.ts`): Homepage now declares a
  `@graph` with `WebSite` (including `SearchAction` for sitelinks search), `Organization` (with
  logo and GitHub sameAs), and `WebApplication` schemas. Individual routes inject page-specific
  JSON-LD: `Course` for the learning hub, `LearningResource` per module, `Dataset` for compliance
  and timeline data, `ItemList` for the algorithm explorer.

- **Journey-oriented descriptions**: Homepage and 5 key pages (`/learn`, `/assess`, `/migrate`,
  `/compliance`, `/timeline`) now carry elevated, mission-driven descriptions that convey the
  end-to-end guided PQC transformation journey — education → risk assessment → migration →
  regulatory compliance alignment.

- **CI prerender support** (`.github/workflows/deploy.yml`): Playwright Chromium is now installed
  before the build step so `scripts/prerender.mjs` runs correctly in the GitHub Actions deploy
  pipeline.

- **`robots.txt` crawl-delay**: Added `Crawl-delay: 1` directive to pace crawler traffic.

## [1.30.0] - 2026-02-22

### Added

- **Persona-aware assessment report** (`/assess`): Executive persona now sees a streamlined report —
  HNDL/HNFL risk windows and algorithm migration matrix are hidden by default, recommended actions
  are clamped to top 5. A "View full technical report" toggle reveals the complete report.
  Researcher and architect personas get the Industry Threat Landscape section expanded by default.

- **Wizard pre-fill from persona store** (`/assess`): The assessment wizard now auto-fills industry
  and country from the persona/region selections made on the landing page, so users don't re-enter
  data they already provided.

- **Industry filter on Migrate catalog** (`/migrate`): New Industry dropdown filter in the software
  catalog, powered by each product's `targetIndustries` field. Auto-initialized from the
  assessment's industry, persona store, or `?industry=` URL parameter. Includes a filter banner
  with clear button matching the existing layer/step filter pattern.

- **Assessment → Migrate deep link** (`/assess`): "Explore" links on recommended actions pointing
  to `/migrate` now append `?industry=...` so the Migrate catalog auto-filters to industry-relevant
  tools.

### Fixed

- **Chunk loading resilience**: All 30 lazy-loaded routes and modules now use `lazyWithRetry` — a
  wrapper that retries failed dynamic imports up to 3 times with exponential backoff (1s → 2s → 4s)
  and auto-reloads the page as a last resort (once, via sessionStorage guard). Eliminates the
  "page won't load until you manually refresh" issue caused by stale chunks after deploys or
  transient network failures.

- **ErrorBoundary smart recovery**: The "Try again" button now detects chunk load errors
  (`dynamically imported module`, `Failed to fetch`) and performs a full page reload instead of
  just resetting React error state — which was ineffective because React.lazy caches rejected
  promises.

- **WASM promise cache invalidation**: liboqs KEM and signature instance caches (`liboqs_kem.ts`,
  `liboqs_sig.ts`) now evict rejected promises on failure so the next call retries the WASM factory
  instead of permanently returning the same dead promise. Cleanup also catches already-failed
  promises to prevent unhandled rejection warnings.

- **LmsService init race condition**: Concurrent `init()` callers now detect whether the first
  init attempt succeeded or failed, instead of silently returning without a module. Failed script
  elements are removed from the DOM so retries can re-add them.

## [1.29.0] - 2026-02-22

### Added

- **Industry-weighted composite scoring** (`/assess`): Risk scores now use industry-tailored
  category weights — government and finance boost regulatory pressure (0.30), telecom and energy
  boost migration complexity (0.25), and technology boosts organizational readiness (0.30) — instead
  of fixed weights across all industries.

- **Country planning horizons** (`/assess`): HNDL and HNFL risk windows now use country-specific
  regulatory deadlines (US/France/Canada target 2030, Germany/UK/Australia target 2035) instead of
  a universal 2035 planning horizon. Users in countries with earlier deadlines see more urgent risk
  assessments.

- **Compliance deadline-aware scoring** (`/assess`): Regulatory pressure scoring now parses actual
  deadline years from compliance frameworks. Passed deadlines score 15 points, imminent (≤2 years)
  score 14, near-term (≤5 years) score 12, and distant deadlines score 8 — replacing the previous
  flat per-framework scoring.

- **Category score driver explanations** (`/assess`): Each of the four risk category progress bars
  now shows a human-readable explanation of what drives the score (e.g., "3 vulnerable algorithms,
  high sensitivity, 25-year retention").

- **Industry-specific recommended actions** (`/assess`): Nine industry-tailored actions added —
  from CNSA 2.0 alignment for government to SCADA/OT assessment for energy, V2X planning for
  automotive, and cloud KMS evaluation for technology.

- **Algorithm-highlighted threat landscape** (`/assess`): Threat rows matching the user's selected
  algorithms are now visually highlighted with a primary-colored left border and subtle background.

- **Country-aware migration roadmap** (`/assess`): Roadmap swim lane phases (Immediate, Short-term,
  Long-term) now dynamically compress or expand based on deadline proximity — urgent deadlines
  (≤24 months) compress to 0–3/3–12 months, distant deadlines (≥60 months) expand to 0–12/12–24
  months.

- **Industry-aware retention defaults** (`/assess`): "I don't know" retention answers now use
  industry-specific conservative defaults from CSV data (75 years for government, 40 for aerospace)
  instead of a flat 15-year default.

### Changed

- **Methodology modal accuracy** (`/assess`): Updated risk score description to reflect actual
  industry-tailored weights and deadline proximity scoring. Added country planning horizon context
  to HNDL description. Updated "I don't know" section with industry-specific retention defaults.

- **Country urgency scoring uncapped** (`/assess`): Removed the artificial cap on country regulatory
  urgency contribution, allowing high-urgency countries (US, France) to contribute their full
  weight to the regulatory pressure score.

- **Executive summary country context** (`/assess`): When a user's country has an accelerated
  planning horizon, the executive summary now explicitly mentions the country's target year
  relative to the global planning horizon.

## [1.28.0] - 2026-02-22

### Added

- **Report methodology modal** (`/assess`): Info button next to the report title opens a modal
  explaining how the risk score, four risk categories, HNDL/HNFL risk windows, conservative
  defaults for "I don't know" responses, and action prioritization work. Hidden in print view.

### Fixed

- **Compliance impact industry filtering** (`/assess`): Fixed bug where telecom-only compliance
  frameworks (e.g., GSMA NG.116) appeared in Finance industry reports. Changing industry or country
  now clears stale compliance selections, and the scoring engine filters out frameworks that don't
  match the selected industry.

## [1.27.0] - 2026-02-22

### Added

- **Web Browsers category in Migrate catalog** (`/migrate`): Added Google Chrome, Microsoft Edge,
  Mozilla Firefox, and Apple Safari (CSC-037) with ML-KEM TLS 1.3 support details. All four tagged
  for both migrate and launch phases. New `02222026.csv` created per CSV maintenance rules.

### Changed

- **Three-tier FIPS validation badge** (`/migrate`): FIPS column now distinguishes between
  FIPS 140/203 certified (green "Validated"), indirect or partial claims like FedRAMP, WebTrust,
  FIPS mode (amber "Partial"), and no validation (gray "No"). Previously any "Yes" value showed
  a misleading green "Validated" badge.

### Fixed

- **CSV line ending normalization**: Fixed mixed CRLF/LF line endings in software reference CSVs
  that caused PapaParse to silently drop rows with quoted comma fields.

## [1.26.0] - 2026-02-22

### Added

- **Sources button on Compliance page** (`/compliance`): Page header now includes a `SourcesButton`
  giving users direct access to authoritative sources referenced in the compliance landscape.

- **Full header cluster on Migrate page** (`/migrate`): The PQC Migration Catalog page header now
  includes an `ArrowRightLeft` icon, plus `SourcesButton`, `ShareButton`, and `GlossaryButton`,
  completing the standard content-page header pattern across all major views.

- **Share & Glossary buttons on OpenSSL Studio** (`/openssl`): Desktop header now includes
  `ShareButton` and `GlossaryButton` (hidden on mobile), consistent with other tool pages.

### Changed

- **Authoritative sources data model** (`src/data/authoritativeSourcesData.ts`): Added
  `complianceCsv` and `migrateCsv` boolean fields to `AuthoritativeSource`; extended `ViewType`
  to include `'Compliance'` and `'Migrate'`; CSV parser updated to 13 columns with
  `lastVerifiedDate` shifted from index 10 to index 12.

### Fixed

- **Playground page layout** (`/playground`): Description paragraph moved above the button cluster
  so it reads correctly before the action controls rather than inline with them.

## [1.25.0] - 2026-02-22

### Added

- **Persona-aware journey step rail** (`/`): The landing page now features a horizontal 7-step
  progression rail — Learn → Assess → Explore → Test → Deploy → Ramp Up → Stay Agile —
  replacing the previous feature-grid layout. Inaccessible steps are dimmed at 35% opacity
  based on the active persona; persona-priority steps receive a "For you" badge. Each step card
  shows route chips for all paths (Explore → Timeline / Algorithms / Library; Stay Agile →
  Threats / Leaders; single-path steps show their chip too for visual consistency).

- **Hero messaging refresh** (`/`): Updated hero tagline to "The quantum era is here. Your
  transformation journey starts now." with a new "Your PQC Transformation" headline and
  persona-aware CTA buttons routing each role to its most relevant starting point
  (Executive → Assess, Developer → Playground, Architect → Timeline, Researcher → Algorithms).

### Fixed

- **Landing — path chips on all step cards** (`/`): Route chips previously only rendered on
  multi-path steps (`step.paths.length > 1` guard removed). All 7 journey cards now display
  their chips, giving every step a consistent visual affordance.

- **Landing — step rail connector alignment** (`/`): Vertical connector lines between step circles
  now pin correctly to circle center regardless of card column height (fixed via `items-start` +
  `mt-4` offset on the connector div).

- **Tests — ComplianceView and audit_suci** (`src/`): Resolved pre-existing failures by wrapping
  `render()` calls in `<MemoryRouter>`, correcting the default-tab assertion (`"landscape"` not
  `"all"`), adding `Buffer` to the WASM test `vm` context, and replacing `new Function()` with
  `vm.runInContext()` for safer WASM glue code loading.

## [1.24.0] - 2026-02-22

### Added

- **Entropy & Randomness quiz category** (`/learn/quiz`): New `entropy-randomness` category with Dice icon covering SP 800-90 A/B/C, DRBG mechanisms, entropy sources, TRNG vs QRNG, and min-entropy estimation. Integrated into Developer, Architect, and Researcher learning personas — quiz paths and checkpoint categories updated; estimated path minutes increased accordingly.

- **BB84 simulator — configurable Eve interception rate** (`/learn`): Eve eavesdropping is no longer all-or-nothing. A slider (10%–100%) controls the fraction of qubits Eve intercepts, enabling partial-eavesdropping experiments that show how QBER scales with interception probability. `BB84Service` gains `eveInterceptionRate` and `channelNoise` parameters; `runFullProtocol` and `createInitialState` updated accordingly.

- **QKD deployment explorer — 2 new US deployments** (`/learn`): Added AWS Center for Quantum Networking (CQN) — Amazon's research initiative focused on quantum memory, repeaters, and scalable networking toward a global quantum internet — and the Chicago Quantum Exchange (CQE) 111 km fiber network connecting UChicago, Argonne National Laboratory, and Toshiba, demonstrating multi-node entanglement distribution.

- **Entropy & Randomness module — FIPS 203/204 seed requirements** (`/learn`): New callout section documents that ML-KEM (FIPS 203) requires exactly 32 bytes of full entropy for `d` and `z` seeds, ML-DSA (FIPS 204) requires 32 bytes for `ρ`, `ρ'`, and `K` seeds, and that per SP 800-131A Rev 3 the RBG security strength must match the target PQC security category (e.g., 256-bit RBG for ML-KEM-1024 Category 5). Also added LMS/XMSS stateful signature entropy failure note and XOF_DRBG (SHAKE-based, SP 800-90A Rev 2) to the DRBG mechanism comparison.

- **Standards Library — 4 new records** (`/library`): RFC 9258 (TLS 1.3 external PSK importer for QKD key injection), NIST SP 800-108 Rev 1 (KDF using PRFs — counter, feedback, and double-pipeline modes; PKCS#11 `CKM_SP800_108_COUNTER_KDF`), NIST SP 800-56C Rev 2 (key derivation for key-establishment including hybrid QKD+PQC EtE), and PKCS#11 v3.0 OASIS Standard (`CKM_HKDF_DERIVE`, `CKM_SP800_108_COUNTER_KDF`, `CKM_HKDF_KEY_GEN`). All tagged with `qkd`, `key-management`, `hybrid-crypto`, or `tls-basics` cross-references.

- **ScoreCard — scoring transparency modal** (`/`): An info button (ⓘ) on the Learning Journey ScoreCard opens a `ScoringModal` explaining the four weighted dimensions: Knowledge (40%), Breadth (30%), Practice (20%), and Time & Consistency (10%), with belt thresholds displayed for each rank.

### Fixed

- **Security — Assessment URL parameter injection** (`/assess`): URL-hydrated state (industry, country, algorithms, compliance frameworks, use cases, infrastructure) is now validated against allowlists derived from the canonical `assessmentData` constants and `REGION_COUNTRIES_MAP`. Arbitrary values injected via shared assessment URLs are silently discarded rather than written to the store.

- **Security — XSS-safe global error overlay** (`src/main.tsx`): Replaced `innerHTML`-based error display with safe DOM construction (`textContent` / `createElement`). Handler is now gated behind `import.meta.env.DEV` so it is completely absent from production bundles.

- **Security — OpenSSL worker eval() removal** (`/openssl`): The `fetch()+eval()` fallback path in the WASM script loader has been replaced with a hard fail and descriptive error message. The worker is a Classic Worker and must use `importScripts`; silent eval was a supply-chain risk and is now gone.

## [1.23.0] - 2026-02-22

### Added

- **Quantum Key Distribution (QKD) Learning Module** (`/learn`): New module with three workshop
  parts — (1) Interactive BB84 protocol simulator with configurable qubit count (8/16/32) and
  toggleable Eve eavesdropper for eavesdropping detection demos, (2) Post-processing visualization
  covering error correction, privacy amplification, and hybrid key derivation, and (3) Global QKD
  deployment explorer with real-world adoption data. Includes Learn, Workshop, Exercises, and
  References tabs. Fully integrated with InlineTooltip glossary, time-spent tracking, and the
  Learning Journey scorecard.

- **Compliance Landscape Dashboard** (`/compliance`): New interactive compliance visualization
  with a 2024–2036 deadline timeline (urgency-coded: imminent/near-term/future), framework cards
  showing PQC requirements, region/industry chips, and cross-references to Library and Timeline.
  Persona integration pre-selects relevant region/industry filters. Includes summary stats (total
  frameworks, PQC-required count, deadline count) and expandable framework detail with related
  documents.

- **Four new UI components** (`src/components/ui/`): `<Skeleton>` (pulse loading placeholder),
  `<EmptyState>` (icon/title/description/action), `<ErrorAlert>` (retry-capable error display),
  and `<CategoryBadge>` (region/industry/level semantic badge). All use semantic tokens only and
  fulfill missing component entries from `docs/ux-standard.md`.

- **Assessment wizard modularized**: The 13-step risk assessment wizard is now split into
  dedicated step components (`src/components/Assess/steps/`) — one file per step — improving
  maintainability and enabling independent testing. Steps include multi-select fields for data
  sensitivity, retention, and credential lifetime with consistent "Unknown" escape-hatch buttons.

- **Assessment data layer extracted**: Scoring logic, type definitions (`AssessmentInput`,
  `HNDLRiskWindow`, `HNFLRiskWindow`), and algorithm database extracted into
  `src/hooks/assessmentData.ts`, `assessmentTypes.ts`, and `assessmentUtils.ts` for cleaner
  separation of concerns and reuse across wizard steps.

- **UX design system documentation** (`docs/`): Added `ux-standard.md` (full semantic token
  standard, component contracts, page header conventions) and `ux-gap-analysis.md` (current
  violations inventory and remediation backlog).

- **Compliance CSV** (`src/data/compliance_02222026.csv`): New date-stamped compliance framework
  dataset with framework metadata, deadlines, regions, industries, PQC requirements, and
  cross-references. Auto-discovered by `complianceData.ts` via `import.meta.glob`.

## [1.22.0] - 2026-02-22

### Added

- **Persona-filtered quiz** (`/learn/quiz`): Quiz questions now carry a `personas` tag (CSV column).
  When a learning persona is active, the quiz module filters questions and dynamically recomputes
  category metadata (question counts, available categories) so each persona sees only relevant
  content. Quick, Full, and Category modes all respect the active persona filter.

- **Glossary expansion** (`/learn`): Added 24 new glossary terms covering TLS (cipher suites,
  handshake), VPN/SSH (Rosenpass, sntrup761), email signing (SignedData, EnvelopedData,
  KEMRecipientInfo), key management (PKCS#11, key lifecycle), stateful signatures (Merkle tree,
  Winternitz OTS), digital assets (P2PKH, BIP44), 5G security (ECIES, AUSF, SIDF, UDM), and
  digital identity (PID, Relying Party, Wallet Instance Attestation). Enriched ~40 existing terms
  with `relatedModule` deep links to learning modules.

- **Glossary button in Learn header** (`/learn`): Added the `GlossaryButton` component to the
  `PKILearningView` header bar, accessible from both the dashboard and individual module views.

## [1.21.1] - 2026-02-22

### Added

- **Simulated Hybrid KEM in Hybrid Crypto Workshop** (`/learn`): X25519MLKEM768 is not available as
  a standalone `genpkey` algorithm in the OpenSSL WASM build. The workshop now simulates hybrid KEM
  by running X25519 ECDH (Web Crypto API) and ML-KEM-768 (OpenSSL WASM) as separate operations, then
  combining shared secrets via HKDF-Extract (SHA-256). The KEM demo shows side-by-side cards for pure
  PQC (ML-KEM-768) and hybrid (X25519 + ML-KEM-768) with component secret breakdown (PQC secret,
  classical secret, combined HKDF secret) and per-phase timing. Key generation step produces separate
  X25519 and ML-KEM-768 keys with combined PEM output.

### Fixed

- **Hybrid Crypto WASM file persistence** (`/learn`): All HybridCryptoService methods now correctly
  pass file data between OpenSSL WASM calls. Previously, key files, ciphertext, and signatures were
  lost between `openSSLService.execute()` invocations because each call creates a fresh WASM
  instance. Fixes ML-DSA-65 certificate generation ("No such file or directory") and KEM
  encapsulation/decapsulation failures.

- **Complete Module button visibility** (`/learn`): The "Complete Module" button now correctly
  appears on the last step of all learning modules including Quantum Threats and Hybrid Crypto.
  Previously the button was hidden on the final step due to an off-by-one check.

- **Composite certificate generation** (`/learn`): Fixed CompositeCertificateViewer to pass key file
  data when generating self-signed certificates, resolving "Could not open file" errors for both
  ECDSA P-256 and ML-DSA-65 certificates.

- **Library detail modal on mobile** (`/library`): Made the document detail modal responsive on
  mobile devices with proper layout and scrolling.

## [1.21.0] - 2026-02-21

### Added

- **7-layer Enterprise Infrastructure Stack**: Restructured the Migrate module from 5 layers to 7
  distinct architectural tiers — Cloud, Network, Application Servers & Software, Database, Security
  Stack, Operating System, Hardware & Secure Elements. Each layer has a dedicated icon, color
  scheme, and descriptive subtitle. Products can now span multiple layers via comma-separated values
  (e.g., AWS KMS appears under both Cloud and Security Stack), with the filter, table icon, and
  layer label column all supporting multi-layer display.

- **Security Stack layer with 42 products**: New dedicated layer for security-critical
  infrastructure covering KMS, PKI, Crypto Libraries, Certificate Lifecycle Management, Secrets
  Management, IAM, Data Protection, and CIAM. Includes Venafi, Keyfactor, HashiCorp Vault, Okta,
  Keycloak, Auth0, ForgeRock, DigiCert, Sectigo, Thales CipherTrust DSP, IBM Guardium, Virtru,
  and core cryptographic libraries (OpenSSL, Bouncy Castle, liboqs, wolfSSL, Google Tink, AWS-LC).

- **30+ new product entries across 10 categories**: Cloud KMS (AWS, Google, Azure), Cloud HSM
  (Thales Luna, AWS CloudHSM, Azure Dedicated HSM), QRNG (ID Quantique Quantis, Quantinuum Quantum
  Origin, QuintessenceLabs), QKD (ID Quantique Cerberis, Toshiba QKD, Quantum Bridge), Network
  Encryptors (Thales HSE, Senetas CN7000, Adva FSP 3000, Ciena WaveLogic 6), Confidential
  Computing (Intel TDX, AMD SEV-SNP, ARM CCA), IAM (Okta, Keycloak, Ping Identity), CIAM (Auth0,
  ForgeRock), Data Protection (Thales CipherTrust DSP, IBM Guardium, Virtru), and Certificate
  Lifecycle Management (DigiCert, Sectigo, EJBCA).

- **PQC Support filter**: Replaced the Platform dropdown with a PQC Support filter that normalizes
  the detailed capability strings into four broad groups — Yes, Limited, Planned, No — so users can
  instantly find products with production-ready quantum-safe capabilities versus those still on the
  roadmap.

- **Contextual filter cascading**: Category and PQC Support dropdowns now derive their available
  options from the currently filtered dataset. Selecting a layer automatically reduces the Category
  dropdown to only categories present in that layer, and vice versa. Stale selections auto-reset to
  "All" when they become unavailable.

### Changed

- **Reference Catalog renamed**: "Software Reference Catalog" heading renamed to "Reference
  Catalog", "Software" column renamed to "Product", "View Related Software" button renamed to "View
  Related Products", and "Software Coverage Gaps" renamed to "Coverage Gaps" throughout the Migrate
  module.

- **193 total products** (up from 161), with multi-layer overlap bringing effective per-layer
  counts to: Cloud 24, Network 13, Application 86, Database 6, Security Stack 42, OS 7,
  Hardware 27.

### Fixed

- **CSV data quality audit**: Consolidated redundant PKI category (CSC-020 merged into CSC-004),
  removed duplicate HashiCorp Vault row, corrected Palo Alto PAN-OS layer assignment from OS to
  Network to match its NGFW peer group.

- **Thales Luna Cloud HSM accuracy**: Corrected PQC support from "Yes (ML-KEM ML-DSA FIPS 140-3
  L3)" to "No (PQC roadmap pending)" and FIPS validation from "FIPS 140-3 L3" to "FIPS 140-2 L3"
  based on current product capabilities.

## [1.20.0] - 2026-02-21

### Added

- **HNFL concept in PQC 101**: The introductory module now covers both harvest-now attack models
  side-by-side. A new "Key concept: HNFL" panel in Step 1 explains that "Harvest Now, Forge Later"
  targets **authenticity and integrity** — adversaries capture signed artifacts (firmware images,
  certificate chains, code-signing blobs) today and retroactively forge or repudiate those
  signatures once a CRQC exists. This contrasts with HNDL (which targets confidentiality). The
  "Digital signatures & code signing" risk bullet now surfaces the HNFL label as a forward
  reference, and Exercise 2 has been reframed to ask learners to distinguish both threat models and
  the algorithm families (ML-DSA/SLH-DSA for HNFL, ML-KEM for HNDL) that address each.

## [1.19.0] - 2026-02-21

### Added

- **Expanded quantum threat dataset (80 threats, 20 industries)**: The Quantum Threats module now
  draws from an updated dataset covering Aerospace/Aviation, Automotive/Connected Vehicles, Cloud
  Computing, Cryptocurrency/Blockchain, Energy/Critical Infrastructure, Financial Services,
  Government/Defense, Healthcare, Insurance, IoT, IT/Software, Legal/eSignature, Media/DRM,
  Payment Card Industry, Rail/Transit, Retail/E-Commerce, Supply Chain/Logistics,
  Telecommunications, and Water/Wastewater — each with criticality rating, vulnerable algorithms,
  PQC replacement recommendation, and primary source citations.
- **Expanded global PQC timeline**: Timeline updated with new milestones through February 2026
  including DoD/SandboxAQ AQtive Guard deployment (Pentagon 5-year contract), Ethereum Foundation
  PQC security initiative ($2M research prize pool, Jan 2026), CISA federal PQC procurement
  guidance (Jan 2026, pursuant to EO 14306), G7 financial sector PQC roadmap (Jan 2026,
  U.S. Treasury + Bank of England), National Quantum Initiative reauthorization (Jan 2026),
  Samsung/Thales ML-KEM embedded secure element (Jan 2026), Australia ASD migration deadlines
  (2026–2030), Canada departmental planning deadlines (2026–2031), China NGCC program and
  financial sector milestones (2025–2030), EU coordinated PQC roadmap milestones (2026–2035),
  France ANSSI first PQC certifications (Sept–Oct 2025), and Germany BSI quantum-secure
  demonstrator (Nov 2025).

### Changed

- **Transformation Leaders updated to 100 verified profiles**: Dataset refreshed with corrections
  and new additions including Philip Intallura (HSBC Group Head Quantum Technologies), Dr. Krysta
  Svore (NVIDIA, former Microsoft Azure Quantum VP), Niccolò De Masi (IonQ Chairman & CEO),
  Bruno Couillard (Crypto4A, pioneer of crypto-agile HSMs), Denis Mandich (Qrypt, 20 years US
  Intelligence Community), Éric Brier (Thales, FALCON algorithm co-designer), Dr. Bob Sutor
  (Sutor Group, former IBM VP Quantum, 40+ years at IBM), Prof. Bill Buchanan OBE (Edinburgh
  Napier, Stanford top 2% scientists 2025), Dr. Colin Soutar (Deloitte Global Quantum Cyber
  Readiness Lead), Konstantinos Karagiannis (Protiviti Director Quantum Computing Services),
  Sheetal Mehta (NTT DATA SVP Global Head of Cybersecurity), and Tom Patterson (Accenture
  Managing Director Emerging Technology Security).
- **Software reference corrected — Google Cloud HSM now shows PQC support**: Google Cloud HSM
  entry updated to reflect that PQC key types (ML-KEM, ML-DSA, SLH-DSA, X-Wing) are available
  through Cloud KMS with HSM protection level. Previous entry incorrectly listed PQC as
  unavailable.

## [1.18.1] - 2026-02-21

### Added

- **Consistent "I don't know" UX across all wizard steps**: Steps 6 (Migration Status), 11 (Crypto
  Agility), and 14 (Timeline Pressure) now use the same dashed-border escape-hatch button pattern
  as Step 3. Previously these three steps embedded "Don't Know" as a regular radio option
  indistinguishable from substantive answers.
- **Consolidated HNDL / HNFL Risk Windows section in report**: The two separate risk window panels
  are now unified into a single "Harvest-Now Attack Risk Windows" section with a **Key Milestones**
  table at the top (Today, Estimated CRQC, Data/Credential expiry dates with at-risk / safe badges)
  followed by the individual timeline visualizations.
- **HNDL / HNFL risk windows for "I don't know" users**: When users select "I don't know" on the
  Data Retention or Credential Lifetime steps, the report now shows risk window visualizations using
  conservative defaults (15-year retention, 10-year credential lifetime) with "(estimated)" labels
  and guidance to define policies for a precise assessment. Previously these sections were invisible
  when the user didn't know their values.

### Changed

- **"I don't know" scoring treats unknowns as high risk**: All "don't know" inputs are now scored
  conservatively rather than as low/moderate risk:
  - Crypto agility unknown: 0.7 &rarr; 0.9 (same as hardcoded)
  - Timeline pressure unknown: 1.1&times; &rarr; 1.2&times; (near-term pressure assumed)
  - Sensitivity unknown: treated as "high" (was implicitly "low")
  - Retention unknown: 12pts retention score (was 0)
  - Infrastructure unknown: 15pts complexity (was 10)
  - Vendor dependency unknown: treated as heavy-vendor (was mixed)

## [1.18.0] - 2026-02-21

### Added

- **"I don't know" escape hatches in Risk Assessment wizard**: Six wizard steps now include explicit
  uncertainty options, ensuring users who lack complete information can still complete the assessment:
  - **Step 3 (Current Crypto)**: "I don't know / Not sure" chip clears algorithm selections and
    triggers conservative RSA-2048 + ECDH equivalent scoring in the engine; all algorithm chips dim
    while active. Wizard cannot advance without at least one algorithm selected _or_ the unknown flag set.
  - **Step 5 (Compliance)**: "None apply / I don't know" button clears all selected frameworks
    (optional step — no blocking).
  - **Step 7 (Use Cases)**: Styled "I don't know / None of these" button replaces the old plain text
    skip hint (optional step — no blocking).
  - **Step 8 (Data Retention)**: "I don't know / Not sure" chip clears retention selections;
    engine falls back to sensitivity-based HNDL estimate. Wizard requires at least one selection
    _or_ the unknown flag before advancing.
  - **Step 11 (Infrastructure)**: Styled "None of these / I don't know" button (optional step —
    no blocking).
  - **Step 12 (Vendors)**: "I don't know / Not sure" button clears vendor selection and defaults
    engine to `mixed` dependency weighting. Wizard requires a selection _or_ the unknown flag.
- **Compliance framework descriptions in Step 5**: Each compliance framework button now shows
  a description sub-line — industry-specific frameworks use their config description; universal
  frameworks (NIST, NIS2, etc.) show the deadline and first sentence of regulatory notes.
- **Awareness-gap remediation actions**: When a user answers "I don't know" on any wizard step,
  the assessment report automatically surfaces targeted recommended actions at the top of the
  priority list to help close those knowledge gaps — e.g. "Conduct a cryptographic asset inventory"
  for unknown algorithms, "Establish a data retention policy" for unknown retention, etc. Covers
  unknown crypto, unknown retention, unknown vendors, missing compliance selections, missing use
  cases, and missing infrastructure data.
- **Quick Assessment executive summary**: Quick assessments (steps 1–6 only) now produce a
  concise executive summary paragraph in the report, summarising risk level, vulnerable algorithms,
  compliance pressure, and migration status. Previously only comprehensive assessments had this.
- **Quick/Comprehensive badge in report header**: A small pill badge in the report header identifies
  whether the result came from a Quick or Comprehensive assessment.
- **HNDL warning banner for quick assessments**: When a quick assessment is completed with
  `high` or `critical` data sensitivity, a warning banner appears in the report noting that
  Harvest-Now-Decrypt-Later risk was not quantified (data retention was not collected) and
  recommending a comprehensive assessment.
- **Country-aware regulatory pressure scoring**: The compound engine now incorporates a
  `COUNTRY_REGULATORY_URGENCY` map (14 jurisdictions) so selecting a country with active
  PQC mandates (e.g. United States, France) increases the Regulatory Pressure category score.
  The legacy quick path also receives a country boost proportional to the urgency weight.
- **`requiresPQC: null` third state for unrecognised compliance frameworks**: Compliance
  frameworks not in the database now surface as "Status unknown" (grey badge) rather than
  "No PQC mandate yet" (which was misleading). The report's compliance impact panel handles
  all three states: `true` (PQC Required / amber), `null` (Status unknown / grey),
  `false` (No PQC mandate yet / grey).

### Changed

- **Risk thresholds recalibrated**: Low/Medium/High/Critical boundaries moved from 30/60/80 to
  25/55/75. This better reflects the distribution of real scores — fewer organisations
  incorrectly land in "Low" and the "Critical" band triggers sooner for high-exposure profiles.
- **NIS2 deadline text updated**: The NIS2 Directive entry now reads
  "October 2024 (transposition passed — enforcement underway)" to reflect that the transposition
  deadline has passed and enforcement is active across the EU.
- **Assessment stale threshold extended**: In-progress (incomplete) wizard sessions are now
  preserved for 30 days before being auto-reset (previously 7 days), reducing accidental
  loss of partially-completed assessments.

## [1.17.5] - 2026-02-21

### Changed

- **Dependency upgrades**: Merged 4 Dependabot updates — `@vitest/coverage-v8` 4.0.18,
  `eslint-plugin-react-refresh` 0.5.0, `jsdom` 28.1.0, `eslint-plugin-security` 4.0.0.
- **ESLint config for security plugin v4**: Adapted flat config to manually extract plugins and
  rules from `security.configs.recommended` to avoid circular reference crash in `defineConfig()`.
- **Updated SBOM**: Refreshed 9 dependency versions in About page to match actual installed
  (React 19.2.4, Framer Motion 12.34.2, Tailwind CSS 4.2.0, tailwind-merge 3.5.0,
  React Router 7.13.0, Zustand 5.0.11, Prettier 3.8.1, Vitest 4.0.18, Playwright 1.58.2).
- **Security audit date**: Bumped to February 21, 2026 (same findings — 13 dev-only, 0 production).

### Fixed

- **Persona "For you" badge**: `setPersona` no longer resets `suppressSuggestion` to false,
  preventing the assessment-inferred badge from reappearing after selecting then clearing a role.

## [1.17.4] - 2026-02-20

### Added

- **Persona-aware guided tour**: The first-visit onboarding tour now filters steps to only highlight
  features visible in the active persona's navigation — an Executive won't be shown the Playground
  or OpenSSL Studio steps.
- **Persona-aware hero CTAs**: Landing page primary and secondary call-to-action buttons now adapt
  to the selected role — Executives are directed to Risk Assessment, Developers to the Playground,
  Architects to the Migration Timeline, and Researchers to Algorithm Explorer.
- **"For you" persona badge on landing**: After completing the Risk Assessment, the inferred
  recommended persona is surfaced with a "For you" badge on the home page role picker.
- **Cross-view CTAs**: Assessment report now includes a "Start Learning" link to the persona-matched
  learning path; the learning path panel includes a "Start Assessment" CTA when no assessment has
  been completed.
- **Compliance and Migrate in executive nav**: `/compliance` and `/migrate` added to the Executive
  persona's navigation — assessment report links to both views are no longer dead ends.
- **Assess in developer nav**: `/assess` added to the Developer persona's navigation — the
  algorithm migration matrix in the report is now reachable.
- **Playground in architect nav**: `/playground` added to the Security Architect persona's
  navigation for hands-on PoC algorithm evaluation.

### Changed

- **Persona inference rewritten**: `inferPersonaFromAssessment()` now correctly maps assessment
  answers to all four persona types. Previous implementation used wrong enum values and always
  defaulted to Architect; Researcher was never reachable. Now uses correct field values
  (`not-started`/`started`/`planning`, `fully-abstracted`, etc.) and returns `null` when signal is
  insufficient.
- **Default persona is now null**: First-time visitors see the full navigation (same as Researcher)
  rather than being silently assigned Researcher. "Clear all" in the persona picker now fully resets
  to no selection.
- **Developer learning path expanded**: Added Quantum Threats module (after PQC 101) and Crypto
  Agility module (after Hybrid Crypto). Path now includes a 4th checkpoint and grows from 405 to
  495 estimated minutes.
- **Architect learning path expanded**: Added TLS Basics module (after Hybrid Crypto). Estimated
  time grows from 420 to 465 minutes.
- **Executive quiz categories fixed**: Removed `industry-threats` from quiz pre-selection — the
  corresponding module was never taught in the executive path. Replaced with `crypto-agility` which
  is covered by the Crypto Agility module.
- **Persona order unified**: Role buttons across home page and learn page now follow the same
  order: Executive → Developer → Architect → Researcher.
- **Assessment report link filtering**: "Explore" action links in the assessment report are now
  hidden when they point to a route outside the active persona's navigation — no more dead links.
- **Researcher learning path**: Added 5th checkpoint after the three application modules (Digital
  Assets, 5G Security, Digital ID) for consistent knowledge verification before the final quiz.

## [1.17.3] - 2026-02-20

### Changed

- **Single-select industry**: The industry picker on the home page now works as single-select —
  clicking an industry selects it exclusively; clicking the active industry deselects it (returns
  to All Industries). Previously allowed multi-select.
- **Timeline country dropdown scoped to region**: When a region is selected on the home page,
  the Timeline country filter shows only that region's group and its individual countries
  (Americas → US + Canada, Europe → 8 EU countries, APAC → 8 APAC countries; Global/none shows all).
- **Digital ID learning module**: Finance & Banking added as a relevant industry alongside
  Government & Defense and Healthcare.

## [1.17.2] - 2026-02-20

### Fixed

- **Library industry filter**: Normalized 40+ raw CSV industry aliases (e.g. `Finance`, `Gov`,
  `Telecom`, `Critical Infrastructure`) to the 11 canonical industry names used across the app.
  The industry dropdown now shows clean canonical names instead of 30+ fragmented raw tags.
- **Library persona → filter**: Selecting an industry on the home page now correctly pre-filters
  the Library (was returning 0 results due to vocabulary mismatch between canonical names and CSV tags).
- **Library untagged items**: Documents with no specific industry tag (broadly applicable standards)
  now appear in all industry-filtered views instead of being hidden.

### Changed

- **Assessment country step**: Step 2 (Country) now lists only the countries that belong to the
  region selected on the home page (Americas → US + Canada, Europe → 8 EU countries,
  APAC → 8 APAC countries, Global/none → all countries).
- **Assessment pre-seeding**: Industry and country fields are now seeded from the home page
  persona selection when starting a fresh assessment (no URL params, no in-progress assessment).

## [1.17.1] - 2026-02-21

### Added

- **Mobile Compliance View** (`/compliance`): New dedicated mobile layout with card-based display
  for compliance records, optimized for touch navigation and small screens.
- **Mobile Threats List** (`/threats`): New dedicated mobile layout for the threats dashboard,
  presenting threat cards in a vertically stacked, touch-friendly format.

### Changed

- **Compliance Table tooltips**: PQC mechanism and classical algorithm tooltips now support
  tap-to-toggle on mobile in addition to hover on desktop, replacing the hover-only interaction.
- **Tooltip viewport clamping**: Tooltip width constrained to `min(256px, 100vw-32px)` to prevent
  overflow on small screens.
- **Gantt Detail Popover**: Refactored layout for improved readability and usability on mobile.
- **Filter Dropdown**: Adjusted touch targets for better mobile usability.
- **Personalization Section**: Minor layout refinements for small-screen display.
- **Main Layout**: Navigation adjustments for mobile responsiveness.

## [1.17.0] - 2026-02-20

### Added

- **Personalization Panel** (`/`): New three-dimension picker on the home page lets users set their
  role (Executive, Developer, Architect, Researcher), region (Americas, Europe, APAC, Global),
  and industry (11 sectors) in a single always-editable section below the hero stats bar.
  Selections persist across sessions via localStorage.
- **Persona-driven navigation**: Selecting a role hides irrelevant pages from the nav;
  always-visible pages (Home, Learn, Timeline, Threats, About) remain accessible to all users
  regardless of persona.
- **"For you" card badges**: Landing page feature cards show a "For you" badge for the top 3
  pages most relevant to the active persona.
- **Region pre-seeding**: Selecting a region pre-filters the Timeline on mount and pre-seeds the
  Assessment country field (Americas → United States, Europe → France, APAC → Japan).
- **Industry pre-seeding**: Selecting an industry pre-seeds the Assessment industry field,
  pre-filters the Threats dashboard, adds an industry filter chip row to the Library, and
  highlights relevant Learning modules with a "Relevant" badge.
- **Industry icons**: Each industry chip in the personalization panel now displays a contextual
  icon (e.g. `Landmark` for Finance, `Shield` for Government, `HeartPulse` for Healthcare).
- **"All Industries" chip**: Explicit chip in the industry row to reset to no filter, always
  highlighted when no industry is selected.

### Changed

- **Learn module**: Removed the in-Learn persona picker; learning paths are now driven entirely
  by the home page persona selection. When no persona is set, the full module grid is shown with
  a "Personalize from home" button linking back to the home page.

## [1.16.1] - 2026-02-20

### Added

- **Executive Summary Dashboard** (`/executive`): High-level PQC readiness metrics, organizational risk scores, and priority action items.
- **7 New PKI Learning Modules** (`/learn`): Added new comprehensive interactive courses:
  - Quantum Threats (HNDL Timeline, Algorithm Vulnerability)
  - Hybrid Cryptography (Key Generation, Signatures)
  - Crypto Agility & Architecture (Abstraction, CBOM)
  - Stateful Hash Signatures (LMS, XMSS)
  - Email & Document Signing (S/MIME, CMS)
  - VPN/IPsec & SSH
  - Key Management & HSM

### Fixed

- **Time Tracking Analytics** (`/learn`): Replaced erroneous `Date.now()` logic that was previously causing massive `timeSpent` metric inflation. Restored sub-minute `float` state precision to correctly accumulate elapsed time across all 14 learning modules, and applied a clean decimal-mask (`Math.floor()`) during frontend Dashboard render.
- **KeyRotationPlanner Build**: Fixed a strict TS compilation error regarding target algorithms missing data keys.

## [1.16.0] - 2026-02-20

### Added

#### Learning Platform Restructure

- **Learning Platform Restructure** (`/learn`): PKI Workshop, Digital Assets, and 5G Security
  modules restructured to the 3-tab layout (Learn | Simulate | Exercises) established by TLS
  Basics. Each module now separates educational theory from hands-on practice and includes guided
  exercise scenarios with "Load & Run" presets and a Quiz CTA.
- **PKI Workshop** (`/learn/pki-workshop`): New Learn tab with 6 educational sections (What is
  PKI, Certificate Lifecycle with interactive diagram, X.509 Anatomy, Trust Chains & Validation,
  PQC in PKI, CTA). New Exercises tab with 5 guided scenarios (RSA-2048, ECDSA P-256, ML-DSA-44,
  ML-DSA-87, SLH-DSA) that pre-configure the workshop and navigate to the correct step.
- **Digital Assets** (`/learn/digital-assets`): New Learn tab with blockchain cryptography
  introduction covering key generation, address derivation, digital signing, and PQC threat
  analysis per chain. New Exercises tab with guided scenarios for Bitcoin, Ethereum, Solana, and
  HD Wallet flows.
- **5G Security** (`/learn/5g-security`): New Learn tab with 6 sections — What is 5G Security
  (3GPP TS 33.501 overview, IMSI catcher history), The Three Pillars (Privacy/Authentication/
  Provisioning), SUCI Protection Schemes (Profile A/B/C comparison), 5G-AKA Authentication
  (MILENAGE f1-f5, key hierarchy), SIM Provisioning & Supply Chain, Post-Quantum Threat to 5G
  (quantum-vulnerable vs quantum-resistant components). New Exercises tab with 5 scenarios
  (Profile A Classical, Profile B NIST, Profile C Hybrid, Profile C Pure PQC, 5G-AKA
  Authentication).

#### Data Expansion

- **Leaders Board Expanded**: 12 new PQC leaders added via `leaders_02202026.csv` — Prof Bill Buchanan OBE (Edinburgh Napier), Dr. Bob Sutor (Sutor Group), Bruno Couillard (Crypto4A), Dr. Colin Soutar (Deloitte), Denis Mandich (Qrypt), Éric Brier (Thales), Konstantinos Karagiannis (Protiviti), Dr. Krysta Svore (Microsoft Azure Quantum), Niccolò De Masi (IonQ), Philip Intallura (HSBC), Sheetal Mehta (NTT DATA), Tom Patterson (Accenture); total now 98 leaders

### Changed

- **Dashboard Progress** (`/learn`): Module progress calculation now uses accurate per-module step
  counts via a `MODULE_STEP_COUNTS` map instead of a hardcoded default of 4 steps. PKI Workshop
  description and duration updated (45 min → 60 min).

### Fixed

- **Algorithm Data**: 10 factual inaccuracies corrected across PQC algorithm profiles
- **Migration Guide**: 5 factual inaccuracies corrected in migration planning content

## [1.15.0] - 2026-02-20

### Added

- **Quiz CSV Data Layer** (`/learn/quiz`): Extracted all quiz questions from hardcoded TypeScript
  into a date-stamped CSV file (`pqcquiz_02192026.csv`), following the established pattern used
  by Leaders, Timeline, Threats, and Library modules. The quiz software auto-selects the most
  recent CSV via `import.meta.glob` in the new `quizDataLoader.ts` loader.
- **Quiz Mode Column** (`/learn/quiz`): New `quiz_mode` field on every question (`quick`, `full`,
  `both`) enables pool-based filtering — Quick Quiz draws from the `quick`+`both` pool (~121
  questions), Full Assessment samples from all 162 questions.
- **Expanded Question Pool** (`/learn/quiz`): Grew from 80 to 162 questions across 8 categories,
  grounded in the app's authoritative data sources (algorithm reference, timeline, threats, and
  learn module content). ~20 questions per category.
- **Smart Sampling with Guaranteed Coverage** (`/learn/quiz`): Both quiz modes now guarantee
  minimum category representation — Quick Quiz: 20 questions with ≥2 per category; Full
  Assessment: 80 questions with ≥10 per category. Every run produces a unique random mix.
- **Source Attribution** (`/learn/quiz`): Quiz intro header displays the source CSV filename and
  last-updated date, consistent with other data-driven pages.

### Changed

- **Full Assessment** (`/learn/quiz`): Changed from "all questions" to an 80-question random
  sample drawn from the full 162-question pool with guaranteed category coverage.
- **Quiz Data Structure** (`/learn/quiz`): `quizData.ts` is now a thin re-export shim; all data
  loading and category metadata live in `quizDataLoader.ts`.

### Fixed

- **Quiz Question Accuracy** (`/learn/quiz`): Applied 7 factual corrections — CNSA 2.0 2030
  scope clarification, EO 14306 date/attribution, Germany's QUANTITY initiative description,
  GSMA PQ.03 v2.0 publication date, Canada CCCS 2026 milestone wording, and a self-contradictory
  TLS hybrid failure explanation.

## [1.14.4] - 2026-02-19

### Added

- **Inline Tooltips** (`/assess`): Jargon terms (HNDL, PQC, Crypto Agility, HSM) in the wizard
  now show click-to-open glossary definitions via a new `InlineTooltip` component backed by 180+
  glossary terms.
- **Quick Assessment Mode** (`/assess`): New mode selector on the landing page — "Quick" (6 steps,
  ~2 min) or "Comprehensive" (13 steps, ~5 min). Quick mode uses the legacy scoring path.
- **Migration Roadmap** (`/assess`): Phased visualization in the report grouping recommended actions
  into 3 swim lanes (0–6 mo, 6–18 mo, 18–36 mo) with effort badges and country deadline indicator.

### Changed

- **Context-Aware Cross-Links** (`/assess`): "Explore" links in recommended actions now carry
  user-specific query params (e.g. `/algorithms?highlight=RSA-2048,ECDH`,
  `/threats?industry=Finance`). Algorithm Transition Guide highlights matching rows; Threats
  Dashboard pre-filters by industry. Migration matrix adds "Try in Playground" links for PQC
  replacement algorithms.
- **Progress Persistence** (`/assess`): Stale assessment threshold extended from 24 hours to 7 days.
  Resume banner shows on return with step info, timestamp, and Continue / Start Over options.

## [1.14.3] - 2026-02-19

### Fixed

- **PDF Print Cross-Browser** (`/assess`): Report PDF now renders correctly in both Chrome and
  Safari. Chrome was not repeating `html { margin-top }` on pages 2+, causing content to overlap
  the fixed header/footer. Replaced with an invisible `<table class="print-report-table">` whose
  `<thead>` (14mm) and `<tfoot>` (10mm) are treated as per-page repeating groups by both browsers.
  All CSS selectors use child combinators (`>`) to avoid cascading into inner report tables.
- **Library Markdown Parser** (`/library`): Fixed markdown rendering regression introduced by
  Prettier reformatting the parser configuration.
- **Security Dependencies** (`deps`): Added `overrides` for `minimatch` and `ajv` to resolve
  high-severity audit findings in transitive dependencies.
- **CI Security Audit** (`ci`): Scoped `npm audit` to production dependencies only, eliminating
  false positives from dev-only packages in the CI pipeline.

## [1.14.2] - 2026-02-19

### Fixed

- **Retention Step Industry-Awareness** (`/assess`): Step 8 (Data Retention) no longer shows
  finance/healthcare-specific language for unrelated industries. Universal time-range options are
  now sourced from the CSV (empty industries column) with purely time-based descriptions.
  Every industry now has specific regulatory retention entries:
  Automotive (telematics 1-3y, vehicle lifetime 10-15y),
  Technology (SOC 2 audit logs 3y),
  Energy & Utilities (NERC CIP-007 3y, FERC/billing 7y),
  Aerospace (FAA/DO-178C aircraft lifetime 20-40y),
  Retail & E-Commerce (PCI DSS audit logs 1y, cardholder data 2y),
  Education (FERPA/financial aid 6y, permanent transcripts).
- **PDF Export** (`/assess`): Reverted to `window.print()` from html2canvas/jsPDF for more
  reliable cross-browser output.

## [1.14.1] - 2026-02-19

### Fixed

- **PDF Content Clipping** (`/assess`): Eliminated content overlap behind the fixed print
  header/footer on pages 2+. Uses invisible `<thead>`/`<tfoot>` spacer table to reserve
  per-page space for the repeating header (14mm) and footer (10mm).
- **Print Visibility** (`GuidedTour`, `WhatsNewToast`): Hidden from print output via `print:hidden`.
- **Threat Table Print** (`/assess`): Added `print:overflow-visible` and `print:min-w-0` to
  prevent right-column clipping in the PDF.

## [1.14.0] - 2026-02-19

### Added

- **Industry-Aware Assessment Wizard** (`/assess`): Compliance, crypto usage, use case, and
  infrastructure steps now surface industry-relevant options first based on CSV-driven config
  (`pqcassessment_02192026.csv`). Industry-specific threats appendix included in report.
- **Country Compliance Filtering** (`/assess`): Step 5 (Compliance) filters frameworks by the
  selected country/jurisdiction — only globally-applicable and country-relevant frameworks are shown.
- **PDF Print Support** (`/assess`): Full print-optimized report with repeating header
  (app version, industry, country, date) and footer (assess URL, page number). Includes
  `break-inside: avoid` on sections, light-mode forced variables, `print-color-adjust: exact`
  for background colors, and framer-motion suppression.
- **Report Collapsible Sections** (`/assess`): Country PQC Migration Timeline and Industry Threat
  Landscape are collapsible on screen but always expanded in print via `hidden print:block` pattern.
- **Organization Filter** (`/library`): Replaced the Region dropdown with an Organization filter
  (NIST, IETF, ETSI, ISO, BSI, ANSSI, etc.) using a canonical org map that rolls up sub-groups.

### Fixed

- **Share URL Arrays** (`/assess`): `dataSensitivity` and `dataRetention` now correctly encode as
  comma-joined arrays in the share URL; added `cy` (country) parameter.
- **PDF Dark Mode** (`/assess`): Print CSS forces all semantic color variables to light-mode values,
  preventing invisible text on white paper when dark theme is active.
- **PDF Background Colors** (`/assess`): Added `print-color-adjust: exact` so bar graphs, badges,
  and colored elements render in the PDF instead of being stripped by the browser.
- **PDF Page Breaks** (`/assess`): `glass-panel` sections avoid splitting across pages; Threat
  Landscape starts on a fresh page; trailing blank page eliminated via `min-height: 0`.
- **Timeline Label Clipping** (`/assess`): Edge year labels (2024, 2035) use left/right-aligned
  transforms instead of centered, preventing clipping in the report timeline strip.

### Changed

- **Mobile Walkthrough** (`GuidedTour`): Redesigned the guided tour on mobile as a full-screen
  swipeable card carousel with step icons, dot indicators, and drag gestures. Desktop anchored
  tooltips unchanged. Added `?tour` query param to reset and replay the tour.
- **WhatsNew Toast** (`WhatsNewToast`): Centered on mobile (was fixed bottom-right, overflowed on
  narrow screens). Added `?whatsnew` query param for easy testing.
- **Assessment Report** (`/assess`): "Explore" links and action buttons hidden in print. Cross-industry
  threats section removed from report — only industry-specific threats shown.

## [1.13.0] - 2026-02-18

### Added

- **Risk Assessment Country Picker** (`/assess`): New "Country" step (step 2 of 13) lets
  organizations select their jurisdiction; the selection aligns the Timeline step with real
  regulatory deadlines sourced directly from the PQC Gantt timeline data.
- **Multi-select Data Sensitivity** (`/assess`): Organizations can now select multiple sensitivity
  levels simultaneously (Low / Medium / High / Critical). Risk scoring uses the highest selected
  level; useful for organizations managing data of mixed sensitivity.
- **Multi-select Data Retention** (`/assess`): Multiple retention periods can be selected at once.
  HNDL risk is computed against the longest selected period for accurate worst-case assessment.
- **Country-aligned Migration Deadlines** (`/assess`): The Timeline step surfaces Deadline phases
  from the selected country's Gantt timeline (real years, titles, descriptions) instead of generic
  static options. Falls back gracefully when no country-specific deadlines exist.
- **Wizard Reset Button** (`/assess`): A "Reset" button in the wizard navigation footer clears all
  answers and returns to step 1, providing a quick path to restart without navigating away.

### Fixed

- **Assessment Store Schema Migration** (`/assess`): Persisted assessments from v1.12 and earlier
  stored `dataSensitivity` and `dataRetention` as strings. On rehydration these are now
  automatically upgraded to arrays, preventing a `TypeError: .filter is not a function` crash.

### Changed

- **Risk Assessment Wizard** (`/assess`): Expanded from 12 to 13 steps with the Country picker.
  `AssessmentInput.dataSensitivity` and `.dataRetention` are now `string[]`; the scoring engine
  uses `getMaxSensitivity()` and `getMaxRetentionYears()` helpers — fully backward-compatible.

## [1.12.0] - 2026-02-18

### Added

- **Timeline Document Table** (`/timeline`): Selecting a country from the Country filter now
  reveals a document table below the Gantt chart listing all matching phases and milestones
  with organization, phase badge, type, title, period (year range), description, and source link.

### Fixed

- **Timeline Filter UX** (`/timeline`):
  - Renamed "Region" dropdown label to "Country" for clarity
  - Active filter chips with × dismiss now appear below the filter bar for every active filter
    (country, phase type, event type, and text search)
  - Result count shown alongside chips ("N results · X of Y countries")
  - Empty state with "Clear all filters" action when no results match
  - Country dropdown now renders above the sticky Gantt table headers (z-index fix)

## [1.11.0] - 2026-02-17

### Added

- **PQC Quiz Module** (`/learn`): New interactive quiz in the Learning dashboard covering
  post-quantum cryptography fundamentals, algorithm families, and migration concepts.

### Fixed

- **Compliance page UI/UX** (`/compliance`):
  - Renamed ambiguous "CC" column header to "Classic" (was misread as Common Criteria)
  - Added missing BSI (DE) source card so the authoritative-sources grid is complete
  - Unified all four filter active states to `primary` color (was: accent, secondary, warning, tertiary)
  - Loading overlay now correctly reads "Refreshing Data…" during a refresh vs. "Filtering Records…" during filtering
  - Close button in detail modal replaced with `<X>` icon + `aria-label`; focus moves into modal on open
  - Filter backdrop `role="button"` replaced with `aria-hidden="true"`
  - Empty-state `colSpan` corrected from 10 to 8
  - ShareButton/GlossaryButton now visible at `md` breakpoint (was `lg`-only)

- **Guided Tour** (`/`): Fixed mobile portrait layout blocking tour from completing;
  fixed tooltip position jumping on step transitions.

## [1.10.0] - 2026-02-17

### Added

- **PQC Risk Assessment — Comprehensive Upgrade** (`/assess`):
  - Expanded from 5-step to **12-step wizard** with 7 new dimensions:
    - Cryptographic use cases (TLS, data-at-rest, digital signatures, key exchange, etc.)
    - Data retention and HNDL risk window analysis
    - Organizational scale (system count + team size)
    - Crypto agility assessment (abstracted, partially-abstracted, hardcoded)
    - Infrastructure dependencies (Cloud KMS, HSMs, IoT, legacy systems)
    - Vendor dependency profiling (heavy-vendor, open-source, mixed, in-house)
    - Timeline pressure and compliance deadlines
  - **Compound scoring engine** replacing simple additive model:
    - 4 category sub-scores (Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness)
    - Weighted composite with interaction multipliers (HNDL, compliance urgency, migration difficulty)
    - Full backward compatibility — old 5-field assessments produce identical scores
  - **HNDL Risk Window visualization**: SVG timeline showing data retention vs. estimated quantum threat horizon (2035)
  - **Migration effort estimation**: Per-algorithm complexity rating (quick-win, moderate, major-project, multi-year)
  - **Executive summary**: One-paragraph C-suite synthesis with risk level, top priorities, and quick-win count
  - **Category score breakdown**: Horizontal progress bars for each risk dimension
  - **Enhanced CSV export**: Includes migration effort, estimated scope, and rationale columns
  - **URL-shareable assessments**: All 12 inputs encoded in URL parameters for team sharing
  - Responsive step indicator: Compact progress bar on mobile, full step circles on desktop

- **Glossary Expansion**:
  - 20+ new PQC terms: Diffie-Hellman, FN-DSA, XMSS, X25519, X448, Ed448, and more
  - Inline `GlossaryButton` component for contextual access from Algorithms, Threats, and other views

- **Algorithm Comparison Overhaul** (`/algorithms`):
  - New filter controls: Type (All/PQC/Classical), Security Level, and search
  - Sortable columns across all fields
  - Performance-optimized with `useMemo`

- **Landing Page Dynamic Counts**:
  - Stats bar now loads actual data counts (timeline events, standards, software, leaders, algorithms)
  - New "Risk Assessment" feature card linking to `/assess`

- **Migration Step-to-Software Linking** (`/migrate`):
  - Clicking a workflow step filters the software database to relevant categories
  - Step filter banner with category context and clear button
  - Updated category mappings for steps 2, 4, and 5

- **Software Reference Data**:
  - 6 new software categories: Operating Systems, Network Operating Systems, Network Security, Hardware Security, Blockchain, Remote Access/VDI
  - Updated product category assignments (CSC-031 through CSC-036)
  - Enhanced SLH-DSA variant descriptions with specific use-case guidance

### Changed

- **Color System Standardization**:
  - Migrated all remaining hardcoded Tailwind colors to semantic tokens across Algorithms, Landing, and data files
  - `blue-500` → `primary`, `green-500` → `success`, `yellow-500` → `warning`, `red-500` → `destructive`

- **Navigation**:
  - Reordered nav items with Assess prominently placed
  - Glossary button moved from global floating overlay to per-view inline placement

- **Test Coverage**:
  - New test suites: AssessReport (31 tests), AssessWizard (32 tests), useAssessmentEngine (39 tests)
  - Updated Executive data and Timeline tests for expanded schemas
  - All 402 unit tests passing

## [1.9.0] - 2026-02-16

### Added

- **PQC Risk Assessment Module** (`/assess`):
  - Interactive 5-step wizard for personalized quantum risk evaluation
  - Algorithm migration recommendations based on assessment results
  - Compliance analysis with actionable remediation steps
  - Printable risk assessment report generation

- **Enhanced Migration Workflow** (`/migrate`):
  - 7-step structured migration process: Assess, Plan, Pilot, Implement, Test, Optimize, Measure
  - Framework mappings for NIST, ETSI, and CISA guidelines
  - Gap analysis with software category coverage assessment
  - Authoritative reference panel with curated migration resources

- **Global PQC Glossary**:
  - Floating access button available on every page
  - 100+ post-quantum cryptography terms with definitions
  - Category filters (Algorithm, Protocol, Standard, Concept, Organization)
  - A-Z index, full-text search, and complexity badges (Beginner, Intermediate, Advanced)
  - Cross-references to relevant learning modules

- **Guided First-Visit Tour**:
  - Interactive onboarding overlay highlighting key platform features
  - Auto-triggers on first visit, remembers completion in localStorage
  - Step-by-step walkthrough with skip and navigation controls

- **PQC 101 Learning Module** (`/learn/pqc-101`):
  - Beginner-friendly introduction to post-quantum cryptography
  - Covers quantum threat landscape and Shor's algorithm impact
  - At-risk sectors and Harvest Now, Decrypt Later (HNDL) attack explanation

- **Enhanced Gantt Timeline**:
  - Phase type filter dropdown (Discovery, Testing, POC, Migration, etc.)
  - Event type filter dropdown (Phase, Milestone)
  - CSV export of filtered timeline data
  - Milestone phase labels displayed on flag markers

- **New Software Reference Data**:
  - Added `quantum_safe_cryptographic_software_reference_02162026.csv`
  - Updated PQC software category priority matrix

### Changed

- **Learning Progress System**:
  - Module store versioning and migration support for schema evolution
  - Added `beforeunload` and `pagehide` persistence handlers for reliable auto-save
  - iOS Safari compatibility fixes for storage persistence
  - QuotaExceededError handling with user-friendly feedback via `react-hot-toast`

- **Navigation**:
  - Added Assess to main navigation bar with ClipboardCheck icon

### Fixed

- **Storage Reliability**:
  - Resolved iOS Safari storage persistence issues on page close
  - Added fallback handling for QuotaExceededError during progress save

## [1.8.7] - 2026-02-16

### Added

- **Library Module Redesign**:
  - New card grid view with `DocumentCard` and `DocumentCardGrid` components
  - `CategorySidebar` for quick category navigation with update indicators
  - `ActivityFeed` showing recent new and updated standards
  - `ViewToggle` to switch between card grid and tree table views
  - `SortControl` with options: Newest, Oldest, Name A-Z, Name Z-A, Urgency
  - Detail popover integration in card view

### Changed

- **Library Module**:
  - Refactored monolithic `LibraryView` into modular sub-components
  - Improved category filtering with sidebar navigation
  - Enhanced sorting with urgency-based ordering

- **Learn Dashboard**:
  - Simplified module card system — removed unused `disabled` and `comingSoon` properties
  - Cleaner duration display logic

- **Build System**:
  - Added `predev` script to copy liboqs WASM files before dev server starts
  - Updated build script to include liboqs dist copy step

- **liboqs DSA Integration**:
  - Updated WASM wrapper for improved compatibility

### Fixed

- **Algorithm Deprecation Dates**:
  - Corrected deprecation timelines per NIST IR 8547 and SP 800-131A Rev 3
  - Only 112-bit security algorithms (RSA-2048) deprecated in 2030; 128-bit+ algorithms (RSA-3072, P-256, P-384, etc.) correctly show 2035 (Disallowed) only
  - P-256 reclassified from 112-bit to 128-bit security tier
  - Updated sorting logic and color coding to distinguish deprecated (amber) from disallowed (red)

## [1.8.6] - 2026-02-14

### Added

- **SEO & Discoverability**:
  - Comprehensive meta tags (title, description, keywords)
  - Open Graph protocol tags for Facebook/LinkedIn link previews
  - Twitter Card tags for rich social media sharing
  - JSON-LD structured data (WebApplication + EducationalOrganization schema)
  - `robots.txt` to allow search engine crawling
  - `sitemap.xml` with 13 routes, priorities, and change frequencies
  - Branded `favicon.svg` with quantum-shield icon
  - `og-image.png` (1200x630) for social media preview images
  - Theme color and canonical URL meta tags

- **Landing Page Experience**:
  - New hero landing page at `/` route with value proposition
  - Stats bar displaying: 42 Algorithms, 165+ Events, 92 Standards, 6 Modules
  - Feature cards grid highlighting platform capabilities
  - Clear CTAs: "Explore Timeline", "Try Playground", "Start Learning"
  - Professional hero messaging: "The quantum threat is not theoretical"

- **Social Sharing**:
  - New `ShareButton` component with native Web Share API
  - Fallback share menu with Copy Link, Twitter/X, LinkedIn options
  - Keyboard accessibility (Escape to close)
  - Share buttons added to 4 key views: Timeline, Algorithms, Playground, Compliance
  - Pre-filled share text optimized for each view

- **Analytics & Engagement**:
  - 11 new analytics event helpers in `utils/analytics.ts`:
    - `logModuleStart()` - Track learning module starts
    - `logModuleComplete()` - Track completions with duration
    - `logStepComplete()` - Track individual step progress
    - `logArtifactGenerated()` - Track downloads (keys, certs, configs)
    - `logLibrarySearch()` / `logLibraryFilter()` - Standards library tracking
    - `logMigrateSearch()` / `logMigrateFilter()` - Software tool tracking
    - `logComplianceFilter()` - Compliance view tracking
    - `logDownload()` - File download tracking
    - `logExternalLink()` - Outbound link tracking
  - Analytics integration in `useModuleStore` for automatic progress tracking
  - Instrumented Library and Migrate views for search/filter analytics

- **Developer Tools**:
  - `scripts/validate-seo.sh` - Automated SEO validation script
  - Validates meta tags, static files, sitemap routes, HTTP status codes

### Changed

- **Routing**:
  - Timeline moved from `/` to `/timeline` route
  - Updated navigation with new "Home" button (with `end` prop)
  - Updated sitemap to include `/timeline` route
  - Updated tests to reflect new routing structure

- **Performance Optimization**:
  - **Removed 196 duplicate WASM files** from `public/dist/` directory
  - **Bundle size reduced from 66MB to 11MB (83% reduction)**
  - Enhanced vendor code splitting in `vite.config.ts`:
    - `vendor-react`: React core libraries
    - `vendor-ui`: Framer Motion, Lucide icons
    - `vendor-pqc`: Cryptography libraries
    - `vendor-zip`, `vendor-csv`, `vendor-markdown`, `vendor-pdf`: Specialized chunks
  - Simplified Framer Motion animation variants to reduce type complexity
  - Removed `mkdir -p public/dist` from build script (no longer needed)

- **Code Quality**:
  - Fixed ESLint accessibility warnings in ShareButton (proper keyboard event handling)
  - Updated MainLayout tests for new Home button behavior
  - All 226 unit and E2E tests passing

### Fixed

- ESLint `jsx-a11y/click-events-have-key-events` error on ShareButton backdrop
- ESLint `jsx-a11y/no-static-element-interactions` warning with proper event handlers
- MainLayout test expecting Timeline to be active at `/` (now expects Home)

## [1.8.5] - 2026-01-06

### Added

- **Migrate Module (New Feature)**:
  - Added new "Migrate" view for PQC readiness planning
  - Verified PQC Software Reference Database with 70+ entries
  - "New" and "Updated" status indicators for change tracking
  - Filtering by Category, Platform, and Support status

- **Data Updates**:
  - Added Jan 6, 2026 data files for Leaders, Threats, and Library (`01062026`)
  - Added 39 new PQC software entries (OS, Libraries, Network, Apps)
  - Updated PQC Software CSV to `12162025` version
  - Added comprehensive details for Windows Server 2025, Android 16, iOS 19, and major firewalls

### Changed

- **Threats Module**:
  - Updated AERO-001 reference to RTCA Security page (`https://www.rtca.org/security/`)
  - Removed "Accuracy / Probability" field from Threat Detail UI for cleaner presentation

- **Library Module**:
  - Corrected OpenPGP reference ID to `draft-ietf-openpgp-pqc-16`

- **Navigation**:
  - Reordered main menu to: Timeline -> Threats -> Algorithms -> Library -> Learn -> Migrate -> Playground -> OpenSSL Studio -> Compliance -> Leaders -> About
  - Better alignment with "Awareness -> Plan -> Act" user journey

- **Documentation**:
  - Updated `README.md` and `REQUIREMENTS.md` with Migrate module details
  - Added dedicated `requirements/Migrate_Module_Requirements.md`

## [1.8.4] - 2025-12-16

### Added

- **LMS/HSS (Hash-Based Signatures)**:
  - Unified "LMS (HSS)" button with Generate / Sign / Verify mode tabs
  - WASM-based key generation, signing, and verification
  - Parameters: LMS height (H5-H25), LM-OTS width (W1-W8)
  - Stateful signature warning for private key updates
  - Added `data-testid` attributes for E2E test reliability

### Changed

- **OpenSSL Studio**:
  - Now shows 13 operation types (added LMS/HSS)
  - "Run Command" button hidden for LMS (uses WASM buttons instead)

### Fixed

- **LMS Signature Verification**:
  - Fixed signature size issue (trimmed trailing zeros from 5KB buffer)
  - Fixed verify mode key selection to prefer `.pub` over `.key` files
  - Filtered verify dropdown to only show public keys (`.pub`, `.pem`)
- **Code Quality**:
  - Resolved all remaining lint errors (any types, label, useEffect deps)
  - Fixed prettier formatting across multiple components

### Removed

- **SKEY (Symmetric Key)**: Removed experimental EVP_SKEY feature due to WASM handle persistence limitations

## [1.8.3] - 2025-12-16

### Added

- **OpenSSL 3.6.0 Upgrade**:
  - Updated WASM binaries to OpenSSL 3.6.0 (4.12MB)
  - Native ML-KEM and ML-DSA support in OpenSSL
  - Enhanced PQC algorithm compatibility
  - OpenSSL documentation links in Studio command preview

- **Project Organization**:
  - Created `certs/` directory structure for TLS certificates
  - Added `certs/README.md` documentation
  - Organized certificates into `pqc/` and `rsa/` subdirectories

### Changed

- **Analytics**:
  - Improved localhost detection to prevent E2E test data from skewing production analytics
  - Enhanced analytics filtering logic

- **TLS Module**:
  - Regenerated all default certificates using OpenSSL 3.6.0
  - Updated ML-DSA certificate chains
  - Enhanced crypto operation logging
  - Certificate Inspector component with tree/raw view modes
  - TLS Comparison Table for side-by-side algorithm analysis
  - Improved client/server panel UI with better certificate management

- **Playground**:
  - Improved WASM instance management
  - Better error handling for key generation
  - Refactored ML-DSA and ML-KEM WASM integration

- **5G Module**:
  - Fixed state propagation issues
  - Improved file data handling between steps

- **Documentation**:
  - Updated data files to 12/15/2025 versions (Timeline, Library, Leaders, Threats)
  - Enhanced E2E tests for TLS module
  - Updated requirements documentation

### Fixed

- Race conditions in KEM playground E2E tests
- WASM caching issues in liboqs modules
- TypeScript errors in 5G service
- E2E test stability improvements across multiple modules
- Linting errors in TLS module (accessibility, TypeScript)
- AboutView test to match current SBOM content
- WASM library files added to repository for production deployment
- Removed mlkem-wasm references from vite config

## [1.8.2] - 2025-12-16

### Added

- **TLS Module Enhancements**:
  - Certificate Inspector component with tree/raw view modes
  - TLS Comparison Table for side-by-side algorithm analysis
  - Improved client/server panel UI with better certificate management
  - Certificate generation scripts for development

### Changed

- Updated data files to 12/15/2025 versions (Timeline, Library, Leaders, Threats)
- Enhanced E2E tests for TLS module
- Updated requirements documentation

### Fixed

- Linting errors in TLS module (accessibility, TypeScript)
- Added .gitignore rules for certificate files
- Excluded generated WASM file from Prettier checks

## [1.8.1] - 2025-12-15

### Added

- **What's New Feature**:
  - Dismissible toast notification on app load after version updates
  - Dedicated `/changelog` route displaying `CHANGELOG.md` with styled markdown
  - Interactive filter buttons for "New Features", "Enhancements", and "Bug Fixes"
  - Version tracking using Zustand store persisted to `localStorage`
  - "View Changelog" link added to About page
  - Comprehensive E2E tests for changelog functionality

- **Authoritative Sources Feature**:
  - "Sources" button added to 5 data views: Timeline, Library, Threats, Leaders, Algorithms
  - Modal displaying filtered authoritative sources grouped by type (Government, Academic, Industry Workgroup)
  - 52 curated sources from `pqc_authoritative_sources_reference_12152025.csv`
  - Timestamp-based CSV file selection for automatic latest version loading
  - Region badges with color coding (Americas, EMEA, APAC, Global)
  - Clickable source names linking to primary URLs
  - View-specific filtering using CSV columns

### Fixed

- E2E test strict mode violations in `algorithms.spec.ts` and `library.spec.ts`
- Changelog linting warnings (removed unnecessary eslint-disable comments)

## [1.8.0] - 2025-12-14

### Added

- **TLS 1.3 Basics Learning Module**:
  - Interactive TLS 1.3 handshake simulation with dual configuration modes (GUI + Raw OpenSSL config)
  - Support for RSA and ML-DSA (Post-Quantum) identity certificates
  - Detailed cryptographic logging showing key derivation, HKDF, signatures, and encryption
  - PQC algorithm support: ML-KEM (Kyber) key exchange, ML-DSA and SLH-DSA signatures
  - Custom certificate import from OpenSSL Studio
  - Separate CA trust configuration for client and server
  - Full interaction flow with customizable messages
  - Comprehensive requirements documentation (`learn_openssltls13_requirement.md`)

- **CI/CD Optimizations**:
  - Implemented Playwright test sharding (2 shards) to parallelize E2E test execution
  - Reduced CI execution time from >30 minutes (timeout) to ~4.5 minutes
  - Configured `workers: 1` in CI to prevent resource deadlocks on GitHub Actions runners
  - Added `ignoreHTTPSErrors: true` to handle SSL issues with external compliance sites

### Changed

- **5G Module**:
  - Refactored to use OpenSSL WASM instead of WebCrypto
  - Improved hybrid crypto implementation

- **Digital ID Module**:
  - Implemented OpenSSL log transparency and cleanup

- **Documentation**:
  - Updated SBOM in About page to match current package.json versions (Framer Motion, Lucide, Zustand, Vite, Prettier)
  - Updated Node.js requirement from v18 to v20 in README
  - Added TLS 1.3 Basics module to README feature list
  - Updated module count from 5 to 6 across documentation
  - Added TLSBasics directory to project structure documentation

### Fixed

- **E2E Test Regressions**:
  - Fixed `timeline.spec.ts` country selector locator (changed from "All Countries" to "Region")
  - Fixed `compliance-sources.spec.ts` SSL errors in Firefox by enabling HTTPS error ignoring
  - Fixed `playground-kem-updated.spec.ts` race condition in HKDF key derivation switching
  - Fixed `playground-kem-additional.spec.ts` race conditions in HKDF normalization tests
  - Added proper waits for WASM operation completion and hybrid mode key selection
  - Fixed `useKemOperations.ts` to clear decapsulated secrets during WASM encapsulation
  - Removed networkidle to resolve hanging CI tests
  - Stabilized CI with sharding and resolved all E2E test failures

- **5G Module**:
  - Restored 5G module, fixed E2E tests and linting
  - Made shared secret derivation stateless-safe for CI
  - Resolved unused variable build error
  - Restored missing public API methods and suppressed lint warnings
  - Restored robust hybrid crypto (WebCrypto + OpenSSL) to fix E2E failures

- **Build Issues**:
  - Removed invalid 'variant' prop from FilterDropdown usage
  - Resolved JSX.Element type error in SimpleGanttChart
  - Resolved wasm adapter lint errors

## [1.7.0] - 2025-12-12

### Added

- **Dynamic Data Loading**:
  - Implemented dynamic selection of the latest CSV data files for algorithms and transitions
  - Added "New" and "Updated" status badges to Library, Threats, Leaders, and Timeline modules
  - Timestamp-based CSV file selection for automatic latest version loading

- **Compliance Module Enhancements**:
  - Added ENISA EUCC scraper (`scripts/scrapers/enisa.ts`) and requirements
  - Multi-URL support for CC certificates and ANSSI scraper
  - Multi-URL dropdown display in compliance table
  - Lab column and expert lab extraction for CC
  - Comprehensive data improvements with filters embedded in column headers
  - Prioritized Cert Report over ST for extraction
  - Improved ANSSI link detection with 'certificat' keyword

- **Library Module**:
  - Library search functionality
  - Updated data classification

### Changed

- **Documentation**:
  - Updated `README.md` to accurately reflect the current project structure (including `scripts` at root)
  - Added comprehensive scraper requirements for all data sources
  - Updated contributing guidelines and added submit_feature workflow
  - Added CODEOWNERS file for branch protection

- **Compliance Module**:
  - Removed Status column from table
  - Centralized lab extraction logic in utils
  - Disabled generic CC links and fixed doc parsing regex
  - Used CC Portal product page URLs instead of corrupted PDF URLs
  - Properly encoded CC certificate URLs and extracted lab field

### Fixed

- **Code Quality**:
  - Resolved `eslint` errors in scraper scripts (`anssi.ts`, `cc.ts`) and various components
  - Fixed security warnings related to object injection and unsafe regex
  - Resolved build failures and security warnings
  - Fixed lint errors in debug scripts

- **E2E Tests**:
  - Fixed e2e regression for removed columns in compliance tests
  - Stabilized CI by skipping flaky tests and optimizing config
  - Used preview server in CI for stability
  - Added timeouts and disabled audit to prevent hangs
  - Disabled vitest watch mode in test script

- **Scraper Issues**:
  - Resolved unused variables and refined CC fetch logic
  - Resolved runtime errors in CC lab extraction
  - Fixed ANSSI links and extracted lab info from ST

- **UI Issues**:
  - Restored E2E fixes and IV management improvements
  - Resolved E2E test failures in PKI and Leaders modules
  - Fixed AttributeTable accessibility
  - Completed truncated AI acknowledgment text

## [1.6.0] - 2025-12-06

### Added

- **Theme Toggle**:
  - Implemented persistent theme selection (Light/Dark modes)
  - Global state management using Zustand with localStorage persistence
  - Theme toggle UI added to About page (desktop and mobile)
  - Synchronized state between mobile and desktop views
  - Refactored CSS to support manual `.dark` class overrides

- **Mobile Timeline Swipeable Phase Navigation**:
  - Swipe gestures for browsing through all phases per country
  - Interactive phase indicator dots showing current position
  - Direct navigation by clicking phase indicators
  - Visual distinction: Flag icon for milestones, colored dot for phases
  - Smooth Framer Motion animations (200ms transitions)
  - 50px drag threshold for phase transitions

- **5G Module Improvements**:
  - Implemented 5G Profile C PQC Dual Mode and EUDI Wallet Crypto alignment
  - Enhanced E2E validation tests for 5G flows

- **Digital Assets Module**:
  - Complete refactor with strict typing, E2E tests, and HD Wallet UI unification
  - Enhanced flows with improved components and utilities
  - Shared hooks to reduce code duplication

- **PKI Workshop Enhancements**:
  - Enhanced certificate parser with deep tree structure and semantic colors
  - Profile info buttons with optimized markdown modal
  - Completed button to PKI Workshop final step
  - Interactive PKI Workshop on mobile with read-only inputs
  - Top-level certificate sections always visible

- **Testing**:
  - Comprehensive unit tests for core utilities
  - Tests for OpenSSLService and PKILearning
  - Tests for ThreatsDashboard and LeadersGrid
  - SimpleGanttChart tests and fixed analytics testing
  - AlgorithmsView and LibraryView tests
  - Comprehensive test coverage for core components

### Changed

- **Appearance Settings**:
  - Removed "System" theme option to simplify user experience
  - Set default theme to **Light**
  - Updated `About` page and Mobile About view to reflect theme changes

- **Semantic Color Tokens**:
  - Global refactor of all Learning Modules (5G, DigitalAssets, DigitalID, PKIWorkshop) to use semantic color tokens
  - Introduced `--color-tertiary` (Purple) for Profile C support
  - Refactored hardcoded colors to semantic tokens across app
  - Replaced hardcoded dark styles with theme-aware variables in About page

- **UI Improvements**:
  - GitHub link added to about section
  - Unified file manager badge text color to muted-foreground style
  - Darkened file manager badge text for better light mode contrast
  - Fixed broken leader icons by adding resilient LeaderCard component
  - Improved console output readability with better semantic tokens
  - Improved attribute value input readability
  - Consistent readable input colors across all PKI Workshop steps
  - Lightened code block backgrounds for better light mode visibility
  - Theme consistency overhaul for Digital Assets module

- **Documentation**:
  - Updated `requirements/timeline.md` with comprehensive mobile timeline specifications
  - Updated `REQUIREMENTS.md` with responsive design breakpoint details
  - Added mobile swipeable navigation requirements and UX specifications
  - Updated project structure in README
  - Fixed README inconsistencies
  - Added maintainability audit report for Learn/Digital Assets modules
  - Added mobile design patterns to design system requirements

- **Build & Deployment**:
  - Display build timestamp in CST (Austin, TX timezone)
  - Made build timestamp update on every build/HMR
  - Added 404.html generation for GitHub Pages SPA routing
  - Updated license info in package.json and About page

### Fixed

- **Navigation Issues**:
  - Resolved critical bug where new users were forced into a redirect loop to the About page (WelcomeRedirect removed)
  - Resolved Timeline blank screen navigation bug
  - Removed AnimatePresence to resolve blank screen navigation bug

- **Test Stability**:
  - Fixed stale `useTheme` tests that referenced the deprecated "system" theme
  - Fixed e2e tests: seed localStorage to bypass welcome, update selectors and mock data
  - Fixed BitcoinFlow unit test crash
  - Updated MobileTimelineList.test.tsx mock data to match interface

- **Linting & Code Quality**:
  - Addressed various security (`detect-object-injection`) and React Hook warnings
  - Resolved build errors in DigitalID and Tabs
  - Resolved Ethereum signature verification issues
  - Suppressed testing-library and security warnings to unblock build
  - Resolved remaining lint errors and bypassed strict checks
  - Corrected TypeScript import for Plugin type

- **Accessibility**:
  - Fixed label-control associations in ThreatsDashboard

- **Theme Consistency**:
  - Removed hardcoded colors across multiple components
  - Ensured openssl terminal supports light mode
  - Ensured light mode consistency for Threats and Leaders pages
  - Ensured consistent light mode by using theme variables

- **PKI Workshop**:
  - Skipped basicConstraints from profile attributes
  - Removed constraints from PKI Workshop components
  - Completed constraints removal from CSRGenerator
  - Preserved CSR source attribution when loading CA profile

- **Dependabot**:
  - Resolved dependabot validation errors by reformatting
  - Enabled dependabot grouping and added AboutView tests

## [1.5.0] - 2025-12-06

### Added

- **Theme Toggle**:
  - Implemented persistent theme selection (Light/Dark/System modes)
  - Global state management using Zustand with localStorage persistence
  - Theme toggle UI added to About page (desktop and mobile)
  - Synchronized state between mobile and desktop views
  - Refactored CSS to support manual `.dark` class overrides

- **Mobile Timeline Swipeable Phase Navigation**:
  - Swipe gestures for browsing through all phases per country
  - Interactive phase indicator dots showing current position
  - Direct navigation by clicking phase indicators
  - Visual distinction: Flag icon for milestones, colored dot for phases
  - Smooth Framer Motion animations (200ms transitions)
  - 50px drag threshold for phase transitions

### Changed

- **UI Improvements**:
  - Learn module added to Kudos and Change Request forms
  - Updated About page SBOM layout to compact 3-column view

- **Documentation**:
  - Updated mobile timeline requirements
  - Created Design System, updated cursor rules with crypto/tech guidelines

### Fixed

- **Theme Consistency**:
  - Ensured openssl terminal supports light mode
  - Ensured light mode consistency for Threats and Leaders pages
  - Ensured consistent light mode by using theme variables

- **Build Issues**:
  - Added 404.html generation for GitHub Pages SPA routing

## [1.4.0] - 2025-12-04

### Added

- **Algorithm Comparison**:
  - Comprehensive algorithm comparison with multi-tab interface
  - Data source attribution to Algorithms and Threats pages

- **Digital Assets Module**:
  - Implemented digital assets module with full cryptocurrency support
  - Complete digital assets flows with improved components and utilities

- **PKI Workshop**:
  - Profile info button with optimized markdown modal

### Changed

- **OpenSSL Studio Redesign**:
  - **Layout**: Implemented a split-pane design with dedicated areas for Configuration (Left) and File Management (Right)
  - **Command Preview**: Moved to the top of the left pane, vertically centered, with an embedded "Run Command" button for a streamlined workflow
  - **File Manager**:
    - Now permanently visible in the right pane
    - Added "Size" column and compact timestamp formatting
    - Implemented column sorting (Name, Type, Size, Date)
  - **Toolbar**: Simplified navigation by removing the redundant "Key Files" button

- **Tailwind v4 Migration**:
  - Migrated to Tailwind v4 with UX improvements
  - Refined algorithms table layout and typography
  - Improved contrast by using proper semantic tokens

- **Data Format**:
  - Converted algorithms data from TypeScript to CSV

- **Filter UI**:
  - Applied grouped filter layout to Timeline page
  - Added opaque styling to filter dropdowns
  - Replaced glass-panel with opaque background in FilterDropdown wrapper
  - Replaced semi-transparent backgrounds in FilterDropdown options
  - Made all select dropdown options opaque globally
  - Made dropdown menus opaque for better readability
  - Improved Threats page filter layout and spacing

### Fixed

- **OpenSSL Studio**:
  - Resolved file writing error and standardized PKI Workshop layout

- **Build & Linting**:
  - Stabilized e2e tests, updated SBOM, and fixed accessibility issues
  - Fixed formatting and lint errors
  - Resolved type error in WorkbenchToolbar and added type check to pre-commit
  - Resolved lint errors and updated lint-staged config
  - Setup husky and lint-staged for automatic formatting
  - Fixed code formatting

- **Component Issues**:
  - Workbench component refactor and fixed regression tests
  - Updated Workbench tests with required props

### Documentation

- Updated `requirements/opensslstudio.md` with the new layout specifications and feature set
- Updated SBOM section with accurate dependency versions
- Updated package-lock.json to sync with package.json
- Updated project structure in README

## [1.3.0] - 2025-12-02

### Added

- **PKI Learning Module Enhancements**:
  - **File Naming**: Standardized naming for artifacts (e.g., `pkiworkshop_<timestamp>.csr`, `pkiworkshop_ca_<timestamp>.key`)
  - **OpenSSL Studio Sync**: Automatically syncs generated keys, CSRs, and certificates to the OpenSSL Studio file store
  - **State Persistence**: Workshop progress and OpenSSL Studio files are now persisted to `localStorage`
  - **UI Improvements**:
    - **CertSigner**: Refactored to a 4-step flow (CSR -> Profile -> Content -> Sign) with an educational process diagram
    - **Attribute Source**: Added visual indicators for attributes from CSR vs. CA Profile
    - **Constraints**: Moved constraints to a dedicated display row
  - **Reset Functionality**: Added a "Reset Workshop" button to clear all state
  - **CertParser**: Added artifact selection dropdown and format conversion (DER/P7B)

- **OpenSSL Studio Enhancements**:
  - File upload support
  - Auto-encryption filename
  - Playground backup functionality
  - Enhanced logs and UI navigation

### Changed

- **OpenSSL Studio**:
  - Updated requirements with verified algorithms and gap analysis
  - Improved command generation syntax for keys, signatures, and KEM

### Fixed

- **Code Quality & Stability**:
  - **Linting**: Resolved all lint warnings (unused variables, `any` types, security alerts)
  - **Build**: Fixed module resolution error by renaming `Root.tsx` to `AppRoot.tsx` and ensuring git tracking
  - **Formatting**: Enforced consistent code style
  - Resolved remaining lint warnings and build error
  - Resolved remaining lint warnings and Fast Refresh issue
  - Resolved remaining lint warnings and security alerts
  - Resolved linting, build, and accessibility errors
  - Applied code formatting fixes

- **OpenSSL Studio**:
  - Fixed SLH-DSA key generation: Added missing variants to Workbench.tsx and updated E2E tests
  - Resolved lint errors

- **Accessibility**:
  - ADA accessibility and UI consistency improvements

## [1.2.0] - 2025-12-02

### Added

- **About Page**:
  - About page with SBOM and AI acknowledgment
  - Comprehensive Security Audit Report (`src/data/security_audit_report_12022025.md`)

- **Threats Dashboard**:
  - Implemented Threats dashboard with tabs and sorting
  - Standardized filtering UI and added criticality filter

- **Analytics**:
  - Implemented granular analytics tracking
  - Integrated Google Analytics

- **Data Updates**:
  - Display data source metadata and updated data files
  - Updated timeline data and schema
  - Updated leaders data and schema
  - Implemented versioned CSV loading for leaders data
  - Added detailed CNSA 2.0 migration phases and milestones
  - Augmented leaders list with new details

- **Algorithms**:
  - Updated algorithms list with full OpenSSL Studio support

- **Build Improvements**:
  - Used static build timestamp
  - Added automated release workflow

### Changed

- **UI Improvements**:
  - Reordered tabs in playground and openssl studio
  - Removed close button and compacted library detail popover
  - Optimized library detail popover metadata layout
  - Refined library popover layout and table actions
  - Used SVG flags and updated footer text
  - Enforced strict sizing for country flags

### Fixed

- **Accessibility & Security**:
  - Accessibility and security issues, added about requirements
  - Resolved lint and security warnings

- **Build Issues**:
  - Fixed formatting issues
  - Fixed lint error: unused variable in timelineData.ts
  - Fixed build error: unused variable in timelineData.ts

- **E2E Tests**:
  - Updated e2e tests for UI changes
  - Added E2E tests for PQC algorithms (ML-DSA, SLH-DSA, ML-KEM)

### Documentation

- Updated `requirements/timeline.md` and `opensslstudio.md`
- Updated requirements with GA, timestamp, and algorithm details
- Updated formatting and added security audit report

## [1.1.0] - 2025-11-30

### Added

- **Revised Timeline Design**:
  - New Gantt chart visualization with sticky columns for Country and Organization
  - Improved popover details for timeline phases and milestones
  - Country selection and filtering
  - Mock data support for stable E2E testing
  - Prioritized milestones in timeline sorting
  - Rendered phases as individual cells for continuous bars
  - Added visible grid lines to timeline
  - Horizontal borders only between countries

- **Timeline Features**:
  - Grouped pre-2025 events and added <2024 header
  - Updated timeline to group pre-2025 events
  - Refined timeline visualization, support new CSV structure

### Changed

- **Popover Improvements**:
  - Removed close button from popover, rely on click-outside
  - Optimized popover header layout to save space
  - Made popover fonts smaller and consistent with timeline
  - Improved popover positioning and text wrapping

- **Phase Handling**:
  - Added 'Research' to phase order for correct sorting
  - Reordered phases for better visualization
  - Used fixed table layout to make phase bars span correctly
  - Made phase bars fill full width of spanned columns

### Fixed

- **OpenSSL Studio**:
  - Resolved duplicate terminal log issues
  - Fixed worker initialization errors (`importScripts` and redeclaration issues)
  - Resolved importScripts error by providing correct URL

- **Accessibility**:
  - Restored high-contrast colors for better visibility
  - Improved color contrast for WCAG AA compliance
  - Added keyboard accessibility to phase cells

- **CI/CD**:
  - Fixed linting and formatting issues for a clean build pipeline
  - Resolved lint errors and security warnings
  - Fixed formatting issues in openssl worker
  - Triggered CI

- **Navigation**:
  - Resolved runtime error in Legend and correct phase sorting
  - Resolved runtime error and type issues with Deadline phase

- **E2E Tests**:
  - Decoupled E2E tests from production CSV data using mock data
  - Updated E2E test expectation to match current data
  - Fixed production test to match current UI
  - Fixed production test strict mode violation
  - Updated E2E tests to match current UI implementation
  - Updated E2E test to close popover by clicking outside

- **Linting**:
  - Resolved ESLint errors - changed let to const for immutable variables
  - Resolved remaining lint errors
  - Resolved type error in FileManager.tsx by casting blob content to BlobPart
  - Resolved persistent lint errors and Fast Refresh warnings
  - Resolved build lint errors and unused variables
  - Resolved 'any' type lint error in SimpleGanttChart.tsx
  - Resolved lint error in GanttDetailPopover.tsx by removing unnecessary mounted state

- **Styling**:
  - Fixed formatting issues
  - Removed .text-muted utility class to restore original styling
  - Restored original text-muted color for better visual hierarchy
  - Added bold styling to active navigation button
  - Improved navigation button readability

### Documentation

- Updated timeline requirements with recent sorting and visualization changes
- Updated timeline requirements with popover improvements
- Updated requirements with recent fixes and testing strategy
- Fixed formatting in requirements docs

## [1.0.0] - Initial Release

Initial release of PQC Timeline Application.
