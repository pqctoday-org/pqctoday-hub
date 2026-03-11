#!/usr/bin/env node
/* global __dirname, process, console */
// Structural / parse correctness validator for all CSV data sources.
// Read-only — outputs JSON findings to stdout.
// Usage: node scripts/validate-csv-structure.cjs

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const DATA_DIR = path.join(__dirname, '..', 'src', 'data')

// ── Expected headers per CSV type ────────────────────────────────────────────

const EXPECTED_HEADERS = {
  library: [
    'reference_id',
    'document_title',
    'download_url',
    'initial_publication_date',
    'last_update_date',
    'document_status',
    'short_description',
    'document_type',
    'applicable_industries',
    'authors_or_organization',
    'dependencies',
    'region_scope',
    'AlgorithmFamily',
    'SecurityLevels',
    'ProtocolOrToolImpact',
    'ToolchainSupport',
    'MigrationUrgency',
    'change_status',
    'manual_category',
    'downloadable',
    'local_file',
    'module_ids',
    'misc_info',
  ],
  migrate: [
    'software_name',
    'category_id',
    'category_name',
    'infrastructure_layer',
    'pqc_support',
    'pqc_capability_description',
    'license_type',
    'license',
    'latest_version',
    'release_date',
    'fips_validated',
    'pqc_migration_priority',
    'primary_platforms',
    'target_industries',
    'authoritative_source',
    'repository_url',
    'product_brief',
    'source_type',
    'verification_status',
    'last_verified_date',
    'migration_phases',
    'learning_modules',
  ],
  leaders: [
    'Name',
    'Country',
    'Role',
    'Organization',
    'Type',
    'Category',
    'Contribution',
    'ImageUrl',
    'WebsiteUrl',
    'LinkedinUrl',
    'KeyResourceUrl',
  ],
  quiz: [
    'id',
    'category',
    'type',
    'difficulty',
    'quiz_mode',
    'question',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
    'explanation',
    'learn_more_path',
    'personas',
    'industries',
  ],
  timeline: [
    'Country',
    'FlagCode',
    'OrgName',
    'OrgFullName',
    'OrgLogoUrl',
    'Type',
    'Category',
    'StartYear',
    'EndYear',
    'Title',
    'Description',
    'SourceUrl',
    'SourceDate',
    'Status',
  ],
  threats: [
    'industry',
    'threat_id',
    'threat_description',
    'criticality',
    'crypto_at_risk',
    'pqc_replacement',
    'main_source',
    'source_url',
    'accuracy_pct',
    'related_modules',
  ],
  compliance: [
    'id',
    'label',
    'description',
    'industries',
    'countries',
    'requires_pqc',
    'deadline',
    'notes',
    'enforcement_body',
    'library_refs',
    'timeline_refs',
    'body_type',
    'website',
  ],
  algorithms_transitions: [
    'Classical Algorithm',
    'Key Size',
    'PQC Replacement',
    'Function',
    'Deprecation Date',
    'Standardization Date',
  ],
  pqc_algorithm_reference: [
    'Algorithm Family',
    'Algorithm',
    'NIST Security Level',
    'AES Equivalent',
    'Public Key (bytes)',
    'Private Key (bytes)',
    'Signature/Ciphertext (bytes)',
    'Shared Secret (bytes)',
    'KeyGen (cycles relative)',
    'Sign/Encaps (cycles relative)',
    'Verify/Decaps (cycles relative)',
    'Stack RAM (bytes)',
    'Optimization Target',
    'FIPS Standard',
    'Use Case Notes',
  ],
  cert_xref: [
    'software_name',
    'cert_type',
    'cert_id',
    'cert_vendor',
    'cert_product',
    'pqc_algorithms',
    'certification_level',
    'status',
    'cert_date',
    'cert_link',
  ],
  assessment: [
    'category',
    'id',
    'label',
    'description',
    'industries',
    'hndl_relevance',
    'migration_priority',
    'retention_years',
    'compliance_deadline',
    'compliance_notes',
    'countries',
  ],
  auth_sources: [
    'Source_Name',
    'Source_Type',
    'Region',
    'Primary_URL',
    'Description',
    'Leaders_CSV',
    'Library_CSV',
    'Algorithm_CSV',
    'Threats_CSV',
    'Timeline_CSV',
    'Compliance_CSV',
    'Migrate_CSV',
    'Last_Verified_Date',
  ],
}

// ── Required fields (must not be empty) ──────────────────────────────────────

const REQUIRED_FIELDS = {
  library: ['reference_id', 'document_title'],
  migrate: ['software_name', 'category_id', 'category_name'],
  leaders: ['Name', 'Country', 'Role'],
  quiz: [
    'id',
    'category',
    'type',
    'difficulty',
    'question',
    'option_a',
    'option_b',
    'correct_answer',
    'explanation',
  ],
  timeline: ['Country', 'OrgName', 'StartYear', 'Title'],
  threats: ['industry', 'threat_id', 'threat_description', 'criticality'],
  compliance: ['id', 'label', 'body_type'],
  algorithms_transitions: ['Classical Algorithm', 'PQC Replacement', 'Function'],
  pqc_algorithm_reference: ['Algorithm Family', 'Algorithm'],
  cert_xref: ['software_name', 'cert_type', 'cert_id'],
  assessment: ['category', 'id', 'label'],
  auth_sources: ['Source_Name', 'Source_Type', 'Primary_URL'],
}

// ── Enum validations ─────────────────────────────────────────────────────────

const QUIZ_TYPES = new Set(['multiple-choice', 'true-false', 'multi-select'])
const QUIZ_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced'])
const QUIZ_MODES = new Set(['quick', 'full', 'both'])

const MIGRATE_FIPS = new Set(['Validated', 'Partial', 'No', 'Pending', ''])
const MIGRATE_PQC_SUPPORT = new Set(['Full', 'Partial', 'Planned', 'None', 'N/A', ''])

const TIMELINE_CATEGORIES = new Set([
  'Discovery',
  'Testing',
  'POC',
  'Migration',
  'Standardization',
  'Guidance',
  'Policy',
  'Regulation',
  'Research',
  'Deadline',
])
const TIMELINE_TYPES = new Set(['Phase', 'Milestone'])

const COMPLIANCE_BODY_TYPES = new Set([
  'standardization_body',
  'technical_standard',
  'certification_body',
  'compliance_framework',
])

// ── Utilities ────────────────────────────────────────────────────────────────

function findLatestCSV(prefix) {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (files.length === 0) return null

  const parsed = files
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        date: new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])),
        rev: m[4] ? parseInt(m[4]) : 0,
      }
    })
    .filter(Boolean)

  parsed.sort((a, b) => {
    const td = b.date.getTime() - a.date.getTime()
    if (td !== 0) return td
    return b.rev - a.rev
  })

  return parsed[0].file
}

// ── Main ─────────────────────────────────────────────────────────────────────

const findings = []

function addFinding(check, severity, csv, row, field, value, message) {
  findings.push({ check, severity, csv, row, field, value, message })
}

const CSV_MAP = {
  library: 'library_',
  migrate: 'quantum_safe_cryptographic_software_reference_',
  leaders: 'leaders_',
  quiz: 'pqcquiz_',
  timeline: 'timeline_',
  threats: 'quantum_threats_hsm_industries_',
  compliance: 'compliance_',
  algorithms_transitions: 'algorithms_transitions_',
  pqc_algorithm_reference: 'pqc_complete_algorithm_reference_',
  cert_xref: 'migrate_certification_xref_',
  assessment: 'pqcassessment_',
  auth_sources: 'pqc_authoritative_sources_reference_',
}

const csvSummary = {}

for (const [type, prefix] of Object.entries(CSV_MAP)) {
  const filename = findLatestCSV(prefix)
  if (!filename) {
    addFinding('S0-missing', 'ERROR', type, 0, '-', '-', `No CSV found for prefix "${prefix}"`)
    continue
  }

  const filePath = path.join(DATA_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')

  // S3: Line ending check
  const crlfCount = (raw.match(/\r\n/g) || []).length
  const lfCount = (raw.match(/(?<!\r)\n/g) || []).length
  if (crlfCount > 0 && lfCount > 0) {
    addFinding(
      'S3-line-endings',
      'WARNING',
      filename,
      0,
      '-',
      '-',
      `Mixed line endings: ${crlfCount} CRLF + ${lfCount} LF-only lines`
    )
  } else if (crlfCount > 0) {
    addFinding(
      'S3-line-endings',
      'INFO',
      filename,
      0,
      '-',
      '-',
      `CRLF line endings (${crlfCount} lines) — consider normalizing to LF`
    )
  }

  // Parse
  const {
    data,
    meta,
    errors: parseErrors,
  } = Papa.parse(raw.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  csvSummary[type] = { filename, rows: data.length, columns: meta.fields ? meta.fields.length : 0 }

  // S1: Header validation
  const expected = EXPECTED_HEADERS[type]
  if (expected && meta.fields) {
    const missing = expected.filter((h) => !meta.fields.includes(h))
    const extra = meta.fields.filter((h) => h.trim() && !expected.includes(h))

    missing.forEach((h) => {
      addFinding(
        'S1-header-missing',
        'ERROR',
        filename,
        1,
        h,
        '-',
        `Expected header "${h}" not found in CSV`
      )
    })
    extra.forEach((h) => {
      addFinding(
        'S1-header-extra',
        'WARNING',
        filename,
        1,
        h,
        '-',
        `Unexpected header "${h}" found in CSV (not in expected set)`
      )
    })
  }

  // S5: Blank header detection
  if (meta.fields) {
    meta.fields.forEach((h, idx) => {
      if (!h.trim()) {
        addFinding(
          'S5-blank-header',
          'WARNING',
          filename,
          1,
          `col_${idx}`,
          '(empty)',
          `Blank header at column index ${idx} — likely trailing comma`
        )
      }
    })
  }

  // S2: Column count consistency (via PapaParse errors)
  parseErrors.forEach((err) => {
    if (err.type === 'FieldMismatch') {
      addFinding(
        'S2-column-count',
        'WARNING',
        filename,
        err.row + 2,
        '-',
        '-',
        `Row has ${err.message}`
      )
    }
  })

  // S4: Empty required fields
  const required = REQUIRED_FIELDS[type]
  if (required) {
    data.forEach((row, i) => {
      required.forEach((field) => {
        if (row[field] === undefined || row[field] === null || row[field].trim() === '') {
          addFinding(
            'S4-empty-required',
            'ERROR',
            filename,
            i + 2,
            field,
            '(empty)',
            `Required field "${field}" is empty`
          )
        }
      })
    })
  }

  // ── Type-specific validations ────────────────────────────────────────────

  if (type === 'quiz') {
    data.forEach((row, i) => {
      // S6: Quiz type enum
      if (row.type && !QUIZ_TYPES.has(row.type)) {
        addFinding(
          'S6-quiz-type',
          'ERROR',
          filename,
          i + 2,
          'type',
          row.type,
          `Invalid quiz type "${row.type}" — expected: ${[...QUIZ_TYPES].join(', ')}`
        )
      }
      // S6: Quiz difficulty enum
      if (row.difficulty && !QUIZ_DIFFICULTIES.has(row.difficulty)) {
        addFinding(
          'S6-quiz-difficulty',
          'ERROR',
          filename,
          i + 2,
          'difficulty',
          row.difficulty,
          `Invalid difficulty "${row.difficulty}"`
        )
      }
      // S6: Quiz mode enum
      if (row.quiz_mode && !QUIZ_MODES.has(row.quiz_mode)) {
        addFinding(
          'S6-quiz-mode',
          'WARNING',
          filename,
          i + 2,
          'quiz_mode',
          row.quiz_mode,
          `Invalid quiz_mode "${row.quiz_mode}"`
        )
      }
      // S6: true-false correct_answer format
      if (row.type === 'true-false') {
        const ca = row.correct_answer ? row.correct_answer.trim().toLowerCase() : ''
        if (ca !== 'true' && ca !== 'false') {
          addFinding(
            'S6-quiz-tf-answer',
            'ERROR',
            filename,
            i + 2,
            'correct_answer',
            row.correct_answer,
            `True-false question "${row.id}" has correct_answer "${row.correct_answer}" — must be "true" or "false"`
          )
        }
      }
      // S6: multi-select should use pipe delimiter
      if (row.type === 'multi-select' && row.correct_answer && !row.correct_answer.includes('|')) {
        addFinding(
          'S6-quiz-multiselect',
          'WARNING',
          filename,
          i + 2,
          'correct_answer',
          row.correct_answer,
          `Multi-select question "${row.id}" correct_answer lacks pipe delimiter`
        )
      }
      // S6: multiple-choice valid answer IDs
      if (row.type === 'multiple-choice') {
        const validAnswers = new Set(['a', 'b', 'c', 'd'])
        if (row.correct_answer && !validAnswers.has(row.correct_answer.trim().toLowerCase())) {
          addFinding(
            'S6-quiz-mc-answer',
            'ERROR',
            filename,
            i + 2,
            'correct_answer',
            row.correct_answer,
            `MC question "${row.id}" has correct_answer "${row.correct_answer}" — must be a/b/c/d`
          )
        }
      }
    })
  }

  if (type === 'migrate') {
    data.forEach((row, i) => {
      // S7: fips_validated enum
      if (row.fips_validated && !MIGRATE_FIPS.has(row.fips_validated.trim())) {
        addFinding(
          'S7-migrate-fips',
          'WARNING',
          filename,
          i + 2,
          'fips_validated',
          row.fips_validated,
          `Invalid fips_validated "${row.fips_validated}"`
        )
      }
      // S7: pqc_support enum
      if (row.pqc_support && !MIGRATE_PQC_SUPPORT.has(row.pqc_support.trim())) {
        addFinding(
          'S7-migrate-pqc-support',
          'WARNING',
          filename,
          i + 2,
          'pqc_support',
          row.pqc_support,
          `Invalid pqc_support "${row.pqc_support}"`
        )
      }
    })
  }

  if (type === 'timeline') {
    data.forEach((row, i) => {
      // S8: StartYear / EndYear ranges
      const sy = parseInt(row.StartYear, 10)
      const ey = row.EndYear ? parseInt(row.EndYear, 10) : null
      if (isNaN(sy) || sy < 2000 || sy > 2040) {
        addFinding(
          'S8-timeline-year',
          'ERROR',
          filename,
          i + 2,
          'StartYear',
          row.StartYear,
          `Invalid StartYear "${row.StartYear}" — must be 2000–2040`
        )
      }
      if (ey !== null && (isNaN(ey) || ey < 2000 || ey > 2040)) {
        addFinding(
          'S8-timeline-year',
          'ERROR',
          filename,
          i + 2,
          'EndYear',
          row.EndYear,
          `Invalid EndYear "${row.EndYear}" — must be 2000–2040`
        )
      }
      if (ey !== null && !isNaN(sy) && !isNaN(ey) && ey < sy) {
        addFinding(
          'S8-timeline-year',
          'ERROR',
          filename,
          i + 2,
          'EndYear',
          row.EndYear,
          `EndYear (${ey}) < StartYear (${sy})`
        )
      }
      // S8: Category enum
      if (row.Category && !TIMELINE_CATEGORIES.has(row.Category)) {
        addFinding(
          'S8-timeline-category',
          'WARNING',
          filename,
          i + 2,
          'Category',
          row.Category,
          `Unexpected Category "${row.Category}"`
        )
      }
      // S8: Type enum
      if (row.Type && !TIMELINE_TYPES.has(row.Type)) {
        addFinding(
          'S8-timeline-type',
          'WARNING',
          filename,
          i + 2,
          'Type',
          row.Type,
          `Unexpected Type "${row.Type}"`
        )
      }
    })
  }

  if (type === 'compliance') {
    data.forEach((row, i) => {
      // S9: body_type enum
      if (row.body_type && !COMPLIANCE_BODY_TYPES.has(row.body_type.trim())) {
        addFinding(
          'S9-compliance-bodytype',
          'ERROR',
          filename,
          i + 2,
          'body_type',
          row.body_type,
          `Invalid body_type "${row.body_type}"`
        )
      }
      // S9: requires_pqc boolean
      if (row.requires_pqc) {
        const val = row.requires_pqc.trim()
        if (val !== 'Yes' && val !== 'No') {
          addFinding(
            'S9-compliance-reqpqc',
            'WARNING',
            filename,
            i + 2,
            'requires_pqc',
            val,
            `requires_pqc should be "Yes" or "No", got "${val}"`
          )
        }
      }
    })
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────

const errors = findings.filter((f) => f.severity === 'ERROR').length
const warnings = findings.filter((f) => f.severity === 'WARNING').length
const info = findings.filter((f) => f.severity === 'INFO').length

const report = {
  timestamp: new Date().toISOString(),
  csvSummary,
  summary: {
    totalCSVs: Object.keys(csvSummary).length,
    errors,
    warnings,
    info,
  },
  findings,
}

console.log(JSON.stringify(report, null, 2))
process.exit(errors > 0 ? 1 : 0)
