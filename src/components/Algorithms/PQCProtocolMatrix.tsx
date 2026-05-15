// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PROTOCOL_MATRIX,
  type DimensionStatusValue,
  type TestabilityValue,
  type ProtocolMatrixRow,
  type DimensionStatus,
  type OssLibrary,
  type PlaygroundTool,
} from '../../data/pqcProtocolMatrix'
import { ExternalLink, FlaskConical, AlertTriangle, CheckCircle2, FileText } from 'lucide-react'

interface DimensionBadgeProps {
  status: DimensionStatus
}

function dimensionLabel(value: DimensionStatusValue): string {
  switch (value) {
    case 'rfc':
      return '✓ RFC'
    case 'draft':
      return '⊳ Draft'
    case 'experimental':
      return '⚠ Experimental'
    case 'none':
      return '✗ None'
    case 'na':
      return '— N/A'
  }
}

function dimensionTone(value: DimensionStatusValue): string {
  switch (value) {
    case 'rfc':
      return 'bg-status-success/15 text-status-success border-status-success/30'
    case 'draft':
      return 'bg-primary/15 text-primary border-primary/30'
    case 'experimental':
      return 'bg-status-warning/15 text-status-warning border-status-warning/30'
    case 'none':
      return 'bg-status-error/10 text-status-error border-status-error/30'
    case 'na':
      return 'bg-muted text-muted-foreground border-border'
  }
}

function DimensionBadge({ status }: DimensionBadgeProps) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${dimensionTone(
          status.value
        )}`}
        title={status.note}
      >
        {dimensionLabel(status.value)}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
        {status.note}
      </span>
    </div>
  )
}

function testabilityLabel(value: TestabilityValue): string {
  switch (value) {
    case 'full':
      return 'Full'
    case 'partial':
      return 'Partial'
    case 'none':
      return 'No'
    case 'na':
      return 'N/A'
  }
}

function testabilityTone(value: TestabilityValue): string {
  switch (value) {
    case 'full':
      return 'text-status-success'
    case 'partial':
      return 'text-status-warning'
    case 'none':
      return 'text-status-error'
    case 'na':
      return 'text-muted-foreground'
  }
}

function LibraryChip({ lib, tone }: { lib: OssLibrary; tone: 'oss' | 'commercial' }) {
  const toneClass =
    tone === 'oss'
      ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
      : 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
  return (
    <Link
      to={`/migrate?software=${encodeURIComponent(lib.productId)}`}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${toneClass}`}
      title={lib.versionNote ? `${lib.name} — ${lib.versionNote}` : lib.name}
    >
      {lib.name}
    </Link>
  )
}

function PlaygroundCell({ tool }: { tool: PlaygroundTool | null }) {
  if (!tool) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <AlertTriangle size={12} /> No tool
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <Link
        to={`/playground/${tool.toolId}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
      >
        <FlaskConical size={12} />
        {tool.toolName}
      </Link>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-tight">
        <span>
          pKEM:{' '}
          <span className={testabilityTone(tool.testability.pureKem)}>
            {testabilityLabel(tool.testability.pureKem)}
          </span>
        </span>
        <span>
          hKEM:{' '}
          <span className={testabilityTone(tool.testability.hybridKem)}>
            {testabilityLabel(tool.testability.hybridKem)}
          </span>
        </span>
        <span>
          pSig:{' '}
          <span className={testabilityTone(tool.testability.pureSig)}>
            {testabilityLabel(tool.testability.pureSig)}
          </span>
        </span>
        <span>
          hSig:{' '}
          <span className={testabilityTone(tool.testability.hybridSig)}>
            {testabilityLabel(tool.testability.hybridSig)}
          </span>
        </span>
      </div>
    </div>
  )
}

function DocList({ docs, label }: { docs: ProtocolMatrixRow['latestRelease']; label: string }) {
  if (docs.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <AlertTriangle size={12} /> None
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      {docs.map((d) => (
        <div key={d.id} className="flex flex-col gap-0.5">
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 text-xs text-primary hover:underline"
            title={`${label}: ${d.title}`}
          >
            <FileText size={11} className="mt-0.5 shrink-0" />
            <span className="font-medium">{d.id}</span>
            <ExternalLink size={9} className="mt-0.5 shrink-0 opacity-60" />
          </a>
          <span className="text-[10px] leading-tight text-muted-foreground">{d.date}</span>
        </div>
      ))}
    </div>
  )
}

export function PQCProtocolMatrix() {
  const totalGaps = useMemo(() => PROTOCOL_MATRIX.reduce((acc, p) => acc + p.gaps.length, 0), [])

  return (
    <div className="space-y-6">
      {/* Intro panel */}
      <div className="glass-panel space-y-2 p-4">
        <h3 className="text-lg font-semibold text-foreground">PQC Protocol Support Matrix</h3>
        <p className="text-sm text-muted-foreground">
          Cross-check of where post-quantum cryptography stands for the 10 standard protocol
          families. Each row shows the latest stable release, latest active draft, the 4 PQC
          dimensions (pure / hybrid × KEM / signature), open-source and commercial implementations
          that back the spec, and which dimensions our in-browser playground can exercise. Snapshot:
          2026-05-15.
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <span className="rounded-md bg-status-success/15 border border-status-success/30 text-status-success px-2 py-0.5">
            ✓ RFC = published standard
          </span>
          <span className="rounded-md bg-primary/15 border border-primary/30 text-primary px-2 py-0.5">
            ⊳ Draft = active IETF/TCG draft
          </span>
          <span className="rounded-md bg-status-warning/15 border border-status-warning/30 text-status-warning px-2 py-0.5">
            ⚠ Experimental
          </span>
          <span className="rounded-md bg-status-error/10 border border-status-error/30 text-status-error px-2 py-0.5">
            ✗ None
          </span>
          <span className="rounded-md bg-muted text-muted-foreground border border-border px-2 py-0.5">
            — N/A
          </span>
        </div>
      </div>

      {/* Main matrix table */}
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Protocol
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Latest Release
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Latest Draft
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pure KEM
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hybrid KEM
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pure Sig
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hybrid Sig
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Open Source
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Commercial
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Playground
              </th>
            </tr>
          </thead>
          <tbody>
            {PROTOCOL_MATRIX.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border/50 align-top hover:bg-muted/20 transition-colors"
              >
                <td className="sticky left-0 z-10 bg-card px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                      {p.description}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <DocList docs={p.latestRelease} label="Release" />
                </td>
                <td className="px-3 py-3">
                  <DocList docs={p.latestDraft} label="Draft" />
                </td>
                <td className="px-3 py-3">
                  <DimensionBadge status={p.dimensions.pureKem} />
                </td>
                <td className="px-3 py-3">
                  <DimensionBadge status={p.dimensions.hybridKem} />
                </td>
                <td className="px-3 py-3">
                  <DimensionBadge status={p.dimensions.pureSig} />
                </td>
                <td className="px-3 py-3">
                  <DimensionBadge status={p.dimensions.hybridSig} />
                </td>
                <td className="px-3 py-3">
                  {p.ossLibraries.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.ossLibraries.map((lib) => (
                        <LibraryChip key={lib.productId} lib={lib} tone="oss" />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  {p.commercialLibraries.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.commercialLibraries.map((lib) => (
                        <LibraryChip key={lib.productId} lib={lib} tone="commercial" />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <PlaygroundCell tool={p.playground} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gaps panel */}
      <div className="glass-panel space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <AlertTriangle size={18} className="text-status-warning" />
            Known Gaps ({totalGaps})
          </h3>
          <span className="text-xs text-muted-foreground">
            Aggregated across all 10 protocol families
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PROTOCOL_MATRIX.filter((p) => p.gaps.length > 0).map((p) => (
            <div key={p.id} className="rounded-md border border-border bg-muted/20 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{p.name}</span>
                <span className="rounded bg-status-warning/15 px-1.5 py-0.5 text-[10px] text-status-warning">
                  {p.gaps.length} {p.gaps.length === 1 ? 'gap' : 'gaps'}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {p.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-status-warning" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {PROTOCOL_MATRIX.filter((p) => p.gaps.length === 0).length > 0 && (
            <div className="rounded-md border border-status-success/30 bg-status-success/10 p-3 md:col-span-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-status-success" />
                <span className="text-foreground">No known gaps:</span>
                <span className="text-muted-foreground">
                  {PROTOCOL_MATRIX.filter((p) => p.gaps.length === 0)
                    .map((p) => p.name)
                    .join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
