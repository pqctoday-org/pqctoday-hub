// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable testing-library/no-node-access -- reads the <dd> value next to a <dt> label and the key container <pre> */
//
// The IKEv2 panel shows the displayed inputs and the displayed outputs of a real derivation. The
// check below recomputes SKEYSEED, SK_* and the RFC 8784 mixing from the values on the page using
// Node's HMAC, so a pass cannot come from the panel agreeing with itself.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/QKD/workshop/ProtocolIntegrationDemo.ikev2.local.test.tsx
import { createHmac, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProtocolIntegrationDemo } from './ProtocolIntegrationDemo'

const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => {
  Object.defineProperty(window, 'crypto', { configurable: true, value: webcrypto })
})
afterEach(() => {
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})

const bytes = (hex: string) => Buffer.from(hex, 'hex')
const prf = (key: Buffer, data: Buffer) => createHmac('sha256', key).update(data).digest()
const prfPlus = (key: Buffer, seed: Buffer, blocks: number) => {
  const out: Buffer[] = []
  let previous = Buffer.alloc(0)
  for (let n = 1; n <= blocks; n++) {
    previous = prf(key, Buffer.concat([previous, seed, Buffer.from([n])]))
    out.push(previous)
  }
  return out
}
/** The value displayed under a label (matched by exact text of the <dt>). */
const shown = (label: string): string => {
  const dt = screen
    .getAllByText(label, { exact: true })
    .find((element) => element.tagName === 'DT') as HTMLElement
  return within(dt.closest('div') as HTMLElement).getByText(/./, { selector: 'code' }).textContent!
}

const run = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Run IKEv2 + RFC 8784 Key Derivation' }))
  await screen.findByText(/Key derivation calculated locally for two fictional peers/)
}

describe('IKEv2 panel: real SKEYSEED, SK_* and RFC 8784 PPK mixing', () => {
  it('states what runs and what does not, and no longer calls an HKDF output SKEYSEED', () => {
    render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/ECP-256, DH group 19; PRF-HMAC-SHA-256/)
    expect(text).toMatch(/No IKE_SA_INIT or IKE_AUTH message is sent/)
    expect(text).toMatch(/not a standardized QKD binding/)
    expect(text).not.toMatch(/Local HKDF Illustration|HKDF-SHA256\(sample/)
    expect(screen.queryByRole('button', { name: /Local IKE-Context HKDF/ })).not.toBeInTheDocument()
  })

  it('displayed SKEYSEED, SK_* and PPK-mixed keys recompute from the displayed inputs', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    await run()
    const ni = bytes(shown('Ni (initiator nonce, 32 bytes)'))
    const nr = bytes(shown('Nr (responder nonce, 32 bytes)'))
    const spiI = bytes(shown('SPIi (initiator SPI, 8 bytes, fictional)'))
    const spiR = bytes(shown('SPIr (responder SPI, 8 bytes, fictional)'))
    const sharedX = bytes(
      shown('g^ir (ECP-256 shared x coordinate, 32 bytes; both peers computed the same value)')
    )
    const skeyseed = prf(Buffer.concat([ni, nr]), sharedX)
    expect(shown('SKEYSEED = prf(Ni | Nr, g^ir), PRF-HMAC-SHA-256')).toBe(skeyseed.toString('hex'))

    const [skD, skAi, skAr, skEi, skEr, skPi, skPr] = prfPlus(
      skeyseed,
      Buffer.concat([ni, nr, spiI, spiR]),
      7
    )
    const plainLabel = (name: string) =>
      `${name} (plain IKEv2, prf+(SKEYSEED, Ni | Nr | SPIi | SPIr); the final key when no PPK is used)`
    expect(shown(plainLabel('SK_d′'))).toBe(skD.toString('hex'))
    expect(shown(plainLabel('SK_ai'))).toBe(skAi.toString('hex'))
    expect(shown(plainLabel('SK_ar'))).toBe(skAr.toString('hex'))
    expect(shown(plainLabel('SK_ei'))).toBe(skEi.toString('hex'))
    expect(shown(plainLabel('SK_er'))).toBe(skEr.toString('hex'))
    expect(shown(plainLabel('SK_pi′'))).toBe(skPi.toString('hex'))
    expect(shown(plainLabel('SK_pr′'))).toBe(skPr.toString('hex'))

    // The PPK is the key under the displayed QKD key_ID in the displayed container.
    const container = JSON.parse(document.body.querySelector('pre')!.textContent!) as {
      keys: { key_ID: string; key: string }[]
    }
    const ppk = Buffer.from(container.keys[0].key, 'base64')
    expect(ppk).toHaveLength(32)
    expect(shown('QKD key_ID (sent as the PPK_ID content)')).toBe(container.keys[0].key_ID)
    expect(shown('PPK_ID as sent: type 1 (PPK_ID_OPAQUE) then the 16 key ID octets')).toBe(
      `01${container.keys[0].key_ID.replace(/-/g, '')}`
    )
    expect(shown('SK_d = prf+(PPK, SK_d′)')).toBe(prfPlus(ppk, skD, 1)[0].toString('hex'))
    expect(shown('SK_pi = prf+(PPK, SK_pi′)')).toBe(prfPlus(ppk, skPi, 1)[0].toString('hex'))
    expect(shown('SK_pr = prf+(PPK, SK_pr′)')).toBe(prfPlus(ppk, skPr, 1)[0].toString('hex'))
    expect(shown('SK_d = prf+(PPK, SK_d′)')).not.toBe(skD.toString('hex'))
  })

  it('shows both paths and says plainly that the fallback session is not quantum-safe', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    await run()
    expect(
      screen.getByText(/Path 1: both peers fetched the key from their own QKD node/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Path 2: the responder's QKD node cannot supply the key, no PPK/)
    ).toHaveTextContent('PPK optional')
    expect(screen.getByText(/This session is NOT quantum-safe\./)).toBeInTheDocument()
    expect(screen.getAllByText(/continues as plain IKEv2/).length).toBeGreaterThan(0)
    expect(document.body.textContent).toMatch(/identical SK_d, SK_pi and SK_pr/)
  })

  it('mandatory policy: a missing key aborts the negotiation instead of falling back', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    fireEvent.click(screen.getByRole('radio', { name: /Mandatory: abort if the PPK is missing/ }))
    await run()
    expect(screen.getByText(/PPK mandatory/)).toBeInTheDocument()
    expect(screen.getByText(/No session is established\./)).toHaveTextContent(
      /AUTHENTICATION_FAILED/
    )
    expect(screen.queryByText(/This session is NOT quantum-safe\./)).not.toBeInTheDocument()
  })

  it('each run uses new nonces and a new QKD key', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    await run()
    const first = [
      shown('Ni (initiator nonce, 32 bytes)'),
      shown('QKD key_ID (sent as the PPK_ID content)'),
    ]
    await run()
    expect(shown('Ni (initiator nonce, 32 bytes)')).not.toBe(first[0])
    expect(shown('QKD key_ID (sent as the PPK_ID content)')).not.toBe(first[1])
  })
})
