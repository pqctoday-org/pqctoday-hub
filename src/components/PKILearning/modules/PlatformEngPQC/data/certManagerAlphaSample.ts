// SPDX-License-Identifier: AGPL-3.0-only

export const CERT_MANAGER_SAMPLE = {
  sourceCommit: 'fcecd8377a59b44d1daf4b9ac1401eaa2a6f76b0',
  sourceUrl:
    'https://github.com/cert-manager/cert-manager/tree/fcecd8377a59b44d1daf4b9ac1401eaa2a6f76b0',
  stage: 'Unreleased snapshot; MLDSAPrivateKeys alpha feature',
  stableBoundary: 'Released cert-manager v1.21.3 does not support this ML-DSA request.',
  controllerGate: '--feature-gates=MLDSAPrivateKeys=true',
  webhookGate: '--feature-gates=MLDSAPrivateKeys=true',
} as const

export const CERT_MANAGER_MLDSA_MANIFESTS = `apiVersion: v1
kind: Namespace
metadata:
  name: fictional-pqc-lab
---
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: fictional-selfsigned
  namespace: fictional-pqc-lab
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: fictional-mldsa65
  namespace: fictional-pqc-lab
spec:
  commonName: fictional-service.example.test
  dnsNames:
    - fictional-service.example.test
  secretName: fictional-mldsa65-tls
  duration: 24h
  renewBefore: 8h
  issuerRef:
    name: fictional-selfsigned
    kind: Issuer
    group: cert-manager.io
  privateKey:
    algorithm: MLDSA
    size: 65
    encoding: PKCS8
    rotationPolicy: Always
`

export const CERT_MANAGER_MLDSA_POLICY = `package certmanager.pqc
import rego.v1

# Native OPA/Rego v1 companion policy. Input has the AdmissionReview review.object shape.
# Requires the pinned ML-DSA-capable controller and webhook; does not establish issuance.
is_certificate if {
  input.review.object.apiVersion == "cert-manager.io/v1"
  input.review.object.kind == "Certificate"
}

valid_mldsa_profile if {
  spec := input.review.object.spec
  key := spec.privateKey
  key.algorithm == "MLDSA"
  # Omitted/zero size uses this snapshot's ML-DSA-44 default.
  object.get(key, "size", 0) in {0, 44, 65, 87}
  object.get(spec, "signatureAlgorithm", "") == ""
}

violation contains {"msg": "This sample policy requires MLDSA with size 44, 65, 87 or its omitted default, and no explicit signatureAlgorithm."} if {
  is_certificate
  not valid_mldsa_profile
}
`

/** Values for the chart built from the same source commit, not the released stable chart. */
export const CERT_MANAGER_ALPHA_GATE_VALUES = `featureGates: "MLDSAPrivateKeys=true"
webhook:
  featureGates: "MLDSAPrivateKeys=true"
`

/** Same tested issuer/profile, with an explicit client-authentication certificate purpose. */
export const CERT_MANAGER_CI_MLDSA_MANIFESTS = CERT_MANAGER_MLDSA_MANIFESTS.replaceAll(
  'fictional-mldsa65',
  'fictional-ci-identity'
)
  .replaceAll('fictional-service.example.test', 'fictional-ci.example.test')
  .replace('  privateKey:', '  usages:\n    - digital signature\n    - client auth\n  privateKey:')
