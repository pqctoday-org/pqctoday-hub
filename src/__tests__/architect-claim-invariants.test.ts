// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Security Architect claim invariants.
 *
 * Each check below is a sentence the site used to teach that is false, and
 * that was corrected. They scan what the build ships — Learn module sources,
 * their summaries, the step exercises, the glossary, the topic summaries and
 * the LATEST module Q&A file (older dated copies are history, not served).
 * Reintroducing any of these sentences fails the test.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const MODULES = path.join(ROOT, 'src/components/PKILearning/modules')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx?|md)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}

function latestModuleQa(): string {
  const dir = path.join(ROOT, 'src/data/module-qa')
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^module_qa_combined_.*\.csv$/.test(f))
    .sort()
    .reverse()
  return path.join(dir, files[0])
}

const SHIPPED: string[] = [
  ...walk(MODULES),
  ...walk(path.join(ROOT, 'src/components/Playground/kmip')),
  path.join(ROOT, 'src/wasm/kmip/kmipMeta.ts'),
  path.join(ROOT, 'src/data/stepExercises.ts'),
  path.join(ROOT, 'src/data/agilityNarration.ts'),
  path.join(ROOT, 'src/data/glossary/concepts.json'),
  path.join(ROOT, 'src/data/module-topic-summaries.md'),
  latestModuleQa(),
]

/** [pattern, why it is wrong] */
const BANNED: Array<[RegExp, string]> = [
  [
    /aws:tlsCipherSuites|TLS_AES_256_GCM_SHA384_PQ/,
    'AWS has no condition key for TLS cipher suites; PQ TLS is a client setting',
  ],
  [
    /One key pair serves both purposes/i,
    'sound designs separate keys by purpose; AWS KMS allows one usage per key',
  ],
  [/key inventory doubles/i, 'inventory grows only where classical keys were dual-use'],
  [/Full PQC firmware support/i, 'HSM vendors differ in algorithms, APIs and FIPS coverage'],
  [/achieved instantly/i, 'a central upgrade still needs per-application adoption and testing'],
  [
    /in (a single|one) certificate (for|to ensure) backward compatib/i,
    'composite certificates are not backward compatible',
  ],
  [
    /18\s*[–-]\s*36\s*KB/,
    'the chain-size scenario is ML-DSA-44 leaf + intermediate + CertificateVerify = 9,884 B',
  ],
  [/JSSE ML-KEM in Java 22/i, 'JSSE hybrid ML-KEM TLS ships in JDK 27 (JEP 527)'],
  [
    /purpose=asymmetric-encrypt\s*\\+\s*\n\s*--default-algorithm=(ML_KEM|X_WING|ml-kem|kem-xwing)/i,
    'Cloud KMS KEM keys use --purpose=key-encapsulation',
  ],
  [/--kty ML-KEM/i, 'Azure Key Vault has no ML-KEM key type'],
  [/label: 'FIPS-only'/, 'an allowlist does not make the engine a FIPS 140-3 validated module'],
]

describe('Security Architect claim invariants', () => {
  it('scans a non-trivial set of shipped files', () => {
    expect(SHIPPED.length).toBeGreaterThan(200)
  })

  for (const [re, why] of BANNED) {
    it(`no shipped file matches ${re} (${why})`, () => {
      const hits = SHIPPED.filter((f) => re.test(fs.readFileSync(f, 'utf-8'))).map((f) =>
        path.relative(ROOT, f)
      )
      expect(hits).toEqual([])
    })
  }

  // Merkle Tree Certificates handshake sizes. The old figures left the server's public key and
  // CertificateVerify signature out of the MTC columns (936 B, "92%"), counted the root's key in
  // the traditional chain (12,034 B) and compared against a 3-certificate chain. Module Q&A and
  // quiz rows move through the data flow, so this guard covers the files the build ships as code,
  // the glossary and the topic summaries.
  it('the MTC handshake sizes keep the server key and CertificateVerify in every column', () => {
    const mtcFiles = SHIPPED.filter(
      (f) =>
        /MerkleTreeCerts|PKIWorkshop/.test(f) ||
        /glossary\/concepts\.json$|module-topic-summaries\.md$/.test(f)
    )
    const stale =
      /~?936\s*(bytes|B)\b|up to 92\s?%|92\s?%\s*(size )?reduction|63[–-]74\s?%|\b12,034\b|\b11,196\b|\b4,444\b|no signature transmitted in the TLS handshake/i
    const hits = mtcFiles
      .filter((f) => !/\.test\.tsx?$/.test(f) && stale.test(fs.readFileSync(f, 'utf-8')))
      .map((f) => path.relative(ROOT, f))
    expect(hits).toEqual([])
  })

  it('the old Merkle Tree Certificates draft is only cited as the one that was replaced', () => {
    const bad: string[] = []
    for (const f of SHIPPED) {
      const lines = fs.readFileSync(f, 'utf-8').split('\n')
      lines.forEach((line, i) => {
        // JSX wraps sentences, so look at the line and its neighbours.
        const context = lines.slice(Math.max(0, i - 2), i + 3).join(' ')
        if (
          /draft-davidben-tls-merkle-tree-certs/.test(line) &&
          !/replac|originat|plants/i.test(context)
        )
          bad.push(`${path.relative(ROOT, f)}: ${line.trim().slice(0, 120)}`)
      })
    }
    expect(bad).toEqual([])
  })
})
