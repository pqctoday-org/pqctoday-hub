// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { KEY_LIFECYCLE_FLOWS, KEY_LIFECYCLE_IO } from './fheKeyLifecycleFlows'

const rotation = KEY_LIFECYCLE_FLOWS.find((f) => f.id === 'ckks-key-rotation')!
const retire = rotation.steps.find((s) => s.id === 'so-retires-old-secret')!
const rotationIo = KEY_LIFECYCLE_IO['ckks-key-rotation']
const retireIo = rotationIo[rotation.steps.findIndex((s) => s.id === 'so-retires-old-secret')]
const deleteIo = rotationIo[rotation.steps.findIndex((s) => s.id === 'server-deletes-rotation-key')]

describe('key rotation: what retirement and deletion guarantee', () => {
  it('ties the immutable retirement record to the token API, not to every copy', () => {
    expect(retire.detail).toMatch(/marked not modifiable, not copyable and not destroyable/)
    expect(retire.detail).toMatch(/CKA_MODIFIABLE, CKA_COPYABLE and CKA_DESTROYABLE/)
    expect(retire.detail).toMatch(/stop calls through the token API/)
    expect(retireIo.output).toMatch(/token API will not modify, copy or destroy/)
  })

  it('leaves backup, restore, token replacement and retention to separate production capabilities', () => {
    expect(retire.detail).toMatch(/restored backup or snapshot, a replaced token/)
    expect(retire.detail).toMatch(/retaining it for as long as policy requires/)
    expect(retire.detail).toMatch(
      /separate production capabilities that this model does not demonstrate/
    )
    expect(retireIo.output).toMatch(/Backups and snapshots are outside this model/)
  })

  it('does not claim a public object nobody can change or delete', () => {
    const all = [retire.detail, retireIo.output, deleteIo.output].join('\n')
    expect(all).not.toMatch(/nobody can change or delete/i)
    expect(all).not.toMatch(/public, immutable retirement record/i)
    expect(all).not.toMatch(/cannot be modified, copied or destroyed/i)
  })

  it('says the modeled server deletes its active copy, not that no copy exists anywhere', () => {
    expect(deleteIo.output).not.toMatch(/No rotation key anywhere/i)
    expect(deleteIo.output).toMatch(
      /In this model the server.s active copy of the rotation key is gone/
    )
    expect(deleteIo.output).toMatch(
      /Copies in backups, logs or snapshots would need their own controls/
    )
  })
})
