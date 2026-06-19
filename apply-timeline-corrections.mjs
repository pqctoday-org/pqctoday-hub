// One-shot timeline-CSV correction pass (run-1 audit findings, 2026-06-18).
// Reads timeline_06072026.csv → applies corrections → writes timeline_06192026.csv.
// Never deletes rows: fabricated/superseded rows get status='deprecated' (+reason),
// which the loader's filterActive() excludes. Re-runnable (idempotent).
// run-5 (2026-06-19): Japan sim-deadline URL upgraded to official gov.jp source;
//   22 rows bulk-assigned confidence_score (85 = authoritative primary, 60 = secondary/draft).
import { readFileSync, writeFileSync } from 'fs'
import Papa from 'papaparse'

const SRC = 'src/data/timeline_06072026.csv'
const OUT = 'src/data/timeline_06192026.csv'
const TODAY = '2026-06-19'

// [Country, Title] → deprecation reason (fabricated / superseded / inverted)
const DEPRECATE = [
  [
    'European Union',
    'Cryptographic Inventory Mandate',
    'Fabricated: EU Recommendation 2024/1101 is non-binding; no "v1.1" nor a Dec-2026 inventory deadline exists (timeline audit 2026-06-18).',
  ],
  [
    'European Union',
    'High-Priority System Migration Begins',
    'Unsupported: no EU source sets 2027 as high-priority migration start; NIS CG roadmap milestones are 2026 plan / 2030 high-risk / 2035 full (audit 2026-06-18).',
  ],
  [
    'Singapore',
    'Financial Sector PQC Migration Plans Due',
    'Fabricated: MAS advisory MAS/TCRS/2024/01 is non-prescriptive and sets no 2028/2026 deadlines (audit 2026-06-18).',
  ],
  [
    'Hong Kong',
    'PQC Readiness Assessment Required',
    'Fabricated: cited HKMA 2026 release announces a Quantum Preparedness Index only — no 2027 mandate, CBOM requirement, or "Fintech 2030" framework (audit 2026-06-18).',
  ],
  [
    'Hong Kong',
    'Financial Sector PQC Migration Complete',
    'Fabricated: HKMA source sets no 2030 completion target (audit 2026-06-18).',
  ],
  [
    'Germany',
    'Full PQC Transition — Standalone Algorithms Required',
    'Superseded by TR-02102-1 2026-01 edition and inverted: BSI REQUIRES hybrid for key establishment/signatures and does NOT mandate standalone PQC by 2035 (audit 2026-06-18).',
  ],
]

// [Country, Title] → { field: newValue }
const FIX = [
  [
    'European Union',
    'Coordinated Roadmap v1.1',
    { trusted_source_id: 'ec', SourceDate: '2025-06-23' },
  ],
  ['European Union', 'Member State Strategy Initiation', { SourceDate: '2025-06-11' }],
  ['European Union', 'High-Risk Systems Secured', { SourceDate: '2025-06-11' }],
  ['European Union', 'Full EU PQC Transition', { SourceDate: '2025-06-11' }],
  ['France', 'PQC Position Paper Follow-up', { SourceDate: '2023-10-11' }],
  [
    'United States',
    'NIST IR 8547 Transition Guidance (Draft)',
    {
      Description:
        'NIST publishes the Initial Public Draft of IR 8547 (Nov 2024), proposing PQC deprecation timelines (comment period closed Jan 2025). It remains at Initial Public Draft as of mid-2026; no second public draft has been published.',
    },
  ],
  [
    'United States',
    'FIPS 206 (FN-DSA) Draft Submitted',
    {
      SourceUrl: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
      source_url_quality: 'url_needs_review',
      Description:
        'FN-DSA (Falcon) is selected for standardization as FIPS 206; the standard is not yet finalized and no public draft is published as of mid-2026. Tracked via the NIST PQC project page.',
    },
  ],
  [
    'Saudi Arabia',
    'ECC-2:2024 Cybersecurity Controls',
    { SourceUrl: 'https://nca.gov.sa/en/', source_url_quality: 'url_needs_review' },
  ],
  [
    'Australia',
    'ISM June 2025 Cryptography Guidelines Update',
    {
      Description:
        'ASD releases the June 2025 revision of the ISM Guidelines for Cryptography with further PQC transition detail; reinforces the 2030 deprecation of traditional asymmetric cryptography. ASD does not recommend hybrid schemes — it permits adopting final PQC standards directly.',
    },
  ],
  [
    'Australia',
    'Commonwealth Cyber Security Posture in 2025',
    {
      SourceDate: '2026-02-01',
      Description:
        'Annual ASD assessment of cyber-security posture across Commonwealth entities (FY2024-25 report, tabled in Parliament Feb 2026). Tracks PQC transition planning and ISM-1917 readiness across Australian government agencies.',
    },
  ],
  [
    'Germany',
    'Hybrid TLS Required for Classified Communications',
    {
      SourceDate: '2025-12-27',
      Description:
        'BSI TR-02102-2 (2026-01 edition, 27.12.2025) recommends hybrid TLS combining classical (ECDH) and PQC (ML-KEM) for sensitive/classified communications; sole classical key agreement is acceptable only through end-2031.',
    },
  ],
  [
    'Germany',
    'Hybrid IPsec and SSH Required',
    {
      SourceDate: '2026-01-27',
      Description:
        'BSI TR-02102-3 (2026-01 edition, 27.01.2026) recommends hybrid IPsec (IKEv2 with ML-KEM) and hybrid SSH (with ML-KEM) for sensitive communications; sole classical key agreement is acceptable through end-2031 (a recommendation, not a hard 2026 mandate).',
    },
  ],
]

// [FlagCode, Title] → the ONE row that IS each country's canonical PQC migration
// deadline for the sim (the first HARD gate; skips legacy CNSA 1.0, soft
// strategy/plan milestones, and protocol-specific rows). AU/JP/SG have no
// suitable Deadline row → untagged → the sim falls back to the Q-Day anchor.
const SIM_DEADLINE = [
  ['US', 'CNSA 2.0 Exclusive - Network/Signing'], // 2030
  ['DE', 'Critical Applications PQC — Hybrid No Longer Required'], // 2030
  ['FR', 'PQC Qualification Requirement'], // 2027
  ['GB', 'Full PQC Compliance'], // 2035 (UK)
  ['EU', 'High-Risk Systems Secured'], // 2030
  ['CA', 'High Priority Systems Complete'], // 2031
  ['KR', 'Full PQC Roadmap Complete'], // 2035
  ['JP', 'Government PQC Transition Deadline'], // 2035 — reinstated via R2_REINSTATE
]

// ── run-2 audit corrections (matched by FlagCode + Title; the auditor's line
// numbers drifted, so we match on content). ───────────────────────────────────
// Reinstate (un-deprecate) + apply changes — used for Japan's 2035 NCO deadline.
// ── run-3 corrections (web-verified 2026-06-19) ──────────────────────────────
// DE: SourceDate was 2025-01-31 (Version 2025-01 era). TR-02102-1 Version 2026-01
//     (dated 2026-01-23) is the edition that explicitly set the 2030 critical-app
//     deadline; also clarify description — the milestone means PQC transition must
//     be COMPLETE by 2030, not that hybrid mode is "no longer required" after that.
// G7: Critical Systems row had SourceDate 2026-01-15 — the G7 CEG statement and
//     roadmap were published 2026-01-12 (US Treasury sb0355). Corrected.
// NZ: Planning Phase row pointed at the v3.9 release URL but SourceDate 2024-09-01
//     matches v3.8 (released 2024-09-05). Correct URL to the v3.8 release page.
// ── run-4 corrections (web-verified 2026-06-19) ──────────────────────────────
// CZ Key/Encryption milestones: NUKIB "Minimum Requirements for Cryptographic
//   Algorithms" is an algorithm-approval list with NO migration dates; the
//   2024-2027 / 2027 windows are unsupported inferences.
// HK Fintech Adoption: URL resolves to a Jul-2025 HKMA speech with no PQC
//   content; description mixes up a Jan-2025 stock-take with the speech source.
// IL Strategy: document is real but contains no PQC or quantum content;
//   description's "quantum threat mitigation provisions" is fabricated.
// NZ Transition Phase: v3.9 URL is correct (only v3.9 has PQC section 2.4);
//   SourceDate 2024-09-01 must update to 2025-05-09 (v3.9 release date).
// CZ Recommendations: SourceDate 2023-01-01 is placeholder; v3.0 published
//   2023-07-01 (first version with substantive PQC content).
const R4_DEPRECATE = [
  [
    'Czech Republic',
    'Key Establishment Migration',
    'Unsupported: NUKIB "Minimum Requirements for Cryptographic Algorithms" is an algorithm-approval list with no migration dates or 2024-2027 window; milestone is an unsourced inference (audit 2026-06-19).',
  ],
  [
    'Czech Republic',
    'Encryption Migration Complete',
    'Unsupported: NUKIB document sets no 2027 encryption-migration deadline; milestone is an unsourced inference from CNSA 2.0/EU timelines, not Czech national policy (audit 2026-06-19).',
  ],
  [
    'Hong Kong',
    'HKMA Fintech Adoption Report: PQC Commitment',
    'Inaccurate: URL resolves to a Jul-2025 HKMA speech (Carmen Chu, FiNETech6) with no PQC content; description conflates a separate Jan-2025 institution stock-take. No verified PQC commitment in this source (audit 2026-06-19).',
  ],
]
const R4_FIX = [
  [
    'Czech Republic',
    'Cryptographic Recommendations',
    {
      SourceDate: '2023-07-01',
      data_quality_notes:
        'SourceDate corrected to 2023-07-01 (NUKIB v3.0 publication date — first version with substantive PQC algorithm approvals). Current live document is v4.0 (Feb 2025); v3.0 introduced ML-KEM / hybrid schemes. URL points to the live PDF which updates in place.',
    },
  ],
  [
    'Israel',
    'National Cybersecurity Strategy 2025-2028',
    {
      Description:
        'INCD publishes the Israel National Cyber Security Strategy 2025 (implementation horizon through 2028), covering critical infrastructure, AI, and the Cyber Dome concept. The strategy document does not explicitly address post-quantum cryptography; PQC guidance comes from companion INCD/Digital Agency directives.',
      confidence_score: '60',
      data_quality_notes:
        'Title corrected to reflect official cover ("2025" not "2025-2028" as a date range). PQC is absent from this strategy; prior description claiming "quantum threat mitigation provisions" was inaccurate (audit 2026-06-19).',
    },
  ],
  [
    'New Zealand',
    'Transition Phase',
    {
      SourceDate: '2025-05-09',
      data_quality_notes:
        'SourceDate corrected to 2025-05-09 (NZISM v3.9 release, the version that introduced Section 2.4 PQC preparation guidance). v3.8 (Sep 2024) has no PQC content. The 2026-2030 transition window is an editorial inference from v3.9 para 2.4.10 ("possibly in the next 2-3 years"); NZISM does not label a discrete "Transition Phase" with those years explicitly (audit 2026-06-19).',
    },
  ],
]

const R3_FIX = [
  [
    'Germany',
    'Critical Applications PQC — Hybrid No Longer Required',
    {
      SourceDate: '2026-01-23',
      SourceUrl:
        'https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.html',
      Description:
        'BSI TR-02102-1 Version 2026-01 (23 Jan 2026) requires that applications with very high protection requirements complete their PQC transition by end-2030. This is the point at which quantum-safe mechanisms must be in place — classical-only key agreement is permitted only through end-2031 for all systems (TR-02102-2/3). Use of hybrid PQC is still encouraged but standalone PQC becomes the recommended baseline.',
    },
  ],
  ['G7', 'G7 Financial Sector Critical Systems PQC Transition', { SourceDate: '2026-01-12' }],
  [
    'New Zealand',
    'Planning Phase',
    { SourceUrl: 'https://www.ncsc.govt.nz/news/nzism-v3-8-release/' },
  ],
]

const R2_REINSTATE = [
  // JP was deprecated in the source CSV; NCO Nov-2025 interim report confirms 2035 target.
  [
    'JP',
    'Government PQC Transition Deadline',
    {
      source_url_quality: 'url_needs_review',
      data_quality_notes:
        'Reinstated 2026-06-19 per re-audit: Japan NCO Nov-2025 interim report sets a 2035 national PQC target. Verify the exact NCO source URL.',
    },
  ],
]

// ── run-5 corrections (2026-06-19) ───────────────────────────────────────────
// JP sim-deadline: SourceUrl was a PQShield blog post. Primary source confirmed:
//   Cabinet Secretariat (内閣官房) National Cyber Security Center "Interim Summary
//   Regarding the Transition to PQC in Government Agencies" (2025-11-20).
//   URL: https://www.cas.go.jp/jp/seisaku/pqc/pdf/report_202511.pdf
//   Sets a target ("原則2035年までに") for all government agencies to migrate to PQC by 2035.
//
// 22 rows bulk-assigned confidence_score:
//   85 = authoritative primary source (NIST SP/FIPS, RFC, EU regulation, official gov doc)
//   60 = secondary, draft, or partially-verified source
const R5_FIX_FLAG = [
  // [FlagCode, Title, changes]  — matched by FlagCode+Title like R2_REINSTATE
  [
    'JP',
    'Government PQC Transition Deadline',
    {
      SourceUrl: 'https://www.cas.go.jp/jp/seisaku/pqc/pdf/report_202511.pdf',
      SourceDate: '2025-11-20',
      source_url_quality: 'url_authoritative',
      peer_reviewed: 'yes',
      confidence_score: '85',
      data_quality_notes:
        'SourceUrl upgraded 2026-06-19 from PQShield blog to primary gov.jp source: Cabinet Secretariat (内閣官房) National Cyber Security Center interim summary (中間とりまとめ) published 2025-11-20. Sets target "原則2035年までにPQCに移行" for all government agencies. Policy hub: https://www.cas.go.jp/jp/seisaku/pqc/index.html',
    },
  ],
]

// Bulk confidence scoring — matched by Country+Title.
// Rows that already have a confidence_score are left untouched (idempotent).
const R5_CONFIDENCE = [
  // 85 — authoritative primary sources
  ['United States', 'CISA PQC Product Category List — EO 14306 Deadline', '85'],
  ['United States', 'NIST SP 800-227 KEM Recommendations', '85'],
  ['United States', 'NIST IR 8545 Round 4 Status Report', '85'],
  ['United States', 'GSA PQC Buyer Guide v1.0', '85'],
  ['United States', 'Additional Signatures Round 3 Advances', '85'],
  ['European Union', 'EU Cyber Resilience Act In Force', '85'],
  ['European Union', 'ENISA PQC Anticipating Threats', '85'],
  ['Japan', 'CRYPTREC Adds ML-KEM to Ciphers List', '85'],
  ['International', 'RFC 9881 ML-DSA in X.509', '85'],
  ['International', 'RFC 9941 SSH PQ-Hybrid Key Exchange', '85'],
  ['International', 'RFC 9370 Multiple Key Exchanges in IKEv2', '85'],
  ['International', 'ISO/IEC SC27 PQC Standardization', '85'],
  ['Germany', 'BSI TR-02102-1 2026 Edition', '85'],
  ['Canada', 'ITSP.40.111 v4 PQC Algorithms Approved', '85'],
  ['Spain', 'CCN-TEC 009 Post-Quantum Transition', '85'],
  ['South Korea', 'K-PQC Master Plan to 2035', '85'],
  // 60 — secondary, draft, or partially-verified
  ['United States', 'DoD PQC Migration Memorandum', '60'],
  ['Saudi Arabia', 'Saudi National Cryptographic Standards', '60'],
  ['United Arab Emirates', 'UAE Crypto Discovery Tool and PQC Index', '60'],
  ['International', 'draft-ietf-tls-ecdhe-mlkem Hybrid KEX', '60'],
  ['International', 'draft-ietf-lamps-kyber-certificates', '60'],
  ['Nigeria', 'NDPA General Application Directive 2025', '60'],
]
const R2_FIX = [
  [
    'OpenSSL 3.5.0 Native PQC Release',
    {
      SourceDate: '2025-04-08',
      SourceUrl: 'https://openssl-library.org/news/openssl-3.5-notes/',
      Description:
        'OpenSSL 3.5.0 (8 Apr 2025) ships native ML-KEM, ML-DSA and SLH-DSA support — the first stable OpenSSL release with built-in PQC, no external provider required.',
    },
  ],
  [
    'PQC Guideline GL-2004-2022',
    {
      StartYear: '2023',
      EndYear: '2023',
      SourceUrl: 'https://www.cryptrec.go.jp/report/cryptrec-gl-2004-2022.pdf',
    },
  ],
]
const R2_DEPRECATE = [
  [
    'OpenSSL 3.6.1 PQC Release',
    'Inaccurate: OpenSSL 3.6.1 (Jan 2026) is a CVE bugfix release with no PQC content; native ML-KEM/ML-DSA/SLH-DSA landed in 3.5 (Apr 2025), captured in the "OpenSSL 3.5.0 Native PQC Release" row (audit 2026-06-18).',
  ],
]

const { data, meta } = Papa.parse(readFileSync(SRC, 'utf8'), { header: true, skipEmptyLines: true })
const find = (country, title) => data.find((r) => r.Country === country && r.Title === title)
const findT = (title) => data.find((r) => r.Title === title)
// Prefers an active row over a deprecated one when both share Country+Title.
const findActive = (country, title) =>
  data.find((r) => r.Country === country && r.Title === title && r.status !== 'deprecated') ??
  data.find((r) => r.Country === country && r.Title === title)

let dep = 0
let fix = 0
const misses = []
for (const [c, t, reason] of DEPRECATE) {
  const r = find(c, t)
  if (!r) {
    misses.push(`DEP ${c}/${t}`)
    continue
  }
  r.status = 'deprecated'
  r.deprecated_at = TODAY
  r.deprecated_reason = reason
  dep++
}
for (const [c, t, changes] of FIX) {
  const r = find(c, t)
  if (!r) {
    misses.push(`FIX ${c}/${t}`)
    continue
  }
  Object.assign(r, changes)
  fix++
}

// ── run-4 corrections ─────────────────────────────────────────────────────────
let r4dep = 0,
  r4fix = 0
for (const [c, t, reason] of R4_DEPRECATE) {
  const r = find(c, t)
  if (!r) {
    misses.push(`R4DEP ${c}/${t}`)
    continue
  }
  r.status = 'deprecated'
  r.deprecated_at = TODAY
  r.deprecated_reason = reason
  r4dep++
}
for (const [c, t, changes] of R4_FIX) {
  const r = find(c, t)
  if (!r) {
    misses.push(`R4FIX ${c}/${t}`)
    continue
  }
  Object.assign(r, changes)
  r4fix++
}

// ── run-3 corrections ─────────────────────────────────────────────────────────
let r3fix = 0
for (const [c, t, changes] of R3_FIX) {
  const r = find(c, t)
  if (!r) {
    misses.push(`R3FIX ${c}/${t}`)
    continue
  }
  Object.assign(r, changes)
  r3fix++
}

// ── run-2 corrections (must run before SIM_DEADLINE tagging — R2_REINSTATE
// un-deprecates JP so the tagger can find it) ────────────────────────────────
let r2dep = 0,
  r2fix = 0,
  r2reinstate = 0
for (const [t, reason] of R2_DEPRECATE) {
  const r = findT(t)
  if (!r) {
    misses.push(`R2DEP ${t}`)
    continue
  }
  r.status = 'deprecated'
  r.deprecated_at = TODAY
  r.deprecated_reason = reason
  r2dep++
}
for (const [t, changes] of R2_FIX) {
  const r = findT(t)
  if (!r) {
    misses.push(`R2FIX ${t}`)
    continue
  }
  Object.assign(r, changes)
  r2fix++
}
for (const [flag, title, changes] of R2_REINSTATE) {
  const r = data.find((x) => x.FlagCode === flag && x.Title === title)
  if (!r) {
    misses.push(`R2REINSTATE ${flag}/${title}`)
    continue
  }
  r.status = 'active'
  r.deprecated_at = ''
  r.deprecated_reason = ''
  Object.assign(r, changes)
  r2reinstate++
}

// ── run-5 corrections ────────────────────────────────────────────────────────
let r5fix = 0
for (const [flag, title, changes] of R5_FIX_FLAG) {
  const r = data.find((x) => x.FlagCode === flag && x.Title === title)
  if (!r) {
    misses.push(`R5FIX ${flag}/${title}`)
    continue
  }
  Object.assign(r, changes)
  r5fix++
}
let r5conf = 0
for (const [country, title, score] of R5_CONFIDENCE) {
  const r = findActive(country, title)
  if (!r) {
    misses.push(`R5CONF ${country}/${title}`)
    continue
  }
  if (!r.confidence_score) {
    r.confidence_score = score
    r5conf++
  }
}

// New column: tag each country's canonical sim deadline (empty for all others).
// Runs AFTER all deprecate/reinstate passes so status is final.
for (const r of data) r.is_sim_deadline = ''
let tag = 0
for (const [flag, title] of SIM_DEADLINE) {
  const r = data.find((x) => x.FlagCode === flag && x.Title === title && x.status !== 'deprecated')
  if (!r) {
    misses.push(`TAG ${flag}/${title}`)
    continue
  }
  r.is_sim_deadline = 'true'
  tag++
}

if (misses.length) {
  console.error('UNMATCHED:\n  ' + misses.join('\n  '))
  process.exit(1)
}

const columns = [...meta.fields, 'is_sim_deadline']
writeFileSync(OUT, Papa.unparse(data, { columns }) + '\n')
console.log(
  `wrote ${OUT}: ${data.length} rows, ` +
    `${dep + r2dep + r4dep} deprecated (+${r2dep} run-2, +${r4dep} run-4), ` +
    `${fix + r2fix + r3fix + r4fix + r5fix} field-fixed (+${r2fix} run-2, +${r3fix} run-3, +${r4fix} run-4, +${r5fix} run-5), ` +
    `${r5conf} confidence-scored (run-5), ` +
    `${r2reinstate} reinstated, ` +
    `${tag} sim-deadline-tagged`
)
