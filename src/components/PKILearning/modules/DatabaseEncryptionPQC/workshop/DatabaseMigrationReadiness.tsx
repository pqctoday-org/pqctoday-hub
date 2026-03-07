// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { CheckSquare, Square, AlertTriangle, CheckCircle } from 'lucide-react'
import { DATABASE_PROFILES, COMPLEXITY_LABELS } from '../data/databaseConstants'

interface ChecklistItem {
  id: string
  category: 'inventory' | 'technical' | 'compliance'
  label: string
  description: string
  priority: 'critical' | 'high' | 'medium'
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Inventory
  {
    id: 'crypto-audit',
    category: 'inventory',
    label: 'Cryptographic algorithm audit complete',
    description:
      'All databases enumerated with algorithm metadata: TDE mechanism, key wrapping algorithm, key sizes, and key ages.',
    priority: 'critical',
  },
  {
    id: 'dek-hierarchy',
    category: 'inventory',
    label: 'DEK hierarchy fully documented',
    description:
      'Master key → Zone key → DEK chain documented for every encrypted database. Key custody (provider-managed / BYOK / HYOK) identified per database.',
    priority: 'critical',
  },
  {
    id: 'external-kms',
    category: 'inventory',
    label: 'External KMS integration configured',
    description:
      'KMIP 2.0 connection established from database servers to external KMS (Thales/HashiCorp/AWS). Connectivity tested with PING and LOCATE operations.',
    priority: 'high',
  },
  // Technical
  {
    id: 'pqc-kms',
    category: 'technical',
    label: 'PQC-capable KMS available',
    description:
      'Thales CipherTrust (roadmap), AWS KMS (ML-KEM preview), or Azure Managed HSM with PQC support provisioned and accessible from all database hosts.',
    priority: 'critical',
  },
  {
    id: 'hsm-firmware',
    category: 'technical',
    label: 'HSM firmware supports ML-KEM-1024',
    description:
      'HSM firmware version verified to support PKCS#11 v3.2 CKM_ML_KEM_* mechanisms. Upgrade scheduled if firmware is pre-PQC.',
    priority: 'high',
  },
  {
    id: 'tde-reencrypt',
    category: 'technical',
    label: 'TDE re-encryption tested in non-prod',
    description:
      'Online TDE re-encryption with new ML-KEM-wrapped DEK tested on non-production replica. Performance impact measured and documented.',
    priority: 'high',
  },
  {
    id: 'app-crypto-agile',
    category: 'technical',
    label: 'Application layer crypto is agile',
    description:
      'Applications using column-level or field-level encryption updated to use algorithm-agnostic crypto abstraction layer. No hardcoded RSA-OAEP calls.',
    priority: 'medium',
  },
  // Compliance
  {
    id: 'gdpr-hipaa-assessed',
    category: 'compliance',
    label: 'GDPR / HIPAA impact assessed',
    description:
      'Data retention periods mapped to HNDL risk windows. Databases containing long-lived personal data (PHI, PII) prioritized for early migration.',
    priority: 'critical',
  },
  {
    id: 'vendor-timeline',
    category: 'compliance',
    label: 'Vendor PQC timeline confirmed',
    description:
      'Database vendor roadmap reviewed for ML-KEM support dates. Upgrade path documented for each database product in inventory.',
    priority: 'high',
  },
  {
    id: 'migration-window',
    category: 'compliance',
    label: 'Migration window scheduled',
    description:
      'Maintenance windows booked for online re-encryption of high-risk databases. Change management approval obtained. Rollback procedure documented.',
    priority: 'medium',
  },
]

const CATEGORY_LABELS = {
  inventory: { label: 'Inventory', color: 'text-primary' },
  technical: { label: 'Technical', color: 'text-status-warning' },
  compliance: { label: 'Compliance', color: 'text-status-info' },
}

const PRIORITY_STYLES = {
  critical: 'text-status-error border-status-error/30 bg-status-error/10',
  high: 'text-status-warning border-status-warning/30 bg-status-warning/10',
  medium: 'text-muted-foreground border-border bg-muted',
}

const SHOWN_DBS = ['oracle', 'sqlserver', 'postgresql', 'mongodb', 'mysql']

export const DatabaseMigrationReadiness: React.FC = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const totalItems = CHECKLIST_ITEMS.length
  const checkedCount = CHECKLIST_ITEMS.filter((item) => checked.has(item.id)).length
  const score = Math.round((checkedCount / totalItems) * 100)

  const scoreColor =
    score >= 80 ? 'text-status-success' : score >= 50 ? 'text-status-warning' : 'text-status-error'
  const scoreBarColor =
    score >= 80 ? 'bg-status-success' : score >= 50 ? 'bg-status-warning' : 'bg-status-error'

  const uncheckedCritical = CHECKLIST_ITEMS.filter(
    (item) => item.priority === 'critical' && !checked.has(item.id)
  )

  const categories = ['inventory', 'technical', 'compliance'] as const

  return (
    <div className="space-y-6">
      {/* Readiness score */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-sm font-bold text-foreground">Fleet Readiness Score</div>
            <div className="text-xs text-muted-foreground">
              {checkedCount} of {totalItems} items complete
            </div>
          </div>
          <div className={`text-3xl font-bold ${scoreColor}`}>{score}%</div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {score === 100 && (
          <div className="mt-3 flex items-center gap-2 text-status-success text-sm font-bold">
            <CheckCircle size={16} />
            Ready for PQC migration
          </div>
        )}
      </div>

      {/* Checklist by category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const items = CHECKLIST_ITEMS.filter((item) => item.category === category)
          const catChecked = items.filter((item) => checked.has(item.id)).length
          const catLabel = CATEGORY_LABELS[category]
          return (
            <div key={category} className="glass-panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-sm font-bold ${catLabel.color}`}>{catLabel.label}</span>
                <span className="text-xs text-muted-foreground">
                  {catChecked}/{items.length} complete
                </span>
              </div>
              <div className="space-y-3">
                {items.map((item) => {
                  const isChecked = checked.has(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        isChecked
                          ? 'border-status-success/30 bg-status-success/5'
                          : 'border-border bg-muted/20 hover:bg-muted/40'
                      }`}
                      onClick={() => toggle(item.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {isChecked ? (
                            <CheckSquare size={18} className="text-status-success" />
                          ) : (
                            <Square size={18} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`text-sm font-medium ${isChecked ? 'text-status-success line-through' : 'text-foreground'}`}
                            >
                              {item.label}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PRIORITY_STYLES[item.priority]}`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Priority Gaps */}
      {uncheckedCritical.length > 0 && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-status-error" />
            <div className="text-sm font-bold text-status-error">
              Critical Gaps ({uncheckedCritical.length})
            </div>
          </div>
          <ul className="space-y-1.5">
            {uncheckedCritical.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-status-error shrink-0 mt-0.5">!</span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Database fleet complexity table */}
      <div className="glass-panel p-5">
        <div className="text-sm font-bold text-foreground mb-3">
          Database Fleet Migration Complexity
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Database</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Complexity
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  PQC Status
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Recommended Action
                </th>
              </tr>
            </thead>
            <tbody>
              {DATABASE_PROFILES.filter((p) => SHOWN_DBS.includes(p.id)).map((db) => {
                const complexity = COMPLEXITY_LABELS[db.migrationComplexity]
                const action =
                  db.migrationComplexity === 'very-high'
                    ? 'Prioritize — engage Oracle/vendor PS team'
                    : db.migrationComplexity === 'high'
                      ? 'Plan now — external KMS + firmware upgrade required'
                      : db.migrationComplexity === 'medium'
                        ? 'Schedule within 18 months'
                        : 'Low risk — address after critical systems'
                return (
                  <tr key={db.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-medium text-foreground">{db.vendor}</td>
                    <td className={`py-2 px-2 font-bold ${complexity.color}`}>
                      {complexity.label}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`font-bold ${
                          db.pqcSupport === 'ga'
                            ? 'text-status-success'
                            : db.pqcSupport === 'planned'
                              ? 'text-status-warning'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {db.pqcSupport === 'ga'
                          ? 'GA'
                          : db.pqcSupport === 'planned'
                            ? 'Planned'
                            : 'None'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{action}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
