// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { X } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  PQC_ALGORITHMS,
  PQC_SUPPORT_MATRIX,
  SUPPORT_STATUS_COLORS,
  SUPPORT_STATUS_LABELS,
  ROADMAP_EVENTS,
  RUNTIME_SUPPORT,
  READINESS_FILTER_OPTIONS,
  TABLE_REVIEW_DATE,
  type MatrixStatus,
} from '../data/pqcSupportData'
import { CRYPTO_APIS } from '../data/apiData'
import { Button } from '@/components/ui/button'

type FamilyFilter = 'All' | 'KEM' | 'Signature' | 'Hash-based Sig'
type StatusFilter = 'All' | MatrixStatus

const FAMILY_ITEMS = [
  { id: 'All', label: 'All Families' },
  { id: 'KEM', label: 'KEM' },
  { id: 'Signature', label: 'Signature' },
  { id: 'Hash-based Sig', label: 'Hash-based Sig' },
]

const STATUS_ITEMS = READINESS_FILTER_OPTIONS

type Tab = 'matrix' | 'runtimes' | 'roadmap'

const TAB_LABELS: Record<Tab, string> = {
  matrix: 'Support Matrix',
  runtimes: 'Language Runtimes',
  roadmap: 'Roadmap Timeline',
}

interface CellDetail {
  apiId: string
  algorithmId: string
}

export const PQCSupportMatrix: React.FC = () => {
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>('All')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('matrix')

  const filteredAlgos = PQC_ALGORITHMS.filter(
    (a) => familyFilter === 'All' || a.family === familyFilter
  )

  const getCell = (apiId: string, algoId: string) =>
    PQC_SUPPORT_MATRIX.find((c) => c.apiId === apiId && c.algorithmId === algoId)

  const selectedDetail = selectedCell
    ? PQC_SUPPORT_MATRIX.find(
        (c) => c.apiId === selectedCell.apiId && c.algorithmId === selectedCell.algorithmId
      )
    : null

  const visibleApis = CRYPTO_APIS

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {(['matrix', 'runtimes', 'roadmap'] as const).map((tab) => (
            <Button
              variant="ghost"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {TAB_LABELS[tab]}
            </Button>
          ))}
        </div>
        {activeTab === 'matrix' && (
          <>
            <FilterDropdown
              label="Algorithm Family"
              items={FAMILY_ITEMS}
              selectedId={familyFilter}
              onSelect={(id) => setFamilyFilter(id as FamilyFilter)}
            />
            <FilterDropdown
              label="Status"
              items={STATUS_ITEMS}
              selectedId={statusFilter}
              onSelect={(id) => setStatusFilter(id as StatusFilter)}
            />
          </>
        )}
      </div>

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SUPPORT_STATUS_COLORS) as [MatrixStatus, string][]).map(
              ([status, cls]) => (
                <div key={status} className={`text-xs px-2 py-1 rounded border ${cls}`}>
                  {SUPPORT_STATUS_LABELS[status]}
                </div>
              )
            )}
          </div>

          {/* Matrix table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 text-muted-foreground font-medium w-28 border-b border-border">
                    API
                  </th>
                  {filteredAlgos.map((algo) => (
                    <th
                      key={algo.id}
                      className="p-2 text-center border-b border-border min-w-[90px]"
                    >
                      <div className="font-semibold text-foreground">{algo.label}</div>
                      <div className="text-xs text-muted-foreground">{algo.fips}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleApis.map((api) => (
                  <tr key={api.id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">
                      {api.name}
                    </td>
                    {filteredAlgos.map((algo) => {
                      const cell = getCell(api.id, algo.id)
                      const status = cell?.status ?? 'not-implemented'
                      if (statusFilter !== 'All' && status !== statusFilter) {
                        return (
                          <td key={algo.id} className="p-2 text-center text-muted-foreground/30">
                            —
                          </td>
                        )
                      }
                      return (
                        <td key={algo.id} className="p-2 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedCell({ apiId: api.id, algorithmId: algo.id })}
                            className={`text-xs px-2 py-1 rounded border transition-all hover:opacity-80 cursor-pointer ${SUPPORT_STATUS_COLORS[status]}`}
                          >
                            {SUPPORT_STATUS_LABELS[status]}
                          </Button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cell detail panel */}
          {selectedDetail && selectedCell && (
            <div className="glass-panel p-4 border-l-4 border-primary">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-foreground">
                    {CRYPTO_APIS.find((a) => a.id === selectedCell.apiId)?.name} ×{' '}
                    {PQC_ALGORITHMS.find((a) => a.id === selectedCell.algorithmId)?.label}
                  </h4>
                  <div
                    className={`inline-block text-xs px-2 py-0.5 rounded border mt-1 ${SUPPORT_STATUS_COLORS[selectedDetail.status]}`}
                  >
                    {SUPPORT_STATUS_LABELS[selectedDetail.status]}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCell(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    Version Required
                  </div>
                  <code className="text-sm font-mono text-primary">{selectedDetail.version}</code>
                </div>
                <div>
                  <div className="font-semibold text-xs text-muted-foreground mb-1">Notes</div>
                  <p className="text-sm text-muted-foreground">{selectedDetail.notes}</p>
                </div>
              </div>
              {selectedDetail.protocolNote && (
                <div className="mt-3">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    Protocol integration
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedDetail.protocolNote}</p>
                </div>
              )}
              {selectedDetail.evidenceUrl && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Source:{' '}
                  <a
                    href={selectedDetail.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {selectedDetail.evidenceUrl}
                  </a>{' '}
                  (checked {selectedDetail.checkedDate})
                </p>
              )}
              {selectedDetail.codeSnippet && (
                <div className="mt-3">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    Code Snippet
                  </div>
                  <pre className="bg-muted/50 rounded p-3 text-xs font-mono text-foreground overflow-x-auto">
                    <code>{selectedDetail.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'runtimes' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Standardised PQC primitives in each language runtime or library, with the backend each
            one depends on. Primitive availability and protocol (TLS, X.509) support are listed
            separately because they often ship in different releases. Table reviewed{' '}
            {TABLE_REVIEW_DATE}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="p-2 font-medium">Runtime / API</th>
                  <th className="p-2 font-medium">Algorithm</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Minimum version</th>
                  <th className="p-2 font-medium">Backend / protocol</th>
                </tr>
              </thead>
              <tbody>
                {RUNTIME_SUPPORT.map((row) => (
                  <tr
                    key={`${row.runtimeId}-${row.algorithm}`}
                    className="border-b border-border align-top"
                  >
                    <td className="p-2">
                      <div className="font-medium text-foreground">{row.runtime}</div>
                      <code className="text-xs text-primary break-words">{row.api}</code>
                    </td>
                    <td className="p-2 whitespace-nowrap text-foreground">{row.algorithm}</td>
                    <td className="p-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${SUPPORT_STATUS_COLORS[row.status]}`}
                      >
                        {SUPPORT_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">{row.minVersion}</td>
                    <td className="p-2 text-xs text-muted-foreground space-y-1">
                      <p>{row.backend}</p>
                      <p>
                        <span className="font-semibold">Protocol:</span> {row.protocolNote}
                      </p>
                      <a
                        href={row.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Source
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Timeline of PQC support additions across major crypto APIs.
          </p>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
            {[...ROADMAP_EVENTS]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((event, i) => {
                const api = CRYPTO_APIS.find((a) => a.id === event.apiId)
                return (
                  <div key={i} className="relative mb-4">
                    <div className="absolute left-[-29px] w-3 h-3 rounded-full bg-primary border-2 border-background top-1.5" />
                    <div className="glass-panel p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">
                          {event.date}
                        </span>
                        <span className="font-semibold text-foreground">
                          {api?.name ?? event.apiId}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.event}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.algorithms.map((a) => (
                          <span
                            key={a}
                            className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
