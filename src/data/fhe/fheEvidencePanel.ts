// SPDX-License-Identifier: GPL-3.0-only
/**
 * What the workshop's results panel shows for one validated step (owner decision 2026-10-03:
 * "Summary + key numbers table"). Built only from the signed manifest record: the optional
 * `summary` (headline and key numbers), else the structured fields every record has. Nothing
 * here reads a raw log. Wording rule: a board is a "software token", never hardware custody.
 */
import {
  DEVICE_LABELS,
  type ClaimScope,
  type DeviceRole,
  type EvidenceArtifact,
  type EvidencePart,
  type EvidenceRecord,
  type EvidenceStatus,
} from './fheEvidence'

export interface PanelFact {
  label: string
  value: string
}

export interface PanelModel {
  /** One plain sentence; absent when the record has no `summary`. */
  headline: string | null
  /** Headline measurements as display strings ("42.7 s"); empty when the record has no `summary`. */
  keyNumbers: { label: string; value: string }[]
  /** Device and role, result, status, date, claim scope, library. Always present. */
  facts: PanelFact[]
  /** How it was measured: samples, distribution, memory method. */
  method: string
  /** Provenance caveats from the record, if any. */
  notes: string | null
  /** The file a reader should open first, then every pinned file. */
  primaryFile: EvidenceArtifact
  files: EvidenceArtifact[]
}

export const CLAIM_SCOPE_TEXT: Record<ClaimScope, string> = {
  'reference-library': 'Reference library run, not the pqctoday-hsm engine',
  'browser-emulator': 'Browser emulator',
  'native-software-token': 'Software token, run natively',
  'owner-device': "The data owner's own device",
  'board-untrusted-compute': 'Board as untrusted compute (keys held in software)',
  'board-software-token': 'Software token on a board',
}

const ROLE_TEXT: Record<DeviceRole, string> = {
  'data-owner': 'data owner',
  'fhe-server': 'FHE server (untrusted compute)',
  custodian: 'custodian, software token',
  'backup-custodian': 'backup custodian, software token',
  party: 'key-holder party, software token',
}

const STATUS_TEXT: Record<EvidenceStatus, string> = {
  estimate: 'Estimate',
  measured: 'Measured',
  reproduced: 'Reproduced (run more than once)',
  'independently-reviewed': 'Independently reviewed',
}

/** "2026-10-03" or "2026-10-03T22:24:00Z" → "3 Oct 2026" (UTC, so the day never shifts). */
export function formatEvidenceDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function partLine(p: EvidencePart): string {
  const role = p.failover ? 'custodian after failover, software token' : ROLE_TEXT[p.role]
  return `${DEVICE_LABELS[p.device]}: ${role}${p.qualifier ? p.qualifier : ''}`
}

/** Pure: the same record always gives the same panel. */
export function evidencePanelModel(record: EvidenceRecord): PanelModel {
  const r = record
  const facts: PanelFact[] = []
  facts.push({ label: 'Run', value: r.claimLabel ?? `${r.library.name} ${r.library.version}` })
  if (r.parts?.length)
    facts.push({ label: 'Devices and roles', value: r.parts.map(partLine).join('\n') })
  else if (r.platformLabel) facts.push({ label: 'Platform', value: r.platformLabel })
  facts.push({ label: 'Result', value: r.result === 'pass' ? 'Passed' : 'Failed' })
  facts.push({ label: 'Evidence level', value: STATUS_TEXT[r.status] ?? r.status })
  facts.push({ label: 'Date', value: formatEvidenceDate(r.measuredAt) })
  const scopes = r.parts?.length
    ? [...new Set(r.parts.map((p) => CLAIM_SCOPE_TEXT[p.claimScope]))]
    : r.claimScope
      ? [CLAIM_SCOPE_TEXT[r.claimScope]]
      : []
  if (scopes.length) facts.push({ label: 'What it claims', value: scopes.join('\n') })
  facts.push({ label: 'Library', value: `${r.library.name} ${r.library.version}` })

  const m = r.method
  const method = `${m.samples} sample${m.samples === 1 ? '' : 's'} (${m.distribution}). Peak memory: ${m.peakMemoryMethod}.`

  return {
    headline: r.summary?.headline.trim() || null,
    keyNumbers: (r.summary?.keyNumbers ?? []).map((k) => ({
      label: k.label,
      value: k.unit ? `${k.value} ${k.unit}` : k.value,
    })),
    facts,
    method,
    notes: r.notes?.trim() || null,
    primaryFile: r.artifacts[0],
    files: r.artifacts,
  }
}
