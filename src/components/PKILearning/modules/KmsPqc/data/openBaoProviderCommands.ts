// SPDX-License-Identifier: AGPL-3.0-only

/** Run in order with an authenticated OpenBao 2.7.2 CLI and a Transit mount.
 * Use disposable fictional keys; the final step permanently deletes them.
 * Override TRANSIT_MOUNT when testing in an isolated mount. */
export const OPENBAO_PROVIDER_COMMANDS = {
  create: String.raw`set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
bao write "$TRANSIT_MOUNT/keys/sample-provider-signing" type=mldsa-65 >/dev/null
test "$(bao read -field=type "$TRANSIT_MOUNT/keys/sample-provider-signing")" = mldsa-65
printf 'Created ML-DSA-65 signing key\n'`,
  get: String.raw`set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
bao read "$TRANSIT_MOUNT/keys/sample-provider-signing"
# Read the actual type, public key versions and latest_version, not a canned response.`,
  activate: String.raw`set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
# Transit keys are usable on creation; there is no separate Activate operation.
input=$(printf %s 'fictional provider sample' | base64 | tr -d '\n')
signature=$(bao write -field=signature "$TRANSIT_MOUNT/sign/sample-provider-signing" input="$input" prehashed=false)
test "$(bao write -field=valid "$TRANSIT_MOUNT/verify/sample-provider-signing" input="$input" signature="$signature" prehashed=false)" = true
changed=$(printf %s 'altered provider sample' | base64 | tr -d '\n')
test "$(bao write -field=valid "$TRANSIT_MOUNT/verify/sample-provider-signing" input="$changed" signature="$signature" prehashed=false)" = false
printf 'Key usable: original accepted; altered message rejected\n'`,
  wrap: String.raw`set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
# AES-GCM encrypts a fictional 32-byte data key. ML-DSA cannot encrypt it.
bao write "$TRANSIT_MOUNT/keys/sample-provider-kek" type=aes256-gcm96 >/dev/null
plaintext=$(printf %s '0123456789abcdef0123456789abcdef' | base64 | tr -d '\n')
ciphertext=$(bao write -field=ciphertext "$TRANSIT_MOUNT/encrypt/sample-provider-kek" plaintext="$plaintext")
recovered=$(bao write -field=plaintext "$TRANSIT_MOUNT/decrypt/sample-provider-kek" ciphertext="$ciphertext")
test "$recovered" = "$plaintext"
printf 'Fictional data key encrypted and recovered exactly\n'
# Retain the complete versioned ciphertext envelope; this is not RSA key transport.`,
  rekey: String.raw`set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
input=$(printf %s 'fictional retained signature' | base64 | tr -d '\n')
old_signature=$(bao write -field=signature "$TRANSIT_MOUNT/sign/sample-provider-signing" input="$input" prehashed=false)
previous=$(bao read -field=latest_version "$TRANSIT_MOUNT/keys/sample-provider-signing")
bao write -f "$TRANSIT_MOUNT/keys/sample-provider-signing/rotate" >/dev/null
latest=$(bao read -field=latest_version "$TRANSIT_MOUNT/keys/sample-provider-signing")
test "$latest" -eq "$((previous + 1))"
new_signature=$(bao write -field=signature "$TRANSIT_MOUNT/sign/sample-provider-signing" input="$input" prehashed=false)
test "$(bao write -field=valid "$TRANSIT_MOUNT/verify/sample-provider-signing" input="$input" signature="$old_signature" prehashed=false)" = true
test "$(bao write -field=valid "$TRANSIT_MOUNT/verify/sample-provider-signing" input="$input" signature="$new_signature" prehashed=false)" = true
printf 'Rotated to version %s; old and new signatures verify\n' "$latest"
# This rotates a signing key; it does not decrypt or re-encrypt stored data.`,
  destroy: String.raw`set -eu
TRANSIT_MOUNT="${'${TRANSIT_MOUNT:-transit}'}"
# DESTRUCTIVE: only delete the two disposable fictional keys from this recipe.
bao write "$TRANSIT_MOUNT/keys/sample-provider-signing/config" deletion_allowed=true >/dev/null
bao delete "$TRANSIT_MOUNT/keys/sample-provider-signing" >/dev/null
bao write "$TRANSIT_MOUNT/keys/sample-provider-kek/config" deletion_allowed=true >/dev/null
bao delete "$TRANSIT_MOUNT/keys/sample-provider-kek" >/dev/null
# A missing-key read must fail; the external test also checks the HTTP 404.
if bao read "$TRANSIT_MOUNT/keys/sample-provider-signing" >/dev/null 2>&1; then
  printf 'Unexpected success: deleted signing key still exists\n' >&2
  exit 1
fi
printf 'Disposable keys deleted\n'`,
} as const
