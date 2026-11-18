// SPDX-License-Identifier: AGPL-3.0-only
import type { HybridFormatId } from '../constants'

/** Properties of the generated sample, not a claim about an entire deployed system. */
export const CERTIFICATE_SECURITY_PROPERTIES: Record<
  HybridFormatId,
  {
    authentication: string
    legacy: string
    tls: string
  }
> = {
  'pure-pqc': {
    authentication: 'ML-DSA signature and issuer chain',
    legacy: 'Requires ML-DSA support',
    tls: 'With ML-DSA CertificateVerify support; exercised below',
  },
  'pure-pqc-slh': {
    authentication: 'SLH-DSA signature and issuer chain',
    legacy: 'Requires SLH-DSA support',
    tls: 'Requires a TLS signature scheme; not offered by this simulator',
  },
  composite: {
    authentication: 'ML-DSA AND classical signature must verify',
    legacy: 'Requires RFC 10073 algorithm support',
    tls: 'Requires composite TLS SignatureScheme; unavailable in this build',
  },
  'alt-sig': {
    authentication: 'PQ protection only when the alternative signature is verified and required',
    legacy: 'Classical signature only; alternative extensions ignored',
    tls: 'Classical authentication in ordinary TLS; alternative cert signature does not add hybrid CertificateVerify',
  },
  'related-certs': {
    authentication: 'Separate classical and PQ paths; binding alone does not require both',
    legacy: 'Classical certificate can be used independently',
    tls: 'One selected identity in ordinary TLS; using both needs protocol support',
  },
  'pure-pqc-kem': {
    authentication: 'ML-DSA issuer signature; subject key encapsulates, cannot sign',
    legacy: 'Requires ML-KEM key support',
    tls: 'Not a CertificateVerify signing key',
  },
  'composite-kem': {
    authentication: 'ML-DSA issuer signature; composite subject key encapsulates, cannot sign',
    legacy: 'Requires composite KEM support',
    tls: 'Not a CertificateVerify signing key; encoding demo only',
  },
  'cert-discovery': {
    authentication: 'Fetched certificate needs independent path and descriptor validation',
    legacy: 'Primary certificate only; discovery extension ignored',
    tls: 'Discovery alone does not authenticate a second TLS identity',
  },
  'unsigned-kem': {
    authentication: 'No certificate signature; trust must come from another authenticated channel',
    legacy: 'Must not validate as a signed certification path',
    tls: 'Cannot sign CertificateVerify or supply a signed path',
  },
  chameleon: {
    authentication: 'Primary PQ signature; reconstructed partner needs separate validation',
    legacy: 'Primary ML-DSA support required; delta ignored',
    tls: 'Historical format; no automatic dual authentication in TLS',
  },
}
