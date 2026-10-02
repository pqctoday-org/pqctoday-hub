// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Refresh public/data/jose-drafts-snapshot.json from the IETF datatracker.
 *
 * The JOSE matrix audit panel (APISecurityJWT/workshop/JOSEProtocolMatrixAudit.tsx)
 * compares the Protocol Matrix JOSE row against this snapshot. Until 2026-10-01
 * the file said "refresh via scripts/audit-jose-matrix.ts" — a script that never
 * existed — so it could only be hand-transcribed and sat at 2026-05-17 while
 * three of its drafts moved on (one changed scope entirely: pqc-kem -06 is
 * COSE-only).
 *
 * For each draft it records what a freshness check actually needs: revision,
 * revision date, title (scope changes show up here first), datatracker state,
 * IESG state and RFC Editor state. Curated fields already in the file
 * (alg_codes_introduced, key_type_introduced, covers, note) are kept as-is.
 *
 * Usage:
 *   npx tsx scripts/refresh-jose-drafts-snapshot.ts          # write
 *   npx tsx scripts/refresh-jose-drafts-snapshot.ts --check  # exit 1 if stale
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SNAPSHOT = resolve(process.cwd(), 'public/data/jose-drafts-snapshot.json')
const DATATRACKER = 'https://datatracker.ietf.org/doc'

interface SnapshotEntry {
  current_version: string
  current_date: string
  title?: string
  state?: string
  iesg_state?: string | null
  rfceditor_state?: string | null
  url: string
  [curated: string]: unknown
}

interface Snapshot {
  $schema: string
  generated_at: string
  source: string
  max_age_days: number
  drafts: Record<string, SnapshotEntry>
}

interface DocJson {
  name: string
  rev: string
  title: string
  state: string
  iesg_state: string | null
  rfceditor_state: string | null
  rev_history: { name: string; rev: string; published: string }[]
}

async function fetchDoc(name: string): Promise<DocJson> {
  const res = await fetch(`${DATATRACKER}/${name}/doc.json`, {
    headers: { Accept: 'application/json', 'User-Agent': 'pqctoday-hub snapshot refresher' },
  })
  if (!res.ok) throw new Error(`${name}: datatracker returned ${res.status}`)
  return (await res.json()) as DocJson
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check')
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as Snapshot
  const next: Snapshot = {
    ...snap,
    generated_at: new Date().toISOString().slice(0, 10),
    source: 'datatracker.ietf.org doc.json, via scripts/refresh-jose-drafts-snapshot.ts',
    drafts: {},
  }
  const changes: string[] = []

  for (const [name, old] of Object.entries(snap.drafts)) {
    const doc = await fetchDoc(name)
    const latest = doc.rev_history.filter((r) => r.name === name && r.rev === doc.rev).pop()
    const entry: SnapshotEntry = {
      ...old,
      current_version: doc.rev,
      current_date: latest ? latest.published.slice(0, 10) : old.current_date,
      title: doc.title,
      state: doc.state,
      iesg_state: doc.iesg_state,
      rfceditor_state: doc.rfceditor_state,
      url: `${DATATRACKER}/${name}/`,
    }
    for (const k of ['current_version', 'title', 'state', 'iesg_state', 'rfceditor_state']) {
      if (old[k] !== entry[k])
        changes.push(`${name}.${k}: ${String(old[k])} -> ${String(entry[k])}`)
    }
    next.drafts[name] = entry
  }

  if (check) {
    if (changes.length) {
      console.error(`jose-drafts-snapshot.json is stale:\n  ${changes.join('\n  ')}`)
      process.exit(1)
    }
    console.log('jose-drafts-snapshot.json matches the datatracker.')
    return
  }
  writeFileSync(SNAPSHOT, JSON.stringify(next, null, 2) + '\n')
  console.log(changes.length ? `Updated:\n  ${changes.join('\n  ')}` : 'No changes.')
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
