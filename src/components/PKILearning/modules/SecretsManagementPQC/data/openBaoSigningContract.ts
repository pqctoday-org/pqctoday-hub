// SPDX-License-Identifier: AGPL-3.0-only

/** The copied example uses pure ML-DSA with OpenBao's versioned signature envelope. */
export const OPENBAO_SIGNING_CONTRACT = {
  product: 'OpenBao',
  version: '2.7.2',
  mount: 'transit',
  keyName: 'sample-mldsa65',
  keyType: 'mldsa-65',
  parameterSet: 65,
  publicKeyBytes: 1952,
  signatureBytes: 3309,
  apiUrl: 'https://openbao.org/docs/api/secret/transit/',
  releaseUrl: 'https://github.com/openbao/openbao/releases/tag/v2.7.2',
} as const

export const OPENBAO_SIGNING_RECIPE = String.raw`# OpenBao 2.7.2; authenticated bao CLI and an existing Transit mount.
# Use a fresh fictional key name. A new signing key does not convert an encryption key.
set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
SIGNING_KEY="${'${SIGNING_KEY:-sample-mldsa65}'}"
bao write "$TRANSIT_MOUNT/keys/$SIGNING_KEY" type=mldsa-65 >/dev/null
input=$(printf %s 'fictional release manifest' | base64 | tr -d '\n')
signature=$(bao write -field=signature "$TRANSIT_MOUNT/sign/$SIGNING_KEY" input="$input" prehashed=false)
valid=$(bao write -field=valid "$TRANSIT_MOUNT/verify/$SIGNING_KEY" input="$input" signature="$signature" prehashed=false)
test "$valid" = true
printf 'Original message valid: %s\n' "$valid"

changed_input=$(printf %s 'changed fictional release manifest' | base64 | tr -d '\n')
valid=$(bao write -field=valid "$TRANSIT_MOUNT/verify/$SIGNING_KEY" input="$changed_input" signature="$signature" prehashed=false)
test "$valid" = false
printf 'Changed message valid: %s\n' "$valid"

# Rotation creates another version of this ML-DSA key, retaining old verification keys.
previous=$(bao read -field=latest_version "$TRANSIT_MOUNT/keys/$SIGNING_KEY")
bao write -f "$TRANSIT_MOUNT/keys/$SIGNING_KEY/rotate" >/dev/null
latest=$(bao read -field=latest_version "$TRANSIT_MOUNT/keys/$SIGNING_KEY")
test "$latest" -eq "$((previous + 1))"
new_signature=$(bao write -field=signature "$TRANSIT_MOUNT/sign/$SIGNING_KEY" input="$input" prehashed=false)
test "$(bao write -field=valid "$TRANSIT_MOUNT/verify/$SIGNING_KEY" input="$input" signature="$new_signature" prehashed=false)" = true
test "$(bao write -field=valid "$TRANSIT_MOUNT/verify/$SIGNING_KEY" input="$input" signature="$signature" prehashed=false)" = true
printf 'New version: %s; new and retained signatures verified\n' "$latest"
# Retain the returned envelope: its version identifies the verification key.
# Raw ML-DSA-65 signatures are 3,309 bytes; the envelope and base64 add overhead.`
