// SPDX-License-Identifier: GPL-3.0-only
/**
 * Lazy loaders for the two public NIST ACVP-Server sample vector sets the
 * WS-F ACVP-format prototype pins (src/services/acvp/__fixtures__/
 * nist-acvp-server/PROVENANCE.json). Loaded with `?raw` so the learner gets
 * the exact upstream bytes: the prototype recognises a public sample only by
 * the SHA-256 of those bytes, and a re-serialised copy would not match.
 *
 * Dynamic imports keep the 0.6 MB (ML-KEM) and 3.1 MB (ML-DSA) prompts out of
 * the module's main chunk until a learner asks for one.
 */
export type PublicFixtureId = 'ML-KEM-encapDecap-FIPS203' | 'ML-DSA-sigVer-FIPS204'

export interface PublicFixture {
  id: PublicFixtureId
  label: string
  loadPrompt: () => Promise<string>
  loadExpected: () => Promise<string>
}

export const PUBLIC_FIXTURES: Record<PublicFixtureId, PublicFixture> = {
  'ML-KEM-encapDecap-FIPS203': {
    id: 'ML-KEM-encapDecap-FIPS203',
    label: 'ML-KEM / encapDecap / FIPS203',
    loadPrompt: () =>
      import('@/services/acvp/__fixtures__/nist-acvp-server/ML-KEM-encapDecap-FIPS203/prompt.json?raw').then(
        (m) => m.default
      ),
    loadExpected: () =>
      import('@/services/acvp/__fixtures__/nist-acvp-server/ML-KEM-encapDecap-FIPS203/expectedResults.json?raw').then(
        (m) => m.default
      ),
  },
  'ML-DSA-sigVer-FIPS204': {
    id: 'ML-DSA-sigVer-FIPS204',
    label: 'ML-DSA / sigVer / FIPS204',
    loadPrompt: () =>
      import('@/services/acvp/__fixtures__/nist-acvp-server/ML-DSA-sigVer-FIPS204/prompt.json?raw').then(
        (m) => m.default
      ),
    loadExpected: () =>
      import('@/services/acvp/__fixtures__/nist-acvp-server/ML-DSA-sigVer-FIPS204/expectedResults.json?raw').then(
        (m) => m.default
      ),
  },
}

export const PUBLIC_FIXTURE_IDS = Object.keys(PUBLIC_FIXTURES) as PublicFixtureId[]

/** Save text as a local file (Blob download). Nothing leaves the browser. */
export const saveTextFile = (fileName: string, text: string): void => {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const readFileText = (file: File): Promise<string> =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(r.error)
        r.readAsText(file)
      })
