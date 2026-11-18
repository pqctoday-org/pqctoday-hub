// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const load = vi.hoisted(() => vi.fn())
vi.mock('pyodide', () => ({ loadPyodide: load }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}

const runtime = {
  FS: { mkdirTree: vi.fn(), writeFile: vi.fn() },
  runPython: vi.fn(),
  runPythonAsync: vi.fn(),
  registerJsModule: vi.fn(),
  setStdout: vi.fn(),
  setStderr: vi.fn(),
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(''))
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('takes ownership before cold boot and updates only the bridge supplied by the accepted run', async () => {
  const boot = deferred<typeof runtime>()
  load.mockReturnValueOnce(boot.promise)
  runtime.runPythonAsync.mockResolvedValue(undefined)
  const { runPython } = await import('./pyRuntime')

  const firstBridge = { engine: 'first' }
  const nextBridge = { engine: 'next' }
  const first = runPython('first', { sample_bridge: firstBridge })
  const concurrent = runPython('overlap', { sample_bridge: nextBridge })
  boot.resolve(runtime)

  expect(await concurrent).toMatchObject({
    ok: false,
    error: expect.stringMatching(/still running|already running/),
  })
  expect(await first).toMatchObject({ ok: true })
  expect(runtime.registerJsModule).toHaveBeenCalledExactlyOnceWith('sample_bridge', firstBridge)
  expect(runtime.runPythonAsync).toHaveBeenCalledExactlyOnceWith('first')

  expect(await runPython('next', { sample_bridge: nextBridge })).toMatchObject({ ok: true })
  expect(runtime.registerJsModule).toHaveBeenLastCalledWith('sample_bridge', nextBridge)
  expect(runtime.runPython).toHaveBeenLastCalledWith(
    expect.stringContaining('modules.pop("sample_bridge", None)')
  )
})

it('keeps output and bridge ownership during a timed-out await until the execution settles', async () => {
  vi.useFakeTimers()
  const held = deferred<void>()
  load.mockResolvedValueOnce(runtime)
  runtime.runPythonAsync.mockReturnValueOnce(held.promise).mockResolvedValue(undefined)
  const { bootPyRuntime, runPython } = await import('./pyRuntime')
  await bootPyRuntime()

  const first = runPython('await held')
  await vi.advanceTimersByTimeAsync(15_000)
  expect(await first).toMatchObject({ ok: false, error: 'Script exceeded 15s' })
  expect(await runPython('overlap', { sample_bridge: {} })).toMatchObject({ ok: false })
  expect(runtime.runPythonAsync).toHaveBeenCalledExactlyOnceWith('await held')
  expect(runtime.registerJsModule).not.toHaveBeenCalled()

  held.resolve()
  await vi.advanceTimersByTimeAsync(0)
  expect(await runPython('after release')).toMatchObject({ ok: true })
  expect(runtime.runPythonAsync).toHaveBeenLastCalledWith('after release')
})
