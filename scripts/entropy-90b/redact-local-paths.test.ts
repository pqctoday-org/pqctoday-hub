// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { redactLocalPaths } from './redact-local-paths'

describe('redactLocalPaths', () => {
  it('reduces a per-session temporary path to the file name', () => {
    expect(
      redactLocalPaths(
        '/private/tmp/session-1/abc/build/out-macos-arm64/jitterentropy-hashtime 1000000 1 /private/tmp/session-1/abc/run/idle/jent-raw-noise --max-mem 0'
      )
    ).toBe('jitterentropy-hashtime 1000000 1 jent-raw-noise --max-mem 0')
  })

  it('reduces home-directory and macOS temp-folder paths', () => {
    expect(redactLocalPaths('/home/someone/work/tool --in /var/folders/xy/T/data.bin')).toBe(
      'tool --in data.bin'
    )
    expect(redactLocalPaths('/home/someone/tool')).toBe('tool')
  })

  it('keeps device paths that are part of the recorded procedure', () => {
    const cmd =
      '/tmp/entropy-0924/bin/jitterentropy-hashtime 1000 1000 /tmp/entropy-0924/run/idle/restart/jent-raw-noise-restart --max-mem 0'
    expect(redactLocalPaths(cmd)).toBe(cmd)
    expect(redactLocalPaths('/ent/bin/jitterentropy-hashtime 1000000 1')).toBe(
      '/ent/bin/jitterentropy-hashtime 1000000 1'
    )
  })

  it('leaves text without paths unchanged', () => {
    expect(redactLocalPaths('getrandom-dump 1000000')).toBe('getrandom-dump 1000000')
  })
})
