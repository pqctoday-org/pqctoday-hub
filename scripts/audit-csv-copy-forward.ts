#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-csv-copy-forward.ts
 *
 * Catches SILENT ROW LOSS between two generations of a dated CSV.
 *
 * THE FAILURE MODE THIS EXISTS FOR (near-miss, 2026-08-14):
 *   This repo versions data as dated generations — library_08122026_r2.csv,
 *   library_08132026.csv, library_08142026.csv — and every loader picks the
 *   NEWEST by (date, revision) and ignores the rest (src/data/csvUtils.ts
 *   sortCSVFiles(), lines 112-143). Two sessions each produced a new
 *   generation: one added two rows to library_08132026.csv, the other wrote
 *   library_08142026.csv from an older base without them. Because the two
 *   generations are DIFFERENT FILENAMES, git merges both cleanly with no
 *   conflict; the app then reads only the newest, and the two rows are gone.
 *   No conflict, no error, no test failure, no signal of any kind. It was
 *   caught by a human asking the right question.
 *
 * THE RULE ENFORCED:
 *   For every dated-CSV family, every ACTIVE row in the previous generation
 *   must still be present in the newest generation — matched by the family's
 *   own primary key. An active row may legitimately CHANGE, and it may
 *   legitimately be DEPRECATED (status=deprecated, which keeps the row), but
 *   it may not simply VANISH. Deletion is not how this repo retires records:
 *   deprecation is (see the status/deprecated_at/deprecated_reason column
 *   triple carried by most families). A row that is already deprecated in the
 *   previous generation is exempt — pruning retired rows is normal.
 *
 *   A genuinely intended removal is expressed by adding an entry to
 *   RECORDED_REMOVALS below, which forces a human to write down a reason.
 *   That is the escape hatch; disabling the gate is not.
 *
 * WHAT IS DERIVED, NOT ASSUMED:
 *   · Families        — by stripping the dated suffix, using the SAME
 *                       csvPrefix() the archival gate already uses.
 *   · Precedence      — delegated to the app's own sortCSVFiles(): date
 *                       DESC, then revision DESC, so library_08132026_r6.csv
 *                       outranks library_08132026.csv and _r24 outranks _r9.
 *   · Primary keys    — derived per family from the data: an identifier-
 *                       looking column, else the shortest leading run of
 *                       columns, that is unique in the previous generation.
 *                       Key names differ wildly across these sources
 *                       (reference_id, product_id, code, Name, href,
 *                       sector_key, and several composites), so nothing is
 *                       hard-coded.
 *   · Active          — from the row's own status/deprecated_at columns when
 *                       the family carries them; active by default otherwise.
 *
 * SCOPE:
 *   Families with at least one generation in src/data/ — i.e. the ones a
 *   loader can actually serve. The PREVIOUS generation may live in
 *   src/data/archive/ (the archival gate keeps only 2 live copies), so both
 *   directories are read. Families that exist only in archive/ are retired
 *   and are not checked. Families whose loader MERGES every generation are
 *   out of scope entirely — see MERGE_ALL_FAMILIES below for why the rule
 *   cannot apply to them.
 *
 * Usage:
 *   npx tsx scripts/audit-csv-copy-forward.ts             # human report
 *   npx tsx scripts/audit-csv-copy-forward.ts --verbose   # + per-family detail
 *   npx tsx scripts/audit-csv-copy-forward.ts --json      # machine-readable
 *
 * Exit codes:
 *   0 — every active row in each previous generation survived into the newest
 *   1 — one or more active rows disappeared without a recorded reason
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { csvPrefix } from './audit-csv-archival'
import { MERGE_ALL_SOURCES } from './audit-merge-all-coverage'
import { sortCSVFiles } from '../src/data/csvUtils'

// ---------------------------------------------------------------------------
// MERGE-ALL FAMILIES — where the copy-forward rule does not apply at all.
//
// This gate's whole premise is "the app serves only the newest generation", so
// a row absent from it is a row nobody can see. A handful of sources
// deliberately break that premise: their loader globs EVERY dated file (and
// src/data/archive/ too) and merges them, because each run appends a file
// covering DIFFERENT subjects rather than restating the previous one. For
// those, an older generation is not superseded — it is still being served, in
// full, right now. Judging them by copy-forward reports every subject the
// newest run happened not to cover as lost, which is the exact opposite of the
// truth. That false positive was live: on 2026-08-14 this gate reported 166
// active CSWP.39 governance requirements across 26 frameworks (CISA, OMB
// M-26-15, ENISA, CMMC, ...) as lost between the 08-08 and 08-09 generations.
// They were never lost: maturityGovernanceData.ts merges both files, and
// complianceData.test.ts asserts a corpus floor (>100 ref_ids) that the 08-09
// file alone (48) cannot possibly satisfy.
//
// The list is NOT restated here. It is imported from audit-merge-all-coverage's
// own registry — the single place this repo already records "which loaders
// merge every generation", and the gate that fails if one of them stops
// globbing a directory. One truth, two consumers; a new merge-all source
// registered there is picked up here with no second edit.
//
// These families are reported as SKIPPED, never silently dropped: a guard that
// quietly stops checking something is how the loss it guards against returns.
// ---------------------------------------------------------------------------
const MERGE_ALL_FAMILIES = new Set(
  MERGE_ALL_SOURCES.filter((s) => s.ext === '.csv').map((s) => s.prefix)
)

// ---------------------------------------------------------------------------
// RECORDED REMOVALS — the ONLY way an active row may legitimately disappear.
//
// Add an entry here after human confirmation, with a real reason. Empty by
// design: an unexplained absence is the failing case, and it should stay hard
// to explain one away. `key` is the exact key string the report prints.
// Format: { family: 'library_', key: 'REF-123', reason: '...', recorded: 'YYYY-MM-DD' }
// ---------------------------------------------------------------------------
export interface RecordedRemoval {
  family: string
  key: string
  reason: string
  recorded: string
}

// ---------------------------------------------------------------------------
// DERIVED FAMILIES — where a removal is explained by a RULE, not one-by-one.
//
// A file that is GENERATED from other CSVs loses rows for a reason its
// generator already states, and that reason is a rule rather than an incident.
// trusted_source_xref_ is the case in point: its generator skips any source row
// whose status is `deprecated` (generate-trusted-source-xref.mjs, added
// 2026-07-16 in bd67d7538, because a deprecated row can share its id field with
// an active one and mint a duplicate composite key). Deprecating a library
// document therefore drops its xref rows BY DESIGN.
//
// Recording those one at a time would mean ~390 hand-written entries that say
// the same sentence, and each new deprecation would break the build until
// someone added another. Worse, the volume would bury the removals that are
// real: of 531 rows this family dropped between its two generations, 390 are
// this rule and 141 are genuine loss. A rule that explains 390 makes those 141
// visible instead of drowning them.
//
// The rule stays deliberately narrow: it excuses a removal ONLY when the target
// row is really gone or really deprecated in the newest generation of the
// source CSV. A dropped xref whose target is still active is still a failure.
// ---------------------------------------------------------------------------
export interface DerivedFamilyRule {
  /** Family prefix this rule applies to. */
  family: string
  /** Short phrase naming the rule, printed on excused keys in the report. */
  label: string
  /**
   * Given a missing key's parts (in `keyColumns` order), return a reason when
   * the removal is legitimate, or null to let it fail.
   */
  excuse(parts: string[], keyColumns: string[]): string | null
}

/**
 * resource_type -> the source CSV family and id column the xref generator
 * reads it from. Copied from generate-trusted-source-xref.mjs's own
 * `processCSV(prefix, resourceType, idField, ...)` calls, which is the only
 * authority on this mapping — inferring it by guessing which column looks like
 * a key gets `algorithm` wrong (it reads pqc_complete_algorithm_reference_,
 * keyed by `Algorithm`, not the transitions file).
 */
const XREF_SOURCE_OF: Record<string, { prefix: string; idField: string }> = {
  library: { prefix: 'library_', idField: 'reference_id' },
  threats: { prefix: 'quantum_threats_hsm_industries_', idField: 'threat_id' },
  timeline: { prefix: 'timeline_', idField: 'Title' },
  leaders: { prefix: 'leaders_', idField: 'Name' },
  compliance: { prefix: 'compliance_', idField: 'id' },
  migrate: { prefix: 'pqc_product_catalog_', idField: 'software_name' },
  algorithm: { prefix: 'pqc_complete_algorithm_reference_', idField: 'Algorithm' },
}

// The three reasons below are shared by several keys each; naming them keeps
// every entry readable without weakening the rule that each key is recorded
// deliberately, one at a time.

/** migrate_certification_xref_: PR #520 (3c4197f40) re-pointed the cross-
 *  reference onto the ids the CC scraper actually mints. PR #517 had
 *  recomputed each id by hashing the stored JSON's DERIVED fields, which
 *  cannot reproduce the scraper's source string -- zero of its 889 ids
 *  appeared among the 821 a real scrape produced. #520 remapped by IDENTITY
 *  (product name, vendor, scheme, date) onto the live scrape. Verified per
 *  key below: the row's (software_name, cert_type, cert_vendor, cert_product,
 *  cert_date) tuple is still present in _08112026_r2.csv, under a corrected
 *  cert_id. The certificate did not go anywhere; only its id did. */
const CERT_ID_REPOINTED_BY_PR520 =
  'cert_id re-pointed onto the id the CC scraper mints (PR #520, 3c4197f40); ' +
  'same certificate, verified present in _08112026_r2.csv by identity ' +
  '(software_name + cert_type + cert_vendor + cert_product + cert_date).'

/** migrate_certification_xref_: this product is Azure Dedicated HSM built on
 *  THALES LUNA 7 -- pqc_product_catalog_08132026.csv carries product_id
 *  azure-dedicated-hsm-marvell-liquidsecurity under the name "Azure Dedicated
 *  HSM (Thales Luna 7)" -- so Marvell LiquidSecurity's own FIPS/CC/ACVP
 *  certificates were never this product's to claim. The certificates
 *  themselves are untouched: they survive on "Marvell LiquidSecurity 2", the
 *  product that actually holds them. #520's identity remap dropped all 7 of
 *  this product's rows (3 active, recorded here; 4 already deprecated). Worth
 *  noting because the commit message claims "1,391 rows, none removed" and
 *  the file it wrote has 1,384 -- the removal was right, the accounting of it
 *  was not. */
const AZURE_MARVELL_CERT_MISMATCH =
  'mismatched certificate removed as a correction (PR #520, 3c4197f40): this ' +
  'product_id is Azure Dedicated HSM on Thales Luna 7, not Marvell hardware. ' +
  'The certificate survives on "Marvell LiquidSecurity 2", which holds it.'

/** migrate_purl_xref_: 6897eaaa9 corrected the catalog row to its real
 *  product name -- "sealsq-quantum-shield renamed to its real product name
 *  (Quantum Shield QS7001), propagated into the CPE/PURL xref CSVs" -- and
 *  this family is keyed by software_name, so a rename reads as a deletion.
 *  Verified: _07162026.csv carries "SEALSQ Quantum Shield QS7001", both
 *  generations hold exactly 800 rows, and the row's payload was a
 *  status=not_found placeholder with an empty purl either way. */
const SEALSQ_RENAMED_TO_QS7001 =
  'product renamed, not removed (6897eaaa9): the catalog row became "SEALSQ ' +
  'Quantum Shield QS7001" and the rename was propagated into this xref, ' +
  'which is keyed by software_name. Both generations hold 800 rows.'

/** industry_standards_: `standard_id` embeds the IETF draft revision, so a
 *  revision bump necessarily changes the primary key. These two rows were
 *  RE-IDENTIFIED from draft-16 to draft-19 when the composite-KEM draft
 *  advanced (same industry, same standard, same library_ref target) — they
 *  were not retired, and the -19 rows that replaced them are present and
 *  active in the same generation. Deprecating the -16 rows instead would
 *  assert a retirement decision that was never made, and would leave rows
 *  pointing at a library entry that is itself deprecated. */
const COMPOSITE_KEM_DRAFT_REVISION_BUMP =
  'standard_id embeds the IETF draft revision, so advancing composite-KEM from ' +
  '-16 to -19 necessarily changes the key. Rows re-identified, not removed: the ' +
  'replacement -19 rows are active in the same generation, same industry and ' +
  'same standard. Recorded 2026-08-18.'

/** industry_market_size_: keyed by `industry`, so a label rename reads as a
 *  deletion. f8e48c18b (WS-1, 2026-08-27) renamed 3 drifted-twin spellings
 *  to their Assess-vocabulary form across every CSV sharing this vocabulary,
 *  per the vendor-risk remediation plan's decision E1. Verified: the newest
 *  generation carries "Finance & Banking" / "Government & Defense" /
 *  "Retail & E-Commerce" in the same row position with the same payload
 *  (value, year, metric, region, source), and both generations hold 19
 *  industries — no row was added or dropped, only re-spelled. */
const INDUSTRY_LABEL_DRIFTED_TWIN_RENAME =
  'label renamed to its Assess-vocabulary spelling, not removed (f8e48c18b, ' +
  'WS-1, 2026-08-27): same row, same payload, under the new spelling. Both ' +
  'generations hold 19 industries.'

/** migrate_vendor_roadmap_: keyed by vendor_id + vendor_name + roadmap_url +
 *  roadmap_title, so correcting a wrong URL reads as a deletion of the old
 *  key. 6e34f286f (2026-09-02) reverted VND-054's roadmap_url/title from a
 *  weaker HPCwire press release back to the vendor's own migration guide
 *  (qu-secure.net) — the 2026-07-28 review-proposals pass (666a15020) had
 *  repointed it there and never wrote back replacement coverage_notes. The
 *  vendor row itself was not removed: VND-054 is present, active, and
 *  richer in the newest generation, under its restored URL/title. */
const VND054_URL_REVERTED_NOT_REMOVED =
  "roadmap_url/title reverted to the vendor's own migration guide, not removed " +
  '(6e34f286f, 2026-09-02): the 2026-07-28 review-proposals pass (666a15020) had ' +
  'repointed this row to a weaker HPCwire press release and never wrote back ' +
  'replacement coverage_notes. VND-054 is present, active, and richer in the ' +
  'newest generation under the restored URL/title.'

export const RECORDED_REMOVALS: RecordedRemoval[] = [
  {
    family: 'migrate_vendor_roadmap_',
    key: 'VND-054 | QuSecure Inc. | https://www.hpcwire.com/off-the-wire/qusecure-and-nists-nccoe-partner-to-address-post-quantum-algorithm-migration/ | QuSecure and NIST NCCoE Partner on Post-Quantum Algorithm Migration',
    reason: VND054_URL_REVERTED_NOT_REMOVED,
    recorded: '2026-09-02',
  },
  {
    family: 'industry_market_size_',
    key: 'Financial Services / Banking',
    reason: INDUSTRY_LABEL_DRIFTED_TWIN_RENAME,
    recorded: '2026-08-27',
  },
  {
    family: 'industry_market_size_',
    key: 'Government / Defense',
    reason: INDUSTRY_LABEL_DRIFTED_TWIN_RENAME,
    recorded: '2026-08-27',
  },
  {
    family: 'industry_market_size_',
    key: 'Retail / E-Commerce',
    reason: INDUSTRY_LABEL_DRIFTED_TWIN_RENAME,
    recorded: '2026-08-27',
  },
  {
    family: 'industry_standards_',
    key: 'draft-ietf-lamps-pq-composite-kem-16',
    reason: COMPOSITE_KEM_DRAFT_REVISION_BUMP,
    recorded: '2026-08-18',
  },
  {
    family: 'industry_standards_',
    key: 'draft-ietf-lamps-pq-composite-kem-16-water',
    reason: COMPOSITE_KEM_DRAFT_REVISION_BUMP,
    recorded: '2026-08-18',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Azure Dedicated HSM (Marvell LiquidSecurity) | azure-dedicated-hsm-marvell-liquidsecurity | Common Criteria | cc-marvell-ls2-hsm-hardware-version--cn9310410-03-c-firmware-version--marvell-ls2-fw-10-24-0780-bootloader-version--marvell-ls2-uboot-10-24-0702-r01-sb-or-marvell-ls2-uboot-10-24-0702-r02-sb-21e2cbbe',
    reason: AZURE_MARVELL_CERT_MISMATCH,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Azure Dedicated HSM (Marvell LiquidSecurity) | azure-dedicated-hsm-marvell-liquidsecurity | FIPS 140-3 | 4700',
    reason: AZURE_MARVELL_CERT_MISMATCH,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Azure Dedicated HSM (Marvell LiquidSecurity) | azure-dedicated-hsm-marvell-liquidsecurity | FIPS 140-3 | 4703',
    reason: AZURE_MARVELL_CERT_MISMATCH,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NESLIB 6.11.3 on ST31R480 A01 (version 6.11.3)(ANSSI-CC-2025/26) | Cryptographic-library-NESLIB-6-11-3-on-S | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--e7b02d10',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NESLIB 6.11.3 on ST31R480 A01 (version 6.11.3)(ANSSI-CC-2025/26) | Cryptographic-library-NESLIB-6-11-3-on-S | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--da5ca2af',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NESLIB 6.11.3 on ST31R480 B01 (version 6.11.3) (ANSSI-CC-2025/27) | Cryptographic-library-NESLIB-6-11-3-on-S-2 | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--e7b02d10',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NESLIB 6.11.3 on ST31R480 B01 (version 6.11.3) (ANSSI-CC-2025/27) | Cryptographic-library-NESLIB-6-11-3-on-S-2 | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--da5ca2af',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NesLib 6.11.0 on ST31R480 A01 référence NesLib version 6.11 | Cryptographic-library-NesLib-6-11-0-on-S | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--e7b02d10',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NesLib 6.11.0 on ST31R480 A01 référence NesLib version 6.11 | Cryptographic-library-NesLib-6-11-0-on-S | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--da5ca2af',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NesLib 6.11.6 on ST33K1M5A and ST33K1M5M B04 Version : 6.11.6 / B04 (EUCC-3090-2026-17) | Cryptographic-library-NesLib-6-11-6-on-S | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--e7b02d10',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NesLib 6.11.6 on ST33K1M5A and ST33K1M5M B04 Version : 6.11.6 / B04 (EUCC-3090-2026-17) | Cryptographic-library-NesLib-6-11-6-on-S | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--da5ca2af',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NesLib 6.11.6 on ST33K1M5C and ST33K1M5T C03 Version : 6.11.6 / C03 (EUCC-3090-2026-16) | Cryptographic-library-NesLib-6-11-6-on-S-2 | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--e7b02d10',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Cryptographic library NesLib 6.11.6 on ST33K1M5C and ST33K1M5T C03 Version : 6.11.6 / C03 (EUCC-3090-2026-16) | Cryptographic-library-NesLib-6-11-6-on-S-2 | Common Criteria | cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--da5ca2af',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'I4P Trident HSM | i4p-trident-hsm | Common Criteria | cc-trident-version-3-2-3-1f56eba4',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Infineon IFX_CCI_00007Ah/8Fh Crypto Suite | Infineon-IFX-CCI-00007Ah-8Fh-Crypto-Suit | Common Criteria | cc-ifx-cci-00007ah-8fh-a11--r11--m11-with-optional-crypto-suite-e1f2ea32',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'ST33KTPM2X (STSAFE-TPM) | st33ktpm2x-stsafe-tpm | Common Criteria | cc-stsafe-v100-tpm---st33ktpm2i--tpm-firmware-10-512---anssi-cc-2024-38--ee83fa73',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'STSAFE-V100-TPM | stsafe-v100-tpm | Common Criteria | cc-stsafe-v100-tpm---st33ktpm2i--tpm-firmware-10-512---anssi-cc-2024-38--ee83fa73',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Samsung S3SSE2A eSE | samsung-s3sse2a-ese | Common Criteria | cc-s3sse2a--s3sse2a-20250522--anssi-cc-2024-26-r01--fa2062b6',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Securosys Primus HSM | securosys-primus-hsm | Common Criteria | cc-primus-hsm-fw-3-1-0-series-e--series-e2--series-x--series-x2-6c95040a',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Thales MultiApp 5.2 Premium PQC | thales-multiapp-5-2-premium-pqc | Common Criteria | cc-quantum-ias-v1-0-0-a-and-moc-server-v3-1-1-on-multiapp-v5-2-premium-pqcversions-1-0-0-a--q-ias--et-3-1-1--moc-server---anssi-cc-2026-03--241fc0d1',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_certification_xref_',
    key: 'Tutus Farist IEG | tutus-farist-ieg | Common Criteria | cc-tutus-f-rist-ieg-v4-5-0-35b63e28',
    reason: CERT_ID_REPOINTED_BY_PR520,
    recorded: '2026-08-14',
  },
  {
    family: 'migrate_purl_xref_',
    key: 'SEALSQ Quantum Shield',
    reason: SEALSQ_RENAMED_TO_QS7001,
    recorded: '2026-08-14',
  },
  // The four below are the residue of regenerating trusted_source_xref_ against
  // current inputs, after the deprecated-target and re-attribution rules above
  // account for the other 527. Each was checked against the row's own
  // main_source / Organization field: all four assert an origin the resource
  // does not claim, so the generator is right to stop emitting them and
  // restoring them would re-publish a false attribution into the trust score.
  {
    family: 'trusted_source_xref_',
    key: 'threats | CI-003 | nist-csrc',
    reason:
      'this threat\'s main_source is "TSA Pipeline Security Guidelines (March 2018, rev. April 2021)", ' +
      'published by the Transportation Security Administration, not by NIST. The nist-csrc edge was wrong.',
    recorded: '2026-08-14',
  },
  {
    family: 'trusted_source_xref_',
    key: 'threats | IT-006 | iacr-eprint',
    reason:
      'main_source is the arXiv preprint "NoMod: A Non-modular Attack on Module Learning With Errors" ' +
      '(arxiv.org/abs/2510.02162). arXiv and the IACR Cryptology ePrint Archive are different preprint ' +
      'servers, so iacr-eprint asserted a publisher this paper does not have.',
    recorded: '2026-08-14',
  },
  {
    family: 'trusted_source_xref_',
    key: 'threats | MEDIA-002 | aacs',
    reason:
      'main_source is the arXiv paper "A First Look at Digital Rights Management Systems for Secure ' +
      'Mobile Content" (arxiv.org/abs/2308.00437) — an independent study, not a publication of the AACS ' +
      'Licensing Administrator. MEDIA-001, which genuinely cites the AACS Specifications, keeps its aacs edge.',
    recorded: '2026-08-14',
  },
  {
    family: 'trusted_source_xref_',
    key: 'leaders | Pieter Wuille | bitcoin-core',
    reason:
      'this leader\'s Organization is "Chaincode Labs;Blockstream (co-founder, former)", which does not ' +
      'name Bitcoin Core at all. The affiliation data changed; the xref followed it. (The trailing-qualifier ' +
      'fallback added to the generator on 2026-08-14 restores the other four leaders lost the same day — ' +
      'Mozilla/Oracle/Zoom/IBM Research were annotated "(former)" and stopped matching. It cannot restore ' +
      'this one, because there is no Bitcoin Core string left to match.)',
    recorded: '2026-08-14',
  },
]

// ---------------------------------------------------------------------------
// Lifecycle vocabulary
// ---------------------------------------------------------------------------

/** Values of a lifecycle column that mean "this row is retired". Anything
 *  else — including an empty cell, and including domain statuses such as
 *  timeline's "Completed" — counts as ACTIVE. Defaulting to active is the
 *  safe direction: it checks more rows, never fewer. */
const RETIRED_STATUSES = new Set([
  'deprecated',
  'obsolete',
  'retired',
  'superseded',
  'removed',
  'withdrawn',
])

/** The documented lifecycle triple is `status` / `deprecated_at` /
 *  `deprecated_reason` (pqctoday-priv/docs/platform/data/csv-status-schema.md
 *  — "ensures `status` is one of active / deprecated / obsolete"), so those
 *  are the only columns consulted. Other `*_status` columns are deliberately
 *  ignored: they carry domain state, not lifecycle. migrate_purl_xref_ is the
 *  cautionary case — it has BOTH a lifecycle `deprecated_at` AND a `status`
 *  column whose values are match results (`not_found`), so reading any
 *  `*status*` column as lifecycle would misclassify rows. */
const STATUS_COLUMN = 'status'
const DEPRECATED_AT_COLUMN = 'deprecated_at'

/** How many leading columns a composite key may span before a family is
 *  declared unkeyable. Beyond this the "key" would be most of the row, and a
 *  single edited field would masquerade as a deleted row. */
const MAX_COMPOSITE_KEY_COLUMNS = 4

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Generation {
  /** Filename only, e.g. 'library_08132026_r6.csv' */
  file: string
  /** Absolute path on disk */
  fullPath: string
  /** true when the file lives under src/data/archive/ */
  archived: boolean
}

export interface FamilyResult {
  family: string
  newest: string
  previous: string
  /** Columns forming the derived primary key, in order */
  keyColumns: string[]
  /** true when no unique key exists and rows are matched by multiset count */
  weakKey?: boolean
  /** Active rows in the previous generation that were compared */
  activeRowsCompared: number
  /** Rows in the previous generation skipped because already retired */
  retiredRowsSkipped: number
  /** Keys active in `previous` and absent from `newest`, minus recorded ones */
  missingKeys: string[]
  /** Keys absent but explained by a RECORDED_REMOVALS entry */
  excusedKeys: string[]
  /** Set when the family could not be checked; the family then FAILS */
  error?: string
}

export interface AuditReport {
  familiesChecked: number
  familiesSkippedSingleGeneration: string[]
  /** Families whose loader merges every generation — copy-forward cannot apply */
  familiesSkippedMergeAll: string[]
  rowPairsCompared: number
  results: FamilyResult[]
  failures: FamilyResult[]
}

// ---------------------------------------------------------------------------
// File discovery + precedence
// ---------------------------------------------------------------------------

/**
 * The dated-generation suffix, with MM/DD/YYYY and the optional `_rN` revision
 * as capture groups 1-4 — the exact shape `sortCSVFiles` expects. Unanchored,
 * so it matches at the end of a full path as well as a bare filename.
 *
 * This is the SAME suffix grammar `csvPrefix()` strips, so "what makes a
 * family" and "what orders a family" can never drift apart.
 */
// eslint-disable-next-line security/detect-unsafe-regex -- fixed-width \d{2}\d{2}\d{4} followed by one optional bounded group; no nested quantifier can backtrack. Same shape as audit-csv-archival.ts's sortKey() and csvUtils.ts's loader regexes.
const DATED_CSV = /(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

/**
 * Group every dated CSV in `dataDir` (and `archiveDir`, if present) by family,
 * each family's generations newest-first.
 *
 * Ordering is delegated to the APP'S OWN `sortCSVFiles` (src/data/csvUtils.ts)
 * — date descending, then revision descending — for the same reason
 * scripts/lib/latestDatedCsv.ts delegates to it: the whole point of this gate
 * is "which generation does the app actually serve", so a second
 * implementation of that answer would be a bug waiting to happen. It is also
 * what makes `library_08132026_r6.csv` correctly outrank
 * `library_08132026.csv` rather than losing to a plain lexicographic sort.
 * `sortCSVFiles` only reads the KEYS of the record it is handed, so paths are
 * passed with empty content and the winning files are read off disk after.
 *
 * Families with no live generation in `dataDir` are omitted: they are retired,
 * not served by any loader.
 */
export function collectFamilies(dataDir: string, archiveDir: string): Map<string, Generation[]> {
  const read = (dir: string, archived: boolean): Generation[] => {
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir)
      .filter((f) => DATED_CSV.test(f))
      .map((f) => ({ file: f, fullPath: path.join(dir, f), archived }))
  }

  const live = read(dataDir, false)
  const liveFamilies = new Set(live.map((g) => csvPrefix(g.file)))

  const byFamily = new Map<string, Generation[]>()
  for (const gen of [...live, ...read(archiveDir, true)]) {
    const family = csvPrefix(gen.file)
    if (!liveFamilies.has(family)) continue
    const group = byFamily.get(family) ?? []
    group.push(gen)
    byFamily.set(family, group)
  }

  for (const [family, group] of byFamily) {
    const byPath = new Map(group.map((g) => [g.fullPath, g]))
    const modules: Record<string, unknown> = {}
    for (const g of group) modules[g.fullPath] = ''
    byFamily.set(
      family,
      sortCSVFiles(modules, DATED_CSV).map((entry) => byPath.get(entry.path)!)
    )
  }

  return byFamily
}

// ---------------------------------------------------------------------------
// Parsing + key derivation
// ---------------------------------------------------------------------------

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

export function parseCsvFile(fullPath: string): ParsedCsv {
  const content = fs.readFileSync(fullPath, 'utf8').trim()
  const { data, meta } = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  })
  return {
    headers: (meta.fields ?? []).filter((f) => f.trim()),
    rows: data,
  }
}

const cell = (row: Record<string, string>, col: string): string =>
  // eslint-disable-next-line security/detect-object-injection -- `col` is always a CSV header string produced by PapaParse from a file this repo owns, never user input
  (row[col] ?? '').trim()

const composite = (row: Record<string, string>, cols: string[]): string =>
  cols.map((c) => cell(row, c)).join(' | ')

/** No two rows in `file` share the same value for `cols`.
 *
 *  Only ever asked of the PREVIOUS generation, because that is the set being
 *  iterated and looked up: a key that identifies each old row uniquely is
 *  enough to ask "did this row survive". Demanding uniqueness in the newest
 *  generation too would reject perfectly good keys — algorithms_transitions_
 *  is unique on its leading 3 columns in every generation it is checked
 *  against, but a LATER generation added rows that repeat a tuple. */
function isUnique(cols: string[], file: ParsedCsv): boolean {
  if (file.rows.length === 0) return false
  const seen = new Set<string>()
  for (const row of file.rows) {
    const k = composite(row, cols)
    if (seen.has(k)) return false
    seen.add(k)
  }
  return true
}

/** Every row in `file` has a non-empty value for every column in `cols`.
 *
 *  Required of single identifier columns (an empty id identifies nothing) but
 *  NOT of composite keys: role_board_content_ is exactly unique on
 *  role_id+variant_id+slot+slot_index, where slot_index is legitimately empty
 *  on 624 of 1,308 rows — "no index" is a real, stable part of that row's
 *  identity, and rejecting it would leave the family unprotected for no gain. */
function isComplete(cols: string[], file: ParsedCsv): boolean {
  return file.rows.every((row) => cols.every((c) => cell(row, c) !== ''))
}

/** Rank a single-column key candidate: identifier-looking names first, then
 *  left-to-right header order. Only ever used to choose BETWEEN columns that
 *  are already proven complete-and-unique, so this is a readability
 *  preference, not a correctness one. */
function singleColumnRank(col: string): number {
  const c = col.toLowerCase()
  if (/(^|_)id$/.test(c)) return 0
  if (/(^|_)(key|slug|number|code|uri|url)$/.test(c)) return 1
  return 2
}

/**
 * Derive a family's primary key FROM ITS DATA — never from an assumed column
 * name, because these sources genuinely disagree (reference_id, product_id,
 * source_id, concept_id, patent_number, code, Name, sector_key, ...), and
 * several have no single-column key at all (industry_standards_ is keyed by
 * industry+standard_id, role_board_content_ by role_id+variant_id+slot+...).
 *
 * 1. A single identifier-looking column (`*_id`, `*_key`, `*_number`, ...)
 *    that is complete and unique in the previous generation.
 * 2. Otherwise the SHORTEST leading run of columns that is unique — leading,
 *    because these CSVs put identifying columns first, and shortest, so the
 *    key stays as small as the data allows and depends on as few volatile
 *    fields as possible.
 * 3. Otherwise the longest allowed leading run, flagged `weak`. Two families
 *    genuinely have no unique key (migrate_certification_xref_ and
 *    pqc_maturity_governance_requirements_ both carry duplicate tuples), so
 *    the choice there is between a weak key and no protection at all. Because
 *    rows are compared as a MULTISET, a weak key still detects loss: if a key
 *    occurs 7 times in the previous generation and 6 in the newest, a row went
 *    missing. It only loses the ability to name WHICH one.
 *
 * Only columns present in BOTH generations are eligible: a column added in the
 * newest generation cannot identify a row in the previous one.
 */
export function deriveKeyColumns(
  newest: ParsedCsv,
  previous: ParsedCsv
): { columns: string[]; weak: boolean } | null {
  const shared = newest.headers.filter((h) => previous.headers.includes(h))
  if (shared.length === 0) return null

  const identifierSingles = shared
    .filter((c) => singleColumnRank(c) < 2 && isComplete([c], previous) && isUnique([c], previous))
    .sort(
      (a, b) => singleColumnRank(a) - singleColumnRank(b) || shared.indexOf(a) - shared.indexOf(b)
    )
  if (identifierSingles.length > 0) return { columns: [identifierSingles[0]], weak: false }

  const maxLen = Math.min(MAX_COMPOSITE_KEY_COLUMNS, shared.length)
  for (let n = 1; n <= maxLen; n++) {
    const cols = shared.slice(0, n)
    if (isUnique(cols, previous)) return { columns: cols, weak: false }
  }

  return { columns: shared.slice(0, maxLen), weak: true }
}

export interface LifecycleColumns {
  status: string | null
  deprecatedAt: string | null
}

/** The row's lifecycle columns, if the family carries them. */
export function findLifecycleColumns(headers: string[]): LifecycleColumns {
  const find = (want: string) => headers.find((h) => h.trim().toLowerCase() === want) ?? null
  return { status: find(STATUS_COLUMN), deprecatedAt: find(DEPRECATED_AT_COLUMN) }
}

/**
 * A row is ACTIVE unless it says otherwise. Defaulting to active is the safe
 * direction — it checks more rows, never fewer — and it is why families with
 * no lifecycle columns at all are still fully protected.
 *
 * Retired means either a retired `status` value, or a populated
 * `deprecated_at` (the schema requires that column be set whenever status is
 * non-active, so it is the more robust of the two signals).
 */
export function isActive(row: Record<string, string>, lifecycle: LifecycleColumns): boolean {
  if (lifecycle.deprecatedAt && cell(row, lifecycle.deprecatedAt) !== '') return false
  if (lifecycle.status && RETIRED_STATUSES.has(cell(row, lifecycle.status).toLowerCase())) {
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

/**
 * Newest generation of `prefix` in `dataDir`, or null when the family has none.
 * Ordering is `collectFamilies`' own, so "newest" here means the same file the
 * app's loader would serve.
 */
const newestOf = (dataDir: string, archiveDir: string, prefix: string): Generation | null => {
  const gens = collectFamilies(dataDir, archiveDir).get(prefix)
  return gens && gens.length > 0 && !gens[0].archived ? gens[0] : null
}

/**
 * The one derived family this repo has. Built per-run because it must read the
 * CURRENT newest generation of each source CSV to answer "is this target still
 * active" — a question whose answer changes every time a row is deprecated.
 */
export const buildDerivedFamilyRules = (
  dataDir: string,
  archiveDir: string
): DerivedFamilyRule[] => [
  {
    family: 'trusted_source_xref_',
    label: 'target row deprecated or gone',
    excuse(parts) {
      const [resourceType, resourceId] = parts
      const source = XREF_SOURCE_OF[resourceType]
      // An unknown resource_type is NOT excused: it means the generator grew a
      // type this rule has not been taught, and silently passing it would hide
      // exactly the loss the guard exists to catch.
      if (!source) return null
      const gen = newestOf(dataDir, archiveDir, source.prefix)
      if (!gen) return null
      const { rows } = parseCsvFile(gen.fullPath)
      const target = rows.find((r) => cell(r, source.idField) === resourceId)
      if (!target) {
        return `${resourceType} row "${resourceId}" no longer exists in ${gen.file}, so the generator cannot emit an xref for it`
      }
      if (cell(target, 'status').toLowerCase() === 'deprecated') {
        return `${resourceType} row "${resourceId}" is deprecated in ${gen.file}; the xref generator skips deprecated rows by design (bd67d7538)`
      }
      // A REMAP is not a loss. This family's key includes source_id, so
      // re-attributing a resource to a better-fitting source reads as "the old
      // edge vanished" — but the resource is still attributed, which is the
      // property that actually matters to the trust score consuming this file.
      //
      // This is not hypothetical tidying. Regenerating against the current
      // trusted-sources registry moved Spain's CCN off `ncsc-uk` onto
      // `ccn-spain`, Bahrain's NCSC off `ncsc-uk` onto `bahrain-ncsc`, Jordan's
      // central bank off `bdf` (Banque de France) onto `cbj-jordan`, PCI DSS
      // off `nist-csrc` onto `pci-ssc`, and 3GPP off `gsma` onto `3gpp`. Every
      // one of those old edges was WRONG. Treating them as rows to restore
      // would push a maintainer to reinstate false attributions — the exact
      // opposite of what this guard is for. 39 of the 47 removals flagged here
      // on 2026-08-14 were of this kind.
      //
      // The tradeoff, stated plainly: a resource that legitimately held two
      // distinct sources and lost one keeps a pass here. That is accepted
      // because the file is regenerated wholesale rather than edited, so
      // edge-level churn is normal and only total loss of attribution is a
      // signal. Excused keys are printed with this reason, never hidden.
      const alsoNewest = newestOf(dataDir, archiveDir, 'trusted_source_xref_')
      if (alsoNewest) {
        const still = parseCsvFile(alsoNewest.fullPath).rows.some(
          (r) => cell(r, 'resource_type') === resourceType && cell(r, 'resource_id') === resourceId
        )
        if (still) {
          return `${resourceType} "${resourceId}" was re-attributed to a different source in ${alsoNewest.file}, not stripped of attribution`
        }
      }
      return null
    },
  },
]

export function checkFamily(
  family: string,
  newestGen: Generation,
  previousGen: Generation,
  recorded: RecordedRemoval[] = RECORDED_REMOVALS,
  derivedRules: DerivedFamilyRule[] = []
): FamilyResult {
  const base: FamilyResult = {
    family,
    newest: newestGen.file,
    previous: previousGen.file + (previousGen.archived ? ' (archive/)' : ''),
    keyColumns: [],
    activeRowsCompared: 0,
    retiredRowsSkipped: 0,
    missingKeys: [],
    excusedKeys: [],
  }

  const newest = parseCsvFile(newestGen.fullPath)
  const previous = parseCsvFile(previousGen.fullPath)

  const derived = deriveKeyColumns(newest, previous)
  if (!derived) {
    return {
      ...base,
      error:
        `the two generations share no columns at all, so no row in one can be matched to a ` +
        `row in the other. This family is UNPROTECTED against silent row loss.`,
    }
  }
  const { columns: keyColumns, weak } = derived

  // Multiset, not set: a key may repeat when a family has no unique key, and
  // losing one of N identical-keyed rows is still losing a row.
  const newestCounts = new Map<string, number>()
  for (const row of newest.rows) {
    const k = composite(row, keyColumns)
    newestCounts.set(k, (newestCounts.get(k) ?? 0) + 1)
  }
  // Deprecated rows in the NEWEST generation still count as present: marking a
  // row deprecated is the legitimate way to retire it, and the row survives.

  const lifecycle = findLifecycleColumns(previous.headers)
  const excused = new Set(recorded.filter((r) => r.family === family).map((r) => r.key))

  const previousActiveCounts = new Map<string, number>()
  let activeRowsCompared = 0
  let retiredRowsSkipped = 0
  for (const row of previous.rows) {
    if (!isActive(row, lifecycle)) {
      retiredRowsSkipped++
      continue
    }
    activeRowsCompared++
    const k = composite(row, keyColumns)
    previousActiveCounts.set(k, (previousActiveCounts.get(k) ?? 0) + 1)
  }

  const rules = derivedRules.filter((r) => r.family === family)

  const missingKeys: string[] = []
  const excusedKeys: string[] = []
  for (const [key, wanted] of previousActiveCounts) {
    const shortfall = wanted - (newestCounts.get(key) ?? 0)
    if (shortfall <= 0) continue
    const label = wanted > 1 ? `${key}  (${shortfall} of ${wanted} occurrences)` : key
    if (excused.has(key)) {
      excusedKeys.push(label)
      continue
    }
    const ruled = rules.reduce<string | null>(
      (acc, r) => acc ?? r.excuse(key.split(' | '), keyColumns),
      null
    )
    if (ruled) excusedKeys.push(`${label}  — ${ruled}`)
    else missingKeys.push(label)
  }

  return {
    ...base,
    keyColumns,
    weakKey: weak,
    activeRowsCompared,
    retiredRowsSkipped,
    missingKeys,
    excusedKeys,
  }
}

export function runAudit(dataDir: string, archiveDir: string): AuditReport {
  const families = collectFamilies(dataDir, archiveDir)
  const derivedRules = buildDerivedFamilyRules(dataDir, archiveDir)
  const results: FamilyResult[] = []
  const singleGeneration: string[] = []
  const mergeAll: string[] = []

  for (const [family, generations] of [...families].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (MERGE_ALL_FAMILIES.has(family)) {
      mergeAll.push(family)
      continue
    }
    if (generations.length < 2) {
      singleGeneration.push(family)
      continue
    }
    results.push(
      checkFamily(family, generations[0], generations[1], RECORDED_REMOVALS, derivedRules)
    )
  }

  return {
    familiesChecked: results.length,
    familiesSkippedSingleGeneration: singleGeneration,
    familiesSkippedMergeAll: mergeAll,
    rowPairsCompared: results.reduce((n, r) => n + r.activeRowsCompared, 0),
    results,
    failures: results.filter((r) => r.error || r.missingKeys.length > 0),
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(SCRIPT_DIR, '..', 'src', 'data')
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive')

const MAX_KEYS_SHOWN = 25

function main(): void {
  const wantJson = process.argv.includes('--json')
  const verbose = process.argv.includes('--verbose')
  const report = runAudit(DATA_DIR, ARCHIVE_DIR)

  if (wantJson) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
    process.exit(report.failures.length > 0 ? 1 : 0)
  }

  // Proof of work: a guard that found nothing to compare must not look green.
  console.log(
    `Copy-forward check — ${report.familiesChecked} dated-CSV famil${
      report.familiesChecked === 1 ? 'y' : 'ies'
    }, ${report.rowPairsCompared} active row(s) compared against the previous generation.`
  )
  if (report.familiesSkippedMergeAll.length > 0) {
    console.log(
      `  (${report.familiesSkippedMergeAll.length} merge-all famil` +
        `${report.familiesSkippedMergeAll.length === 1 ? 'y is' : 'ies are'} out of scope — ` +
        `the loader serves EVERY generation, so an older one is not superseded: ` +
        `${report.familiesSkippedMergeAll.join(', ')})`
    )
  }
  if (report.familiesSkippedSingleGeneration.length > 0) {
    console.log(
      `  (${report.familiesSkippedSingleGeneration.length} famil` +
        `${report.familiesSkippedSingleGeneration.length === 1 ? 'y has' : 'ies have'} only one ` +
        `generation on disk — nothing to compare: ` +
        `${report.familiesSkippedSingleGeneration.join(', ')})`
    )
  }

  if (verbose) {
    console.log('')
    for (const r of report.results) {
      const key = r.keyColumns.length ? r.keyColumns.join(' + ') : '(none)'
      console.log(
        `  ${r.family}*  key=[${key}]  ${r.previous} -> ${r.newest}  ` +
          `${r.activeRowsCompared} active, ${r.retiredRowsSkipped} retired-skipped` +
          `${r.excusedKeys.length ? `, ${r.excusedKeys.length} recorded-removal` : ''}`
      )
    }
  }

  if (report.failures.length === 0) {
    console.log(`\nPASS every active row survived into the newest generation.`)
    process.exit(0)
  }

  console.log(
    `\nFAIL ${report.failures.length} dated-CSV famil` +
      `${report.failures.length === 1 ? 'y' : 'ies'} lost rows between generations:\n`
  )
  for (const f of report.failures) {
    console.log(`  ${f.family}*`)
    console.log(`    previous : ${f.previous}`)
    console.log(`    newest   : ${f.newest}`)
    if (f.error) {
      console.log(`    ERROR    : ${f.error}`)
      continue
    }
    console.log(`    key      : ${f.keyColumns.join(' + ')}`)
    console.log(
      `    missing  : ${f.missingKeys.length} active row(s) present in the previous ` +
        `generation and absent from the newest`
    )
    for (const k of f.missingKeys.slice(0, MAX_KEYS_SHOWN)) console.log(`               - ${k}`)
    if (f.missingKeys.length > MAX_KEYS_SHOWN) {
      console.log(`               ... and ${f.missingKeys.length - MAX_KEYS_SHOWN} more`)
    }
    console.log('')
  }
  console.log(
    `Rows are retired by setting status=deprecated (keeping the row), not by deleting them.\n` +
      `If a removal really is intended, record it in RECORDED_REMOVALS in\n` +
      `scripts/audit-csv-copy-forward.ts with a reason — do not disable this check.`
  )
  process.exit(1)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
