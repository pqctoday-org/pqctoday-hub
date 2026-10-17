// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { runOp, getKmipEngine } = vi.hoisted(() => ({
  runOp: vi.fn(),
  getKmipEngine: vi.fn(),
}))

vi.mock('@/wasm/kmip/kmipEngine', () => ({ getKmipEngine }))

import { KmipProtocolExplorer } from './KmipProtocolExplorer'

describe('KmipProtocolExplorer live operation lab', () => {
  beforeEach(() => {
    runOp.mockReset()
    getKmipEngine.mockReset()
    getKmipEngine.mockResolvedValue({ runOp })
    runOp.mockReturnValue({
      ok: true,
      operation: 'CreateKeyPair',
      status: 'Success',
      resultReason: null,
      message: null,
      summary: { privateKeyUid: 'private-1', publicKeyUid: 'public-1' },
      responseWireHex: '42007b',
      responseWireLen: 3,
      responseTree: { tag: '0x42007b', type: 'Structure', children: [] },
      audit: [],
    })
  })

  it('distinguishes illustrative provider examples from a real local engine run', async () => {
    render(
      <MemoryRouter>
        <KmipProtocolExplorer />
      </MemoryRouter>
    )

    expect(screen.getByText('Illustrative provider API')).toBeInTheDocument()
    expect(screen.getByText(/No cloud account or provider API is contacted/)).toBeInTheDocument()
    const runButton = await screen.findByRole('button', { name: 'Run Create' })
    fireEvent.click(runButton)

    await waitFor(() =>
      expect(runOp).toHaveBeenCalledWith({
        op: 'CreateKeyPair',
        algorithm: 'ML-KEM-768',
        name: 'learn-create',
      })
    )
    expect(screen.getByText('CreateKeyPair · Success')).toBeInTheDocument()
    expect(screen.getByText(/policy → KMIP → PKCS#11/)).toBeInTheDocument()
  })
})
