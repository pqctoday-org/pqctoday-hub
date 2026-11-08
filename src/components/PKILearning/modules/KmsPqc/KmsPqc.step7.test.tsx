// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Step 7 is registered everywhere a workshop step has to be: the manifest, the
 * rendered PARTS, the module shell, and the Crypto Lab (Playground) listing.
 * Before Step 7 existed the module had six steps and the Playground had no
 * Cloud KMS Key Exchange tool; each assertion here failed on that code.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import '@testing-library/jest-dom'
import fs from 'node:fs'
import path from 'node:path'
import manifest from './manifest'
import { WORKSHOP_TOOLS, TOOL_COMPONENTS } from '@/components/Playground/workshopRegistry'
import { TOOL_ROUTE_META } from '@/seo/toolRouteMeta.generated'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    phase: 'idle',
    isReady: false,
    error: null,
    engine: 'rust',
    moduleRef: { current: null },
    slotRef: { current: 0 },
    hSessionRef: { current: 0 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    removeKey: vi.fn(),
    addStepLog: vi.fn(),
    clearKeys: vi.fn(),
    clearLog: vi.fn(),
    initialize: vi.fn(),
    finalize: vi.fn(),
  }),
}))

describe('KmsPqc Step 7: Cloud KMS key exchange', () => {
  it('the manifest declares seven workshop steps, the seventh being the cloud KMS exchange', () => {
    expect(manifest.workshopSteps).toHaveLength(7)
    expect(manifest.workshopSteps?.[6]).toEqual({
      id: 'cloud-kms-exchange',
      label: 'Cloud KMS Key Exchange',
    })
  })

  it('the module renders the same seven ids as PARTS, in order', () => {
    const src = fs.readFileSync(path.resolve(__dirname, 'index.tsx'), 'utf8')
    const parts = src.match(/const PARTS[^=]*=\s*\[([\s\S]*?)\n\]/)![1]
    const ids = [...parts.matchAll(/\{\s*id: '([^']+)'/g)].map((m) => m[1])
    expect(ids).toEqual(manifest.workshopSteps!.map((s) => s.id))
    expect(ids).toHaveLength(7)
  })

  it('is listed in the Playground, in the HSM / PKCS#11 category, and links back to Step 7', () => {
    const tool = WORKSHOP_TOOLS.find((t) => t.id === 'cloud-kms-key-exchange')
    expect(tool).toBeDefined()
    expect(tool?.category).toBe('HSM / PKCS#11')
    expect(tool?.moduleLink).toBe('/learn/kms-pqc?tab=workshop&step=6')
    expect(TOOL_COMPONENTS['cloud-kms-key-exchange']).toBeDefined()
    expect(TOOL_ROUTE_META.some((m) => m.path === '/playground/cloud-kms-key-exchange')).toBe(true)
  })

  it('the Playground listing does not claim more than the step does', () => {
    const tool = WORKSHOP_TOOLS.find((t) => t.id === 'cloud-kms-key-exchange')!
    const text = `${tool.description} ${tool.intro?.whatYouWillDo} ${tool.intro?.workedExample}`
    expect(text).toMatch(/[Ss]imulat/)
    expect(text).toMatch(/no cloud call/i)
  })

  it('renders the step in the module when it is opened from the workshop rail', async () => {
    const user = userEvent.setup()
    const { KmsPqcModule } = await import('./index')
    render(
      <EmbedProvider>
        <MemoryRouter>
          <KmsPqcModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    await user.click(screen.getByRole('tab', { name: 'Workshop' }))
    await user.click(await screen.findByRole('button', { name: /Step 7: Cloud KMS Key Exchange/ }))
    expect(
      await screen.findByRole('heading', { name: 'Exchanging keys with a cloud KMS' })
    ).toBeInTheDocument()
  })
})
