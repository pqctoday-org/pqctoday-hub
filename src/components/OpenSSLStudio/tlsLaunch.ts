// SPDX-License-Identifier: AGPL-3.0-only
import type { AlgorithmLaunch } from '@/data/algorithmLaunch'
import type { TLSConfig } from '@/store/tls-learning.store'

/** A persisted raw configuration must not override an exact named-group launch. */
export function exactTlsLaunchConfig(
  launch: AlgorithmLaunch | undefined
): Partial<TLSConfig> | undefined {
  if (launch?.toolId !== 'tls-simulator' || !launch.parameter) return undefined
  return { groups: [launch.parameter], mode: 'ui', rawConfig: '' }
}
