// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { expect, it } from 'vitest'
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { parse } from 'yaml'
import { PIPELINE_INTEGRATION_PATTERNS } from './secretsConstants'

it('executes the displayed POSIX job shell and stops on failed login/read without exposing the password', () => {
  const job = parse(
    PIPELINE_INTEGRATION_PATTERNS.find((p) => p.id === 'gitlab-ci-tokens')!.codeSnippet
  )['fetch-secrets']
  const dir = mkdtempSync(join(tmpdir(), 'hub-gitlab-shell-'))
  try {
    const cli = join(dir, 'vault')
    // A CLI test double tests shell exit propagation only, not JWT verification.
    writeFileSync(
      cli,
      `#!/bin/sh
if [ "$1" = write ]; then
  [ "$CASE_MODE" != bad-login ] || exit 2
  printf 'fictional-token'
elif [ "$1" = kv ]; then
  [ "$VAULT_TOKEN" = fictional-token ] || exit 3
  [ "$CASE_MODE" != missing-secret ] || exit 2
  [ "$CASE_MODE" != empty-secret ] || exit 0
  printf 'fictional-password'
else
  exit 4
fi
`
    )
    chmodSync(cli, 0o700)
    for (const mode of ['valid', 'bad-login', 'missing-secret', 'empty-secret']) {
      const result = spawnSync('/bin/sh', ['-c', job.script.join('\n')], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: dir + ':' + process.env.PATH,
          CASE_MODE: mode,
          VAULT_ID_TOKEN: 'fictional-id-token',
          VAULT_TOKEN: '',
        },
      })
      expect(result.status, mode).toBe(mode === 'valid' ? 0 : mode === 'empty-secret' ? 1 : 2)
      expect(result.stdout + result.stderr).not.toContain('fictional-password')
      expect(result.stdout + result.stderr).not.toContain('fictional-token')
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
