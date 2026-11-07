// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ROTATION_STEPS } from './fheRotationSharedData'

const step = (id: string) => ROTATION_STEPS.find((s) => s.id === id)!

describe('rotation walkthrough: retirement and deletion wording', () => {
  it('limits the retirement record protection to calls through the token API', () => {
    const body = step('so-retires').body
    expect(body).toMatch(/token API will not modify, copy or destroy/)
    expect(body).not.toMatch(/nobody can change or delete/i)
  })

  it('names durable anti-rollback, retention and backup handling as separate production capabilities', () => {
    const body = step('so-retires').body
    expect(body).toMatch(/durable anti-rollback, retention and backup handling/)
    expect(body).toMatch(/separate production capabilities/)
  })

  it('says the modeled server deletes its active copy of the rotation key', () => {
    const body = step('server-deletes').body
    expect(body).toMatch(/modeled server deletes its active copy/)
    expect(body).toMatch(/backups or logs would need their own controls/)
  })
})
