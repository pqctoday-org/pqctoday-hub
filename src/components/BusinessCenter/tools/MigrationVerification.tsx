// SPDX-License-Identifier: GPL-3.0-only
/**
 * Migration Verification & Program Closure — the framework's 9th block
 * (Applied Quantum v2.1 p140-144). Closes the loop a CBOM "migration status"
 * cannot: it forces *evidence* that migration happened, logs the
 * decommissioning of classical material, and records formal closure to BAU.
 *
 * Three sections → the framework's four named deliverables:
 *  1. Verification recorder — the 5-point evidence standard. A system is
 *     "Verified" ONLY when all five evidence fields are present; otherwise it is
 *     "Unverified (n/5)". You cannot mark a system done off a change-ticket.
 *  2. Decommissioning log — classical key/cert retirement per the org's own
 *     key-destruction standard (e.g. NIST SP 800-88 purge/destroy procedures —
 *     the framework names "the organization's key destruction standard," not
 *     SP 800-88 specifically; SP 800-88 is media sanitization guidance whose
 *     Purge/Destroy actions are commonly reused for key material). An
 *     unconfirmed signing-key retirement raises a Trust-Now-Forge-Later flag.
 *  3. Closure & BAU handover — closure sign-off + the permanent owners of the
 *     never-ending capabilities (Discovery, CBOM, Risk, Vendor governance).
 */
import React, { useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
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
    hint: 'A captured handshake showing PQC was actually negotiated — evidence, not configuration.',
  },
  {
    key: 'negativeTest',
    label: 'Negative test',
    hint: 'A classical-only peer is rejected or downgraded exactly as intended.',
  },
  {
    key: 'certChainUnderPqc',
    label: 'Cert-chain under PQC',
    hint: 'The full certificate chain validates with PQC signatures.',
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
}

export interface DecommissionRow {
  id: string
  material: string
  kind: DecommissionKind
  retiredDate: string
  owner: string
  method: string
  confirmed: boolean
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
    },
  ],
  closure: {
    decision: '',
    signOffBy: '',
    signOffDate: '',
    bauOwners: { Discovery: '', CBOM: '', Risk: '', 'Vendor governance': '' },
  },
}

/** How many of the 5 evidence fields are filled in for a record. */
export function verifiedCount(r: VerificationRecord): number {
  return EVIDENCE_FIELDS.filter((f) => r.evidence[f.key].trim().length > 0).length
}
export const isVerified = (r: VerificationRecord): boolean =>
  verifiedCount(r) === EVIDENCE_FIELDS.length

/** A retired-but-unconfirmed signing key is a standing Trust-Now-Forge-Later risk. */
export const isTnflLiability = (d: DecommissionRow): boolean =>
  d.kind === 'signing-key' && !d.confirmed

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
  lines.push('| System | Negotiation | Neg-test | Cert-chain | Downgrade | Dossier | Status |')
  lines.push('|---|:--:|:--:|:--:|:--:|:--:|---|')
  for (const r of state.records) {
    const cell = (k: EvidenceField) => (r.evidence[k].trim() ? '✓' : '—')
    const status = isVerified(r) ? '**Verified**' : `Unverified (${verifiedCount(r)}/5)`
    lines.push(
      `| ${r.system || '_(unnamed)_'} | ${cell('observedNegotiation')} | ${cell('negativeTest')} | ${cell('certChainUnderPqc')} | ${cell('downgradeDocumented')} | ${cell('dossierLink')} | ${status} |`
    )
  }
  const verified = state.records.filter(isVerified).length
  lines.push('')
  lines.push(
    `> ${verified}/${state.records.length} systems verified. A system is only "Verified" with all five evidence points — observed negotiation (not configuration), negative testing, cert-chain validation under PQC, documented downgrade/fallback, and evidence filed to the dossier.`
  )
  lines.push('')

  // 2 — Decommissioning log.
  lines.push('## Decommissioning log (classical material)')
  lines.push('')
  if (state.decommissions.length === 0) {
    lines.push('_No classical material logged for decommissioning._')
  } else {
    lines.push('| Material | Kind | Retired | Owner | Method | Confirmed |')
    lines.push('|---|---|---|---|---|---|')
    for (const d of state.decommissions) {
      const confirmed = d.confirmed ? '✓' : isTnflLiability(d) ? '⚠ TNFL liability' : 'pending'
      lines.push(
        `| ${d.material || '—'} | ${d.kind} | ${d.retiredDate || '—'} | ${d.owner || '—'} | ${d.method || '—'} | ${confirmed} |`
      )
    }
    lines.push('')
    lines.push(
      "> A retired-but-trusted signing key is a standing Trust-Now-Forge-Later liability — destroy per your organization's key-destruction standard and confirm."
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
  const setSystem = (id: string, system: string) =>
    setState((prev) => ({
      ...prev,
      records: prev.records.map((r) => (r.id === id ? { ...r, system } : r)),
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
  const verifiedTotal = state.records.filter(isVerified).length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <ClipboardCheck size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Migration Verification &amp; Program Closure
          </h2>
          <p className="text-sm text-muted-foreground">
            Prove migration with the 5-point evidence standard, log classical-key decommissioning
            per your organization's key-destruction standard, and record closure &amp; BAU handover.
            Verification ≠ migration.
          </p>
        </div>
      </header>

      {/* 1 — Verification recorder */}
      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Verification records · {verifiedTotal}/{state.records.length} verified
        </h3>
        <p className="text-xs text-muted-foreground">
          A system is <span className="font-medium text-foreground">Verified</span> only when all
          five evidence fields are filled — observed negotiation (not configuration), negative
          testing, cert-chain under PQC, documented downgrade, and evidence in the dossier.
        </p>
        <div className="space-y-3">
          {state.records.map((r) => {
            const n = verifiedCount(r)
            const done = n === EVIDENCE_FIELDS.length
            return (
              <div key={r.id} className="glass-panel border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={r.system}
                    onChange={(e) => setSystem(r.id, e.target.value)}
                    placeholder="System (e.g. Public web TLS)"
                    aria-label="System"
                    className="flex-1"
                  />
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      done
                        ? 'border-status-success/40 bg-status-success/10 text-status-success'
                        : 'border-status-warning/40 bg-status-warning/10 text-status-warning'
                    }`}
                  >
                    {done ? 'Verified' : `Unverified ${n}/5`}
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
                        onChange={(e) => setEvidence(r.id, f.key, e.target.value)}
                        placeholder="evidence ref…"
                        className="mt-1 text-xs"
                      />
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
      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Decommissioning log (classical material)
        </h3>
        <p className="text-xs text-muted-foreground">
          A retired-but-trusted <span className="font-medium text-foreground">signing key</span> is
          a standing Trust-Now-Forge-Later liability — destroy per your organization's
          key-destruction standard and confirm.
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
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={d.confirmed}
                  onChange={(e) => setDecommission(d.id, { confirmed: e.target.checked })}
                  aria-label="Destruction confirmed"
                />
                {d.confirmed ? 'confirmed' : isTnflLiability(d) ? '⚠ TNFL' : 'pending'}
              </label>
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
      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Closure &amp; BAU handover</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            value={state.closure.decision}
            onChange={(e) => setClosure({ decision: e.target.value })}
            placeholder="Closure decision / scope"
            aria-label="Closure decision"
            className="text-xs sm:col-span-3"
          />
          <Input
            value={state.closure.signOffBy}
            onChange={(e) => setClosure({ signOffBy: e.target.value })}
            placeholder="Signed off by (Executive Sponsor)"
            aria-label="Signed off by"
            className="text-xs sm:col-span-2"
          />
          <Input
            value={state.closure.signOffDate}
            onChange={(e) => setClosure({ signOffDate: e.target.value })}
            placeholder="Date (YYYY-MM-DD)"
            aria-label="Sign-off date"
            className="text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          BAU handover — name the permanent owner of each never-ending capability:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BAU_CAPABILITIES.map((cap) => (
            <div key={cap} className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground w-32 shrink-0">{cap}</span>
              <Input
                value={state.closure.bauOwners[cap]}
                onChange={(e) => setBauOwner(cap, e.target.value)}
                placeholder="owner / team"
                aria-label={`${cap} owner`}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      </section>

      <ExportableArtifact
        title="Migration Verification — Export"
        exportData={exportMarkdown}
        filename="migration-verification"
        formats={['markdown', 'pdf', 'docx']}
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
          Export the verification records, decommissioning log, closure decision and BAU handover —
          the evidence that migration actually happened.
        </p>
      </ExportableArtifact>
    </div>
  )
}
