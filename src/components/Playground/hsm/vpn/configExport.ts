// SPDX-License-Identifier: GPL-3.0-only
/**
 * Export the current VPN simulator configuration as a downloadable bundle.
 * Produces a .zip containing strongswan.conf, ipsec.conf / swanctl.conf,
 * ipsec.secrets (for PSK mode), peer certs (for dual auth), and a README.
 */
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { IKEv2Mode } from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'

export interface VpnConfigExport {
  mode: IKEv2Mode
  authMode: 'psk' | 'dual'
  mtu: number
  allowFragmentation: boolean
  clientAlg: string
  clientSize: string
  clientClassAlg: string
  serverAlg: string
  serverSize: string
  serverClassAlg: string
  clientPsk: string
  serverPsk: string
  strongswanConfInit: string
  strongswanConfResp: string
  ipsecConfInit: string
  ipsecConfResp: string
  initiatorCertPem?: string | null
  responderCertPem?: string | null
  initiatorCkaId?: string | null
  responderCkaId?: string | null
}

const README = (cfg: VpnConfigExport) => `# PQC VPN Configuration Bundle

Exported from the pqctoday-hub PKCS#11 VPN simulator.

## Selected configuration

- IKE mode: \`${cfg.mode}\`
- Auth mode: \`${cfg.authMode}\`
- Initiator signature: ${cfg.clientAlg === 'RSA' ? cfg.clientClassAlg : `ML-DSA-${cfg.clientSize}`}
- Responder signature: ${cfg.serverAlg === 'RSA' ? cfg.serverClassAlg : `ML-DSA-${cfg.serverSize}`}
- MTU: ${cfg.mtu}
- Fragmentation: ${cfg.allowFragmentation ? 'enabled' : 'disabled'}

## Files

- \`initiator/strongswan.conf\` — charon daemon options (initiator role)
- \`initiator/ipsec.conf\` — connection definition (initiator role)
- \`responder/strongswan.conf\` — charon daemon options (responder role)
- \`responder/ipsec.conf\` — connection definition (responder role)
${
  cfg.authMode === 'psk'
    ? '- `initiator/ipsec.secrets` + `responder/ipsec.secrets` — PSK material'
    : '- `initiator/certs/*.pem`, `responder/certs/*.pem` — generated self-signed certificates'
}

## How to run against a real strongSwan daemon

1. Install strongSwan 6.x with the PKCS#11 plugin loaded.
2. Copy the \`initiator/\` or \`responder/\` subdirectory to the target host,
   e.g. \`/etc/strongswan/\` (path may vary by distribution).
3. If using dual auth, import the PEM certs into \`/etc/ipsec.d/certs/\` and
   ensure the matching private key exists on your PKCS#11 token at the same
   CKA_ID listed below.
4. Start/reload charon.

## Expected PKCS#11 handles (CKA_ID, hex)

- Initiator key: \`${cfg.initiatorCkaId ?? '(not provisioned yet)'}\`
- Responder key: \`${cfg.responderCkaId ?? '(not provisioned yet)'}\`

> Note: the simulator builds self-signed certs with a \`SubjectKeyIdentifier\`
> extension equal to the CKA_ID so strongSwan's pkcs11 plugin can locate
> the private key via \`C_FindObjects({CKA_ID=ski})\`.

## Simulator caveats

- Hybrid IKE_INTERMEDIATE and the ML-KEM transforms are simulation-only in
  the current WASM charon build. A real-deployment strongSwan needs the
  \`ipsecme-ikev2-mlkem\` + \`ipsecme-ikev2-pqc-ake\` patches and IANA-assigned
  transform IDs for full interop.
- ML-DSA certificate OIDs follow
  \`draft-ietf-lamps-dilithium-certificates\` — verify your peer strongSwan
  understands these OIDs before deploying.

Generated ${new Date().toISOString()}.
`

export async function exportVpnConfigBundle(cfg: VpnConfigExport): Promise<void> {
  const zip = new JSZip()

  zip.file('README.md', README(cfg))

  zip.file('initiator/strongswan.conf', cfg.strongswanConfInit)
  zip.file('initiator/ipsec.conf', cfg.ipsecConfInit)

  zip.file('responder/strongswan.conf', cfg.strongswanConfResp)
  zip.file('responder/ipsec.conf', cfg.ipsecConfResp)

  if (cfg.authMode === 'psk') {
    zip.file('initiator/ipsec.secrets', `# PSK for outbound connection\n: PSK "${cfg.clientPsk}"\n`)
    zip.file('responder/ipsec.secrets', `# PSK for inbound connection\n: PSK "${cfg.serverPsk}"\n`)
  }

  if (cfg.authMode === 'dual') {
    if (cfg.initiatorCertPem) {
      zip.file('initiator/certs/initiator.crt', cfg.initiatorCertPem)
    }
    if (cfg.responderCertPem) {
      zip.file('responder/certs/responder.crt', cfg.responderCertPem)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  saveAs(blob, `pqc-vpn-config-${cfg.mode}-${cfg.authMode}-${stamp}.zip`)
}
