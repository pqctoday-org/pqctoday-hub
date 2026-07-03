// SPDX-License-Identifier: GPL-3.0-only
//
// Batch + active-policy integration test — regression coverage for the gap
// found during the CACP A-grade review (2026-07-03): the review confirmed
// every batch item IS policy-gated exactly like a single op (dispatcher
// dispatches per-item, same handler), but a rekey-on-use policy makes `Sign`
// mint a whole new key pair inline, and the dispatcher's `Undo` bookkeeping
// had no idea that had happened — so under `BatchErrorContinuation::Undo`
// the new key pair was never deleted and the old key's Deactivated+supersede
// mutation was never reverted (see `pqctoday-hsm/kmip` `touched_uids` /
// `newly_created_uids` / `SignResponse::rekeyed`). No test at any level
// previously combined "batch" with an active restrictive/rekey policy.
//
// Drives the REAL wasm engine (not a JS simulator) through `runBatch`.
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only) because
// booting the wasm engine is heavier than the default suite budget.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { KmipEngine } from '@/wasm/kmip/kmipEngine'

const POLICY_DIR = join(__dirname, '../../../../public/kmip-policies')
const AUTO_MIGRATE_YAML = readFileSync(join(POLICY_DIR, 'auto-migrate-on-use.yaml'), 'utf8')

const PERMISSIVE_YAML = `
schema_version: 1
metadata: { name: permissive, description: p, authority: t, effective: "always" }
rules: []
`

interface CreateKeyPairSummary {
  privateKeyUid: string
  publicKeyUid: string
}

interface SignRekeySummary {
  oldUid: string
  newPrivateKeyUid: string
  newPublicKeyUid: string
}

describe('runBatch — policy enforcement + Undo (real wasm engine)', () => {
  let engine: KmipEngine

  beforeAll(async () => {
    engine = await KmipEngine.boot()
  })

  it('gates a batch item exactly like a single op — a new classical key is denied under auto-migrate-on-use', () => {
    engine.loadPolicy(AUTO_MIGRATE_YAML)
    const batch = engine.runBatch({
      errorContinuation: 'Continue',
      items: [{ op: 'CreateKeyPair', algorithm: 'ECDSA' }],
    })
    expect(batch.items[0].status).toBe('OperationFailed')
  })

  it('a batched Sign triggers the same rekey-on-use the single-op path does, and Undo fully reverses it', () => {
    // The legacy key predates the migration policy — the real-world scenario
    // auto-migrate-on-use.yaml exists for (a pre-existing classical key that
    // gets rekeyed the first time it's used, not created fresh under it).
    engine.loadPolicy(PERMISSIVE_YAML)
    const legacy = engine.runOp({ op: 'CreateKeyPair', algorithm: 'ECDSA' })
    expect(legacy.ok).toBe(true)
    const { privateKeyUid: privUid } = legacy.summary as unknown as CreateKeyPairSummary
    expect(engine.runOp({ op: 'Activate', uid: privUid }).ok).toBe(true)

    engine.loadPolicy(AUTO_MIGRATE_YAML)

    const batch = engine.runBatch({
      errorContinuation: 'Undo',
      items: [
        { op: 'Sign', uid: privUid, text: 'agility-lesson' },
        { op: 'Destroy', uid: 'urn:pqctoday:ghost' }, // guaranteed ObjectNotFound
      ],
    })

    expect(batch.items).toHaveLength(2)
    expect(batch.items[0].status).toBe('OperationUndone')
    expect(batch.items[1].status).toBe('OperationFailed')

    const rekeyed = (batch.items[0].summary as unknown as { rekeyed: SignRekeySummary | null })
      .rekeyed
    expect(rekeyed, 'Sign must report the rekey it performed').not.toBeNull()
    expect(rekeyed!.oldUid).toBe(privUid)
    expect(rekeyed!.newPrivateKeyUid).not.toBe(privUid)

    // The old key must be back to exactly its pre-rekey shape.
    const objects = engine.listObjects()
    const restoredLegacy = objects.find((o) => o.uid === privUid)
    expect(restoredLegacy?.state).toBe('Active')

    // The freshly-minted replacement key pair must be gone entirely.
    expect(objects.some((o) => o.uid === rekeyed!.newPrivateKeyUid)).toBe(false)
    expect(objects.some((o) => o.uid === rekeyed!.newPublicKeyUid)).toBe(false)
  })
})
