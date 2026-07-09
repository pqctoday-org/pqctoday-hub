// TEMPORARY probe (deleted before commit) — observe the rebuilt engine's
// behavior for the ops being promoted out of "Advertised-only".
/* eslint-disable security/detect-non-literal-fs-filename, no-console */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, beforeAll } from 'vitest'
import { KmipEngine } from '../kmipEngine'
import { CodepointTable } from './codepointTable'
import { runOp } from './runner'
import { find, leaf, struct, type KmipNode } from './nodes'
import * as ops from './opTemplates'

const SPEC_JSON = JSON.parse(
  readFileSync(join(__dirname, '../../../../public/kmip-corpus/tags-enums.json'), 'utf8')
) as Parameters<typeof CodepointTable.fromSpec>[0]

describe('probe promoted ops', () => {
  let engine: KmipEngine
  let table: CodepointTable
  beforeAll(async () => {
    engine = await KmipEngine.boot()
    table = CodepointTable.fromSpec(SPEC_JSON)
  })
  const run = (operation: string, payload: KmipNode[]) => runOp(engine, table, operation, payload)
  const dump = (label: string, r: ReturnType<typeof runOp>) =>
    console.log(
      label,
      JSON.stringify({ ok: r.ok, msg: r.resultMessage, tree: r.namedResponseTree }).slice(0, 1500)
    )

  it('split key round trip', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    console.log('created', uid)
    run('Activate', ops.activate(uid))
    const split = run('CreateSplitKey', [
      leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
      leaf('UniqueIdentifier', 'TextString', uid),
      leaf('SplitKeyParts', 'Integer', 5),
      leaf('SplitKeyThreshold', 'Integer', 3),
      leaf('SplitKeyMethod', 'Enumeration', 'Polynomial Sharing GF (28)'),
    ])
    dump('CreateSplitKey', split)
    // collect share uids
    const shares: string[] = []
    const walk = (n: unknown): void => {
      const node = n as { tag?: string; value?: unknown; children?: unknown[] }
      if (
        (node.tag === 'UniqueIdentifier' || node.tag === 'Unique Identifier') &&
        typeof node.value === 'string'
      )
        shares.push(node.value)
      for (const c of node.children ?? []) walk(c)
    }
    walk(split.namedResponseTree)
    console.log('share uids', shares)
    const join3 = run('JoinSplitKey', [
      leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
      ...shares.slice(0, 3).map((s) => leaf('UniqueIdentifier', 'TextString', s)),
    ])
    dump('JoinSplitKey(3)', join3)
    const join2 = run('JoinSplitKey', [
      leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
      ...shares.slice(0, 2).map((s) => leaf('UniqueIdentifier', 'TextString', s)),
    ])
    dump('JoinSplitKey(2)', join2)
  })

  it('async flow via Hash + Mandatory indicator', () => {
    const r = runOp(engine, table, 'Hash', ops.hash('68656c6c6f'), [
      leaf('AsynchronousIndicator', 'Enumeration', 'Mandatory'),
    ])
    dump('Hash async enqueue', r)
    // pull the correlation value and poll it
    const cv = find(r.namedResponseTree, 'AsynchronousCorrelationValue')?.value
    console.log('correlation value:', cv)
    if (typeof cv === 'string') {
      dump('Poll real CV', run('Poll', [leaf('AsynchronousCorrelationValue', 'ByteString', cv)]))
      dump('QueryAsyncRequests after', run('QueryAsynchronousRequests', []))
    }
  })

  it('ObtainLease / SetConstraints', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    dump('ObtainLease', run('ObtainLease', [leaf('UniqueIdentifier', 'TextString', uid)]))
    dump('SetConstraints', run('SetConstraints', [struct('Constraints')]))
    dump(
      'Poll bogus CV',
      run('Poll', [leaf('AsynchronousCorrelationValue', 'ByteString', 'deadbeef')])
    )
    dump('QueryAsyncRequests empty', run('QueryAsynchronousRequests', []))
  })
})
