// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  validateAttestation,
  parseCodeowners,
  teamsOwningChangedFiles,
  codeownersGlobMatch,
  findAttestationFiles,
  run,
  type GithubClient,
  type Reviewer,
} from './validate-offline-attestation'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REVIEWERS: Reviewer[] = [
  {
    reviewer_id: 'sme-alice',
    github_handle: null,
    display_name: 'Dr Alice Smith',
    active: true,
    domains: ['library'],
  },
  {
    reviewer_id: 'sme-inactive',
    github_handle: null,
    display_name: 'Dormant Reviewer',
    active: false,
    domains: ['compliance'],
  },
]

const PR_CREATED = new Date('2026-05-10T12:00:00Z')
const NOW = new Date('2026-05-14T12:00:00Z')

function validAttestation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    reviewer_id: 'sme-alice',
    proxy_github_handle: 'ericamador',
    review_date: '2026-05-08T09:30:00Z',
    approved_via: 'email',
    justification: 'Reviewed the library_*.csv backfill and approved by email on 2026-05-08.',
    evidence_ref: 'mailto:alice@example.org?subject=PR-842',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// validateAttestation
// ---------------------------------------------------------------------------

describe('validateAttestation', () => {
  it('accepts a well-formed attestation', () => {
    const r = validateAttestation(validAttestation(), REVIEWERS, PR_CREATED, NOW)
    expect(r.ok).toBe(true)
  })

  it('rejects non-object input', () => {
    const r = validateAttestation('not an object', REVIEWERS, PR_CREATED, NOW)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toMatch(/must be a JSON object/)
  })

  it('rejects missing reviewer_id', () => {
    const att = validAttestation()
    delete att.reviewer_id
    const r = validateAttestation(att, REVIEWERS, PR_CREATED, NOW)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('missing or empty required field: reviewer_id')
  })

  it('rejects empty justification', () => {
    const r = validateAttestation(
      validAttestation({ justification: '' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
  })

  it('rejects justification under 20 chars', () => {
    const r = validateAttestation(
      validAttestation({ justification: 'too short' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/at least 20 chars/)
  })

  it('rejects approved_via outside the closed set', () => {
    const r = validateAttestation(
      validAttestation({ approved_via: 'sms' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/approved_via must be one of/)
  })

  it('accepts each of the four allowed approved_via values', () => {
    for (const v of ['email', 'call', 'meeting', 'signed-doc']) {
      const r = validateAttestation(
        validAttestation({ approved_via: v }),
        REVIEWERS,
        PR_CREATED,
        NOW
      )
      expect(r.ok, `approved_via=${v} should be accepted`).toBe(true)
    }
  })

  it('rejects a review_date in the future', () => {
    const r = validateAttestation(
      validAttestation({ review_date: '2027-01-01T00:00:00Z' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/in the future/)
  })

  it('rejects a review_date more than 90 days before PR creation', () => {
    // PR created 2026-05-10; this date is more than 90 days earlier.
    const r = validateAttestation(
      validAttestation({ review_date: '2026-01-01T00:00:00Z' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/more than 90 days/)
  })

  it('rejects unknown reviewer_id', () => {
    const r = validateAttestation(
      validAttestation({ reviewer_id: 'who-is-this' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/not found in reviewers.json/)
  })

  it('rejects inactive reviewer', () => {
    const r = validateAttestation(
      validAttestation({ reviewer_id: 'sme-inactive' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/is not marked active/)
  })

  it('rejects an obviously-malformed GitHub username', () => {
    const r = validateAttestation(
      validAttestation({ proxy_github_handle: 'with space' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/not a valid GitHub username/)
  })

  it('tolerates an @-prefixed proxy handle', () => {
    const r = validateAttestation(
      validAttestation({ proxy_github_handle: '@ericamador' }),
      REVIEWERS,
      PR_CREATED,
      NOW
    )
    expect(r.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CODEOWNERS parsing + glob matching
// ---------------------------------------------------------------------------

describe('parseCodeowners', () => {
  it('skips comments, blanks, and trailing-comment text', () => {
    const text = `
# this is a comment
*  @ericamador

src/data/library_*.csv  @pqctoday-org/library-smes   # owned by library team
approvals/  @pqctoday-org/editorial-board
    `
    const rules = parseCodeowners(text)
    expect(rules).toHaveLength(3)
    expect(rules[0]).toEqual({ pattern: '*', owners: ['@ericamador'] })
    expect(rules[1].pattern).toBe('src/data/library_*.csv')
    expect(rules[1].owners).toEqual(['@pqctoday-org/library-smes'])
    expect(rules[2].pattern).toBe('approvals/')
  })

  it('skips lines with a pattern but no owners', () => {
    expect(parseCodeowners('some/path/with/no/owners')).toEqual([])
  })
})

describe('codeownersGlobMatch', () => {
  it('catch-all * matches anything', () => {
    expect(codeownersGlobMatch('*', 'src/data/library_05142026.csv')).toBe(true)
    expect(codeownersGlobMatch('*', '.github/CODEOWNERS')).toBe(true)
  })

  it('matches glob with single-segment wildcard', () => {
    expect(codeownersGlobMatch('src/data/library_*.csv', 'src/data/library_05142026.csv')).toBe(
      true
    )
    expect(codeownersGlobMatch('src/data/library_*.csv', 'src/data/library_05142026.json')).toBe(
      false
    )
    expect(codeownersGlobMatch('src/data/library_*.csv', 'src/data/archive/library_old.csv')).toBe(
      false
    )
  })

  it('trailing-slash directory pattern matches anything under it', () => {
    expect(codeownersGlobMatch('approvals/', 'approvals/offline-842-sme-alice.json')).toBe(true)
    expect(codeownersGlobMatch('approvals/', 'approvals/nested/deep/file.json')).toBe(true)
    expect(codeownersGlobMatch('approvals/', 'other/dir/file.json')).toBe(false)
  })
})

describe('teamsOwningChangedFiles', () => {
  const rules = parseCodeowners(`
*                                                   @ericamador
src/data/library_*.csv                              @pqctoday-org/library-smes
src/data/compliance_*.csv                           @pqctoday-org/compliance-smes
approvals/                                          @pqctoday-org/editorial-board
  `)

  it('returns teams owning the latest-matching rule per file', () => {
    const teams = teamsOwningChangedFiles(rules, ['src/data/library_05142026.csv', 'README.md'])
    // README.md matches only `*` (no team owner — skipped)
    // library_*.csv matches both `*` and library rule; later rule wins.
    expect([...teams]).toEqual(['pqctoday-org/library-smes'])
  })

  it('returns multiple teams when the PR touches multiple owned paths', () => {
    const teams = teamsOwningChangedFiles(rules, [
      'src/data/library_05142026.csv',
      'src/data/compliance_05092026.csv',
      'approvals/offline-1-sme-alice.json',
    ])
    expect(new Set(teams)).toEqual(
      new Set([
        'pqctoday-org/library-smes',
        'pqctoday-org/compliance-smes',
        'pqctoday-org/editorial-board',
      ])
    )
  })

  it('returns empty when no rule names a team', () => {
    const minimalRules = parseCodeowners('*  @ericamador')
    expect(teamsOwningChangedFiles(minimalRules, ['anything.txt']).size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// findAttestationFiles
// ---------------------------------------------------------------------------

describe('findAttestationFiles', () => {
  it('returns [] when the approvals dir does not exist', () => {
    expect(findAttestationFiles('/tmp/does-not-exist-' + Math.random(), 1)).toEqual([])
  })

  it('returns only matching files for the given PR', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pqc-test-'))
    try {
      fs.writeFileSync(path.join(dir, 'offline-842-sme-alice.json'), '{}')
      fs.writeFileSync(path.join(dir, 'offline-842-sme-bob.json'), '{}')
      fs.writeFileSync(path.join(dir, 'offline-100-sme-alice.json'), '{}') // different PR
      fs.writeFileSync(path.join(dir, 'random-file.txt'), '')
      const files = findAttestationFiles(dir, 842).sort()
      expect(files).toEqual(['offline-842-sme-alice.json', 'offline-842-sme-bob.json'])
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

// ---------------------------------------------------------------------------
// run() — end-to-end with a fake GithubClient
// ---------------------------------------------------------------------------

function makeFakeGithub(opts: {
  changedFiles?: string[]
  teamMembers?: Record<string, string[]>
  prCreated?: string
}): GithubClient {
  // TypeScript covariance: methods may take fewer arguments than the
  // interface declares. We omit prNumber on the fakes because the test
  // fixtures don't vary by PR.
  return {
    listChangedFiles: async () => opts.changedFiles ?? [],
    getPullRequest: async () => ({ created_at: opts.prCreated ?? PR_CREATED.toISOString() }),
    isTeamMember: async (team, handle) => {
      // eslint-disable-next-line security/detect-object-injection
      const members = opts.teamMembers?.[team]
      if (!members) return 'unknown'
      return members.includes(handle)
    },
  }
}

describe('run', () => {
  function setupFixtures(opts: { attestations?: Record<string, unknown> } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pqc-run-'))
    fs.mkdirSync(path.join(root, 'approvals'), { recursive: true })
    fs.mkdirSync(path.join(root, 'public', 'data'), { recursive: true })
    fs.mkdirSync(path.join(root, '.github'), { recursive: true })
    for (const [name, body] of Object.entries(opts.attestations ?? {})) {
      fs.writeFileSync(path.join(root, 'approvals', name), JSON.stringify(body))
    }
    fs.writeFileSync(
      path.join(root, 'public', 'data', 'reviewers.json'),
      JSON.stringify({ reviewers: REVIEWERS })
    )
    fs.writeFileSync(
      path.join(root, '.github', 'CODEOWNERS'),
      [
        '*                                @ericamador',
        'src/data/library_*.csv           @pqctoday-org/library-smes',
        'approvals/                       @pqctoday-org/editorial-board',
      ].join('\n')
    )
    return root
  }

  it('returns 0 when no attestations are present', async () => {
    const root = setupFixtures()
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({}),
        log: () => undefined,
      })
      expect(code).toBe(0)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns 0 when a valid attestation is paired with a recognised team', async () => {
    const root = setupFixtures({
      attestations: { 'offline-42-sme-alice.json': validAttestation() },
    })
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({
          changedFiles: ['src/data/library_05142026.csv'],
          teamMembers: { 'pqctoday-org/library-smes': ['ericamador'] },
        }),
        log: () => undefined,
      })
      expect(code).toBe(0)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns 1 when proxy handle is not in any owning team', async () => {
    const root = setupFixtures({
      attestations: { 'offline-42-sme-alice.json': validAttestation() },
    })
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({
          changedFiles: ['src/data/library_05142026.csv'],
          teamMembers: { 'pqctoday-org/library-smes': ['someone-else'] },
        }),
        log: () => undefined,
      })
      expect(code).toBe(1)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns 1 when no owning team applies to the PR', async () => {
    // Attestation present, but the PR only touches files matched by the
    // catch-all `*` rule (individual owner, no team) — nothing to gate
    // against, so the attestation is rejected.
    const root = setupFixtures({
      attestations: { 'offline-42-sme-alice.json': validAttestation() },
    })
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({ changedFiles: ['README.md'], teamMembers: {} }),
        log: () => undefined,
      })
      expect(code).toBe(1)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns 1 when API returns "unknown" by default (strict)', async () => {
    const root = setupFixtures({
      attestations: { 'offline-42-sme-alice.json': validAttestation() },
    })
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({ changedFiles: ['src/data/library_05142026.csv'] }),
        log: () => undefined,
      })
      expect(code).toBe(1)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns 0 when API returns "unknown" and skipTeamCheck is enabled', async () => {
    const root = setupFixtures({
      attestations: { 'offline-42-sme-alice.json': validAttestation() },
    })
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({ changedFiles: ['src/data/library_05142026.csv'] }),
        skipTeamCheck: true,
        log: () => undefined,
      })
      expect(code).toBe(0)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns 1 when the attestation JSON is malformed', async () => {
    const root = setupFixtures()
    fs.writeFileSync(path.join(root, 'approvals', 'offline-42-sme-alice.json'), 'not json')
    try {
      const code = await run({
        approvalsDir: path.join(root, 'approvals'),
        reviewersPath: path.join(root, 'public', 'data', 'reviewers.json'),
        codeownersPath: path.join(root, '.github', 'CODEOWNERS'),
        prNumber: 42,
        github: makeFakeGithub({}),
        log: () => undefined,
      })
      expect(code).toBe(1)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})
