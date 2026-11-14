// SPDX-License-Identifier: AGPL-3.0-only
// The SUPI input names the sample home network and, for Profile C only, warns that a SUPI of
// another PLMN will be refused by the home network. The input itself is never blocked.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SuciFlow } from './SuciFlow'
import { fiveGService } from './services/FiveGService'

const hsm = vi.hoisted(() => ({
  isReady: false,
  moduleRef: { current: null },
  hSessionRef: { current: 0 },
  slotRef: { current: 0 },
  log: [],
  keys: [],
  initialize: vi.fn(),
  clearLog: vi.fn(),
  clearKeys: vi.fn(),
  removeKey: vi.fn(),
  addStepLog: vi.fn(),
  registerKey: vi.fn(),
}))
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsm }))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  fiveGService.state = {}
})

const supiInput = () => screen.getByPlaceholderText('310260123456789')
const type = (digits: string) => fireEvent.change(supiInput(), { target: { value: digits } })
const notice = () => screen.queryByTestId('supi-plmn-notice')

describe('SUPI input and the sample home network', () => {
  it.each(['a', 'b', 'c'] as const)(
    'profile %s: states the home network is MCC 310 / MNC 260',
    async (p) => {
      const user = userEvent.setup()
      render(<SuciFlow onBack={vi.fn()} />)
      await user.click(screen.getByTestId(`profile-${p}-btn`))
      expect(screen.getByTestId('supi-home-network-note')).toHaveTextContent(
        "This sample's home network is MCC 310 / MNC 260."
      )
    }
  )

  it('profile C: a SUPI of another PLMN shows the refusal notice and the input stays editable', async () => {
    const user = userEvent.setup()
    render(<SuciFlow onBack={vi.fn()} />)
    await user.click(screen.getByTestId('profile-c-btn'))
    expect(notice()).not.toBeInTheDocument() // default 310260... is this home network
    type('310990123456789')
    expect(supiInput()).toHaveValue('310990123456789') // not blocked
    expect(notice()).toHaveTextContent('MCC 310 / MNC 990')
    expect(notice()).toHaveTextContent('"PLMN is not this home network"')
    expect(notice()).toHaveTextContent('Profile A and Profile B do not check the PLMN')
    type('234260123456789')
    expect(notice()).toHaveTextContent('MCC 234 / MNC 260')
    type('310260123456789')
    expect(notice()).not.toBeInTheDocument()
  })

  it('profile C: no notice while the SUPI is incomplete (the length error shows instead)', async () => {
    const user = userEvent.setup()
    render(<SuciFlow onBack={vi.fn()} />)
    await user.click(screen.getByTestId('profile-c-btn'))
    type('31099')
    expect(notice()).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('exactly 15 digits')
  })

  it.each(['a', 'b'] as const)(
    'profile %s: a SUPI of another PLMN shows no refusal notice',
    async (p) => {
      const user = userEvent.setup()
      render(<SuciFlow onBack={vi.fn()} />)
      await user.click(screen.getByTestId(`profile-${p}-btn`))
      type('310990123456789')
      expect(supiInput()).toHaveValue('310990123456789')
      expect(notice()).not.toBeInTheDocument()
    }
  )

  it('switching to Profile C with a foreign SUPI already typed shows the notice', async () => {
    const user = userEvent.setup()
    render(<SuciFlow onBack={vi.fn()} />)
    type('310990123456789')
    expect(notice()).not.toBeInTheDocument()
    await user.click(screen.getByTestId('profile-c-btn'))
    expect(notice()).toBeInTheDocument()
  })
})
