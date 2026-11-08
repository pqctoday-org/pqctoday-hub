// SPDX-License-Identifier: AGPL-3.0-only
// Actual chooser, step descriptions, diagram, plain-English rail, perspective
// controls and actual EphemeralOps output. No cryptographic validity claim.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuciFlow } from './SuciFlow'
import { fiveGService } from './services/FiveGService'
import { openSSLService } from '@/services/crypto/OpenSSLService'

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
vi.mock('@/components/shared/LiveHSMToggle', () => ({
  LiveHSMToggle: () => null,
}))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: () => null,
}))
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn() },
}))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.mocked(openSSLService.execute)
    .mockReset()
    .mockResolvedValue({ stdout: '', stderr: '', files: [] })
  localStorage.clear()
  sessionStorage.clear()
  fiveGService.state = {}
  fiveGService.testVectors = undefined
  // Prerequisite activities are controlled fixtures, not the claim under test.
  vi.spyOn(fiveGService, 'generateNetworkKey').mockResolvedValue({
    output: 'Fixture HN-key prerequisite ready',
    pubKeyFile: 'hn.pub',
    privKeyFile: 'hn.key',
  })
  vi.spyOn(fiveGService, 'provisionUSIM').mockResolvedValue(
    'Fixture card-personalization prerequisite only'
  )
  vi.spyOn(fiveGService, 'retrieveKey').mockResolvedValue(
    'Fixture HN-public-key retrieval prerequisite ready'
  )
  vi.spyOn(fiveGService, 'cleanup').mockImplementation(async () => {
    fiveGService.state = {}
    fiveGService.generatedFiles.clear()
  })
  vi.spyOn(fiveGService, 'getTimestamp').mockReturnValue('sample-a008')
  // Opaque engine-output fixtures only: the real ephemeral operation formats
  // these values. No key validity, ECDH result or generated randomness is asserted.
  vi.spyOn(fiveGService, 'readFileHex').mockImplementation(async (name) =>
    name.includes('_priv_')
      ? '11'.repeat(32)
      : fiveGService.state.profile === 'B'
        ? '04' + '22'.repeat(64)
        : '22'.repeat(32)
  )
})
async function reachEphemeral(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole('button', { name: 'Execute Step' }))
    await user.click(await screen.findByRole('button', { name: 'Next Step' }))
  }
  await screen.findByRole('heading', { name: /^4\. Generate Ephemeral Key/ })
}
const rail = () =>
  screen.getByRole('complementary', {
    name: 'What just happened in plain English',
  })

describe('SUCI fresh-sender versus later-static-recipient compromise teaching', () => {
  it.each(['A', 'B', 'C'] as const)(
    'selected Profile %s keeps the existing key-generation output and its limited privacy explanation aligned',
    async (profile) => {
      const user = userEvent.setup(),
        changed = vi.fn()
      render(<SuciFlow onBack={vi.fn()} onProfileChange={changed} />)
      // Actual public chooser, not a forced state mutation or mocked wizard.
      await user.click(screen.getByTestId(`profile-${profile.toLowerCase()}-btn`))
      expect(changed).toHaveBeenLastCalledWith(profile)
      if (profile === 'C')
        expect(
          screen.getByText('Research proposal (Khan et al. 2025) · not a 3GPP profile')
        ).toBeInTheDocument()
      await reachEphemeral(user)
      if (profile !== 'C') {
        const description = screen.getByText(/^Generate a fresh ephemeral key pair/)
        expect(description).toHaveTextContent('The UE key is fresh for this attempt')
        expect(description).toHaveTextContent(
          'does not provide forward secrecy against later compromise of the home network private key'
        )
        expect(description).toHaveTextContent('captured SUCI to recover its shared secret')
      } else {
        expect(
          screen.getByText(/^In Hybrid Mode, the USIM generates an X25519 ephemeral key pair/)
        ).toHaveTextContent('In Pure PQC mode, this step is skipped')
      }
      expect(rail()).toHaveTextContent('fresh, one-time keypair just for this connection attempt')
      expect(rail()).toHaveTextContent(
        'does not by itself provide forward secrecy against later compromise of the home network private key'
      )
      expect(rail()).toHaveTextContent(
        'captured SUCIs include the UE public key needed for deconcealment'
      )
      expect(rail()).toHaveTextContent(
        'software comparison also retains sample private-key bytes in the browser'
      )

      await user.click(screen.getByRole('button', { name: 'Execute Step' }))
      await screen.findByRole('button', { name: 'Next Step' })
      // Actual service output; generateEphemeralKey/EphemeralOps were not mocked.
      expect(await screen.findByText(/Ephemeral(?: ECC)? Key Pair Ready\./)).toBeInTheDocument()
      expect(
        vi
          .mocked(openSSLService.execute)
          .mock.calls.some(([command]) => command.includes('genpkey'))
      ).toBe(true)
      expect(rail()).toHaveTextContent('does not by itself provide forward secrecy')

      // The actual observation/legend-like sidecar distinguishes what is on-air
      // from a later private-key compromise; it does not model that compromise.
      await user.click(screen.getAllByRole('button', { name: 'IMSI-catcher view' })[0])
      const observation = screen.getByRole('note', {
        name: 'What an IMSI catcher would observe at this step',
      })
      expect(observation).toHaveTextContent(
        profile === 'C' ? 'Nothing yet' : 'No modeled radio output yet'
      )
      if (profile !== 'C')
        expect(observation).toHaveTextContent('ephemeral public key is included later in the SUCI')
      expect(
        within(rail()).getByText(/later compromise of the home network private key/)
      ).toBeInTheDocument()
      // The real toggle hides/restores the authored rail, not the underlying result.
      await user.click(screen.getByRole('checkbox', { name: 'Plain English' }))
      expect(
        screen.queryByRole('complementary', {
          name: 'What just happened in plain English',
        })
      ).not.toBeInTheDocument()
      await user.click(screen.getByRole('checkbox', { name: 'Plain English' }))
      expect(rail()).toHaveTextContent(
        'captured SUCIs include the UE public key needed for deconcealment'
      )
      expect(screen.getByText(/Ephemeral(?: ECC)? Key Pair Ready\./)).toBeInTheDocument()
    }
  )
})
