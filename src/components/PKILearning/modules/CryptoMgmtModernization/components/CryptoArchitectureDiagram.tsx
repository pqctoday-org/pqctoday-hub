// SPDX-License-Identifier: GPL-3.0-only
/**
 * Crypto Architecture Diagram builder — CSWP.39 §5.4.
 *
 * Form-driven capture of the organisation's cryptographic architecture
 * (applications, libraries, HSMs, protocols, key stores, certificate
 * authorities) and the dependencies between them. Output is a structured
 * markdown document plus an embedded Mermaid graph block so the artifact
 * renders as a real diagram inside the Command Center artifact viewer.
 *
 * Persists to the Command Center via `useModuleStore.addExecutiveDocument` —
 * the same flow as RiskRegisterBuilder etc.
 */
import React, { useCallback, useMemo, useState } from 'react'
import { Plus, Trash2, Save, Copy, Check, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import { useAlgorithmTransitionsForAssessment } from '@/hooks/useAlgorithmTransitionsForAssessment'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

type ComponentKind =
  | 'application'
  | 'library'
  | 'hsm'
  | 'protocol'
  | 'key-store'
  | 'certificate-authority'

interface ArchComponent {
  id: string
  kind: ComponentKind
  name: string
  /** e.g. version, vendor, FIPS cert, PQC support notes */
  detail: string
  /** Comma-separated list of other component ids this depends on. */
  dependsOn: string
}

const KIND_LABELS: Record<ComponentKind, string> = {
  application: 'Application',
  library: 'Library / Crypto API',
  hsm: 'HSM / Hardware key store',
  protocol: 'Protocol',
  'key-store': 'Software key store',
  'certificate-authority': 'Certificate Authority',
}

const KIND_PLACEHOLDERS: Record<ComponentKind, string> = {
  application: 'e.g. payment-gateway, version 4.2',
  library: 'e.g. OpenSSL 3.4 (PQC via OQS provider)',
  hsm: 'e.g. nCipher nShield XC, FIPS 140-3 L3, no ML-DSA',
  protocol: 'e.g. TLS 1.3 hybrid X25519+ML-KEM-768',
  'key-store': 'e.g. HashiCorp Vault, transit engine',
  'certificate-authority': 'e.g. Internal Root CA, RSA-3072 (no PQC yet)',
}

const newId = () => `c-${Math.random().toString(36).slice(2, 9)}`

const seedComponents = (): ArchComponent[] => [
  {
    id: 'app-1',
    kind: 'application',
    name: 'Customer-facing web app',
    detail: 'Public TLS endpoint',
    dependsOn: 'lib-1, ca-1',
  },
  {
    id: 'lib-1',
    kind: 'library',
    name: 'OpenSSL',
    detail: '3.4 + OQS provider (ML-KEM-768, ML-DSA-65)',
    dependsOn: 'hsm-1',
  },
  {
    id: 'hsm-1',
    kind: 'hsm',
    name: 'Network HSM',
    detail: 'FIPS 140-3 L3, no ML-DSA firmware yet',
    dependsOn: '',
  },
  {
    id: 'ca-1',
    kind: 'certificate-authority',
    name: 'Internal Root CA',
    detail: 'RSA-3072, hybrid roadmap 2027',
    dependsOn: '',
  },
]

function sanitiseId(id: string): string {
  // Mermaid node IDs only allow alphanumerics/underscore.
  return id.replace(/[^a-zA-Z0-9_]/g, '_') || 'node'
}

function buildMermaid(components: ArchComponent[]): string {
  const lines: string[] = ['flowchart LR']
  for (const c of components) {
    const id = sanitiseId(c.id)
    const label = `${KIND_LABELS[c.kind]}: ${c.name || c.id}`
    const safeLabel = label.replace(/"/g, "'")
    lines.push(`  ${id}["${safeLabel}"]`)
  }
  for (const c of components) {
    const targets = c.dependsOn
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    for (const target of targets) {
      // Only draw an edge if the target id is real.
      if (components.some((other) => other.id === target)) {
        lines.push(`  ${sanitiseId(c.id)} --> ${sanitiseId(target)}`)
      }
    }
  }
  return lines.join('\n')
}

function buildMarkdown(components: ArchComponent[]): string {
  let md = '# Crypto Architecture\n\n'
  md +=
    "*Documents the organisation's cryptographic architecture per NIST CSWP.39 §5.4 — " +
    'libraries, HSMs, protocols, key stores, and certificate authorities, with their ' +
    'inter-dependencies.*\n\n'

  md += '## Components\n\n'
  md += '| Kind | Name | Detail | Depends on |\n'
  md += '|---|---|---|---|\n'
  for (const c of components) {
    md += `| ${KIND_LABELS[c.kind]} | ${c.name || '—'} | ${c.detail || '—'} | ${c.dependsOn || '—'} |\n`
  }

  md += '\n## Dependency diagram\n\n'
  md += '```mermaid\n'
  md += buildMermaid(components)
  md += '\n```\n'

  md += '\n## Notes\n\n'
  md += `- Generated ${new Date().toISOString().slice(0, 10)} (CSWP.39 §5.4 — Cryptographic Architecture).\n`
  md += '- Update this document whenever components change FIPS status, PQC support, or vendor.\n'
  md += '- Cross-link this document from the policy generator and risk register for traceability.\n'

  return md
}

function buildAssessmentSeed(
  useCases: string[],
  transitions: ReturnType<typeof useAlgorithmTransitionsForAssessment>,
  myProducts: ReturnType<typeof useExecutiveModuleData>['myProducts']
): ArchComponent[] {
  const out: ArchComponent[] = []
  // One library row per reported algorithm with its PQC target as detail.
  transitions.forEach((t, i) => {
    const id = `lib-${i + 1}`
    out.push({
      id,
      kind: 'library',
      name: `${t.classical}${t.keySize ? ` (${t.keySize})` : ''}`,
      detail: `Target: ${t.pqc} · ${t.status} · deprecation ${t.deprecationDate || 'TBD'}`,
      dependsOn: '',
    })
  })
  // One library/HSM row per bookmarked product on /migrate. Use kind=library
  // for typical crypto libraries; kind=hsm if the product name hints at one.
  myProducts.slice(0, 12).forEach((p, i) => {
    const isHsm = /hsm|nshield|cloudhsm/i.test(p.softwareName || '')
    const fipsBadge =
      p.fipsValidated && p.fipsValidated !== 'No' ? ` · FIPS: ${p.fipsValidated}` : ''
    const pqcBadge = p.pqcSupport && p.pqcSupport !== 'None' ? ` · PQC: ${p.pqcSupport}` : ''
    out.push({
      id: `prod-${i + 1}`,
      kind: isHsm ? 'hsm' : 'library',
      name: `${p.softwareName}${p.vendorId ? ` (${p.vendorId})` : ''}`,
      detail: `From /migrate selection.${fipsBadge}${pqcBadge}`,
      dependsOn: '',
    })
  })
  // One protocol row per reported use case so the user can attach dependencies.
  useCases.forEach((uc, i) => {
    out.push({
      id: `proto-${i + 1}`,
      kind: 'protocol',
      name: uc,
      detail: 'Reported in assessment use cases — fill in versions and PQC support.',
      dependsOn: out
        .filter((c) => c.kind === 'library')
        .map((c) => c.id)
        .join(', '),
    })
  })
  return out
}

export const CryptoArchitectureDiagram: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const { input } = useAssessmentSnapshot()
  const transitions = useAlgorithmTransitionsForAssessment()
  const { myProducts } = useExecutiveModuleData()
  const useCases = input?.cryptoUseCases ?? []
  const assessmentSeed = useMemo(
    () => buildAssessmentSeed(useCases, transitions, myProducts),
    [useCases, transitions, myProducts]
  )
  const hasAssessmentSeed = assessmentSeed.length > 0

  const [components, setComponents] = useState<ArchComponent[]>(() =>
    hasAssessmentSeed ? assessmentSeed : seedComponents()
  )
  const [seededFromAssessment, setSeededFromAssessment] = useState<boolean>(hasAssessmentSeed)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const markdown = useMemo(() => buildMarkdown(components), [components])

  const updateRow = useCallback((id: string, patch: Partial<ArchComponent>) => {
    setComponents((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const addRow = useCallback((kind: ComponentKind) => {
    setComponents((rows) => [...rows, { id: newId(), kind, name: '', detail: '', dependsOn: '' }])
  }, [])

  const removeRow = useCallback((id: string) => {
    setComponents((rows) => rows.filter((r) => r.id !== id))
  }, [])

  const handleSave = useCallback(() => {
    addExecutiveDocument({
      id: `crypto-architecture-${Date.now()}`,
      type: 'crypto-architecture',
      title: 'Crypto Architecture (CSWP.39 §5.4)',
      data: markdown,
      createdAt: Date.now(),
      moduleId: 'crypto-mgmt-modernization',
    })
    setSavedAt(Date.now())
  }, [markdown, addExecutiveDocument])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [markdown])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Network size={24} className="text-primary mt-1 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Crypto Architecture Diagram</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Capture every cryptographic component (apps, libraries, HSMs, protocols, key stores,
            CAs) and the dependencies between them. The artifact stores both the structured table
            and a Mermaid graph that renders inside the Command Center viewer.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Aligned with NIST CSWP.39 §5.4 — Cryptographic Architecture.
          </p>
        </div>
      </div>

      {seededFromAssessment && (
        <PreFilledBanner
          summary={[
            transitions.length > 0 &&
              `${transitions.length} library row${transitions.length !== 1 ? 's' : ''} from reported crypto`,
            myProducts.length > 0 &&
              `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`,
            useCases.length > 0 &&
              `${useCases.length} protocol row${useCases.length !== 1 ? 's' : ''} from use cases`,
          ]
            .filter(Boolean)
            .join(' + ')}
          onClear={() => {
            setComponents(seedComponents())
            setSeededFromAssessment(false)
          }}
        />
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Components</h3>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(KIND_LABELS) as ComponentKind[]).map((kind) => (
              <Button
                key={kind}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => addRow(kind)}
              >
                <Plus size={12} className="mr-1" />
                {KIND_LABELS[kind]}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Kind</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">
                  Detail (version, vendor, FIPS, PQC support)
                </th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">
                  Depends on (ids, comma-separated)
                </th>
                <th className="px-3 py-2 text-left font-semibold text-foreground w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {components.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 align-top text-foreground/85">
                    <select
                      value={c.kind}
                      onChange={(e) => updateRow(c.id, { kind: e.target.value as ComponentKind })}
                      className="text-xs bg-background border border-input rounded px-1.5 py-1 text-foreground"
                    >
                      {(Object.keys(KIND_LABELS) as ComponentKind[]).map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                      id: {c.id}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      value={c.name}
                      onChange={(e) => updateRow(c.id, { name: e.target.value })}
                      placeholder="Component name"
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      value={c.detail}
                      onChange={(e) => updateRow(c.id, { detail: e.target.value })}
                      placeholder={KIND_PLACEHOLDERS[c.kind]}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      value={c.dependsOn}
                      onChange={(e) => updateRow(c.id, { dependsOn: e.target.value })}
                      placeholder="lib-1, hsm-1"
                      className="h-8 text-xs font-mono"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeRow(c.id)}
                      aria-label="Remove component"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="gradient" onClick={handleSave}>
          <Save size={14} className="mr-1.5" />
          Save to Command Center
        </Button>
        <Button variant="outline" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={14} className="mr-1.5 text-status-success" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} className="mr-1.5" />
              Copy markdown
            </>
          )}
        </Button>
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            Last saved {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}

export default CryptoArchitectureDiagram
