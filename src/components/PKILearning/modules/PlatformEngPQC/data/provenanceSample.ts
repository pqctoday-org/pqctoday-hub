// SPDX-License-Identifier: AGPL-3.0-only
import fixture from './provenanceSampleFixture.json'

export const PROVENANCE_SAMPLE_FILES: Readonly<Record<string, string>> = fixture
export const PROVENANCE_POLICY = fixture['sample-policy.rego']
export const PROVENANCE_RUNNER = fixture['verify-sample.py']
export const PROVENANCE_PUBLIC_KEY_SHA256 =
  '1f677545f078de476414aad2cdad75ce69bf85f4ecb498903867dfc9c9d475f5'

/** Expected outcomes are instructions for the copied tool run, not browser verification. */
export function provenanceFilesForCase(kind: 'trusted' | 'changed-artifact' | 'changed-statement') {
  const files = { ...PROVENANCE_SAMPLE_FILES }
  if (kind === 'changed-artifact') files['artifact.txt'] += 'changed after signing\n'
  if (kind === 'changed-statement') {
    const statement = JSON.parse(files['statement.json'])
    statement.predicate.runDetails.builder.id = 'https://example.test/builders/other'
    files['statement.json'] = JSON.stringify(statement, null, 2) + '\n'
  }
  return files
}
