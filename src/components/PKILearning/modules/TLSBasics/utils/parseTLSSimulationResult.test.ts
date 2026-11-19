// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseTLSSimulationResult } from './parseTLSSimulationResult'

const established = {
  side: 'connection',
  event: 'established',
  details: 'Negotiated: TLS_AES_256_GCM_SHA384',
}

describe('parseTLSSimulationResult', () => {
  it('requires both explicit success and confirmation of an established connection', () => {
    expect(
      parseTLSSimulationResult(JSON.stringify({ status: 'success', trace: [established] }))
    ).toEqual({ status: 'success', trace: [established] })
    expect(parseTLSSimulationResult(JSON.stringify({ trace: [established] })).status).toBe('error')
    expect(parseTLSSimulationResult(JSON.stringify({ status: 'success', trace: [] })).status).toBe(
      'error'
    )
    expect(
      parseTLSSimulationResult(
        JSON.stringify({
          status: 'success',
          trace: [{ ...established, side: 'server' }],
        })
      ).status
    ).toBe('error')
  })

  it('preserves a reported failure and its usable trace', () => {
    const trace = [{ side: 'client', event: 'error', details: 'certificate verify failed' }]
    const error = 'Client handshake failed'
    expect(parseTLSSimulationResult(JSON.stringify({ status: 'failed', trace, error }))).toEqual({
      status: 'failed',
      trace,
      error,
    })
  })

  it('rejects malformed entries and non-JSON engine output', () => {
    expect(parseTLSSimulationResult('{"status":"success","trace":[null]}').status).toBe('error')
    expect(parseTLSSimulationResult('Worker returned no structured output')).toEqual({
      status: 'error',
      trace: [],
      error: 'Worker returned no structured output',
    })
  })
})
