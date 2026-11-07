// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useLayoutEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { OpenSslLearnView } from './OpenSslLearnView'
import { OPENSSL_LESSONS } from './opensslLessons'
import { useOpenSSLStore } from '../store'

const lms =
  'Error initializing LMS context\n01000000:error:0308010C:digital envelope routines:inner_evp_generic_fetch:unsupported:crypto/evp/evp_fetch.c:376:Global default library context, Algorithm (LMS : 0), Properties (<null>)'
const hss =
  'genpkey: Error generating HSS key\n01000000:error:410000E0:pkcs11:p11prov_hss_gen:The token was not present in its slot when the function was invoked:/src/src/vendor/pkcs11-provider/src/keymgmt.c:4011:hss Key generation failed'
const aead = 'enc: AEAD ciphers not supported\nenc: Use -help for summary.'
const show = (runCommand = vi.fn().mockResolvedValue({ stdout: '' })) => {
  const view = render(
    <MemoryRouter>
      <OpenSslLearnView isReady runCommand={runCommand} onTryInWorkbench={vi.fn()} />
    </MemoryRouter>
  )
  return { ...view, runCommand }
}
const lesson = (number: number) =>
  fireEvent.click(
    screen.getAllByRole('button').find((button) => button.textContent?.startsWith(`L${number}`))!
  )
afterEach(() => {
  vi.restoreAllMocks()
})

describe('OpenSSL Learn observed outcomes and attempt lifetime', () => {
  it('recognises the two distinct observed build boundaries, not a generic refusal', async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error(lms)).mockRejectedValueOnce(new Error(hss))
    show(run)
    lesson(5)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await waitFor(() => expect(screen.getAllByText('Refused, as expected')).toHaveLength(2))
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(run.mock.calls.map((c) => c[0])).toEqual(OPENSSL_LESSONS[4].steps.map((s) => s.op))
  })
  it('recognises the observed AEAD boundary for its exact command', async () => {
    show(vi.fn().mockRejectedValue(new Error(aead)))
    lesson(6)
    fireEvent.click(screen.getAllByRole('button', { name: 'Run' }).at(-1)!)
    await screen.findByText('Refused, as expected')
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
  })
  it.each([
    'OpenSSL exited with status 1',
    'Input file missing',
    hss,
    'OpenSSL worker closed before the request completed.',
  ])('keeps unrelated/incomplete LMS failure incomplete: %s', async (error) => {
    const run = vi.fn().mockRejectedValue(new Error(error))
    show(run)
    lesson(5)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: 'Retry' })
    expect(run).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Refused, as expected')).not.toBeInTheDocument()
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
  })
  it('unexpected negative success stops dependent work and permits a real retry', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ stdout: 'unexpected key' })
      .mockRejectedValueOnce(new Error(lms))
      .mockRejectedValueOnce(new Error(hss))
    show(run)
    lesson(5)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: 'Retry' })
    expect(run).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await waitFor(() => expect(screen.getAllByText('Refused, as expected')).toHaveLength(2))
    expect(run).toHaveBeenCalledTimes(3)
  })
  it('a throw outside the command runner cannot borrow matching diagnostic text', async () => {
    vi.spyOn(OPENSSL_LESSONS[4].steps[0], 'run').mockRejectedValue(new Error(lms))
    const { runCommand } = show()
    lesson(5)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: 'Retry' })
    expect(runCommand).not.toHaveBeenCalled()
    expect(screen.queryByText('Refused, as expected')).not.toBeInTheDocument()
  })
  it('matching diagnostic text from another command cannot satisfy the authored refusal', async () => {
    vi.spyOn(OPENSSL_LESSONS[4].steps[0], 'run').mockImplementation(async (ctx) => {
      await ctx.run('version')
      return { detail: 'not expected' }
    })
    show(vi.fn().mockRejectedValue(new Error(lms)))
    lesson(5)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: 'Retry' })
    expect(screen.queryByText('Refused, as expected')).not.toBeInTheDocument()
  })
  it('keeps an explicitly pending outcome incomplete without calling it a refusal', async () => {
    const step = OPENSSL_LESSONS[0].steps[0]
    const previous = step.expect
    step.expect = 'pending'
    try {
      vi.spyOn(step, 'run').mockResolvedValue({ detail: 'not completion evidence' })
      show()
      fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
      await screen.findByText(
        'The expected outcome was not established. This step remains incomplete.'
      )
      expect(screen.queryByText(/expected refusal was not observed/)).not.toBeInTheDocument()
      expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    } finally {
      step.expect = previous
    }
  })
  it('serialises rapid clicks, invalidates a switched lesson, then allows a fresh attempt', async () => {
    let finish!: (r: { stdout: string }) => void
    const run = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          })
      )
      .mockResolvedValue({ stdout: '' })
    show(run)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    expect(run).toHaveBeenCalledTimes(1)
    lesson(5)
    expect(screen.getByRole('button', { name: 'Run all' })).toBeDisabled()
    await act(async () => finish({ stdout: 'old lesson result' }))
    expect(screen.queryByText('old lesson result')).not.toBeInTheDocument()
    expect(run).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run all' })).toBeEnabled())
  })
  it('does not continue file writes or dependent commands after unmount', async () => {
    let finish!: (r: { stdout: string }) => void
    vi.spyOn(OPENSSL_LESSONS[0].steps[0], 'run').mockImplementation(async (ctx) => {
      await ctx.run('version')
      await ctx.run('second obsolete command')
      ctx.writeFile('stale-result.txt', 'not current')
      return { detail: 'old' }
    })
    const run = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const { unmount } = show(run)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    unmount()
    await act(async () => finish({ stdout: 'old' }))
    expect(useOpenSSLStore.getState().getFile('stale-result.txt')).toBeUndefined()
    expect(run).toHaveBeenCalledTimes(1)
  })
  it('invalidates the local attempt during unmount commit before a parent layout effect settles it', async () => {
    let finish!: (result: { stdout: string }) => void
    const run = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    vi.spyOn(OPENSSL_LESSONS[0].steps[0], 'run').mockImplementation(async (ctx) => {
      await ctx.run('first sample command')
      await ctx.run('second obsolete command')
      ctx.writeFile('layout-stale-result.txt', 'obsolete')
      return { detail: 'must not attach' }
    })
    function Harness() {
      const [visible, setVisible] = useState(true)
      useLayoutEffect(() => {
        if (!visible) finish({ stdout: 'settled at parent layout effect' })
      }, [visible])
      return (
        <MemoryRouter>
          <Button onClick={() => setVisible(false)}>Close sample lesson</Button>
          {visible && <OpenSslLearnView isReady runCommand={run} onTryInWorkbench={vi.fn()} />}
        </MemoryRouter>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close sample lesson' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(run).toHaveBeenCalledTimes(1)
    expect(useOpenSSLStore.getState().getFile('layout-stale-result.txt')).toBeUndefined()
    expect(screen.queryByText('must not attach')).not.toBeInTheDocument()
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
  })
})
