// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable testing-library/no-node-access -- finds a table row by its data attribute */
/**
 * Behaviour of the three workshop steps with the OpenSSL service replaced by a stand-in that
 * returns fixed bytes. The real tool is exercised by the local test of the same name.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { getAlgorithm } from '@/data/algorithmProperties'
import { MLKEMRoundTrip } from './workshop/MLKEMRoundTrip'
import { MLDSASignVerify } from './workshop/MLDSASignVerify'
import { SizeComparator } from './workshop/SizeComparator'
import { COMPARATOR_NAMES, FILES } from './data/workshopData'

const execute = vi.fn()
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: (...args: unknown[]) => execute(...args),
    deleteFile: vi.fn(async () => undefined),
  },
}))

const bytes = (n: number, v: number) => new Uint8Array(n).fill(v)
const file = (name: string, data: Uint8Array) => ({ name, data })
const result = (...files: { name: string; data: Uint8Array }[]) => ({
  stdout: '',
  stderr: '',
  files,
})

const renderStep = (node: React.ReactElement) => render(<MemoryRouter>{node}</MemoryRouter>)

describe('step 1: ML-KEM round trip', () => {
  beforeEach(() => {
    execute.mockReset()
    execute.mockImplementation(
      async (command: string, inputs: { name: string; data: Uint8Array }[] = []) => {
        if (command.includes('genpkey')) return result(file(FILES.kemKey, bytes(8, 1)))
        if (command.includes('-pubout')) return result(file(FILES.kemPub, bytes(8, 2)))
        if (command.includes('-encap'))
          return result(
            file(FILES.kemCiphertext, bytes(1088, 3)),
            file(FILES.kemSecret, bytes(32, 7))
          )
        if (command.includes('-decap')) {
          const ciphertext = inputs.find((i) => i.name.endsWith('ciphertext.bin'))
          const same = ciphertext !== undefined && ciphertext.data.every((b) => b === 3)
          const out = command.includes(FILES.kemAlteredRecovered)
            ? FILES.kemAlteredRecovered
            : FILES.kemRecovered
          return result(file(out, bytes(32, same ? 7 : 9)))
        }
        throw new Error(`unexpected command ${command}`)
      }
    )
  })

  it('shows the same secret after decapsulation and a different one for a changed ciphertext', async () => {
    renderStep(<MLKEMRoundTrip />)
    fireEvent.click(screen.getByRole('button', { name: /Generate a key pair/ }))
    expect(await screen.findByText(/Generated for ML-KEM-768/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /2\. Encapsulate/ }))
    expect(await screen.findByText('Ciphertext: 1088 bytes')).toBeInTheDocument()
    expect(screen.getByText('Shared secret: 32 bytes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /3\. Decapsulate/ }))
    expect(
      await screen.findByText(/Same as the secret from encapsulation: yes/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Change one byte of the ciphertext/ }))
    expect(screen.getByText(/was flipped/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Decapsulate the changed ciphertext/ }))
    expect(await screen.findByText(/The command finished without an error/)).toBeInTheDocument()
    expect(screen.getByText(/Same as the secret from encapsulation: no/)).toBeInTheDocument()
  })

  it('reports a failure of the tool instead of a result', async () => {
    execute.mockReset()
    execute.mockRejectedValue(new Error('OpenSSL Service not available: offline'))
    renderStep(<MLKEMRoundTrip />)
    fireEvent.click(screen.getByRole('button', { name: /Generate a key pair/ }))
    expect(await screen.findByText(/not available/)).toBeInTheDocument()
  })
})

describe('step 2: ML-DSA sign and verify', () => {
  beforeEach(() => {
    execute.mockReset()
    execute.mockImplementation(
      async (command: string, inputs: { name: string; data: Uint8Array }[] = []) => {
        if (command.includes('genpkey')) return result(file(FILES.dsaKey, bytes(8, 1)))
        if (command.includes('-pubout')) return result(file(FILES.dsaPub, bytes(8, 2)))
        if (command.includes('-sign')) {
          const det = command.includes('deterministic:1')
          return result(
            file(FILES.dsaSignature, bytes(3309, det ? 5 : Math.floor(Math.random() * 200)))
          )
        }
        if (command.includes('-verify')) {
          const message = inputs.find((i) => i.name === FILES.dsaMessage)
          const text = new TextDecoder().decode(message?.data)
          if (text !== 'Message to sign') throw new Error('OpenSSL exited with status 1')
          return result()
        }
        throw new Error(`unexpected command ${command}`)
      }
    )
  })

  it('verifies the signed message and rejects a changed one', async () => {
    renderStep(<MLDSASignVerify />)
    fireEvent.click(screen.getByRole('button', { name: /Generate a key pair/ }))
    expect(await screen.findByText(/Key pair generated for ML-DSA-65/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sign the message/ }))
    expect(await screen.findByText(/Signature: 3309 bytes \(hedged\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Verify the signature/ }))
    expect(await screen.findByText('Signature verified.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Message to verify'), {
      target: { value: 'Message to sigN' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Verify the signature/ }))
    expect(await screen.findByText('Verification failed.')).toBeInTheDocument()
  })

  it('compares two deterministic signatures of the same message', async () => {
    renderStep(<MLDSASignVerify />)
    fireEvent.click(screen.getByRole('button', { name: /Generate a key pair/ }))
    expect(await screen.findByText(/Key pair generated/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Deterministic' }))
    fireEvent.click(screen.getByRole('button', { name: /Sign the message/ }))
    expect(await screen.findByText(/\(deterministic\)/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sign the message/ }))
    expect(
      await screen.findByText(
        /Same bytes as the previous signature of this message and context: yes/
      )
    ).toBeInTheDocument()
    const signCalls = execute.mock.calls.filter(([c]) => String(c).includes('-sign'))
    expect(signCalls.every(([c]) => String(c).includes('-pkeyopt deterministic:1'))).toBe(true)
  })

  it('refuses a context string the command line cannot carry', async () => {
    renderStep(<MLDSASignVerify />)
    fireEvent.change(screen.getByLabelText(/Context string \(leave empty/), {
      target: { value: 'has"quote' },
    })
    expect(screen.getByText(/printable characters without quotes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign the message/ })).toBeDisabled()
  })
})

describe('step 3: size comparator', () => {
  it('lists every algorithm with the registry values', () => {
    renderStep(<SizeComparator />)
    for (const name of COMPARATOR_NAMES) {
      const row = document.querySelector(`[data-row="${name}"]`) as HTMLElement
      expect(row, name).not.toBeNull()
      const a = getAlgorithm(name)
      for (const n of [a.publicKeyBytes, a.privateKeyBytes, a.signatureOrCiphertextBytes]) {
        expect(
          within(row).getAllByText(n.toLocaleString('en-US')).length,
          `${name} ${n}`
        ).toBeGreaterThan(0)
      }
    }
    expect(execute).not.toHaveBeenCalled()
  })
})
