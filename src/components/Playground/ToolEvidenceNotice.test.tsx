// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'
import { NON_CERTIFICATION_NOTICE } from './toolEvidence'
import { ToolEvidenceNotice } from './ToolEvidenceNotice'

describe('ToolEvidenceNotice result boundary', () => {
  it.each(['entropy-test', 'drbg-demo', 'firmware-signing'])(
    '%s carries the one validation disclaimer, not a second wording',
    (toolId) => {
      render(<ToolEvidenceNotice toolId={toolId} resultBoundary />)
      expect(screen.getByTestId('validation-disclaimer')).toHaveTextContent(VALIDATION_DISCLAIMER)
      expect(document.body).not.toHaveTextContent(NON_CERTIFICATION_NOTICE)
    }
  )

  it('other certification-boundary tools keep the generic notice', () => {
    render(<ToolEvidenceNotice toolId="rng-demo" resultBoundary />)
    expect(document.body).toHaveTextContent(NON_CERTIFICATION_NOTICE)
    expect(screen.queryByTestId('validation-disclaimer')).toBeNull()
  })
})
