// SPDX-License-Identifier: AGPL-3.0-only
export const WORKER_CONCURRENCY: number
export const DEFAULT_LIVE_ACCEPTANCE_ROUTES: string[]
export function parseCliArgs(argv?: string[]): {
  baseUrl: string
  workers: number
  delayMs: number
  maxRetries: number
  timeoutMs: number
  baseBackoffMs: number
  routes: string[]
  receiptPath?: string
}
export function computeBackoffMs(
  attempt: number,
  retryAfterHeader: string | null | undefined,
  baseBackoffMs?: number,
  randomFn?: () => number
): number
export function fetchWithPacedBackoff(
  url: string,
  options?: {
    maxRetries?: number
    baseBackoffMs?: number
    timeoutMs?: number
    fetchImpl?: (url: string, init?: unknown) => Promise<{
      status: number
      ok: boolean
      headers: { get: (name: string) => string | null }
      text: () => Promise<string>
    }>
    sleepImpl?: (ms: number) => Promise<void>
  }
): Promise<{
  url: string
  status: number
  ok: boolean
  retriesUsed: number
  bodyLength: number
  elapsedMs: number
}>
