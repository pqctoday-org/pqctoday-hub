// SPDX-License-Identifier: AGPL-3.0-only
import type {
  IKEv2Mode,
  KemSize,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'

/** Describes the normal selector proposal, never a claim of negotiated outcome. */
export function vpnExchangeLabel(mode: IKEv2Mode, size?: KemSize, customProposal?: string) {
  if (customProposal)
    return `Custom proposal requested: ${customProposal} — inspect negotiation trace`
  const kem = size ? `ML-KEM-${size}` : 'ML-KEM (selected parameter set)'
  if (mode === 'classical') return 'ECP-256 (IKE_SA_INIT)'
  if (mode === 'pure-pqc') return `${kem} (IKE_SA_INIT)`
  return `ECP-256 (IKE_SA_INIT) + ${kem} (Additional KE 1, IKE_INTERMEDIATE)`
}

/** Teaching formula only; the displayed KEM bytes are not the classical secret. */
export function vpnDerivationExample(
  mode: IKEv2Mode,
  size: KemSize,
  kemSecretHex: string,
  customProposal?: string
) {
  if (customProposal) {
    return `Custom proposal requested: ${customProposal}\nInspect its negotiated exchanges and trace; the normal-selector derivation example does not establish a custom proposal's exchange order.`
  }
  if (mode === 'classical')
    return 'Classical ECP-256 is the primary exchange; no ML-KEM secret is used.'
  if (mode === 'pure-pqc') {
    return `SKEYSEED = prf(Ni ‖ Nr, ss_kem)\n         = PRF-HMAC-SHA-256(Ni ‖ Nr,\n             0x${kemSecretHex})`
  }
  return `SKEYSEED  = prf(Ni ‖ Nr, g^ir)\n                              ↑ ECDH ECP-256 secret (IKE_SA_INIT)\nSKEYSEED' = prf(SK_d, ss_kem ‖ Ni ‖ Nr)\n                      ↑ ML-KEM-${size} secret (Additional KE 1, IKE_INTERMEDIATE)\n            ss_kem = 0x${kemSecretHex}`
}
