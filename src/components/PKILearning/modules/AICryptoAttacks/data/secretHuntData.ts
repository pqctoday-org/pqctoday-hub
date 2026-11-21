// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Hub-authored toy repository tree for Workshop Step 1 (Secret Hunt).
 * All sample secrets strictly use EXAMPLE_FAKE_ placeholders that cannot
 * pass any real secret scanner or authenticate to any service.
 */
import type { SourceClaimId } from './sourceClaims'

export interface RepoSecretArtifact {
  readonly id: string
  readonly path: string
  readonly locationClass:
    'commit-history' | 'config-env' | 'application-log' | 'crash-dump' | 'ci-workflow'
  readonly label: string
  readonly snippet: string
  readonly regexDetectable: boolean
  readonly whyRegexMissesOrHits: string
  readonly remediationTitle: string
  readonly remediationSteps: readonly string[]
  readonly relatedClaimId: SourceClaimId
}

export const SAMPLE_REPO_FILES: readonly RepoSecretArtifact[] = [
  {
    id: 'env-config',
    path: 'config/service.env.example',
    locationClass: 'config-env',
    label: 'Config & Environment File',
    snippet: [
      'SIGNING_ENDPOINT=https://kms.example.invalid/v1',
      'SIGNING_API_TOKEN=EXAMPLE_FAKE_SIGNING_TOKEN_01',
      'KMS_KEY_ALIAS=alias/example-app-signing-dev',
    ].join('\n'),
    regexDetectable: true,
    whyRegexMissesOrHits:
      'Matches simple prefix/assignment regexes (`SIGNING_API_TOKEN=...`), so pre-commit push protection can block it before push.',
    remediationTitle: 'Remove static token, revoke & use workload OIDC',
    remediationSteps: [
      'Block commit with push protection before it reaches remote history.',
      'Revoke the exposed token immediately and replace with short-lived OIDC workload identity.',
    ],
    relatedClaimId: 'AI-7.2',
  },
  {
    id: 'git-history',
    path: '.git/COMMIT_EDITMSG (rev 4f9a21c)',
    locationClass: 'commit-history',
    label: 'Historical Git Commit',
    snippet: [
      'commit 4f9a21c (removed in later commit 8b12d0e)',
      '+ const fallbackCredential = "EXAMPLE_FAKE_" + "SPLIT_CRED_02"',
      '- // TODO: move to HSM before release',
    ].join('\n'),
    regexDetectable: false,
    whyRegexMissesOrHits:
      'Simple current-tree regexes miss this because (a) a later commit deleted the line while history still retains it, and (b) string concatenation splits the token literal.',
    remediationTitle: 'Purge history, rotate credential & scan full git log',
    remediationSteps: [
      'Treat any secret ever committed to Git as compromised: revoke and rotate immediately (rewriting Git history alone does not revoke copies).',
      'Scan full commit history and move signing credentials into an HSM or KMS.',
    ],
    relatedClaimId: 'AI-2.5',
  },
  {
    id: 'worker-log',
    path: 'logs/auth-worker-2026-11.log',
    locationClass: 'application-log',
    label: 'Unstructured Application Log',
    snippet: [
      '2026-11-18T14:22:09Z WARN auth-worker retry failed for tenant=demo',
      'headers={"Authorization":"Bearer EXAMPLE_FAKE_SESSION_BEARER_03","X-Trace":"91a"}',
    ].join('\n'),
    regexDetectable: true,
    whyRegexMissesOrHits:
      'Bearer header rule matches if log scanning is enabled, though many teams only scan source files and omit CI/runtime log archives.',
    remediationTitle: 'Redact headers at logger boundary & shorten session TTL',
    remediationSteps: [
      'Strip Authorization/Cookie headers in structured logging middleware before emission.',
      'Shorten session lifetimes and bind tokens to hardware-backed or PoP/workload identities.',
    ],
    relatedClaimId: 'AI-2.1',
  },
  {
    id: 'crash-dump',
    path: 'dumps/signer-crash-sample.txt',
    locationClass: 'crash-dump',
    label: 'Diagnostic Crash Dump',
    snippet: [
      'PANIC at signer_init: unexpected EOF',
      'stack_frame[2] buf_hex_note="unstructured seed label: EXAMPLE_FAKE_RAW_SEED_LABEL_04"',
      'mem_region=heap (unzeroized diagnostic buffer)',
    ].join('\n'),
    regexDetectable: false,
    whyRegexMissesOrHits:
      'Standard vendor-prefix secret regexes miss unstructured seed labels or raw buffer dumps inside diagnostic artifacts.',
    remediationTitle: 'Disable core/crash dumps in signing processes & move keys to HSM',
    remediationSteps: [
      'Keep long-lived signing keys inside an HSM/KMS so raw private material never enters application heap.',
      'Zeroize ephemeral buffers and disable diagnostic heap dumps on signing hosts.',
    ],
    relatedClaimId: 'AI-7.5',
  },
  {
    id: 'ci-workflow',
    path: '.github/workflows/release-sign.yml',
    locationClass: 'ci-workflow',
    label: 'CI/CD Pipeline Configuration',
    snippet: [
      'jobs:',
      '  sign-release:',
      '    env:',
      '      DEPLOY_PAT_OVERRIDE: EXAMPLE_FAKE_CI_PAT_OVERRIDE_05',
      '    run: echo "signing artifact with static PAT instead of OIDC"',
    ].join('\n'),
    regexDetectable: false,
    whyRegexMissesOrHits:
      'Custom environment variable names without a known vendor token prefix evade naive static prefix rules, yet allow OIDC-to-cloud privilege escalation if a runner or developer token leaks.',
    remediationTitle: 'Replace static CI PAT with short-lived OIDC federation',
    remediationSteps: [
      'Configure short-lived OpenID Connect (OIDC) federation scoped tightly by repository, branch, and environment.',
      'Audit cloud STS assume-role trust policies and monitor abnormal token assumptions.',
    ],
    relatedClaimId: 'AI-2.5',
  },
] as const
