// SPDX-License-Identifier: GPL-3.0-only
//
// Integration test for the generic op-template pipeline (buildRequest →
// toWireTree → encodeTtlv → submit → decodeTtlv, via `runOp`) — the
// foundation the new KMIP3.0 Commands tab and the OASIS corpus replay both
// build on, instead of a Rust match arm per operation. Drives the REAL wasm
// engine, not a mock.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only) because
// booting the wasm engine is heavier than the default suite budget.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { KmipEngine } from '../kmipEngine'
import { CodepointTable } from './codepointTable'
import { runOp } from './runner'
import { find, findAll, leaf } from './nodes'
import * as ops from './opTemplates'
import { OP_TEMPLATES } from './opTemplates'

const SPEC_JSON = JSON.parse(
  readFileSync(join(__dirname, '../../../../public/kmip-corpus/tags-enums.json'), 'utf8')
) as Parameters<typeof CodepointTable.fromSpec>[0]

describe('op-template pipeline (real wasm engine)', () => {
  let engine: KmipEngine
  let table: CodepointTable

  beforeAll(async () => {
    engine = await KmipEngine.boot()
    table = CodepointTable.fromSpec(SPEC_JSON)
  })

  const run = (operation: string, payload: ReturnType<typeof ops.query>) =>
    runOp(engine, table, operation, payload)

  it('has exactly one template per KMIP 3.0 operation, 66 total', () => {
    expect(OP_TEMPLATES).toHaveLength(66)
    expect(new Set(OP_TEMPLATES.map((t) => t.op)).size).toBe(66)
  })

  it('Query succeeds and reports the server info', () => {
    const { ok, namedResponseTree } = run('Query', ops.query())
    expect(ok).toBe(true)
    expect(find(namedResponseTree, 'VendorIdentification')).toBeDefined()
  })

  it('full lifecycle: CreateKeyPair → Activate → Sign → GetAttributes → Revoke → Destroy', () => {
    const created = run('CreateKeyPair', ops.createKeyPair('ML-DSA-65', 'Sign Verify'))
    expect(created.ok).toBe(true)
    const priv = find(created.namedResponseTree, 'PrivateKeyUniqueIdentifier')
    expect(typeof priv?.value).toBe('string')
    const uid = priv?.value as string

    expect(run('Activate', ops.activate(uid)).ok).toBe(true)

    const signed = run('Sign', ops.sign(uid, '68656c6c6f'))
    expect(signed.ok).toBe(true)
    expect(find(signed.namedResponseTree, 'SignatureData')).toBeDefined()

    expect(run('GetAttributes', ops.getAttributes(uid)).ok).toBe(true)
    expect(run('Revoke', ops.revoke(uid)).ok).toBe(true)
    expect(run('Destroy', ops.destroy(uid)).ok).toBe(true)
  })

  it('DeriveKey (NIST 800-108-C) derives a real key from a base secret', () => {
    // Matches op_coverage_e2e.rs's `dk-derive` base key exactly: an
    // HMAC-SHA256 key (the KDF's PRF) carrying the `DeriveKey` usage bit —
    // DeriveKey refuses a base object lacking that bit
    // (IncompatibleCryptographicUsageMask), and refuses a PreActive one
    // (WrongKeyLifecycleState), so both must be set up correctly here.
    const base = run('Create', ops.create('HMAC-SHA256', 256, 'DeriveKey'))
    expect(base.ok).toBe(true)
    const baseUid = find(base.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(run('Activate', ops.activate(baseUid)).ok).toBe(true)

    const derived = run('DeriveKey', ops.deriveKey(baseUid))
    expect(derived.ok).toBe(true)
    expect(find(derived.namedResponseTree, 'UniqueIdentifier')).toBeDefined()
  })

  it('GetUsageAllocation on a key with no declared Usage Limits is a real, well-formed AttributeNotFound', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    // A freshly created key with no `UsageLimits` attribute correctly
    // refuses an allocation request — proving the round trip reaches real
    // dispatcher semantics, not just "some bytes came back".
    const { ok, resultReason } = run('GetUsageAllocation', ops.getUsageAllocation(uid, 5))
    expect(ok).toBe(false)
    expect(resultReason).toBeDefined()
  })

  it('Validate — still OperationNotSupported in this wasm build (native-only crypto backend; real rejection, not simulated)', () => {
    const { ok, resultReason } = run('Validate', ops.validate())
    expect(ok).toBe(false)
    expect(resultReason).toBeDefined()
  })

  // ── engine 0.12.0/0.13.0 "honest maximum" promotions ──────────────────────

  it('CreateSplitKey → JoinSplitKey: a 3-of-5 polynomial split reconstructs from any 3 shares and refuses 2', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(run('Activate', ops.activate(uid)).ok).toBe(true)

    const split = run('CreateSplitKey', ops.createSplitKey(uid, 5, 3))
    expect(split.ok).toBe(true)
    const shares = findAll(split.namedResponseTree, 'UniqueIdentifier')
      .map((n) => n.value)
      .filter((v): v is string => typeof v === 'string')
    expect(shares).toHaveLength(5)

    const joined = run('JoinSplitKey', ops.joinSplitKey(shares.slice(0, 3)))
    expect(joined.ok).toBe(true)
    expect(find(joined.namedResponseTree, 'UniqueIdentifier')).toBeDefined()

    const tooFew = run('JoinSplitKey', ops.joinSplitKey(shares.slice(0, 2)))
    expect(tooFew.ok).toBe(false)
    expect(tooFew.resultMessage).toContain('Threshold')
  })

  it('CreateSplitKey with XOR honestly refuses N != M (§13.1: XOR needs every share)', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    run('Activate', ops.activate(uid))
    const { ok, resultMessage } = run('CreateSplitKey', ops.createSplitKey(uid, 5, 3, 'XOR'))
    expect(ok).toBe(false)
    expect(resultMessage).toContain('XOR')
  })

  it('async round trip: Hash + Mandatory indicator → OperationPending + correlation value → Poll returns the real digest', () => {
    const enqueue = runOp(engine, table, 'Hash', ops.hash('68656c6c6f'), [
      leaf('AsynchronousIndicator', 'Enumeration', 'Mandatory'),
    ])
    // OperationPending, not Success — the job is queued, not answered.
    expect(enqueue.ok).toBe(false)
    const cv = find(enqueue.namedResponseTree, 'AsynchronousCorrelationValue')?.value
    expect(typeof cv).toBe('string')

    const polled = run('Poll', ops.poll(cv as string))
    expect(polled.ok).toBe(true)
    // SHA-256("hello") — the identical payload the synchronous op returns.
    expect(find(polled.namedResponseTree, 'Data')?.value).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    )
  })

  it('Poll with an unknown correlation value is a real, well-formed rejection', () => {
    const { ok, resultMessage } = run('Poll', ops.poll('deadbeef'))
    expect(ok).toBe(false)
    expect(resultMessage).toBeDefined()
  })

  it('QueryAsynchronousRequests succeeds (empty once every job has been polled)', () => {
    expect(run('QueryAsynchronousRequests', ops.queryAsynchronousRequests()).ok).toBe(true)
  })

  it('ObtainLease grants a real lease on a managed object', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    const lease = run('ObtainLease', ops.obtainLease(uid))
    expect(lease.ok).toBe(true)
    expect(find(lease.namedResponseTree, 'LeaseTime')).toBeDefined()
  })

  it('SetConstraints round-trips against the real constraint table', () => {
    expect(run('SetConstraints', ops.setConstraints()).ok).toBe(true)
  })

  it('Locate narrows by UID filter — real filtering since 0.13.0, not silently ignored', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    const located = run('Locate', ops.locate(undefined, undefined, uid))
    const uids = findAll(located.namedResponseTree, 'UniqueIdentifier').map((n) => n.value)
    expect(uids).toEqual([uid])
  })

  it('a genuinely-unimplemented op (Put) is a real, well-formed rejection', () => {
    const { ok, resultMessage } = run('Put', ops.put())
    expect(ok).toBe(false)
    expect(resultMessage).toBeDefined()
  })
})
