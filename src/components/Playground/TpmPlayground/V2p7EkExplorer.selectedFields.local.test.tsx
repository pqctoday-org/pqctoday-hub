// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { V2p7EkExplorer } from './V2p7EkExplorer'

const bridge = vi.hoisted(() => ({ readPublic: vi.fn() }))
vi.mock('../../../wasm/tpmBridge', () => ({ readPublic: bridge.readPublic }))
vi.mock('./useTpmBusy', () => ({ useTpmBusy: () => false }))

// Authored decoder fixtures, not captured TPM output or valid cryptographic keys.
// Fixed common-field and PolicyB literals come from the v2p7-reference.ts
// snapshot, whose declared upstream is tcg_pqc_ek_constants.h. They are not
// imported at runtime and do not independently validate those reference values.
// Uninterpreted parameter space uses the explorer's existing
// eight-/three-byte input contract; its contents and key bytes are not validated.
const policies = {
  sha256: 'ca3d0a99a2b93906f7a3342414efcfb3a385d44cd1fd459089d19b5071c0b7a0',
  sha384:
    'b26e7d28d11a50bc53d882bcf5fd3a1a074148bb35d3b4e4cb1c0ad9bde419cacb47ba09699646150f9fc000f3f80e12',
  sha512:
    'b8221ca69e8550a4914de3faa6a18c072cc01208073a928d5d66d59ef79e49a429c41a6b269571d57edb25fbdb1838425608b413cd616a5f6db5b6071af99bea',
}
const samples = [
  {
    label: 'ML-KEM-512',
    handle: 0x810100b0,
    header: '00a0000b000300b2',
    policy: policies.sha256,
    parameterBytes: 8,
    uniqueSize: 800,
  },
  {
    label: 'ML-KEM-768',
    handle: 0x810100a0,
    header: '00a0000c000300b2',
    policy: policies.sha384,
    parameterBytes: 8,
    uniqueSize: 1184,
  },
  {
    label: 'ML-KEM-1024',
    handle: 0x810100b2,
    header: '00a0000d000300b2',
    policy: policies.sha512,
    parameterBytes: 8,
    uniqueSize: 1568,
  },
  {
    label: 'ML-DSA-44',
    handle: 0x810100b4,
    header: '00a1000b000500b2',
    policy: policies.sha256,
    parameterBytes: 3,
    uniqueSize: 1312,
  },
  {
    label: 'ML-DSA-65',
    handle: 0x810100b5,
    header: '00a1000c000500b2',
    policy: policies.sha384,
    parameterBytes: 3,
    uniqueSize: 1952,
  },
  {
    label: 'ML-DSA-87',
    handle: 0x810100b6,
    header: '00a1000d000500b2',
    policy: policies.sha512,
    parameterBytes: 3,
    uniqueSize: 2592,
  },
] as const
const hexBytes = (hex: string) => Uint8Array.from(hex.match(/../g)!, (part) => parseInt(part, 16))
function response(sample: (typeof samples)[number]) {
  const policy = hexBytes(sample.policy)
  const uniqueOffset = 10 + policy.length + sample.parameterBytes
  const bytes = new Uint8Array(uniqueOffset + 2 + sample.uniqueSize)
  bytes.set(hexBytes(sample.header))
  const view = new DataView(bytes.buffer)
  view.setUint16(8, policy.length)
  bytes.set(policy, 10)
  view.setUint16(uniqueOffset, sample.uniqueSize)
  return bytes
}
const fields = ['type', 'nameAlg', 'attributes', 'policy', 'uniqueSize'] as const
type Field = (typeof fields)[number]
function changeField(bytes: Uint8Array, field: Field) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  switch (field) {
    case 'type':
      view.setUint16(0, view.getUint16(0) ^ 1)
      break
    case 'nameAlg':
      view.setUint16(2, view.getUint16(2) ^ 1)
      break
    case 'attributes':
      view.setUint32(4, view.getUint32(4) ^ 1)
      break
    case 'policy':
      view.setUint8(10, view.getUint8(10) ^ 1)
      break
    case 'uniqueSize': {
      const offset = 10 + view.getUint16(8) + (view.getUint16(0) === 0x00a0 ? 8 : 3)
      view.setUint16(offset, view.getUint16(offset) - 1)
    }
  }
}
let responses: Map<number, Uint8Array>
let failedHandle: number | undefined
beforeEach(() => {
  responses = new Map(samples.map((sample) => [sample.handle, response(sample)]))
  failedHandle = undefined
  bridge.readPublic.mockReset().mockImplementation(async (handle: number) => {
    if (handle === failedHandle) throw new Error('Controlled sample ReadPublic failure')
    return responses.get(handle)!.slice()
  })
})
async function showAll() {
  const view = render(<V2p7EkExplorer isWasmReady v2p7Status={null} />)
  await waitFor(() => expect(screen.getAllByText('selected checks match')).toHaveLength(6))
  return view
}

describe('EK explorer selected common-field comparisons', () => {
  it('reads the six existing handles and matches fixed common-field byte fixtures', async () => {
    await showAll()
    expect(bridge.readPublic.mock.calls).toEqual(samples.map((sample) => [sample.handle]))
    expect(screen.queryByText('selected-check mismatch')).not.toBeInTheDocument()
  })

  it.each(samples.flatMap((sample) => fields.map((field) => ({ sample, field }))))(
    'recomputes $sample.label after a changed $field response on Re-read',
    async ({ sample, field }) => {
      await showAll()
      const changed = response(sample)
      changeField(changed, field)
      responses.set(sample.handle, changed)
      fireEvent.click(screen.getByRole('button', { name: 'Re-read' }))
      await waitFor(() => expect(screen.getAllByText('selected-check mismatch')).toHaveLength(1))
      // Cards have no accessible group; scope to the target rather than only counting badges.
      // eslint-disable-next-line testing-library/no-node-access
      const card = within(screen.getByText(sample.label).closest('.glass-panel') as HTMLElement)
      expect(card.getByText('selected-check mismatch')).toBeInTheDocument()
      expect(card.queryByText('selected checks match')).not.toBeInTheDocument()
      expect(screen.getAllByText('selected checks match')).toHaveLength(5)
      expect(bridge.readPublic).toHaveBeenCalledTimes(12)
      responses.set(sample.handle, response(sample))
      fireEvent.click(screen.getByRole('button', { name: 'Re-read' }))
      await waitFor(() => expect(screen.getAllByText('selected checks match')).toHaveLength(6))
    }
  )

  it.each(['read error', 'truncated response'] as const)(
    'withdraws the prior match for %s and accepts a later successful read',
    async (failure) => {
      await showAll()
      const sample = samples[0]
      if (failure === 'read error') failedHandle = sample.handle
      else responses.set(sample.handle, new Uint8Array([0]))
      fireEvent.click(screen.getByRole('button', { name: 'Re-read' }))
      await waitFor(() => expect(screen.getAllByText('selected checks match')).toHaveLength(5))
      // Cards have no accessible group; scope to the target rather than only counting badges.
      // eslint-disable-next-line testing-library/no-node-access
      const card = within(screen.getByText(sample.label).closest('.glass-panel') as HTMLElement)
      expect(card.queryByText('selected checks match')).not.toBeInTheDocument()
      expect(card.queryByText('selected-check mismatch')).not.toBeInTheDocument()
      if (failure === 'read error')
        expect(card.getByText('Controlled sample ReadPublic failure')).toBeInTheDocument()
      failedHandle = undefined
      responses.set(sample.handle, response(sample))
      fireEvent.click(screen.getByRole('button', { name: 'Re-read' }))
      await waitFor(() => expect(screen.getAllByText('selected checks match')).toHaveLength(6))
    }
  )

  it('does not read before readiness and loads the sample fields when ready', async () => {
    const view = render(<V2p7EkExplorer isWasmReady={false} v2p7Status={null} />)
    expect(bridge.readPublic).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Re-read' })).toBeDisabled()
    view.rerender(<V2p7EkExplorer isWasmReady v2p7Status={null} />)
    await waitFor(() => expect(screen.getAllByText('selected checks match')).toHaveLength(6))
  })
})
