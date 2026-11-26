// SPDX-License-Identifier: AGPL-3.0-only
import { isExecutiveBankOverview } from '@/components/Simulation/autorun/autoRunFill'
import { useSimulationStore } from '@/store/useSimulationStore'
import { plannedVerificationSample } from '@/components/Simulation/autorun/plannedVerification'
/**
 * Migration Verification & Program Closure — the framework's 9th block
 * (Applied Quantum v2.1 p140-144). Closes the loop a CBOM "migration status"
 * cannot: it records educational evidence references, logs the
 * decommissioning of classical material, and records formal closure to BAU.
 *
 * Three sections → the framework's four named deliverables:
 *  1. Evidence recorder — five teaching prompts. Filled fields record references;
 *     they do not evaluate evidence or verify a deployment.
 *  2. Decommissioning log — classical key/cert retirement per the org's own
 *     key-destruction standard (e.g. NIST SP 800-88 purge/destroy procedures —
 *     the framework names "the organization's key destruction standard," not
 *     SP 800-88 specifically; SP 800-88 is media sanitization guidance whose
 *     Purge/Destroy actions are commonly reused for key material). A
 *     signing-key retirement raises a Trust-Now-Forge-Later flag until
 *     verifier trust in the old public key is withdrawn: destroying the private
 *     key does not clear it.
 *  3. Closure & BAU handover — closure sign-off + the permanent owners of the
 *     never-ending capabilities (Discovery, CBOM, Risk, Vendor governance).
 */
import React, { useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { rowsToSpreadsheetCsv } from '@/services/export/csvExport'
import { useModuleStore } from '@/store/useModuleStore'
import {
  FRAMEWORK_AUTHOR,
  FRAMEWORK_LICENSE,
  FRAMEWORK_NAME,
  FRAMEWORK_URL,
  FRAMEWORK_VERSION,
} from '@/data/frameworkPhases'

type EvidenceField =
  | 'observedNegotiation'
  | 'negativeTest'
  | 'certChainUnderPqc'
  | 'downgradeDocumented'
  | 'dossierLink'

const EVIDENCE_FIELDS: { key: EvidenceField; label: string; hint: string }[] = [
  {
    key: 'observedNegotiation',
    label: 'Observed negotiation',
    hint: 'Record the negotiated key exchange group from a captured handshake, such as X25519MLKEM768.',
  },
  {
    key: 'negativeTest',
    label: 'Negative test',
    hint: 'A classical-only peer is rejected or downgraded exactly as intended.',
  },
  {
    key: 'certChainUnderPqc',
    label: 'Certificate and authentication evidence',
    hint: 'Record the certificate chain validation and the peer’s CertificateVerify signature separately from key exchange.',
  },
  {
    key: 'downgradeDocumented',
    label: 'Downgrade documented',
    hint: 'Fallback/downgrade behaviour is known, tested and acceptable.',
  },
  {
    key: 'dossierLink',
    label: 'Evidence in dossier',
    hint: 'Reference/link to the filed evidence.',
  },
]

const CERTIFICATE_AUTH_OPTIONS = [
  'Classical certificate',
  'Post-quantum certificate',
  'Composite certificate',
] as const
type CertificateAuth = (typeof CERTIFICATE_AUTH_OPTIONS)[number]

const DECOMMISSION_KINDS = ['signing-key', 'certificate', 'kek', 'other'] as const
type DecommissionKind = (typeof DECOMMISSION_KINDS)[number]

// "Purge"/"Destroy" borrow NIST SP 800-88 Rev.1's media-sanitization vocabulary
// (a common, legitimate way orgs describe destroying key material) — but SP
// 800-88 itself is not a key-destruction standard; the framework says to
// follow your organization's own key-destruction standard, which may or may
// not use SP 800-88's terms. Drives the per-row "Method" select so the
// decommissioning record captures *how* the material was destroyed, not just
// that it was.
const DECOMMISSION_METHODS = [
  'SP 800-88 purge',
  'SP 800-88 destroy',
  'crypto-shred (key erase)',
  'revoke & archive',
  'other',
] as const

const BAU_CAPABILITIES = ['Discovery', 'CBOM', 'Risk', 'Vendor governance'] as const
type BauCapability = (typeof BAU_CAPABILITIES)[number]

export interface VerificationRecord {
  id: string
  system: string
  evidence: Record<EvidenceField, string>
  requiredCertificateAuth?: CertificateAuth
  observedCertificateAuth?: CertificateAuth
}

export interface DecommissionRow {
  id: string
  material: string
  kind: DecommissionKind
  retiredDate: string
  owner: string
  method: string
  /** Destruction of the retired material is confirmed. For a signing key this does NOT clear the TNFL flag. */
  confirmed: boolean
  /**
   * Verifiers no longer trust the retired signing key's public key (revoked, removed from trust
   * stores or replaced). Absent in records saved before this field existed, which reads as not
   * withdrawn.
   */
  trustWithdrawn?: boolean
}

export interface VerifyState {
  records: VerificationRecord[]
  decommissions: DecommissionRow[]
  closure: {
    decision: string
    signOffBy: string
    signOffDate: string
    bauOwners: Record<BauCapability, string>
  }
}

const newId = (): string => `mv-${Math.random().toString(36).slice(2, 9)}`
const emptyEvidence = (): Record<EvidenceField, string> => ({
  observedNegotiation: '',
  negativeTest: '',
  certChainUnderPqc: '',
  downgradeDocumented: '',
  dossierLink: '',
})

const SEED_STATE: VerifyState = {
  records: [
    { id: newId(), system: 'Public web TLS (edge)', evidence: emptyEvidence() },
    { id: newId(), system: 'Internal mTLS service mesh', evidence: emptyEvidence() },
  ],
  decommissions: [
    {
      id: newId(),
      material: 'Legacy root CA signing key (RSA-4096)',
      kind: 'signing-key',
      retiredDate: '',
      owner: '',
      method: 'SP 800-88 purge',
      confirmed: false,
      trustWithdrawn: false,
    },
  ],
  closure: {
    decision: '',
    signOffBy: '',
    signOffDate: '',
    bauOwners: { Discovery: '', CBOM: '', Risk: '', 'Vendor governance': '' },
  },
}

/** Field-completeness helpers only; these do not validate the recorded evidence. */
export function verifiedCount(r: VerificationRecord): number {
  return EVIDENCE_FIELDS.filter((f) => r.evidence[f.key].trim().length > 0).length
}
export const isVerified = (r: VerificationRecord): boolean =>
  verifiedCount(r) === EVIDENCE_FIELDS.length

function authenticationIssue(record: VerificationRecord): string | undefined {
  if (!record.requiredCertificateAuth) return undefined
  if (!record.observedCertificateAuth) return 'Record observed certificate authentication'
  if (record.requiredCertificateAuth !== record.observedCertificateAuth)
    return 'Authentication differs from requirement'
}

function evidenceStatus(record: VerificationRecord): string {
  return (
    authenticationIssue(record) ??
    (isVerified(record)
      ? 'Evidence recorded — review required'
      : `Incomplete evidence (${verifiedCount(record)}/5)`)
  )
}

/**
 * A retired signing key whose public key verifiers still trust is a standing
 * Trust-Now-Forge-Later risk, whether or not its private key was destroyed.
 */
export const isTnflLiability = (d: DecommissionRow): boolean =>
  d.kind === 'signing-key' && !d.trustWithdrawn

export function buildMarkdown(state: VerifyState): string {
  const lines: string[] = []
  lines.push('# Migration Verification & Program Closure')
  lines.push('')
  lines.push(
    `_Built on the ${FRAMEWORK_NAME} ${FRAMEWORK_VERSION} — ${FRAMEWORK_AUTHOR} (${FRAMEWORK_LICENSE}). ${FRAMEWORK_URL}_`
  )
  lines.push('')

  // 1 — Verification records (5-point evidence standard).
  lines.push('## Verification records')
  lines.push('')
  lines.push(
    '| System | Negotiation | Neg-test | Authentication evidence | Downgrade | Dossier | Required authentication | Observed authentication | Status |'
  )
  lines.push('|---|:--:|:--:|:--:|:--:|:--:|---|---|---|')
  for (const r of state.records) {
    const cell = (k: EvidenceField) => (r.evidence[k].trim() ? '✓' : '—')
    const status = evidenceStatus(r)
    lines.push(
      `| ${r.system || '_(unnamed)_'} | ${cell('observedNegotiation')} | ${cell('negativeTest')} | ${cell('certChainUnderPqc')} | ${cell('downgradeDocumented')} | ${cell('dossierLink')} | ${r.requiredCertificateAuth ?? '—'} | ${r.observedCertificateAuth ?? '—'} | ${isVerified(r) && !authenticationIssue(r) ? `**${status}**` : status} |`
    )
  }
  const verified = state.records.filter(isVerified).length
  lines.push('')
  lines.push(
    `> ${verified}/${state.records.length} records have all five evidence fields populated. These educational references require review; entering them does not evaluate evidence or verify a deployment.`
  )
  lines.push('')
  lines.push(
    '> **Evidence chain (CBOM → ACVP → CMVP → Runtime):** A CBOM (e.g. CycloneDX 1.6/1.7 / ECMA-424) inventories declared cryptographic assets and does not prove runtime negotiation or module validation. ACVP/CAVP validates an algorithm implementation against NIST test vectors, not the enclosing module boundary. CMVP (FIPS 140-3; FIPS 140-2 moved to the Historical list in September 2026) validates a specific module version, approved-algorithm list, and operating configuration. Runtime verification (captured handshakes, negative/downgrade tests, certificate-chain checks) confirms what the deployed system actually negotiates.'
  )
  lines.push('')

  const withEvidence = state.records.filter((record) => verifiedCount(record) > 0)
  if (withEvidence.length > 0) {
    lines.push('### Evidence references for review', '')
    for (const record of withEvidence) {
      lines.push('System', '', ...record.system.split(/\r?\n/).map((line) => `    ${line}`), '')
      for (const field of EVIDENCE_FIELDS) {
        const reference = record.evidence[field.key].trim()
        if (reference) {
          lines.push(field.label, '', ...reference.split(/\r?\n/).map((line) => `    ${line}`), '')
        }
      }
    }
  }

  // 2 — Decommissioning log.
  lines.push('## Decommissioning log (classical material)')
  lines.push('')
  if (state.decommissions.length === 0) {
    lines.push('_No classical material logged for decommissioning._')
  } else {
    lines.push(
      '| Material | Kind | Retired | Owner | Method | Destruction confirmed | Verifier trust withdrawn |'
    )
    lines.push('|---|---|---|---|---|---|---|')
    for (const d of state.decommissions) {
      const destroyed = d.confirmed ? '✓' : 'pending'
      const trust = d.kind !== 'signing-key' ? 'n/a' : isTnflLiability(d) ? '⚠ TNFL liability' : '✓'
      lines.push(
        `| ${d.material || '—'} | ${d.kind} | ${d.retiredDate || '—'} | ${d.owner || '—'} | ${d.method || '—'} | ${destroyed} | ${trust} |`
      )
    }
    lines.push('')
    lines.push(
      '> Destroying a retired signing private key does not prevent quantum forgery while verifiers still trust its vulnerable public key. Plan withdrawal of that trust and handle private-key destruction under the applicable retention and key-management policy. For PKI migration and timelines, see the [NCSC PQC migration guidance](https://www.ncsc.gov.uk/guidance/pqc-migration-timelines).'
    )
  }
  lines.push('')

  // 3 — Closure decision record + BAU handover register.
  lines.push('## Closure decision record')
  lines.push('')
  lines.push(`- **Decision:** ${state.closure.decision || '—'}`)
  lines.push(`- **Signed off by:** ${state.closure.signOffBy || '—'}`)
  lines.push(`- **Date:** ${state.closure.signOffDate || '—'}`)
  lines.push('')
  lines.push('## BAU handover register')
  lines.push('')
  lines.push('| Continuous capability | Permanent owner |')
  lines.push('|---|---|')
  for (const cap of BAU_CAPABILITIES) {
    lines.push(`| ${cap} | ${state.closure.bauOwners[cap] || '—'} |`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(
    "*Aligned to the framework's Migration Verification & Program Closure block — feeds the Evidence Dossier.*"
  )
  return lines.join('\n')
}

function isVerifyState(x: unknown): x is VerifyState {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  return Array.isArray(s.records) && Array.isArray(s.decommissions) && !!s.closure
}

export const MigrationVerification: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const executiveDocuments = useModuleStore((s) => s.artifacts.executiveDocuments)

  // Restore the user's last saved verification record (round-trip via `inputs`).
  const restored = useMemo<VerifyState | null>(() => {
    const latest = (executiveDocuments ?? [])
      .filter((d) => d.type === 'migration-verification' && d.inputs)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
    return isVerifyState(latest?.inputs) ? (latest.inputs as VerifyState) : null
  }, [executiveDocuments])

  // Merge over fresh SEED_STATE (not just `restored ?? SEED_STATE`) so a
  // record saved before a field was added (e.g. a new BAU capability) still
  // round-trips without an undefined value reaching the UI — same pattern as
  // ROICalculator / Vendor Scorecard / Infra Modernization Planner.
  const [state, setState] = useState<VerifyState>(() => {
    if (isExecutiveBankOverview(useSimulationStore.getState().sector))
      return plannedVerificationSample()
    const seed = {
      records: SEED_STATE.records.map((r) => ({ ...r })),
      decommissions: SEED_STATE.decommissions.map((d) => ({ ...d })),
      closure: { ...SEED_STATE.closure, bauOwners: { ...SEED_STATE.closure.bauOwners } },
    }
    if (!restored) return seed
    return {
      records: restored.records ?? seed.records,
      decommissions: restored.decommissions ?? seed.decommissions,
      closure: {
        ...seed.closure,
        ...restored.closure,
        bauOwners: { ...seed.closure.bauOwners, ...restored.closure?.bauOwners },
      },
    }
  })

  const setEvidence = (id: string, key: EvidenceField, value: string) =>
    setState((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.id === id ? { ...r, evidence: { ...r.evidence, [key]: value } } : r
      ),
    }))
  const updateRecord = (id: string, patch: Partial<Omit<VerificationRecord, 'id' | 'evidence'>>) =>
    setState((prev) => ({
      ...prev,
      records: prev.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  const addRecord = () =>
    setState((prev) => ({
      ...prev,
      records: [...prev.records, { id: newId(), system: '', evidence: emptyEvidence() }],
    }))
  const removeRecord = (id: string) =>
    setState((prev) => ({ ...prev, records: prev.records.filter((r) => r.id !== id) }))

  const setDecommission = (id: string, patch: Partial<DecommissionRow>) =>
    setState((prev) => ({
      ...prev,
      decommissions: prev.decommissions.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }))
  const addDecommission = () =>
    setState((prev) => ({
      ...prev,
      decommissions: [
        ...prev.decommissions,
        {
          id: newId(),
          material: '',
          kind: 'signing-key',
          retiredDate: '',
          owner: '',
          method: 'SP 800-88 purge',
          confirmed: false,
          trustWithdrawn: false,
        },
      ],
    }))
  const removeDecommission = (id: string) =>
    setState((prev) => ({ ...prev, decommissions: prev.decommissions.filter((d) => d.id !== id) }))

  const setClosure = (patch: Partial<VerifyState['closure']>) =>
    setState((prev) => ({ ...prev, closure: { ...prev.closure, ...patch } }))
  const setBauOwner = (cap: BauCapability, owner: string) =>
    setState((prev) => ({
      ...prev,
      closure: { ...prev.closure, bauOwners: { ...prev.closure.bauOwners, [cap]: owner } },
    }))

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])
  const exportCsv = useMemo(() => {
    const header = [
      'Section',
      'System / Material',
      'Kind / Status',
      'Observed Negotiation / Retired Date',
      'Negative Test / Owner',
      'Cert Chain / Method',
      'Downgrade Documented / Destruction Confirmed',
      'Dossier Link / Verifier Trust Withdrawn',
      'Required Certificate Authentication',
      'Observed Certificate Authentication',
    ]
    const recordRows = state.records.map((r) => [
      'Verification Record',
      r.system || '(unnamed)',
      evidenceStatus(r),
      r.evidence.observedNegotiation,
      r.evidence.negativeTest,
      r.evidence.certChainUnderPqc,
      r.evidence.downgradeDocumented,
      r.evidence.dossierLink,
      r.requiredCertificateAuth ?? '',
      r.observedCertificateAuth ?? '',
    ])
    const decommRows = state.decommissions.map((d) => [
      'Decommissioning Log',
      d.material || '—',
      d.kind,
      d.retiredDate || '—',
      d.owner || '—',
      d.method || '—',
      d.confirmed ? 'confirmed' : 'pending',
      d.kind !== 'signing-key' ? 'n/a' : isTnflLiability(d) ? 'TNFL liability' : 'trust withdrawn',
      '',
      '',
    ])
    return rowsToSpreadsheetCsv([header, ...recordRows, ...decommRows])
  }, [state])
  const verifiedTotal = state.records.filter(isVerified).length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <ClipboardCheck size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold font-display text-heading">
            Migration Verification &amp; Program Closure
          </h2>
          <p className="text-sm text-muted-foreground">
            Practise recording evidence references, retirement decisions and closure requirements.
            These educational prompts do not evaluate evidence or verify a deployment.
          </p>
        </div>
      </header>

      {/* 1 — Verification recorder */}
      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">
          Verification records · {verifiedTotal}/{state.records.length} evidence complete
        </h3>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Evidence recorded — review required.</span>{' '}
          Filling the five educational prompts records references. It does not test the system or
          evaluate the evidence. Different services require different technical checks.
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Evidence chain (CBOM → ACVP → CMVP → Runtime):
          </span>{' '}
          A CBOM (CycloneDX 1.6/1.7 / ECMA-424) inventories declared assets; ACVP validates
          algorithm test vectors, not the module boundary; CMVP (FIPS 140-3; FIPS 140-2 moved to
          Historical in September 2026) validates the specific module version, approved algorithms
          and configuration; runtime captures confirm what actually negotiates on the wire.
        </p>
        <p className="text-xs text-muted-foreground">
          In TLS 1.3, record the negotiated group separately from the certificate chain and peer
          authentication. A hybrid group can be used with a classical certificate. Compare the
          observed authentication with the policy for the service.{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc10024.html#section-4"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            TLS hybrid groups
          </a>
          {' · '}
          <a
            href="https://www.ietf.org/ietf-ftp/rfc/rfc9846.html#section-4.5"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            TLS authentication messages
          </a>
        </p>
        <div className="space-y-3">
          {state.records.map((r) => {
            const done = isVerified(r) && !authenticationIssue(r)
            return (
              <div
                key={r.id}
                role="group"
                aria-label={r.system.trim() || 'Unnamed system'}
                className="glass-panel glass-panel-row p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={r.system}
                    onChange={(e) => updateRecord(r.id, { system: e.target.value })}
                    placeholder="System (e.g. Public web TLS)"
                    aria-label="System"
                    className="flex-1"
                  />
                  <span
                    role="status"
                    className={`min-w-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      done
                        ? 'border-status-success/40 bg-status-success/10 text-status-success'
                        : 'border-status-warning/40 bg-status-warning/10 text-status-warning'
                    }`}
                  >
                    {evidenceStatus(r)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecord(r.id)}
                    aria-label="Remove record"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <FilterDropdown
                    items={[...CERTIFICATE_AUTH_OPTIONS]}
                    selectedId={r.requiredCertificateAuth ?? ''}
                    onSelect={(id) =>
                      updateRecord(r.id, {
                        requiredCertificateAuth: CERTIFICATE_AUTH_OPTIONS.find(
                          (option) => option === id
                        ),
                      })
                    }
                    ariaLabel="Required certificate authentication"
                    defaultLabel="No requirement recorded"
                    label="Required certificate authentication"
                  />
                  <FilterDropdown
                    items={[...CERTIFICATE_AUTH_OPTIONS]}
                    selectedId={r.observedCertificateAuth ?? ''}
                    onSelect={(id) =>
                      updateRecord(r.id, {
                        observedCertificateAuth: CERTIFICATE_AUTH_OPTIONS.find(
                          (option) => option === id
                        ),
                      })
                    }
                    ariaLabel="Observed certificate authentication"
                    defaultLabel="No observation recorded"
                    label="Observed certificate authentication"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  {EVIDENCE_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label
                        htmlFor={`${r.id}-${f.key}`}
                        className="text-[11px] font-medium text-muted-foreground"
                        title={f.hint}
                      >
                        {f.label}
                      </label>
                      <Input
                        id={`${r.id}-${f.key}`}
                        value={r.evidence[f.key]}
                        aria-describedby={`${r.id}-${f.key}-hint`}
                        onChange={(e) => setEvidence(r.id, f.key, e.target.value)}
                        placeholder="evidence ref…"
                        className="mt-1 text-xs"
                      />
                      <p
                        id={`${r.id}-${f.key}-hint`}
                        className="mt-1 text-[11px] text-muted-foreground"
                      >
                        {f.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addRecord}
          className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:bg-muted/50"
        >
          + Add system
        </Button>
      </section>

      {/* 2 — Decommissioning log */}
      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">
          Decommissioning log (classical material)
        </h3>
        <p className="text-xs text-muted-foreground">
          Destroying a retired signing private key does not prevent quantum forgery while verifiers
          still trust its vulnerable public key. Plan withdrawal of that trust and handle
          private-key destruction under the applicable retention and key-management policy. For PKI
          migration and timelines, see the{' '}
          <a
            href="https://www.ncsc.gov.uk/guidance/pqc-migration-timelines"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            NCSC PQC migration guidance
          </a>
          .
        </p>
        <div className="space-y-2">
          {state.decommissions.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-1 sm:grid-cols-8 gap-2 items-center rounded-md border border-border p-2"
            >
              <Input
                value={d.material}
                onChange={(e) => setDecommission(d.id, { material: e.target.value })}
                placeholder="Material (e.g. root CA key)"
                aria-label="Material"
                className="text-xs sm:col-span-2"
              />
              <FilterDropdown
                items={[...DECOMMISSION_KINDS]}
                selectedId={d.kind}
                onSelect={(id) => setDecommission(d.id, { kind: id as DecommissionKind })}
                ariaLabel="Kind"
                hideDefaultOption
                noContainer
                size="sm"
              />
              <Input
                type="date"
                value={d.retiredDate}
                onChange={(e) => setDecommission(d.id, { retiredDate: e.target.value })}
                aria-label="Retired date"
                className="text-xs"
              />
              <Input
                value={d.owner}
                onChange={(e) => setDecommission(d.id, { owner: e.target.value })}
                placeholder="Owner"
                aria-label="Owner"
                className="text-xs"
              />
              <FilterDropdown
                items={[...DECOMMISSION_METHODS]}
                selectedId={d.method}
                onSelect={(id) => setDecommission(d.id, { method: id })}
                ariaLabel="Destruction method"
                hideDefaultOption
                noContainer
                size="sm"
              />
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={d.confirmed}
                    onChange={(e) => setDecommission(d.id, { confirmed: e.target.checked })}
                    aria-label="Destruction confirmed"
                  />
                  {d.confirmed ? 'destruction confirmed' : 'destruction pending'}
                </label>
                {d.kind === 'signing-key' && (
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={!!d.trustWithdrawn}
                      onChange={(e) => setDecommission(d.id, { trustWithdrawn: e.target.checked })}
                      aria-label="Verifier trust withdrawn"
                    />
                    {isTnflLiability(d) ? '⚠ TNFL: verifiers still trust it' : 'trust withdrawn'}
                  </label>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDecommission(d.id)}
                aria-label="Remove material"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive justify-self-end"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addDecommission}
          className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:bg-muted/50"
        >
          + Add material
        </Button>
      </section>

      {/* 3 — Closure & BAU handover */}
      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">
          Closure &amp; BAU handover
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-3">
            <label
              htmlFor="mv-closure-decision"
              className="text-[11px] font-medium text-muted-foreground"
            >
              Closure decision / scope
            </label>
            <Input
              id="mv-closure-decision"
              value={state.closure.decision}
              onChange={(e) => setClosure({ decision: e.target.value })}
              placeholder="Closure decision / scope"
              className="mt-1 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="mv-sign-off-by"
              className="text-[11px] font-medium text-muted-foreground"
            >
              Signed off by
            </label>
            <Input
              id="mv-sign-off-by"
              value={state.closure.signOffBy}
              onChange={(e) => setClosure({ signOffBy: e.target.value })}
              placeholder="Signed off by (Executive Sponsor)"
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <label
              htmlFor="mv-sign-off-date"
              className="text-[11px] font-medium text-muted-foreground"
            >
              Sign-off date
            </label>
            <Input
              id="mv-sign-off-date"
              value={state.closure.signOffDate}
              onChange={(e) => setClosure({ signOffDate: e.target.value })}
              placeholder="Date (YYYY-MM-DD)"
              className="mt-1 text-xs"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          BAU handover — name the permanent owner of each never-ending capability:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BAU_CAPABILITIES.map((cap) => {
            const capId = `mv-bau-owner-${cap.toLowerCase().replace(/\s+/g, '-')}`
            return (
              <div key={cap} className="flex items-center gap-2">
                <label
                  htmlFor={capId}
                  className="text-xs font-medium text-foreground w-32 shrink-0"
                >
                  {cap}
                </label>
                <Input
                  id={capId}
                  value={state.closure.bauOwners[cap]}
                  onChange={(e) => setBauOwner(cap, e.target.value)}
                  placeholder="owner / team"
                  aria-label={`${cap} owner`}
                  className="text-xs"
                />
              </div>
            )
          })}
        </div>
      </section>

      <ExportableArtifact
        title="Migration Verification — Export"
        exportData={exportMarkdown}
        csvData={exportCsv}
        filename="migration-verification"
        formats={['markdown', 'csv', 'pdf', 'docx']}
        wideTable
        onExport={() => {
          addExecutiveDocument({
            id: `migration-verification-${Date.now()}`,
            moduleId: 'migration-program',
            type: 'migration-verification',
            title: `Migration Verification & Closure — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: state,
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Export the sample reference entries, retirement-planning notes, closure decision and BAU
          handover as educational drafts. Recording these fields does not establish that a migration
          or retirement was performed.
        </p>
      </ExportableArtifact>
    </div>
  )
}
