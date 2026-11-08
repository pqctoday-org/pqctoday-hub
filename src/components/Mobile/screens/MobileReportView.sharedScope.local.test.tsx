// SPDX-License-Identifier: AGPL-3.0-only
import { Button } from '@/components/ui/button'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { MobileReportView } from './MobileReportView'
import { EXAMPLE_REPORT_RESULT } from '@/data/exampleReport'
const pack = vi.hoisted(() => vi.fn())
vi.mock('@/components/common/BoardPackExport', () => ({
  BoardPackExport: (props: unknown) => {
    pack(props)
    return <Button>Shared pack fixture</Button>
  },
}))

describe('existing phone shared result/export contract', () => {
  it('uses the passed sender result and guarded board-pack context', () => {
    const sender = { ...EXAMPLE_REPORT_RESULT, riskScore: 17 }
    render(
      <MemoryRouter>
        <MobileReportView
          sharedView={{ result: sender, persona: 'executive', approximate: false }}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('17')).toBeTruthy()
    expect(pack.mock.calls.at(-1)![0]).toMatchObject({
      result: sender,
      shared: true,
      persona: 'executive',
    })
  })
  it('does not add an engineering export to the phone developer brief', () => {
    pack.mockClear()
    render(
      <MemoryRouter>
        <MobileReportView
          sharedView={{ result: EXAMPLE_REPORT_RESULT, persona: 'developer', approximate: false }}
        />
      </MemoryRouter>
    )
    expect(pack).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /engineering/i })).toBeNull()
  })
})
