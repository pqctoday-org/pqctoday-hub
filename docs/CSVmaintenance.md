# CSV Maintenance Guide

This guide covers the versioned CSV data system used across the PQC Timeline App. Follow these procedures for all CSV modifications to ensure stable, predictable updates.

## 1. How It Works

### Versioning

Every CSV file uses the naming convention `{prefix}_{MMDDYYYY}.csv` (e.g., `library_02222026.csv`). **Never edit a CSV in place** — always copy to a new file with today's date.

### Loader Architecture

Each CSV has a dedicated loader in `src/data/`. Loaders use Vite's `import.meta.glob` with `eager: true` and `query: '?raw'` to discover all matching files at build time, extract the `MMDDYYYY` date from each filename, sort descending, and select:

- **Current** = latest file (drives all UI data)
- **Previous** = second-latest file (drives `New`/`Updated` status badges)

### Status Tracking

`compareDatasets()` in `src/utils/dataComparison.ts` compares current vs previous CSV by a unique ID field:

- Record ID **not in previous** → status = `New`
- Record ID **exists but any field changed** → status = `Updated`
- Record ID **in previous but not in current** → **silently removed** (no "Deleted" status)
- Skipped fields: the ID field itself, `children`, `status`

### Archive

Keep at least **2 versions** in `src/data/` for status comparison. Move older files to `src/data/archive/`.

---

## 2. CSV Inventory

| CSV Prefix                                        | Loader                        | ID Field                            | Status Tracked | Key Consumers                                                             |
| ------------------------------------------------- | ----------------------------- | ----------------------------------- | -------------- | ------------------------------------------------------------------------- |
| `library_*`                                       | `libraryData.ts`              | `referenceId`                       | Yes            | LibraryView, ModuleReferencesTab, ComplianceLandscape (via `libraryRefs`) |
| `timeline_*`                                      | `timelineData.ts`             | composite `country:org:phase:title` | Yes            | TimelineView, SimpleGanttChart, DocumentTable, AssessReport (Step 13)     |
| `leaders_*`                                       | `leadersData.ts`              | `name`                              | Yes            | LeadersGrid, LeaderCard                                                   |
| `quantum_threats_hsm_industries_*`                | `threatsData.ts`              | `threatId`                          | Yes            | ThreatsDashboard, AssessReport, useExecutiveData                          |
| `quantum_safe_cryptographic_software_reference_*` | `migrateData.ts`              | `softwareName`                      | Yes            | SoftwareTable, InfrastructureStack, useExecutiveData                      |
| `compliance_*`                                    | `complianceData.ts`           | `id`                                | No             | ComplianceLandscape, AssessWizard (Step 5), useAssessmentEngine           |
| `pqcassessment_*`                                 | `industryAssessConfig.ts`     | `category` + `id`                   | No             | AssessWizard (Steps 4-8), useAssessmentEngine                             |
| `pqcquiz_*`                                       | `quizDataLoader.ts`           | `id`                                | No             | Quiz module                                                               |
| `algorithms_transitions_*`                        | `algorithmsData.ts`           | implicit (classical algo name)      | No             | AlgorithmComparison                                                       |
| `pqc_complete_algorithm_reference_*`              | `pqcAlgorithmsData.ts`        | implicit (algorithm name)           | No             | AlgorithmComparison, InteractivePlayground                                |
| `pqc_authoritative_sources_reference_*`           | `authoritativeSourcesData.ts` | `sourceName`                        | No             | SourcesModal                                                              |
| `pqc_software_category_priority_matrix`           | `migrationWorkflowData.ts`    | N/A (static, no date stamp)         | No             | MigrationRoadmap                                                          |

---

## 3. Operation Procedures

### 3.1 Record Update (modifying existing rows)

1. Copy latest CSV to a new file with today's date:
   ```bash
   cp src/data/library_02222026.csv src/data/library_02232026.csv
   ```
2. Edit the **new** file — change field values on existing rows.
3. **Do NOT change the ID field value** (`referenceId`, `threatId`, `name`, `softwareName`, etc.). Changing an ID causes the old record to vanish and a new one to appear as `New`.
4. If the loader has status tracking, the modified item will automatically show an `Updated` badge.
5. If the item has cross-references (see §5), verify referenced IDs still exist in target CSVs.
6. Run the verification checklist (§6).

### 3.2 Record Insertion (adding new rows)

1. Copy latest CSV to a new date-stamped file.
2. Add new row(s). Position does not matter but appending to the end is conventional.
3. Assign a **unique ID** — check existing values to avoid duplicates:
   ```bash
   grep -c "^" src/data/library_02222026.csv   # row count
   grep "YOUR-ID" src/data/library_02222026.csv # check uniqueness
   ```
4. Fill **ALL columns**. Loaders expect a consistent column count per row. Use empty string (`""`) for fields with no value.
5. Multi-value fields use **semicolon** delimiters: `"Finance;Healthcare;Government"`.
6. If the loader has status tracking, new items automatically show a `New` badge.
7. If adding cross-references (`libraryRefs`, `timelineRefs`, `moduleIds`, `dependencies`), verify target IDs exist in their respective CSVs.
8. Run the verification checklist (§6).

### 3.3 Record Deletion (removing rows)

1. Copy latest CSV to a new date-stamped file.
2. Remove the row(s).
3. **Critical**: `compareDatasets()` has **no "Deleted" detection**. Items simply disappear from the data array and UI with no notification.
4. **Check cross-references before deleting** — search all CSVs for the ID being removed:
   ```bash
   # Example: deleting library item with referenceId "NIST-FIPS-203"
   grep -r "NIST-FIPS-203" src/data/*.csv
   ```
   Specifically check:
   - `compliance_*.csv` → `libraryRefs` and `timelineRefs` columns
   - `library_*.csv` → `dependencies` column (parent-child tree)
   - `library_*.csv` → `moduleIds` column (learning module links)
5. Remove or update any dangling references found in step 4.
6. Run the verification checklist (§6).

### 3.4 Format Change (adding, removing, or renaming columns)

1. Copy latest CSV to a new date-stamped file.
2. Make column changes in the CSV.

#### Adding a column

3. Update the TypeScript **interface** in the loader file (e.g., add a field to `LibraryItem` in `libraryData.ts`).
4. Update the **parse function** to extract the new column. Most loaders use positional indexing (`fields[N]`), so the new column must go at the end or all indices after the insertion point must be updated.
5. If this is a status-tracked loader: backfill the new column in the **previous** CSV version (the second-latest file), or handle `undefined` gracefully in the parser. Otherwise `compareDatasets()` will mark every record as `Updated` because the new field is `undefined` in previous but populated in current.
6. Update consumer components that should display the new field.

#### Removing a column

3. Remove the field from the TypeScript **interface**.
4. Update the **parse function** — adjust positional column indices for all fields after the removed column.
5. Search for all usages of the removed field across consumers:
   ```bash
   grep -r "fieldName" src/components/ src/hooks/
   ```
6. Remove or update all consumer references.

#### Renaming a column

3. Treat as **remove + add**: update the interface, parser, and all consumers.
4. If the renamed column is the **ID field**, this is a **breaking change**:
   - Update the `compareDatasets()` call in the loader to use the new field name.
   - Update the previous CSV to use the new column header (or status tracking will mark every record as `New`).

5. Run the verification checklist (§6).

---

## 4. Parser Details

| Parser Type                      | Used By                                                                                                         | Notes                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Custom quote-aware inline parser | library, leaders, threats, compliance, assessment, quiz, algorithms, algorithm reference, authoritative sources | Handles commas inside quoted fields. Does **not** handle escaped quotes (`""`) or line breaks within fields. |
| PapaParse (`header: true`)       | migrateData.ts (software)                                                                                       | Full RFC 4180 compliance. Handles escaped quotes, line breaks in fields, edge cases.                         |
| `parseTimelineCSV` utility       | timelineData.ts                                                                                                 | Shared parser in `src/utils/csvParser.ts`.                                                                   |

**Field delimiter conventions:**

- **Comma** `,` — column separator (standard CSV)
- **Semicolon** `;` — multi-value fields (`industries`, `countries`, `libraryRefs`, `timelineRefs`)
- **Pipe** `|` — multi-select quiz answers (`correctAnswer` in quiz CSV)
- **Empty fields** — use `""` (empty quoted string), never omit the delimiter

---

## 5. Cross-CSV Dependency Map

```
compliance.libraryRefs       ──→ library.referenceId
compliance.timelineRefs      ──→ timeline event IDs (country:org:phase:title)
library.dependencies         ──→ library.referenceId  (parent-child tree)
library.moduleIds            ──→ PKI Learning module IDs (hardcoded in learn components)
industryAssessConfig         ──→ compliance.id  (via complianceDB re-export)
AssessReport                 ──→ threatsData (all), timelineData (country filter)
useExecutiveData             ──→ algorithmsData (count), threatsData (count),
                                 complianceFrameworks (count), softwareData (count)
personaConfig                ──→ threatsData.industry values (INDUSTRY_TO_THREATS_MAP)
```

**Impact matrix — what breaks when you change an ID:**

| Changed ID In         | Breaks                                                               |
| --------------------- | -------------------------------------------------------------------- |
| `library.referenceId` | `compliance.libraryRefs`, `library.dependencies` tree, status badges |
| `compliance.id`       | Assessment wizard compliance step, `complianceDB` lookups            |
| `threats.threatId`    | Assessment report threat appendix, status badges                     |
| `timeline` event IDs  | `compliance.timelineRefs`, Gantt chart status badges                 |
| `leaders.name`        | Status badges (name is the ID key)                                   |
| `softwareName`        | Migrate view, executive dashboard count, status badges               |

---

## 6. Verification Checklist

After **any** CSV change, run these steps in order:

1. **Build** — ensures CSV is discovered and parsed (glob is eager, errors surface at build):
   ```bash
   npm run build
   ```
2. **Lint** — catches TypeScript interface mismatches if loader/interface was updated:
   ```bash
   npm run lint
   ```
3. **Test** — runs loader unit tests (`libraryData.test.ts`, `timelineData.test.ts`, `threatsData.test.ts`, etc.):
   ```bash
   npm run test
   ```
4. **Visual check** — start dev server and navigate to the affected view:

   ```bash
   npm run dev   # http://localhost:5175
   ```

   - Verify data renders (no empty states or missing rows)
   - Verify `New`/`Updated` badges appear correctly (status-tracked CSVs only)
   - Check cross-referencing views (e.g., Compliance → Library links, Assessment report)

5. **Console check** — open browser DevTools console. Look for `warn` messages about missing CSV files or parse errors.

---

## 7. Common Pitfalls

| Pitfall                                  | Why It Breaks                                                                      | Prevention                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Editing a CSV in place                   | Overwrites history, loses previous version for status tracking                     | Always copy to new date-stamped file                                               |
| Changing an ID field value               | Old record vanishes, new record appears as `New`, cross-references break           | Never modify `referenceId`, `threatId`, `name`, `softwareName`, `id` values        |
| Wrong date format                        | Loader regex rejects the file silently                                             | Use `MMDDYYYY` — not `YYYYMMDD`, `DDMMYYYY`, or `MM-DD-YYYY`                       |
| Inconsistent column count                | Positional parsers map wrong values to wrong fields                                | Always fill ALL columns; use `""` for empty                                        |
| Unescaped commas in data                 | Field splits incorrectly, shifts all subsequent columns                            | Wrap any field containing commas in double quotes                                  |
| Dangling cross-references                | UI shows broken links or missing data in related views                             | Grep all CSVs for the ID before deleting any record                                |
| Too few versions in `src/data/`          | Status tracking (`New`/`Updated`) stops working                                    | Keep at least 2 dated versions; archive older ones to `src/data/archive/`          |
| Filename suffix (e.g., `_v2`, `_backup`) | Some loaders use strict regex that rejects suffixed files (compliance, assessment) | Never add suffixes — only `{prefix}_{MMDDYYYY}.csv`                                |
| Adding column without backfill           | Every record shows `Updated` badge because new field is undefined in previous CSV  | Backfill the new column in the previous CSV version, or handle undefined in parser |

---

## 8. Checking Web Sources for Updates

CSV data originates from trusted web sources (NIST, ANSSI, BSI, IETF, etc.). This section defines how to check those sources, validate URLs, and manage changes.

### 8.1 Trusted Source Registry

The authoritative sources are catalogued in `pqc_authoritative_sources_reference_*.csv` (`src/data/`). Each entry includes:

- `Primary_URL` — the canonical URL to check for updates
- `Last_Verified_Date` — when the URL and data were last confirmed accurate
- Boolean flags (`Leaders_CSV`, `Library_CSV`, `Algorithm_CSV`, `Threats_CSV`, `Timeline_CSV`) — which CSVs the source feeds into

**Key government sources to check regularly:**

| Source               | URL                                                                      | Feeds Into                             |
| -------------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| NIST CSRC PQC        | <https://csrc.nist.gov/projects/post-quantum-cryptography>               | library, algorithms, timeline, threats |
| NIST FIPS Repository | <https://csrc.nist.gov/publications/fips>                                | library, algorithms                    |
| NIST IR Publications | <https://csrc.nist.gov/publications/search>                              | library, algorithms, threats           |
| NSA CNSA 2.0         | <https://www.nsa.gov/Press-Room/Cybersecurity-Advisories-Guidance/>      | library, threats, timeline             |
| CISA Quantum         | <https://www.cisa.gov/quantum>                                           | library, threats, timeline             |
| BSI PQC (Germany)    | <https://www.bsi.bund.de/>                                               | library, threats, timeline             |
| ANSSI (France)       | <https://www.ssi.gouv.fr/en/>                                            | library, threats, timeline             |
| NCSC UK Quantum      | <https://www.ncsc.gov.uk/collection/quantum>                             | library, threats, timeline             |
| ENISA PQC (EU)       | <https://www.enisa.europa.eu/topics/quantum-computing>                   | library, threats, timeline             |
| IETF Datatracker     | <https://datatracker.ietf.org/>                                          | library, algorithms, leaders           |
| CMVP Validation      | <https://csrc.nist.gov/projects/cryptographic-module-validation-program> | library, algorithms                    |

### 8.2 Update Workflow

When checking a web source and finding new or updated information:

#### Step 1 — Verify the source

1. Confirm the URL is reachable and still points to the expected content.
2. If the URL has changed (redirect or restructured site), update the `Primary_URL` in `pqc_authoritative_sources_reference` CSV.
3. Update the `Last_Verified_Date` to today.

#### Step 2 — Identify what changed

1. Compare the source content against the current CSV data.
2. Classify each change:
   - **New publication/standard/leader** → record insertion (§3.2)
   - **Updated deadline/status/description** → record update (§3.1)
   - **Withdrawn/superseded document** → record deletion (§3.3) or status update
   - **New data field needed** → format change (§3.4)

#### Step 3 — Record the change context

Before modifying any CSV, document the change in the git commit message with:

- **Source**: which website/document prompted the change
- **Source URL**: direct link to the specific page, publication, or announcement
- **Date observed**: when you found the update
- **What changed**: brief description (e.g., "NIST published FIPS 206 final")

Example commit message:

```text
feat(data): add FIPS 206 to library, update timeline for NIST

Source: NIST CSRC (https://csrc.nist.gov/publications/fips)
Observed: 2026-02-22
Change: FIPS 206 (ML-DSA) published as final standard
```

#### Step 4 — Apply changes to affected CSVs

A single source update may affect **multiple CSVs**. Use the boolean flags in `pqc_authoritative_sources_reference` to identify which:

| If source feeds into... | Apply change to...                                                         |
| ----------------------- | -------------------------------------------------------------------------- |
| `Library_CSV = Yes`     | `library_*.csv` — add/update document entry                                |
| `Timeline_CSV = Yes`    | `timeline_*.csv` — add/update regulatory event                             |
| `Threats_CSV = Yes`     | `quantum_threats_hsm_industries_*.csv` — update threat assessment          |
| `Leaders_CSV = Yes`     | `leaders_*.csv` — add/update person or organization                        |
| `Algorithm_CSV = Yes`   | `algorithms_transitions_*.csv` or `pqc_complete_algorithm_reference_*.csv` |

Follow the operation procedure for each affected CSV (§3.1–§3.4).

#### Step 5 — Update the changelog

Add an entry to the app's changelog (version bump) describing what data was refreshed and from which source.

#### Step 6 — Verify

Run the full verification checklist (§6) for **all** modified CSVs.

### 8.3 URL Validation

When adding or updating URLs in CSV data (`downloadUrl`, `sourceUrl`, `primaryUrl`):

1. **Verify the URL loads** — open it in a browser and confirm it returns the expected content (not a 404, login wall, or redirect to a generic page).
2. **Prefer canonical URLs** — use the publisher's official permalink, not a shortened or third-party mirror link.
3. **Prefer HTTPS** — all URLs should use `https://`. Reject `http://` unless the source genuinely has no TLS.
4. **Avoid deep-linked PDFs** — if a PDF URL is likely to change (e.g., includes version numbers or session tokens), link to the landing page that hosts the PDF instead.
5. **Check for DOI** — for academic publications, prefer DOI links (`https://doi.org/...`) as they are permanent.
6. **Escape special characters** — if the URL contains commas, wrap the entire field in double quotes in the CSV.

### 8.4 Handling Clarifications

When a source is ambiguous or conflicts with existing data:

1. **Do not guess** — if a publication date, algorithm parameter, or compliance deadline is unclear, note it and defer.
2. **Cross-reference** — check at least one additional authoritative source to confirm the information.
3. **Flag in commit** — if uncertain, add `[NEEDS VERIFICATION]` to the CSV field value and note it in the commit message.
4. **Track open questions** — add a comment in the PR or issue tracker describing what needs clarification and from which source.

### 8.5 Automated Scraping (Compliance Only)

The compliance data has an automated scraping workflow:

- **Script**: `scripts/scrape-compliance.ts`
- **CI**: `update-compliance.yml` runs daily at 8 AM UTC
- **Output**: `public/data/compliance-data.json` (runtime fetch)
- **Note**: The `compliance_*.csv` is manually maintained separately. The scraper supplements but does not replace the CSV. Both must be kept in sync when compliance frameworks change.
