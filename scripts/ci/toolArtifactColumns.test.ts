// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
// @ts-expect-error plain module with no type declarations
import { toolArtifactColumns } from './toolArtifactColumns.mjs'

const TYPES = ['document', 'certificate', 'key', 'tls-run', 'run-record', 'data-file']
const check = (produces_artifact: string, artifact_type: string): Record<string, unknown> =>
  toolArtifactColumns({ produces_artifact, artifact_type }, TYPES)

describe('the tools file output columns', () => {
  it('blank means not known and writes nothing', () => {
    expect(check('', '')).toEqual({})
  })

  it('true with a type, false without one', () => {
    expect(check('true', 'data-file')).toEqual({
      producesArtifact: true,
      artifactType: 'data-file',
    })
    expect(check('false', '')).toEqual({ producesArtifact: false })
  })

  it('refuses any flag other than blank, true or false', () => {
    for (const bad of ['yes', 'True', ' true', 'no', '1']) {
      expect(() => check(bad, '')).toThrow(/blank, true or false/)
    }
  })

  it('refuses a type outside the list', () => {
    expect(() => check('true', 'report')).toThrow(/not one of/)
    expect(() => check('true', 'Document')).toThrow(/not one of/)
  })

  it('a true row needs a type; any other row must not carry one', () => {
    expect(() => check('true', '')).toThrow(/required/)
    expect(() => check('false', 'document')).toThrow(/must be blank/)
    expect(() => check('', 'document')).toThrow(/must be blank/)
  })
})
