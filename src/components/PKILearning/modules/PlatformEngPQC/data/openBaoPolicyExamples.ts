// SPDX-License-Identifier: AGPL-3.0-only

/** Native OpenBao ACL. Apply it to a scoped test token, not the administrator. */
export const OPENBAO_KEY_CREATION_POLICY = `# OpenBao 2.7.2: one named key and one explicitly required type.
path "transit/keys/sample-policy-key" {
  capabilities = ["update"]
  required_parameters = ["type"]
  allowed_parameters = {
    "type" = ["mldsa-65"]
  }
}
# Other paths are denied unless another attached policy grants them.
# Review the token's complete policy set before relying on this restriction.`

export const OPENBAO_PKI_ROLE_RECIPE = String.raw`# OpenBao 2.7.2; authenticated bao CLI and an existing sample PKI mount/CA.
# key_type selects ML-DSA; key_bits selects its parameter set.
bao write pki/roles/pipeline-role-pqc \
  allowed_domains="pipeline.internal" \
  allow_subdomains=true \
  max_ttl="720h" \
  key_type="mldsa" \
  key_bits=44
# Retain the issued certificate and private key in an owner-only local file.
umask 077
bao write -format=json pki/issue/pipeline-role-pqc \
  common_name="runner.pipeline.internal" ttl="30m" > sample-issuance.json
# Inspect and verify the issued certificate against the intended CA.
# An ML-DSA subject key alone does not establish the issuer/chain's algorithm.`
