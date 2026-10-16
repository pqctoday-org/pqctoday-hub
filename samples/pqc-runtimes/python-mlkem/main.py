# SPDX-License-Identifier: AGPL-3.0-only
"""ML-KEM-768 round trip with pyca/cryptography (48+ with OpenSSL 3.5+, or 47+ with AWS-LC)."""

import hmac
import sys

from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives.asymmetric.mlkem import MLKEM768PrivateKey

SAMPLE = "python-mlkem"


def main() -> int:
    try:
        private_key = MLKEM768PrivateKey.generate()
    except UnsupportedAlgorithm as exc:
        print(f"FAIL {SAMPLE}: backend has no ML-KEM-768 ({exc})", file=sys.stderr)
        return 1
    public_key = private_key.public_key()

    # Sender: encapsulate against the public key.
    sender_secret, ciphertext = public_key.encapsulate()
    # Receiver: decapsulate with the private key.
    receiver_secret = private_key.decapsulate(ciphertext)

    if not hmac.compare_digest(sender_secret, receiver_secret):
        print(f"FAIL {SAMPLE}: shared secrets differ", file=sys.stderr)
        return 1

    print("SIZE encapsulation_key", len(public_key.public_bytes_raw()))
    print("SIZE ciphertext", len(ciphertext))
    print("SIZE shared_secret", len(sender_secret))
    print(f"OK {SAMPLE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
