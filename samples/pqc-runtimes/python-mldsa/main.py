# SPDX-License-Identifier: GPL-3.0-only
"""ML-DSA-65 sign / verify with pyca/cryptography (48+ with OpenSSL 3.5+, or 47+ with AWS-LC)."""

import sys

from cryptography.exceptions import InvalidSignature, UnsupportedAlgorithm
from cryptography.hazmat.primitives.asymmetric.mldsa import MLDSA65PrivateKey

SAMPLE = "python-mldsa"


def main() -> int:
    try:
        private_key = MLDSA65PrivateKey.generate()
    except UnsupportedAlgorithm as exc:
        print(f"FAIL {SAMPLE}: backend has no ML-DSA-65 ({exc})", file=sys.stderr)
        return 1
    public_key = private_key.public_key()

    message = b"post-quantum hello"
    signature = private_key.sign(message)
    public_key.verify(signature, message)  # raises InvalidSignature on failure

    # A modified message must be rejected.
    try:
        public_key.verify(signature, b"Post-quantum hello")
    except InvalidSignature:
        pass
    else:
        print(f"FAIL {SAMPLE}: tampered message verified", file=sys.stderr)
        return 1

    print("SIZE public_key", len(public_key.public_bytes_raw()))
    print("SIZE signature", len(signature))
    print(f"OK {SAMPLE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
