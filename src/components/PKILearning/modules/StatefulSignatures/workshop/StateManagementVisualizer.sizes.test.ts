// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import SOURCE from './StateManagementVisualizer.tsx?raw'

/**
 * The size line and the signature inspector of the state visualizer take their byte counts from the
 * RFC 8554 layouts in data/signatureSizes.ts (an LMS signature is 12 + n(1 + p + h) bytes; the HSS
 * signature adds its 4-byte level count once). The earlier per-level formula already included that
 * count, so every level added 4 bytes too many to the header and shifted the inspector's coloured
 * sections. The sizes themselves are checked in data/signatureSizes.test.ts; this keeps the
 * component on those functions.
 */
describe('StateManagementVisualizer: signature sizes come from the RFC 8554 layout', () => {
  it('sizes one level with lmsSignatureBytes and the whole signature with hssSignatureBytes', () => {
    expect(SOURCE).toContain('const sigSize = lmsSignatureBytes(n, p, n, h)')
    expect(SOURCE).toMatch(
      /const sigSize = hssSignatureBytes\(\s*levelCfgs\.map\(\(c\) => c\.sigSize\),\s*cfg1\.n\s*\)/
    )
  })

  it('no longer uses the per-level formula that counted the level count twice', () => {
    expect(SOURCE).not.toContain('16 + n * (1 + p + h)')
  })
})
