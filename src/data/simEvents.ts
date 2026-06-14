// SPDX-License-Identifier: GPL-3.0-only
/**
 * simEvents — the End-Quarter world-event pool for the simulation turn loop.
 * `{sector}` / `{country}` tokens are substituted at draw time. Severities map
 * to the hub's status tokens (danger→error, warning, success, info).
 */
export type EventSeverity = 'danger' | 'warning' | 'success' | 'info'

export interface SimEvent {
  sev: EventSeverity
  /** Turn label, e.g. "Q3 2026". */
  t: string
  txt: string
}

export const SIM_EVENT_POOL: Record<EventSeverity, string[]> = {
  danger: [
    'Harvest-now capture suspected on classical TLS — {sector} records exposed',
    "Ransomware crew advertises 'store-now-decrypt-later' archive of your VPN traffic",
    'Auditor flags {country} hybrid-mandate gap — remediation clock started',
  ],
  warning: [
    '{country} regulator opens an audit window — evidence due in 2 quarters',
    'Vendor slips ML-KEM delivery by a quarter — bridging pattern required',
    'RSA-2048 code-signing certificates flagged for sunset by your CA',
  ],
  success: [
    'OpenSSL 3.6 ships ML-DSA hardware acceleration — perf headroom recovered',
    'Pilot cutover clean: zero rollbacks on Tier-1 internet-facing service',
    'Vendor confirms dated ML-KEM commitment in renewed contract',
  ],
  info: [
    'NIST publishes updated ML-DSA guidance — review parameters',
    'New CBOM scanner signatures available — re-run discovery',
    'Peer org in {sector} publishes their PQC migration retro',
  ],
}

/** Substitute {sector}/{country} tokens in an event template. */
export function fillEvent(template: string, sectorLabel: string, countryId: string): string {
  return template.replace('{sector}', sectorLabel.toLowerCase()).replace('{country}', countryId)
}
