// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { GITLAB_VAULT_SAMPLE_SETUP, PIPELINE_INTEGRATION_PATTERNS } from './secretsConstants'

describe('GitLab ID token and Vault JWT/KV-v2 sample', () => {
  const sample = PIPELINE_INTEGRATION_PATTERNS.find((p) => p.id === 'gitlab-ci-tokens')!
  const yaml = parse(sample.codeSnippet)
  const role = JSON.parse(GITLAB_VAULT_SAMPLE_SETUP.split("<<'JSON'\n")[1].split('\nJSON')[0])
  it('binds the job audience, issuer, project and read-only path as one complete example', () => {
    expect(yaml['fetch-secrets'].id_tokens).toEqual({
      VAULT_ID_TOKEN: { aud: 'https://vault.example.com' },
    })
    expect(yaml['fetch-secrets'].image).toBe('hashicorp/vault:1.21.0')
    expect(role.bound_audiences).toEqual(['https://vault.example.com'])
    expect(role.bound_claims).toEqual({ project_id: '42' })
    expect(role.token_explicit_max_ttl).toBe(1800)
    expect(GITLAB_VAULT_SAMPLE_SETUP).toContain('bound_issuer="https://gitlab.example.com"')
    expect(GITLAB_VAULT_SAMPLE_SETUP).toContain(
      'path "secret/data/db" {\n  capabilities = ["read"]\n}'
    )
    expect(GITLAB_VAULT_SAMPLE_SETUP).not.toContain('secret/data/*')
    expect(yaml['fetch-secrets'].artifacts).toBeUndefined()
  })
  it('propagates failed login/read instead of exporting a failed command status or publishing the password', () => {
    const script = yaml['fetch-secrets'].script as string[]
    expect(script[0]).toBe('set -eu')
    expect(script).toEqual([
      'set -eu',
      'VAULT_TOKEN="$(vault write -field=token auth/jwt/login role=gitlab-ci jwt="$VAULT_ID_TOKEN")"',
      'export VAULT_TOKEN',
      'DB_PASSWORD="$(vault kv get -field=password secret/db)"',
      'export DB_PASSWORD',
      'test -n "$DB_PASSWORD"',
    ])
    expect(sample.codeSnippet + sample.secretInjection + sample.recommendation).not.toMatch(
      /CI_JOB_JWT|dotenv:|echo.*DB_PASSWORD|GitLab PQC roadmap/
    )
    expect(sample.pattern).toBe('GitLab CI ID Tokens + Vault JWT Auth')
  })
})
