// SPDX-License-Identifier: AGPL-3.0-only
import { COMPOSITE_KEM_SETS, COMPOSITE_SIG_SETS } from '@/wasm/softhsm/compositeParams'
import type { ClassicalAlgorithm } from '@/components/Playground/contexts/types'

export interface AlgorithmLaunch {
  toolId: string
  algorithm: string
  parameter?: string
  classical?: ClassicalAlgorithm
  family?: 'sig' | 'kem'
  suite?: string
  tab?: 'keystore' | 'sign_verify'
}

const launches = new Map<string, AlgorithmLaunch>()
function add(name: string, toolId: string, config: Partial<AlgorithmLaunch> = {}) {
  launches.set(name, { toolId, algorithm: name, ...config })
}
for (const level of [512, 768, 1024]) add(`ML-KEM-${level}`, 'interactive', { tab: 'keystore' })
for (const level of [44, 65, 87]) add(`ML-DSA-${level}`, 'interactive', { tab: 'keystore' })
for (const hash of ['SHA2', 'SHAKE'])
  for (const set of ['128s', '128f', '192s', '192f', '256s', '256f'])
    add(`SLH-DSA-${hash}-${set}`, 'slh-dsa', { parameter: `${hash.toLowerCase()}-${set}` })
for (const name of [
  'FN-DSA-512',
  'FN-DSA-1024',
  'HQC-128',
  'HQC-192',
  'HQC-256',
  'FrodoKEM-640',
  'FrodoKEM-976',
  'FrodoKEM-1344',
  'Classic-McEliece-348864',
  'Classic-McEliece-460896',
  'Classic-McEliece-6688128',
  'Classic-McEliece-6960119',
  'Classic-McEliece-8192128',
  'MAYO-1',
  'MAYO-2',
  'MAYO-3',
  'MAYO-5',
])
  add(name, 'interactive', {
    parameter: name.startsWith('FrodoKEM') ? `${name}-AES` : name,
    tab: 'keystore',
  })
for (const [name, parameter] of [
  ['CROSS', 'CROSS-RSDP-128-balanced'],
  ['UOV', 'OV-Ip'],
  ['SNOVA', 'SNOVA-24-5-4'],
])
  add(name, 'interactive', { parameter, tab: 'keystore' })
for (const name of [
  'RSA-2048',
  'RSA-3072',
  'RSA-4096',
  'Ed25519',
  'Ed448',
  'X25519',
  'X448',
  'secp256k1',
] as const)
  add(name, 'interactive', { classical: name, tab: 'keystore' })
for (const size of [256, 384, 521] as const) {
  add(`ECDSA P-${size}`, 'interactive', { classical: `ECDSA-P${size}`, tab: 'keystore' })
  add(`ECDH P-${size}`, 'interactive', { classical: `P-${size}`, tab: 'keystore' })
}
for (const name of ['X25519MLKEM768', 'SecP256r1MLKEM768', 'SecP384r1MLKEM1024'])
  add(name, 'tls-simulator', { parameter: name })
for (const row of COMPOSITE_SIG_SETS)
  add(row.draftName, 'hsm', { family: 'sig', parameter: String(row.ckp) })
for (const row of COMPOSITE_KEM_SETS)
  add(row.draftName, 'hsm', { family: 'kem', parameter: String(row.ckp) })
add('X-Wing', 'api-security-jwt', { suite: 'HPKE-9' })
add('HPKE-PQ', 'hybrid-encrypt', { suite: 'MLKEM768-X25519' })
add('mlkem768x25519-sha256', 'pqc-ssh-sim', { parameter: 'mlkem768-curve25519-sha256' })
add('mlkem768nistp256-sha256', 'pqc-ssh-sim', { parameter: 'mlkem768-nistp256-sha256' })

export function getAlgorithmLaunch(name: string): AlgorithmLaunch | undefined {
  return launches.get(name)
}
export function algorithmLaunchHref(name: string): string | undefined {
  const launch = getAlgorithmLaunch(name)
  if (!launch) return undefined
  const params = new URLSearchParams({ launchAlgo: name })
  if (launch.toolId === 'interactive') {
    if (!launch.classical) params.set('algo', launch.parameter ?? launch.algorithm)
    params.set('tab', launch.tab ?? 'keystore')
  }
  if (launch.toolId === 'hsm') {
    params.set('tab', 'build')
    params.set('dtab', 'v33')
    params.set('engine', 'rust')
  }
  return `/playground/${launch.toolId}?${params}`
}
export function readAlgorithmLaunch(
  toolId: string,
  search = typeof window === 'undefined' ? '' : window.location.search
): AlgorithmLaunch | undefined {
  const name = new URLSearchParams(search).get('launchAlgo')
  if (!name) return undefined
  const launch = launches.get(name)
  return launch?.toolId === toolId ? launch : undefined
}
export function algorithmLaunchError(toolId: string, search: string): string | null {
  const name = new URLSearchParams(search).get('launchAlgo')
  return name && !readAlgorithmLaunch(toolId, search)
    ? `No exact ${name} launch is available in this tool.`
    : null
}
