# PQC Timeline App — Maintenance Guide

> **Purpose**: One-stop reference for keeping every feature of the app up to date. Covers architecture, data sources, the AI assistant, persistence, and per-page maintenance instructions.
>
> **Related docs**: [`CSVmaintenance.md`](CSVmaintenance.md) (CSV workflow rules) · [`ux-standard.md`](ux-standard.md) (styling tokens) · [`CLAUDE.md`](../CLAUDE.md) (coding standards)

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [1 — Application Architecture](#1--application-architecture)
- [2 — PQC Assistant & RAG](#2--pqc-assistant--rag)
- [3 — Persistence, Progress Tracking & History](#3--persistence-progress-tracking--history)
- [4 — Landing Page](#4--landing-page-)
- [5 — Timeline](#5--timeline-timeline)
- [6 — Library](#6--library-library)
- [7 — Compliance](#7--compliance-compliance)
- [8 — Migrate](#8--migrate-migrate)
- [9 — Assess & Report](#9--assess--report-assess-report)
- [10 — Learn](#10--learn-learn)
- [11 — Threats](#11--threats-threats)
- [12 — Algorithms](#12--algorithms-algorithms)
- [13 — Playground](#13--playground-playground)
- [14 — OpenSSL Studio](#14--openssl-studio-openssl)
- [15 — Leaders](#15--leaders-leaders)
- [16 — Data Maintenance Quick Reference](#16--data-maintenance-quick-reference)

---

## Quick Reference

| Page                  | Primary CSV/Data                                                                                 | Sacred ID      | Persisted Store            | Links To                      |
| --------------------- | ------------------------------------------------------------------------------------------------ | -------------- | -------------------------- | ----------------------------- |
| `/` Landing           | `personaConfig.ts`, `learningPersonas.ts`                                                        | —              | `usePersonaStore`          | All pages                     |
| `/timeline`           | `timeline_MMDDYYYY.csv`                                                                          | —              | —                          | Library                       |
| `/library`            | `library_MMDDYYYY.csv`                                                                           | `referenceId`  | —                          | Compliance, Learn             |
| `/compliance`         | `compliance_MMDDYYYY.csv`, `compliance-data.json`                                                | `id`           | —                          | Library, Timeline, Assess     |
| `/migrate`            | `quantum_safe_crypto_software_reference_MMDDYYYY.csv`, `migrate_certification_xref_MMDDYYYY.csv` | `softwareName` | `useMigrateSelectionStore` | Assess, Learn, Compliance     |
| `/assess` + `/report` | `industryAssessConfig.ts`, `pqcassessment_MMDDYYYY.csv`                                          | —              | `useAssessmentStore`       | Compliance, Timeline, Migrate |
| `/learn/*`            | `modules/`, `moduleData.ts`, `pqcquiz_MMDDYYYY.csv`                                              | `moduleId`     | `useModuleStore`           | Library, Migrate, Threats     |
| `/threats`            | `quantum_threats_hsm_industries_MMDDYYYY.csv`                                                    | `threatId`     | —                          | Learn                         |
| `/algorithms`         | `pqc_complete_algorithm_reference_MMDDYYYY.csv`, `algorithms_transitions_MMDDYYYY.csv`           | —              | —                          | Playground, Learn             |
| `/playground`         | `src/data/acvp/*.json` (no CSV)                                                                  | —              | —                          | Learn, Algorithms             |
| `/openssl`            | `openssl_docs_map.csv`                                                                           | —              | —                          | Learn                         |
| `/leaders`            | `leaders_MMDDYYYY.csv`                                                                           | —              | —                          | Landing, Threats              |

**Universal update rule**: copy CSV → new dated file → edit → restart dev server → `npm run build && npm run test`.
**After any data source change**: `npm run generate-corpus` rebuilds the RAG index (runs automatically in `npm run build`).
**After migrate or compliance edits**: `python3 scripts/match_certifications.py`.

---

## 1 — Application Architecture

### 1.1 Purpose & Tech Stack

The PQC Timeline App is a **React single-page application** for post-quantum cryptography (PQC) education, migration planning, and interactive cryptographic demonstrations. All computation runs in the browser — there is no backend server.

| Layer             | Technology                                                    |
| ----------------- | ------------------------------------------------------------- |
| UI framework      | React 18 + TypeScript (strict)                                |
| Build tool        | Vite 5 with `vite-plugin-wasm`                                |
| Routing           | React Router v6 (lazy routes)                                 |
| Styling           | Tailwind v4 CSS — `@theme` block in `src/styles/index.css`    |
| State management  | Zustand + `persist` middleware (localStorage)                 |
| CSV parsing       | PapaParse                                                     |
| Full-text search  | MiniSearch (RAG retrieval)                                    |
| AI assistant      | Google Gemini 2.5 Flash (user-supplied API key)               |
| Crypto — standard | OpenSSL WASM v3.6.0 (`src/services/crypto/OpenSSLService.ts`) |
| Crypto — PQC      | `@oqs/liboqs-js` v0.15.1                                      |
| Blockchain crypto | `@noble/*`, `@scure/*`                                        |
| Testing           | Vitest (unit) + Playwright (E2E)                              |

### 1.2 Route Map

All routes are lazy-loaded via `lazyWithRetry()` in `src/App.tsx`. Every route is nested inside `<MainLayout>` (navigation shell).

| Route         | Component             | Notes                                       |
| ------------- | --------------------- | ------------------------------------------- |
| `/`           | `LandingView`         | Persona-aware journey rail                  |
| `/timeline`   | `TimelineView`        | Gantt chart of government PQC milestones    |
| `/library`    | `LibraryView`         | Technical standards & RFC repository        |
| `/compliance` | `ComplianceLandscape` | Compliance framework dashboard              |
| `/migrate`    | `MigrateView`         | Software migration catalog (7 infra layers) |
| `/assess`     | `AssessView`          | 14-step risk assessment wizard              |
| `/report`     | `ReportView`          | Assessment report + PDF print               |
| `/learn/*`    | `PKILearningView`     | 25 PQC learning modules + quiz              |
| `/learn/quiz` | (sub-route)           | Standalone quiz mode                        |
| `/threats`    | `ThreatsDashboard`    | Industry quantum threat landscape           |
| `/algorithms` | `AlgorithmsView`      | Algorithm database & comparisons            |
| `/playground` | `PlaygroundView`      | Live KEM/Signature testing (WASM)           |
| `/openssl`    | `OpenSSLStudioView`   | OpenSSL WASM command runner                 |
| `/leaders`    | `LeadersGrid`         | Industry PQC leadership by region           |
| `/changelog`  | `ChangelogView`       | Release notes                               |
| `/about`      | `AboutView`           | Disclaimers & credits                       |
| `/*`          | redirect `/`          | 404 fallback                                |

### 1.3 Application Boot Sequence

```
index.html
  └─ main.tsx
       └─ AppRoot.tsx
            ├─ React.StrictMode
            ├─ ErrorBoundary          ← catches React render errors
            ├─ Suspense               ← fallback while lazy chunks load
            └─ App.tsx (BrowserRouter)
                 ├─ AnalyticsTracker  ← logs page views on route changes
                 ├─ MainLayout        ← navigation shell (header + sidebar)
                 │    ├─ Route Component (lazy-loaded per route)
                 │    └─ RightPanel   ← Chat + History sidebar (also lazy)
                 └─ Toaster           ← react-hot-toast notifications
```

Zustand stores **auto-rehydrate** from localStorage before the first render. The `onRehydrateStorage` crash guard on every store prevents a corrupted key from crashing the app.

### 1.4 Data Flow

```
Build time
  CSV files (src/data/*)
    ──import.meta.glob──▶  loaders (libraryData.ts, timelineData.ts, …)
                                    ▼
                         generate-rag-corpus.ts
                                    ▼
                         public/data/rag-corpus.json

Runtime
  localStorage
    ──Zustand rehydrate──▶  stores (useModuleStore, usePersonaStore, …)
                                    ▼
                         Component render
                                    ▼
                    User interaction  ──▶  Store update ──▶  localStorage
                                    ▼
                    Analytics event (Google Analytics)
```

No runtime HTTP requests are made for content data (all CSVs are bundled). The only runtime HTTP requests are:

- **Gemini API** — streaming AI responses
- **NIST / BSI / ANSSI / CC proxies** — dev server only, for compliance scraping

### 1.5 Cross-Page Connection Map

This table shows which pages actively reference content from other pages (via navigation links, URL deep-links, or shared data).

| Source Page    | Links To        | How                                          |
| -------------- | --------------- | -------------------------------------------- |
| Landing        | All pages       | Journey step rail + persona CTA buttons      |
| Timeline       | Library         | DocumentTable source links                   |
| Library        | Compliance      | `libraryRefs` IDs in compliance CSV          |
| Library        | Learn           | `moduleIds` column in library CSV            |
| Compliance     | Library         | `libraryRefs` → `/library?ref=ID`            |
| Compliance     | Timeline        | `timelineRefs` → `/timeline?country=X`       |
| Compliance     | Assess          | Step 5 of wizard reads compliance frameworks |
| Migrate        | Assess / Report | Products shown for selected industry         |
| Migrate        | Learn           | `learningModules` column in migrate CSV      |
| Migrate        | Compliance      | Certification xref table                     |
| Assess         | Report          | Wizard completion → `/report`                |
| Assess         | Compliance      | Step 5 (framework selection)                 |
| Assess         | Timeline        | Step 13 (country-aligned deadlines)          |
| Learn          | Library         | `?moduleIds=module-id` filter                |
| Learn          | Migrate         | Module-tagged products                       |
| Learn          | Threats         | `?industry=X` filter                         |
| Learn          | Quiz            | `?category=IDs`                              |
| Threats        | Learn           | `relatedModules` column (pipe-separated)     |
| Algorithms     | Playground      | Test highlighted algorithms                  |
| Algorithms     | Learn           | Module deep-links via `?highlight=algo`      |
| Playground     | Learn           | Algorithm deep-links via `?algo=ML-KEM`      |
| OpenSSL Studio | Learn           | Command deep-links via `?cmd=category`       |
| Leaders        | Threats         | Industry profiles                            |

### 1.6 Shared Services

| Service                 | File                                            | Purpose                                                 |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `OpenSSLService`        | `src/services/crypto/OpenSSLService.ts`         | WASM OpenSSL — primary crypto (key gen, signing, certs) |
| `RetrievalService`      | `src/services/chat/RetrievalService.ts`         | RAG retrieval — MiniSearch index over corpus            |
| `GeminiService`         | `src/services/chat/GeminiService.ts`            | Gemini API streaming integration                        |
| `GoogleDriveService`    | `src/services/storage/GoogleDriveService.ts`    | Cloud sync (infrastructure ready, not yet in UI)        |
| `UnifiedStorageService` | `src/services/storage/UnifiedStorageService.ts` | Local + cloud storage abstraction                       |

### 1.7 Styling System (Summary)

Full spec: [`ux-standard.md`](ux-standard.md). Key rules:

- **Always** use semantic tokens: `text-primary`, `text-secondary`, `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `bg-muted`, `border-border`
- **Never** use raw palette classes: `text-blue-400`, `bg-gray-900`, `bg-black/40`
- **Exception**: `fixed inset-0 bg-black/60` for full-screen modal backdrops
- **Status colors**: `.text-status-error/warning/success/info` + `.bg-status-*`
- **Cards/containers**: `.glass-panel`
- **Page titles** (≥ `text-lg`): `.text-gradient`

### 1.8 Build Scripts

```bash
npm run dev            # Dev server (port 5175) with WASM headers
npm run build          # scrape compliance → tsc → vite build → copy 404.html
npm run generate-corpus  # Rebuild RAG corpus from all data sources
npm run scrape         # Re-scrape NIST / ACVP / CC / BSI / ANSSI
npm run download:library   # Download/archive library reference HTML/PDFs
npm run download:timeline  # Download/archive timeline documents
npm run download:threats   # Download/archive threat documents
npm run lint           # ESLint
npm run test           # Vitest unit tests
npm run test:e2e       # Playwright E2E (Chromium)
npm run coverage       # Vitest coverage report
```

---

## 2 — PQC Assistant & RAG

### 2.1 Overview

The PQC Assistant is a **RAG-augmented AI chatbot** powered by Google Gemini 2.5 Flash. It has **no backend** — the API key is provided by the user and stored locally. All knowledge comes from a bundled corpus generated at build time.

**Key files**:

| File                                             | Purpose                                             |
| ------------------------------------------------ | --------------------------------------------------- |
| `src/components/RightPanel/ChatPanelContent.tsx` | Main chat UI (message list, input, streaming)       |
| `src/components/Chat/ChatMessage.tsx`            | Individual message rendering                        |
| `src/components/Chat/ApiKeySetup.tsx`            | API key input & validation                          |
| `src/components/Chat/ConversationMenu.tsx`       | Conversation selection                              |
| `src/services/chat/GeminiService.ts`             | Gemini API streaming integration                    |
| `src/services/chat/RetrievalService.ts`          | RAG retrieval + MiniSearch index                    |
| `src/services/chat/responseCache.ts`             | Response cache (query + page → response)            |
| `src/services/chat/groundingCheck.ts`            | Warns if response references entities not in corpus |
| `src/services/chat/exportConversation.ts`        | Export chat as markdown/JSON                        |
| `src/hooks/useChatSend.ts`                       | Query → retrieve → stream → store pipeline          |
| `src/store/useChatStore.ts`                      | Conversation history + API key (localStorage v4)    |
| `src/types/ChatTypes.ts`                         | `RAGChunk`, `ChatMessage`, `Conversation` types     |
| `scripts/generate-rag-corpus.ts`                 | Corpus generation script                            |
| `public/data/rag-corpus.json`                    | Generated corpus output                             |

### 2.2 RAG Corpus

#### What It Is

`public/data/rag-corpus.json` is a flat array of `RAGChunk` objects, one per indexable document fragment. Format:

```json
{
  "chunks": [
    {
      "id": "string",
      "source": "glossary | algorithms | timeline | library | threats | compliance | leaders | migrate | ...",
      "title": "string",
      "content": "string",
      "category": "string",
      "metadata": { "key": "value" },
      "deepLink": "/algorithms?highlight=ML-KEM"
    }
  ],
  "generatedAt": "2026-02-28T00:00:00.000Z"
}
```

Legacy flat-array format (`RAGChunk[]` directly) is also supported for backward compatibility.

#### 22 Data Sources

| Source key              | Origin                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `glossary`              | `src/data/glossaryData.ts` (~170 terms)                      |
| `timeline`              | `timeline_MMDDYYYY.csv`                                      |
| `library`               | `library_MMDDYYYY.csv`                                       |
| `algorithms`            | `pqc_complete_algorithm_reference_MMDDYYYY.csv`              |
| `algorithm-transitions` | `algorithms_transitions_MMDDYYYY.csv`                        |
| `threats`               | `quantum_threats_hsm_industries_MMDDYYYY.csv`                |
| `compliance`            | `compliance-data.json` (scraped)                             |
| `leaders`               | `leaders_MMDDYYYY.csv`                                       |
| `migrate`               | `quantum_safe_cryptographic_software_reference_MMDDYYYY.csv` |
| `certifications`        | `migrate_certification_xref_MMDDYYYY.csv`                    |
| `authoritative-sources` | `pqc_authoritative_sources_reference_MMDDYYYY.csv`           |
| `module-summaries`      | 25 module intro descriptions from `moduleData.ts`            |
| `module-content`        | Module step descriptions                                     |
| `document-enrichment`   | `doc-enrichments/library_doc_enrichments_MMDDYYYY.md`        |
| `quiz`                  | `pqcquiz_MMDDYYYY.csv` (470+ questions)                      |
| `assessment`            | Assessment scoring logic guidance                            |
| `priority-matrix`       | `pqc_software_category_priority_matrix.csv`                  |

#### Generating the Corpus

```bash
npm run generate-corpus    # explicit rebuild
npm run build              # also runs generate-corpus automatically (prebuild)
```

**When to regenerate**:

- After updating any source CSV
- After adding/editing module content
- After updating `library_doc_enrichments_MMDDYYYY.md`
- After adding a new data source to `scripts/generate-rag-corpus.ts`

#### Adding a New Data Source to the Corpus

1. Add a parsing section in `scripts/generate-rag-corpus.ts` that creates `RAGChunk[]` from your data
2. Choose a unique `source` key (snake-case)
3. Populate `deepLink` fields with relevant app URLs
4. Run `npm run generate-corpus` and verify chunk count increases
5. Add the new source key to the table above

### 2.3 Retrieval Pipeline

Retrieval happens in `src/services/chat/RetrievalService.ts` via a **3-phase pipeline**:

#### Phase 1 — Direct Entity Matching

- Query split into n-grams (1–4 word combinations)
- Matched against a pre-built `entityIndex` (normalized entity titles from all chunks)
- Fuzzy matching: `"ML-DSA-44"` also matched as `"ml dsa"`, `"ml-dsa"`
- Returns up to 4 high-precision chunks for exact entity hits

#### Phase 2 — Query Expansion

- Maps natural-language phrases to technical terms (150+ pairs in `QUERY_EXPANSIONS`)
- Examples: `"quantum signing algorithm"` → ML-DSA, SLH-DSA, FN-DSA; `"harvest now"` → HNDL, SNDL; `"key exchange"` → ML-KEM, ECDH
- Country names expand to country-specific terms
- Special handling for `country_query` intent to prevent generic dilution

**To add a new expansion**: edit the `QUERY_EXPANSIONS` map in `RetrievalService.ts`.

#### Phase 3 — MiniSearch Ranking

Full-text search with **intent-based boosting**:

| Intent           | Detected by                    | Source boosts                            |
| ---------------- | ------------------------------ | ---------------------------------------- |
| `definition`     | "what is", "define", "explain" | glossary ×3, algorithms ×2               |
| `comparison`     | "compare", "vs", "difference"  | algorithms ×2, transitions ×3            |
| `catalog_lookup` | product/software names         | migrate ×3, certifications ×2            |
| `recommendation` | "should I", "recommend"        | assessment ×2, compliance ×1.5           |
| `country_query`  | country names                  | timeline ×3, compliance ×2, leaders ×1.5 |
| `general`        | fallback                       | no boost                                 |

**Chunk limits by intent**: `definition` → 10, `comparison` → 15, `catalog_lookup` → 20, `general` → 15.

### 2.4 Gemini Integration

#### API Details

| Property    | Value                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Endpoint    | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent` |
| Auth        | User-provided API key (stored in `useChatStore`, key `pqc-chat-storage`)                         |
| Streaming   | Server-Sent Events (SSE)                                                                         |
| Timeout     | 60 seconds                                                                                       |
| Retry       | Exponential backoff, max 2 retries on 5xx                                                        |
| Temperature | 0.3                                                                                              |
| Max tokens  | 8 192                                                                                            |

**To change the model**: update the default in `useChatStore.ts` and the endpoint in `GeminiService.ts`.

#### System Prompt Construction

The system prompt includes:

1. **RAG context blocks** — up to 80 000 characters of retrieved chunks
2. **Entity inventory** — up to 30 unique named entities grouped by category (prevents hallucination by telling the model what it's allowed to reference)
3. **Persona profile** — response style adapted to: `executive` (business focus), `developer` (technical detail), `architect` (integration patterns), `researcher` (math/academic)
4. **User profile** — industry, region, assessment risk score (if available)
5. **Page context** — current route + tab + step (for contextual responses)
6. **Deep-link map** — instructs the model to embed app links, e.g.:
   - `/algorithms?highlight=ML-KEM` for algorithm references
   - `/library?ref=fips-140-3` for standards
   - `/timeline?country=US` for timeline events
   - `/migrate?q=openssl` for products
   - `/learn/{module-id}` for learning content
   - `/assess?step=N` for wizard steps
   - `/playground?algo=ML-KEM` for playground

### 2.5 Conversation History

Managed by `useChatStore` (localStorage key: `pqc-chat-storage`, version 4).

- **Max 10 conversations** — oldest removed when exceeded
- **Max 50 messages per conversation** — auto-trimmed
- Conversation auto-titled from first user message
- Messages carry: `id`, `role`, `content`, `timestamp`, `sources[]`, `sourceRefs[]`, `followUps[]`, `feedback`

**Version history**: v1 (flat messages) → v2 (model upgrade) → v3 (feedback field) → v4 (multi-conversation `Conversation[]`)

### 2.6 Response Caching & Grounding

- **Cache** (`responseCache.ts`): keyed by `(query, currentPage)`. Avoids redundant API calls for identical questions on the same page.
- **Grounding check** (`groundingCheck.ts`): After receiving a response, verifies that entity names in the response appear in the retrieved chunks. Flags responses that reference entities absent from the corpus.

### 2.7 Keeping the Assistant Accurate

| Action                        | How                                                               |
| ----------------------------- | ----------------------------------------------------------------- |
| Update factual content        | Edit source CSVs → `npm run generate-corpus`                      |
| Add new knowledge domain      | Add data source to `generate-rag-corpus.ts` → rebuild             |
| Improve retrieval for a topic | Add entries to `QUERY_EXPANSIONS` in `RetrievalService.ts`        |
| Change AI model               | Update default model in `useChatStore` + `GeminiService` endpoint |
| Improve linking               | Update deep-link map in `GeminiService.buildSystemPrompt()`       |

### 2.8 Document Enrichment Pipeline

The enrichment pipeline extracts structured metadata from downloaded HTML/PDF documents and feeds it into both the Library UI and the RAG corpus. It runs **manually** (not as part of `npm run build`).

#### Pipeline Stages

```
1. Download                2. Extract                    3. Load                       4. Consume
npm run download:library   python3 enrich-public-docs.py libraryEnrichmentData.ts      ├─ DocumentAnalysis.tsx (UI)
        ↓                          ↓                             ↓                     └─ generate-rag-corpus.ts (RAG)
public/library/ (HTML/PDF) doc-enrichments/*_MMDDYYYY.md  EnrichmentLookup map
```

**Stage 1 — Download**: `npm run download:library`, `download:timeline`, `download:threats` fetch HTML/PDF copies of source documents into `public/{library|timeline|threats}/`. Each directory has a `manifest.json` (download log) and `skip-list.json` (paywalled URLs).

**Stage 2 — Extract**: Use **Claude Haiku** to read each downloaded document and extract the **11 semantic dimensions**. Haiku produces significantly higher-quality enrichments than regex-based alternatives by understanding context, resolving abbreviations, and identifying implicit references across the full document.

> ⚠️ **Do NOT use the regex parser (`enrich-public-docs.py`) as the primary extraction method.** The regex script is a bulk fallback only. For any new additions, always use Claude Haiku to generate enrichments.

The 11 dimensions to extract per document:

| #   | Dimension              | What to extract                                   | Scale                                        |
| --- | ---------------------- | ------------------------------------------------- | -------------------------------------------- |
| 1   | Main Topic             | Free-form summary sentence (≤250 chars)           | —                                            |
| 2   | PQC Algorithms         | All PQC algorithm families explicitly covered     | ML-KEM, ML-DSA, SLH-DSA, FN-DSA, etc.        |
| 3   | Quantum Threats        | Threat models addressed                           | CRQC, HNDL, HNFL, Shor's, Grover's           |
| 4   | Migration Timeline     | Dates + contextual milestone phrases (≤120 chars) | "2027: agencies must complete PQC inventory" |
| 5   | Regions & Bodies       | Countries and regulatory bodies explicitly cited  | US, EU, AU + NIST, IETF, NSA                 |
| 6   | Leaders Mentioned      | Named individuals with contributions              | 2+ word names                                |
| 7   | PQC Products           | Commercial or open-source PQC tools mentioned     | OpenSSL, liboqs, AWS-LC, etc.                |
| 8   | Protocols              | Cryptographic protocols covered                   | TLS 1.3, X.509, SSH, IPsec, QUIC             |
| 9   | Infrastructure Layers  | Infrastructure categories addressed               | HSM, TPM, PKI, CA, IoT, Cloud                |
| 10  | Standardization Bodies | Standards organizations referenced                | NIST, ISO/IEC, IETF, ETSI, W3C               |
| 11  | Compliance Frameworks  | Regulatory/compliance frameworks cited            | FIPS 140-3, Common Criteria, eIDAS 2.0, NIS2 |

**Extraction prompt for Haiku**: provide the downloaded document text (HTML or PDF), the 11 dimensions, and the required output format (the markdown section format used in `library_doc_enrichments_MMDDYYYY.md`). Append the output to the enrichment file.

**Fallback — regex parser**: `python3 scripts/enrich-public-docs.py` can bulk-process all downloaded documents via pattern matching. Use only when Haiku extraction is not feasible for a large batch. Output format is identical. Text extraction limits: HTML first 20K characters, PDF first 1000 lines.

**Stage 3 — Load**: `src/data/libraryEnrichmentData.ts` auto-discovers the latest enrichment markdown via `import.meta.glob('./doc-enrichments/library_doc_enrichments_*.md')`, parses `## ReferenceID` sections into a `LibraryEnrichment` object per document, and exports the lookup map.

**Stage 4 — Consume**: Two consumers read the enrichment data:

- **Library UI** (`src/components/Library/DocumentAnalysis.tsx`) — 11-dimension accordion panel inside the Library detail popover. Documents with enrichments show a "Document Analysis" button with a Sparkles icon. Each dimension uses a distinct tag color variant.
- **RAG corpus** (`scripts/generate-rag-corpus.ts`, function `processDocumentEnrichments()`) — converts enrichment sections into searchable `RAGChunk` objects with `source: 'document-enrichment'` and deep-links back to `/library?ref=ID` or `/threats?id=ID`.

#### Key Files

| File                                                     | Purpose                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `scripts/enrich-public-docs.py`                          | Python extraction script (11 dimensions from HTML/PDF)                    |
| `src/data/doc-enrichments/*_doc_enrichments_MMDDYYYY.md` | Extracted enrichment markdown (3 collections: library, timeline, threats) |
| `src/data/libraryEnrichmentData.ts`                      | Markdown parser + auto-discovery loader                                   |
| `src/data/libraryEnrichmentData.test.ts`                 | Loader unit tests                                                         |
| `src/components/Library/DocumentAnalysis.tsx`            | 11-dimension accordion UI component                                       |
| `src/components/Library/DocumentAnalysis.test.tsx`       | Component tests                                                           |
| `scripts/generate-rag-corpus.ts`                         | RAG chunk generation (function `processDocumentEnrichments`)              |

#### How to Run

**Full pipeline** (all collections):

```bash
# 1. Download/refresh source documents
npm run download:library
npm run download:timeline
npm run download:threats

# 2. Extract dimensions from downloaded documents
python3 scripts/enrich-public-docs.py

# 3. Rebuild RAG index (picks up new enrichment chunks)
npm run generate-corpus

# 4. Restart dev server (import.meta.glob re-discovers new .md files)
```

**Single collection** (with dry-run preview):

```bash
python3 scripts/enrich-public-docs.py --collection library --dry-run
python3 scripts/enrich-public-docs.py --collection library
```

#### Constraints

- Enrichment is **not automated** — `npm run build` does not run `enrich-public-docs.py`. Run it manually after downloading new documents.
- `import.meta.glob` resolves at **dev server startup** — restart the dev server after adding/removing enrichment markdown files.
- The extraction script depends on external CSV data (`leaders_*.csv` for leader names, `migrate_*.csv` for product names). If those CSVs are updated, re-run the enrichment script to pick up new names.
- PDF extraction requires `pdftotext` CLI (from Poppler). If unavailable, PDFs are silently skipped.

---

## 3 — Persistence, Progress Tracking & History

### 3.1 Overview

The app is **100% local-first**. All user state is stored in `localStorage` via Zustand `persist` middleware. There is no authentication, no server session, and no remote database (except for optional Google Drive sync — infrastructure ready but not yet in UI).

### 3.2 Mandatory Store Conventions

Every persisted Zustand store **must** follow these rules (enforced by CLAUDE.md):

```typescript
export const useMyStore = create<MyState>()(
  persist(
    (set, get) => ({
      // ... state + actions
    }),
    {
      name: 'pqc-my-store', // localStorage key
      version: 1, // increment on every schema change
      migrate(persistedState: unknown, fromVersion: number) {
        const s = persistedState as Partial<MyState>
        if (fromVersion < 1) {
          s.newField = s.newField ?? 'default' // scalar
          s.listField = Array.isArray(s.listField) ? s.listField : [] // array
          s.boolField = s.boolField ?? false // boolean
        }
        return s as MyState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('MyStore rehydration error:', error)
      },
    }
  )
)
```

**When adding a new persisted field**: bump `version`, add a migration step that provides a safe default. **Never** silently wipe user data.

### 3.3 Store Inventory

| Store                      | localStorage Key        | Version | Purpose                                                       |
| -------------------------- | ----------------------- | ------- | ------------------------------------------------------------- |
| `useModuleStore`           | `pki-module-storage`    | 5       | Learning progress for all 25 modules, artifacts, quiz mastery |
| `useChatStore`             | `pqc-chat-storage`      | 4       | AI assistant conversations + API key                          |
| `useAssessmentStore`       | `pqc-assessment`        | 7       | 14-step risk wizard state + last result                       |
| `usePersonaStore`          | `pqc-learning-persona`  | 2       | Persona, region, industry, experience level                   |
| `useHistoryStore`          | `pqc-history`           | 2       | User action event timeline (max 500 events)                   |
| `useVersionStore`          | `pqc-version-storage`   | 1       | "What's New" toast suppression                                |
| `useRightPanelStore`       | `pqc-right-panel`       | 1       | Chat/History sidebar active tab                               |
| `useThemeStore`            | `pqc-theme`             | 1       | Dark/light mode preference                                    |
| `useMigrateSelectionStore` | `pqc-migrate-selection` | 2       | Migrate catalog layer/subcategory/hidden products             |
| `useCloudSyncStore`        | `pqc-cloud-sync`        | 1       | Google Drive sync state (reserved)                            |

### 3.4 Learning Progress (`useModuleStore`)

**File**: `src/store/useModuleStore.ts`

Tracks:

- **Module status** per module: `not-started` / `in-progress` / `completed`
- **Completed steps** (`completedSteps: string[]`) per module
- **Time spent** (minutes) per module
- **Quiz scores** by category (percentage)
- **Session tracking**: `firstVisit`, `lastVisitDate`, `totalSessions`, `currentStreak`, `longestStreak`, `visitDates` (last 30 days)
- **Cumulative quiz mastery**: `quizMastery.correctQuestionIds[]` — tracks every correctly answered question ID across all quiz sessions
- **Artifacts**: generated keys, X.509 certificates, CSRs, and executive documents (each with `id`, `type`, `generatedAt`, `module`)

**Export/import**: `saveProgress()` downloads a JSON snapshot; `loadProgress(data)` imports it. Used for Google Drive sync.

**Auto-save**: `beforeunload` and `pagehide` listeners flush progress to localStorage before page closes.

### 3.5 Assessment Store (`useAssessmentStore`)

**File**: `src/store/useAssessmentStore.ts`

Stores all 14 wizard steps:

| Step           | Field(s)                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Industry       | `industry: string`                                                                                    |
| Country        | `country: string` (auto-clears stale compliance when changed)                                         |
| Crypto         | `currentCrypto: string[]`, `cryptoUnknown: boolean`                                                   |
| Sensitivity    | `dataSensitivity: string[]` (multi-select, worst-case scoring)                                        |
| Compliance     | `complianceRequirements: string[]` (filtered by industry)                                             |
| Migration      | `migrationStatus: string`                                                                             |
| Use Cases      | `cryptoUseCases: string[]`                                                                            |
| Retention      | `dataRetention: string[]` (multi-select, worst-case scoring)                                          |
| Credential     | `credentialLifetime: string[]`                                                                        |
| Infrastructure | `infrastructure: string[]`, `infrastructureSubCategories`, `systemCount`, `teamSize`, `cryptoAgility` |
| Vendors        | `vendorDependency: string`                                                                            |
| Timeline       | `timelinePressure: string`                                                                            |
| Result         | `lastResult: AssessmentResult                                                                         | null`, `assessmentStatus`, `completedAt` |

`dataSensitivity` and `dataRetention` use worst-case (max) scoring — the highest-risk value drives the final score.

### 3.6 History Store (`useHistoryStore`)

**File**: `src/store/useHistoryStore.ts`

Records a timeline of user actions (max 500 events, oldest removed). Events include:

`page_viewed`, `module_started`, `module_completed`, `step_completed`, `quiz_completed`, `assessment_started`, `assessment_completed`, `artifact_key`, `artifact_cert`, `artifact_csr`, `artifact_executive`, `tls_simulation`, `persona_set`

Events deduplicate by `(type, moduleId, day)` — so visiting the same module twice in a day only creates one event (except artifact and TLS events which always log).

**Seeding**: `src/services/history/seedHistory.ts` bulk-populates history from imported progress data.

### 3.7 Persona Store (`usePersonaStore`)

**File**: `src/store/usePersonaStore.ts`

| Field                  | Type                                                                | Purpose                                                    |
| ---------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `selectedPersona`      | `'executive' \| 'developer' \| 'architect' \| 'researcher' \| null` | Drives landing CTAs, journey step visibility, chat prompts |
| `hasSeenPersonaPicker` | `boolean`                                                           | Suppresses onboarding modal                                |
| `selectedRegion`       | `'americas' \| 'eu' \| 'apac' \| 'global'`                          | Presets timeline/compliance region filter                  |
| `selectedIndustries`   | `string[]`                                                          | Multi-industry context                                     |
| `experienceLevel`      | `'new' \| 'basics' \| 'expert' \| null`                             | Adapts module recommendations                              |
| `suppressSuggestion`   | `boolean`                                                           | Hides persona suggestion banner                            |

### 3.8 Google Drive Sync (Reserved)

`src/services/storage/GoogleDriveService.ts` + `UnifiedStorageService.ts` implement upload/download of `useModuleStore` progress and assessment state. The infrastructure is complete but not yet wired to the UI.

### 3.9 Adding a New Persisted Field

1. Add the field to the store's state type
2. Provide a default value in the initial state
3. Bump `version` by 1
4. In `migrate()`, add a case for the new version:
   ```typescript
   if (fromVersion < NEW_VERSION) {
     s.myNewField = s.myNewField ?? defaultValue
   }
   ```
5. Update the Store Inventory table in this document (§3.3)

---

## 4 — Landing Page (`/`)

### Components

- `src/components/Landing/LandingView.tsx` — main view
- `src/components/Landing/ScoreCard.tsx` — Learning Journey scorecard (judo belt grading)

### Data Sources

| Source                 | File                                 | What It Drives                                                           |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| Persona definitions    | `src/data/learningPersonas.ts`       | Persona picker descriptions                                              |
| Persona routing config | `src/data/personaConfig.ts`          | `PERSONA_RECOMMENDED_PATHS`, `ALWAYS_VISIBLE_PATHS`, `PERSONA_NAV_PATHS` |
| Stats bar              | Computed from other loaders on mount | Algorithm count, timeline events, library items, products                |

No CSV files are directly loaded by Landing. Statistics are computed by calling the other feature loaders.

### How to Update

| Change                                            | How                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Add/edit persona description                      | Edit `src/data/learningPersonas.ts`                                          |
| Change which journey steps are visible by default | Edit `ALWAYS_VISIBLE_PATHS` in `personaConfig.ts`                            |
| Change persona → page priority mapping            | Edit `PERSONA_RECOMMENDED_PATHS` in `personaConfig.ts`                       |
| Add a new journey step                            | Add to the step rail in `LandingView.tsx` and register in `personaConfig.ts` |

### Links to Other Pages

The **7-step journey rail** links to all main features:

| Step       | Route(s)                               |
| ---------- | -------------------------------------- |
| Learn      | `/learn`                               |
| Assess     | `/assess`                              |
| Explore    | `/timeline`, `/algorithms`, `/library` |
| Test       | `/playground`, `/openssl`              |
| Deploy     | `/migrate`                             |
| Ramp Up    | `/compliance`                          |
| Stay Agile | `/threats`, `/leaders`                 |

### Stores

- `usePersonaStore` — drives step accessibility (35% dim for inaccessible steps), "For you" badges, and primary CTA button targets

---

## 5 — Timeline (`/timeline`)

### Components

- `src/components/Timeline/TimelineView.tsx` — view wrapper, owns `selectedCountry` state
- `src/components/Timeline/SimpleGanttChart.tsx` — Gantt chart, owns `filterText`, `selectedPhaseType`, `selectedEventType`
- `src/components/Timeline/DocumentTable.tsx` — document list below chart when country is selected

### Data Sources

| File                             | Loader                     | Format                                                                            |
| -------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `src/data/timeline_MMDDYYYY.csv` | `src/data/timelineData.ts` | CountryName, RegularBodyName, Phase, Title, Description, StartYear, EndYear, Type |

The loader uses `import.meta.glob('./timeline_*.csv')` to auto-discover all dated files. It loads the **two most recent versions** — the latest for display, the previous for New/Updated badge comparison.

**Archived HTML/PDFs**: `public/timeline/` (named `{Country}_{Org}_{Title}.{html|pdf}`) — use to verify source claims.

### How to Update

```bash
# 1. Copy to new dated file
cp src/data/timeline_02282026.csv src/data/timeline_03012026.csv

# 2. Edit the new file (never edit in place)

# 3. Restart dev server (Vite re-discovers import.meta.glob)

# 4. Verify build and tests
npm run build && npm run test

# 5. Archive older version
mv src/data/timeline_[oldest].csv src/data/archive/

# 6. Rebuild RAG corpus
npm run generate-corpus
```

### Links to Other Pages

- **Library**: DocumentTable shows source document links (external URLs, not internal)
- Deep-linkable: `?country=CountryName` presets the country filter

### Z-index Notes (Memory)

- Sticky table headers: `z-30`
- Phase cells: `z-20`
- Filter controls bar: `relative z-40` (renders dropdowns above sticky headers)
- `GanttDetailPopover`: inline style `z-index: 9999`

### Stores

- `usePersonaStore.selectedRegion` — presets initial region filter

---

## 6 — Library (`/library`)

### Components

- `src/components/Library/LibraryView.tsx` — main view
- `src/components/Library/LibraryTreeTable.tsx` — hierarchical table
- `src/components/Library/LibraryDetailPopover.tsx` — document detail drawer
- `src/components/Library/DocumentCard.tsx` — card layout
- `src/components/Library/DocumentAnalysis.tsx` — AI-generated enrichment view

### Data Sources

| File                                                           | Loader                     | Notes                                          |
| -------------------------------------------------------------- | -------------------------- | ---------------------------------------------- |
| `src/data/library_MMDDYYYY.csv`                                | `src/data/libraryData.ts`  | 22+ columns; `referenceId` is sacred           |
| `src/data/doc-enrichments/library_doc_enrichments_MMDDYYYY.md` | Parsed by corpus generator | AI-generated summaries; also fed into RAG      |
| `public/library/`                                              | Static assets              | Archived HTML/PDF copies; use to verify claims |

The loader builds a tree structure: parent documents contain child documents via the `dependencies` column (semicolon-separated `referenceId` values).

### How to Update

```bash
# 1. Copy to new dated file
cp src/data/library_02282026.csv src/data/library_03012026.csv

# 2. Edit — NEVER change existing referenceId values
# (cross-referenced by compliance.libraryRefs and module loaders)

# 3. Restart dev server

# 4. For enrichment updates: copy and edit the enrichments .md file

# 5. Rebuild RAG corpus
npm run generate-corpus

# 6. Verify
npm run build && npm run test
```

**Downloading new reference docs**:

```bash
npm run download:library       # fetches URLs in library CSV
npm run download:library:dry   # dry-run (preview only)
```

### Links to Other Pages

- **Compliance**: `compliance.libraryRefs` column contains `referenceId` values; compliance cards show "View document" links to `/library?ref=ID`
- **Learn modules**: `library.moduleIds` column (pipe-separated module IDs); Learn shows "Explore documents" links to `/library?moduleIds=module-id`
- Deep-linkable: `?ref=referenceId`, `?q=SearchTerm`

### Cross-Reference Warning

`referenceId` values are referenced by:

- `compliance_MMDDYYYY.csv` column `libraryRefs`
- `library_MMDDYYYY.csv` column `dependencies` (self-reference for tree building)
- Learn module loaders via `getLibraryItemsForModule(moduleId)`

**Never change a referenceId.** Grep for it before deleting a record.

### Stores

- `usePersonaStore.selectedIndustry` — presets industry filter on load

---

## 7 — Compliance (`/compliance`)

### Components

- `src/components/Compliance/ComplianceLandscape.tsx`

### Data Sources

| File                               | Loader                       | Refresh                                                                    |
| ---------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `src/data/compliance_MMDDYYYY.csv` | `src/data/complianceData.ts` | Manual (copy → new date)                                                   |
| `public/data/compliance-data.json` | Loaded at runtime            | Daily via GitHub Actions `update-compliance.yml`; manual: `npm run scrape` |

The CSV contains compliance **frameworks** (FIPS, ISO, BSI, ANSSI, etc.). The JSON contains scraped **certifications** (NIST CMVP, ACVP, Common Criteria).

CSV columns include:

- `libraryRefs` — semicolon-separated `referenceId` values (must exist in library CSV)
- `timelineRefs` — semicolon-separated timeline event IDs
- `industries` — semicolon-separated industry names
- `countries` — semicolon-separated country codes

### How to Update

**Frameworks** (CSV):

```bash
cp src/data/compliance_02262026.csv src/data/compliance_03012026.csv
# Edit new file
npm run build && npm run test
```

**Certifications** (JSON — automated):

```bash
npm run scrape    # Re-scrapes NIST CMVP, ACVP, BSI, ANSSI, Common Criteria
# Also runs daily in CI via update-compliance.yml workflow
```

**After any migrate CSV change**, regenerate the certification xref:

```bash
python3 scripts/match_certifications.py
```

### Links to Other Pages

- **Library**: `libraryRefs` column → `/library?ref=ID`
- **Timeline**: `timelineRefs` column → `/timeline?country=X`
- **Assess**: Step 5 of the wizard reads compliance frameworks filtered by the wizard's selected `industry` and `country`

### Stores

- `usePersonaStore.selectedIndustries`, `selectedRegion` — preset filters on load

---

## 8 — Migrate (`/migrate`)

### Components

- `src/components/Migrate/MigrateView.tsx`
- `src/components/Migrate/SoftwareTable.tsx` — product table with expanded certification row
- `src/components/Migrate/InfrastructureStack.tsx` — visual layer stack

### Data Sources

| File                                                                  | Loader                              | Notes                                  |
| --------------------------------------------------------------------- | ----------------------------------- | -------------------------------------- |
| `src/data/quantum_safe_cryptographic_software_reference_MMDDYYYY.csv` | `src/data/migrateData.ts`           | `softwareName` is sacred               |
| `src/data/migrate_certification_xref_MMDDYYYY.csv`                    | `src/data/certificationXrefData.ts` | Generated by `match_certifications.py` |

7 infrastructure layers + Web Browsers category. `migration_phases` column enables phase-based filtering. FIPS badge: `Validated` (green), `Partial` (amber), `No` (gray).

### How to Update

```bash
# 1. Copy CSVs
cp src/data/quantum_safe_cryptographic_software_reference_03262026.csv \
   src/data/quantum_safe_cryptographic_software_reference_04012026.csv
cp src/data/migrate_certification_xref_02242026.csv \
   src/data/migrate_certification_xref_04012026.csv

# 2. Edit the migrate CSV (softwareName must not change)

# 3. Regenerate certification xref
python3 scripts/match_certifications.py
# Add new entries to MATCH_RULES in match_certifications.py for new products

# 4. Restart dev server; build and test
npm run build && npm run test

# 5. Rebuild RAG corpus
npm run generate-corpus
```

### Links to Other Pages

- **Assess / Report**: Products shown for selected industry in report output
- **Learn modules**: `learningModules` column (pipe-separated module IDs) — modules show "View products" links
- **Compliance**: Expanded product row shows FIPS/ACVP/CC certifications from `compliance-data.json`

### Stores

- `useMigrateSelectionStore` (persisted v2): `activeLayer`, `activeSubCategory`, `hiddenProducts[]`

---

## 9 — Assess & Report (`/assess`, `/report`)

### Components

- `src/components/Assess/AssessView.tsx` — 14-step wizard
- `src/components/Assess/ReportMethodologyModal.tsx` — info modal (explains scoring)
- `src/components/Report/ReportView.tsx` — results + printable PDF

### Data Sources

| Source                             | File                                  | How Used                              |
| ---------------------------------- | ------------------------------------- | ------------------------------------- |
| Step definitions, options, scoring | `src/data/industryAssessConfig.ts`    | TypeScript config — edit directly     |
| Industry presets                   | `src/data/pqcassessment_MMDDYYYY.csv` | Auto-discovered latest file           |
| Compliance frameworks              | `src/data/complianceData.ts`          | Step 5 — filtered by industry/country |
| Timeline deadlines                 | `src/data/timelineData.ts`            | Step 13 — country-aligned deadlines   |

### How to Update

| Change                    | How                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| Scoring weights           | Edit `industryAssessConfig.ts`                                          |
| Add/remove wizard options | Edit `industryAssessConfig.ts`                                          |
| Add industry preset       | Copy `pqcassessment_MMDDYYYY.csv` → new dated file                      |
| Add a wizard step         | Edit `AssessView.tsx`, bump `useAssessmentStore` version, add migration |

### Wizard Step Reference

| Step   | Field                               | Notes                                            |
| ------ | ----------------------------------- | ------------------------------------------------ |
| 0      | `assessmentMode`                    | quick / comprehensive                            |
| 1      | `industry`                          | drives compliance step filtering                 |
| 2      | `country`                           | drives timeline deadlines + compliance filtering |
| 3      | `currentCrypto[]`                   | worst-case not applicable; categories derived    |
| 4      | `dataSensitivity[]`                 | worst-case (max) scoring                         |
| 5      | `complianceRequirements[]`          | filtered by industry + country                   |
| 6      | `migrationStatus`                   | affects urgency scoring                          |
| 7      | `cryptoUseCases[]`                  | —                                                |
| 8      | `dataRetention[]`                   | worst-case (max) scoring                         |
| 9      | `credentialLifetime[]`              | —                                                |
| 10     | `infrastructure[]` + sub-categories | 7 layers                                         |
| 11     | `vendorDependency`                  | —                                                |
| 12     | `timelinePressure`                  | —                                                |
| 13     | Timeline / deadline review          | reads timeline data                              |
| Report | `lastResult`                        | computed risk score 0–100                        |

### Print/PDF Support

Key implementation details for the Report (`/report`):

- **Fixed header/footer**: `position: fixed; top:0 / bottom:0` — repeats on every page
- **Anti-clipping trick**: invisible `<table class="print-report-table">` with `<thead>` (14mm) and `<tfoot>` (10mm) that reserve per-page margin space
- **Screen-mode CSS**: `print-report-table` must use `display: block` on screen (never `display: none`) — hiding tbody would make report content invisible. Only `thead`/`tfoot` get `display: none` on screen.
- **Color**: `print-color-adjust: exact` forces background colors; CSS vars forced to light-mode
- **Page breaks**: `.glass-panel` gets `break-inside: avoid`; Threat Landscape gets `break-before: page`
- **CollapsibleSection**: uses `hidden print:block` pattern — always renders in print
- **MainLayout header/footer**: `print:hidden`

### Links to Other Pages

- Completes to `/report` on wizard finish
- Report includes "Explore Migrate" buttons → `/migrate?industry=X`
- Methodology modal explains cross-links to timeline and compliance data

### Stores

- `useAssessmentStore` (v7) — all wizard state
- `usePersonaStore` — seeds industry/region into wizard
- `useHistoryStore` — logs `assessment_started` / `assessment_completed`

---

## 10 — Learn (`/learn/*`)

### Components

- `src/components/PKILearning/PKILearningView.tsx` — routing shell
- `src/components/PKILearning/modules/` — 25 module directories (TypeScript React)
- `src/components/PKILearning/moduleData.ts` — module catalog (metadata, ordering)

### Data Sources

| Source         | File                                       | Notes                                 |
| -------------- | ------------------------------------------ | ------------------------------------- |
| Module content | `src/components/PKILearning/modules/`      | TypeScript components — edit directly |
| Module catalog | `src/components/PKILearning/moduleData.ts` | Module metadata, ordering, tags       |
| Quiz questions | `src/data/pqcquiz_MMDDYYYY.csv`            | 470+ questions, 32 categories         |
| Quiz loader    | `src/data/quizDataLoader.ts`               | Auto-discovers latest dated CSV       |

### 25 Modules (as of v1.31)

`pqc-101`, `quantum-threats`, `hybrid-crypto`, `crypto-agility`, `tls-basics`, `vpn-ssh-pqc`, `email-signing`, `pki-workshop`, `key-management`, `stateful-signatures`, `digital-assets`, `5g-security`, `digital-id`, `entropy-randomness`, `merkle-tree-certs`, `qkd`, `vendor-risk`, `compliance-strategy`, `migration-program`, `pqc-risk-management`, `pqc-business-case`, `pqc-governance`, `code-signing`, `api-security-jwt`, `iot-ot-pqc`

### How to Update

**Quiz questions**:

```bash
cp src/data/pqcquiz_03232026.csv src/data/pqcquiz_04012026.csv
# Edit new file
# Restart dev server
npm run generate-corpus   # quiz indexed in RAG
```

**Module content**: Edit TypeScript files directly in `modules/{module-id}/`.

**Add a new module**:

1. Create `src/components/PKILearning/modules/my-module/` with `index.tsx` (intro), `components/`, `flows/`, etc.
2. Register in `src/components/PKILearning/moduleData.ts` with ID, title, description, tags
3. Add quiz questions to `pqcquiz_MMDDYYYY.csv` with matching category
4. Run `npm run generate-corpus` (module summaries + content indexed in RAG)
5. Tag relevant library items via `library.moduleIds`; tag relevant migrate products via `migrate.learningModules`

### Links to Other Pages

- **Library**: "Explore documents" → `/library?moduleIds=module-id`
- **Migrate**: "View products" → `/migrate` (with module-tagged products)
- **Threats**: Industry-specific modules link → `/threats?industry=X`
- **Quiz**: "Take quiz" → `/learn/quiz?category=IDs`

### Stores

- `useModuleStore` (v5) — progress tracking, artifacts, quiz mastery
- `usePersonaStore` — `experienceLevel` adapts module recommendations

---

## 11 — Threats (`/threats`)

### Components

- `src/components/Threats/ThreatsDashboard.tsx`

### Data Sources

| File                                                   | Loader                    | Notes                |
| ------------------------------------------------------ | ------------------------- | -------------------- |
| `src/data/quantum_threats_hsm_industries_MMDDYYYY.csv` | `src/data/threatsData.ts` | `threatId` is sacred |

CSV columns: `industry`, `threatId`, `description`, `criticality`, `cryptoAtRisk`, `pqcReplacement`, `mainSource`, `sourceUrl`, `accuracyPct`, `relatedModules`

`relatedModules` is pipe-separated module IDs (e.g. `pqc-101|quantum-threats`).

**Archived docs**: `public/threats/` (named `{INDUSTRY_CODE}-{NUMBER}.{html|pdf}`)

### How to Update

```bash
cp src/data/quantum_threats_hsm_industries_02282026.csv \
   src/data/quantum_threats_hsm_industries_04012026.csv
# Edit — NEVER change threatId values
npm run generate-corpus
npm run build && npm run test
```

**Download new threat docs**:

```bash
npm run download:threats
npm run download:threats:dry   # preview
```

### Links to Other Pages

- **Learn modules**: `relatedModules` column → "Learn more" buttons

### Cross-Reference Warning

`threatId` values are referenced by Learn module data as cross-links. **Never change a threatId.**

### Stores

- `usePersonaStore.selectedIndustries` — presets industry filter

---

## 12 — Algorithms (`/algorithms`)

### Components

- `src/components/Algorithms/AlgorithmsView.tsx`

### Data Sources

| File                                                     | Loader                          |
| -------------------------------------------------------- | ------------------------------- |
| `src/data/pqc_complete_algorithm_reference_MMDDYYYY.csv` | `src/data/pqcAlgorithmsData.ts` |
| `src/data/algorithms_transitions_MMDDYYYY.csv`           | `src/data/algorithmsData.ts`    |

Both loaders use `import.meta.glob` for auto-discovery of dated files.

### How to Update

```bash
cp src/data/pqc_complete_algorithm_reference_02262026.csv \
   src/data/pqc_complete_algorithm_reference_04012026.csv
cp src/data/algorithms_transitions_02262026.csv \
   src/data/algorithms_transitions_04012026.csv
# Edit new files
npm run generate-corpus
npm run build && npm run test
```

### Links to Other Pages

- **Landing**: Algorithm count shown in stats bar (computed from loader)
- **Playground**: `?algo=ML-KEM` deep-link opens algorithm in Playground
- **Learn modules**: `?highlight=ML-KEM,ML-DSA` highlights specific algorithms

### Stores

No persisted store. URL params only.

---

## 13 — Playground (`/playground`)

### Components

- `src/components/Playground/PlaygroundView.tsx`
- `src/components/Playground/keystore/KeyGenerationSection.tsx`
- `src/components/Playground/tabs/` — KEM and Signature tabs

### Data Sources

No CSV files. All computation runs live via:

- **OpenSSL WASM v3.6.0** (via `OpenSSLService`)
- **`@oqs/liboqs-js` v0.15.1** (PQC algorithms)
- **ACVP test vectors**: `src/data/acvp/*.json`

**BIKE is not available** in `@oqs/liboqs-js` v0.15.1 — no browser WASM package exposes it yet.

### How to Update

| Change                          | How                                                                 |
| ------------------------------- | ------------------------------------------------------------------- |
| Update liboqs algorithm support | Upgrade `@oqs/liboqs-js` in `package.json`; check API compatibility |
| Add ACVP test vectors           | Add/edit JSON files in `src/data/acvp/`                             |
| Add a new KEM/Signature tab     | Create component in `tabs/`, register in `PlaygroundView`           |

### WASM Requirements

- `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers required (set in `vite.config.ts`)
- Pre-built WASM files copied from `@oqs/liboqs-js` to `public/dist` by the `predev` and `build` scripts

### Links to Other Pages

- **Landing**: "Test" journey step
- **Learn modules**: `?algo=ML-KEM` deep-link from module pages
- **Algorithms**: Algorithm view links to Playground for live testing

---

## 14 — OpenSSL Studio (`/openssl`)

### Components

- `src/components/OpenSSLStudio/OpenSSLStudioView.tsx`

### Data Sources

| File                            | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `src/data/openssl_docs_map.csv` | Maps OpenSSL commands to documentation links |
| OpenSSL WASM v3.6.0             | Executes commands in-browser                 |

### How to Update

- **New commands**: edit `openssl_docs_map.csv`
- **OpenSSL version upgrade**: update WASM build artifacts in `public/`
- Command history is session-only (not persisted to localStorage)

### Links to Other Pages

- **Landing**: "Test" journey step
- **Learn modules**: `?cmd=category` deep-link from module pages

---

## 15 — Leaders (`/leaders`)

### Components

- `src/components/Leaders/LeadersGrid.tsx`

### Data Sources

| File                            | Loader                    |
| ------------------------------- | ------------------------- |
| `src/data/leaders_MMDDYYYY.csv` | `src/data/leadersData.ts` |

CSV columns: `name`, `title`, `organizations[]`, `country`, `type` (Public/Private/Academic), `bio`, `category`

### How to Update

```bash
cp src/data/leaders_02252026.csv src/data/leaders_04012026.csv
# Edit new file
npm run generate-corpus
npm run build && npm run test
```

### Links to Other Pages

- **Landing**: "Stay Agile" journey step
- **Threats**: Industry profiles may reference leader organizations

### URL Deep-links

`?country=USA`, `?sector=Public|Private|Academic`, `?q=SearchTerm`, `?leader=LeaderName`

---

## 16 — Data Maintenance Quick Reference

> For detailed CSV procedures (operation steps, parser details, pitfall table, web source workflow, cross-reference dependency map), see [`CSVmaintenance.md`](CSVmaintenance.md). This section covers only the **non-CSV triggers** and a quick command cheat sheet.

### When to Run What

| Trigger                                   | Command                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Any CSV changed                           | Follow [`CSVmaintenance.md`](CSVmaintenance.md) §3 + §6                     |
| After any data source change              | `npm run generate-corpus` (or `npm run build`, which runs it automatically) |
| Migrate or compliance CSV changed         | `python3 scripts/match_certifications.py` (then rebuild corpus)             |
| NIST / ACVP / CC certification data stale | `npm run scrape`                                                            |
| Library reference docs outdated           | `npm run download:library`                                                  |
| Timeline source docs outdated             | `npm run download:timeline`                                                 |
| Threat source docs outdated               | `npm run download:threats`                                                  |
| New persisted store field added           | Bump store `version` + add `migrate()` step (see §3.9)                      |
| New RAG data source added                 | Extend `scripts/generate-rag-corpus.ts` (see §2.2)                          |
| Query expansion missing                   | Add entry to `QUERY_EXPANSIONS` in `RetrievalService.ts` (see §2.3)         |
| AI model change                           | Update default in `useChatStore` + endpoint in `GeminiService` (see §2.4)   |
