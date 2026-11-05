// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { usePersonaStore } from '@/store/usePersonaStore'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { EVIDENCE_CLASS_LABEL, evidenceForTool } from '@/components/Playground/toolEvidence'
import { MobilePlaygroundView } from '@/components/Mobile/screens/MobilePlaygroundView'

beforeEach(() => usePersonaStore.setState({ selectedPersona: null }))

describe('Phone discovery preserves shared evidence scope', () => {
  it.each(['tls-simulator', 'hsm-capacity', 'qrng-demo'])(
    'phone %s card and sheet preserve the same existing evidence class and scope',
    (id) => {
      const tool = WORKSHOP_TOOLS.find((tool) => tool.id === id)!
      const profile = evidenceForTool(id)!
      render(
        <MemoryRouter>
          <MobilePlaygroundView />
        </MemoryRouter>
      )
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: tool.name } })
      const card = screen.getByText(tool.name).closest('article') as HTMLElement
      expect(within(card).getByText(EVIDENCE_CLASS_LABEL[profile.primary])).toBeInTheDocument()
      expect(within(card).getByText(profile.summary)).toBeInTheDocument()
      fireEvent.click(within(card).getByText(tool.name))
      const dialog = screen.getByRole('dialog', { name: tool.name })
      expect(within(dialog).getByText(EVIDENCE_CLASS_LABEL[profile.primary])).toBeInTheDocument()
      expect(within(dialog).getByText(profile.summary)).toBeInTheDocument()
    }
  )
})
