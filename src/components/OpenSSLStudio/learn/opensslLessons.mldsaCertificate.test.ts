// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { OPENSSL_LESSONS } from './opensslLessons'
import type { OpenSslLearnContext } from './opensslLearnContext'

/** A context that records the commands a lesson runs, without an engine. */
function recordingContext(): { ctx: OpenSslLearnContext; commands: string[] } {
  const commands: string[] = []
  const ctx: OpenSslLearnContext = {
    run: async (cmd) => {
      commands.push(cmd)
      return { stdout: '' }
    },
    readFile: () => new Uint8Array(10),
    writeFile: () => undefined,
  }
  return { ctx, commands }
}

describe('OpenSSL lessons: ML-DSA certificates', () => {
  it('names no digest on the ML-DSA req commands, in the lesson text or in what is run', async () => {
    const mldsaReqSteps = OPENSSL_LESSONS.flatMap((l) => l.steps).filter(
      (s) => /^req /.test(s.op) && /mldsa/i.test(s.op)
    )
    expect(mldsaReqSteps.length).toBeGreaterThanOrEqual(2)
    for (const step of mldsaReqSteps) {
      expect(step.op).not.toMatch(/-sha(1|224|256|384|512)\b/)
      const { ctx, commands } = recordingContext()
      await step.run(ctx)
      expect(commands.join(' ')).not.toMatch(/-sha(1|224|256|384|512)\b/)
      // What is shown is what is run.
      expect(commands).toContain(step.op)
    }
  })

  it('explains pure ML-DSA signing without a reference SHA-256 digest for older parsers', async () => {
    const step = OPENSSL_LESSONS.flatMap((l) => l.steps).find(
      (s) => s.op.startsWith('req ') && s.op.includes('learn-l2-mldsa')
    )
    expect(step).toBeDefined()
    const { ctx } = recordingContext()
    const { detail } = await step!.run(ctx)
    expect(detail).not.toMatch(/older parsers/i)
    expect(detail).not.toMatch(/for reference/i)
    expect(detail).toMatch(/signs the TBSCertificate directly/)
    expect(detail).toMatch(/no separate SHA-256 digest/)
    expect(detail).toMatch(/signature algorithm reads ML-DSA-65, not sha256WithRSAEncryption/)
  })

  it('the comparison table shows the two certificates carry different signature algorithms and commands', () => {
    const lesson = OPENSSL_LESSONS.find((l) => l.steps.some((s) => s.op.includes('learn-l2-mldsa')))
    expect(lesson).toBeDefined()
    const command = lesson!.compare?.find((c) => c.label === 'req command used')
    expect(command?.same).toBe(false)
    expect(command?.b).toMatch(/no digest option/)
    const algo = lesson!.compare?.find((c) => c.label === 'Signature algorithm in the certificate')
    expect(algo).toMatchObject({ a: 'sha256WithRSAEncryption', b: 'ML-DSA-65', same: false })
  })
})
