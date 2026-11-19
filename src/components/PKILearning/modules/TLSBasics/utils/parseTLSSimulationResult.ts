// SPDX-License-Identifier: AGPL-3.0-only
import type { SimulationResult } from '@/store/tls-learning.store'

type TraceEvent = SimulationResult['trace'][number]

function isTraceEvent(value: unknown): value is TraceEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<TraceEvent>
  return (
    (event.side === 'client' ||
      event.side === 'server' ||
      event.side === 'connection' ||
      event.side === 'system') &&
    typeof event.event === 'string' &&
    typeof event.details === 'string' &&
    (event.timestamp === undefined || typeof event.timestamp === 'string')
  )
}

export function parseTLSSimulationResult(output: string): SimulationResult {
  let result: { trace?: unknown; status?: unknown; error?: unknown } | null
  try {
    result = JSON.parse(output)
  } catch {
    return { trace: [], status: 'error', error: output.slice(0, 200) || 'Empty OpenSSL response.' }
  }

  if (!result || !Array.isArray(result.trace) || !result.trace.every(isTraceEvent)) {
    return { trace: [], status: 'error', error: 'Invalid OpenSSL TLS trace.' }
  }

  const { trace, status, error } = result
  if (status === 'error' || status === 'failed') {
    return {
      trace,
      status,
      error: typeof error === 'string' && error ? error : 'TLS handshake failed.',
    }
  }
  if (
    status === 'success' &&
    trace.some(({ side, event }) => side === 'connection' && event === 'established')
  ) {
    return { trace, status }
  }
  return { trace, status: 'error', error: 'OpenSSL did not confirm a completed TLS handshake.' }
}
