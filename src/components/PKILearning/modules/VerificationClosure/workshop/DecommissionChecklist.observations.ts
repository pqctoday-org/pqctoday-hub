// SPDX-License-Identifier: AGPL-3.0-only
/** Independently authored fictional post-action observations, not scanner output. */
export interface RetirementObservation {
  id: string
  scope: string
  method: string
  primaryPresent: boolean
  dependentCopies: readonly string[]
}

const SCOPES: Record<string, string> = {
  'cert-prod-api': 'API listener and the sample client trust configuration',
  'cert-shadow-legacy': 'Payroll listener and its scheduled client configuration',
  'cert-intermediate-ca': 'Issuing-CA service and the sample trust-store manifest',
  'lib-openssl-1.1.1': 'Application package manifest and running-process module list',
  'lib-bc-java': 'Java dependency manifest and application classpath',
  'sw-batch-signer': 'Batch signing job and the offline document-verifier trust store',
  'sw-custom-crypto': 'Helper source references and the sample application build manifest',
  'key-root-ca-signing': 'Sample token key listing and the CA trust-store manifest',
  'key-kek-kms': 'Sample KMS key listing and the dependent wrapping configuration',
  'key-signing-code': 'Sample signing-token key listing and release-verifier trust store',
  'legacy-appliance': 'Appliance configuration export and its dependent application manifest',
}

export function retirementObservation(
  assetId: string,
  followup = false
): RetirementObservation | undefined {
  if (!Object.hasOwn(SCOPES, assetId)) return undefined
  // Own-key guard above excludes inherited or unsupported asset identities.
  // eslint-disable-next-line security/detect-object-injection
  const scope = SCOPES[assetId]
  if (!scope) return undefined
  if (followup && assetId !== 'sw-batch-signer') return undefined
  return {
    id: `${assetId}-${followup ? 'followup-02' : 'post-action-01'}`,
    scope,
    method: 'Fictional inventory/configuration comparison supplied with this exercise',
    primaryPresent: false,
    dependentCopies:
      assetId === 'sw-batch-signer' && !followup
        ? ['Offline document verifier still trusts the retired RSA signing public key']
        : [],
  }
}

export function observedAbsent(observation: RetirementObservation | undefined): boolean {
  return !!observation && !observation.primaryPresent && observation.dependentCopies.length === 0
}
