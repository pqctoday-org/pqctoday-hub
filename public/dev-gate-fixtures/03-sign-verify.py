"""
03 — Sign a message with ML-DSA and verify the signature.

The variant is selected via the SIGN_ALGO environment variable:
  ML-DSA-44 (parameter set CKP_ML_DSA_44 = 1, signature 2420 bytes)
  ML-DSA-65 (parameter set CKP_ML_DSA_65 = 2, signature 3309 bytes)  [default]
  ML-DSA-87 (parameter set CKP_ML_DSA_87 = 3, signature 4627 bytes)

PKCS#11 calls used:
  C_GenerateKeyPair  → create the ML-DSA key pair (CKA_PARAMETER_SET picks the variant)
  C_SignInit         → prepare signing with CKM_ML_DSA
  C_Sign             → produce the signature
  C_VerifyInit       → prepare verification with CKM_ML_DSA
  C_Verify           → verify signature against public key
"""

import os
import struct

import p11
from p11 import Module

PIN     = os.environ.get('PKCS11_PIN', '1234')
ALGO    = os.environ.get('SIGN_ALGO', 'ML-DSA-65')
MESSAGE = b'Hello from pqctoday HSM sandbox!'

# CKM_ML_DSA, CKM_ML_DSA_KEY_PAIR_GEN, and CKA_PARAMETER_SET (pkcs11t.h
# §6.67/§6.68) are PKCS#11 v3.2 additions that the bundled p11 package already
# exposes as p11.CKM_ML_DSA, p11.CKM_ML_DSA_KEY_PAIR_GEN, p11.CKA_PARAMETER_SET.

def ck_ulong(n):
    """Pack n as CK_ULONG (sizeof(unsigned long) = 8 on 64-bit Linux)."""
    return struct.pack('<Q', n)

# variant → (CKP_ML_DSA_* parameter set value, expected signature size in bytes)
VARIANTS = {
    'ML-DSA-44': (1, 2420),   # CKP_ML_DSA_44 §6.67.1
    'ML-DSA-65': (2, 3309),   # CKP_ML_DSA_65
    'ML-DSA-87': (3, 4627),   # CKP_ML_DSA_87
}

if ALGO not in VARIANTS:
    print(f'Unknown SIGN_ALGO: {ALGO}')
    print('Supported: ML-DSA-44, ML-DSA-65, ML-DSA-87')
    raise SystemExit(1)

param_set, expected_sig_size = VARIANTS[ALGO]

print(f'Algorithm : {ALGO}')
print(f'Message   : {MESSAGE.decode()}')

with Module() as hsm:
    session = hsm.open_session(pin=PIN)

    # Generate an ephemeral key pair for the selected variant. CKA_PARAMETER_SET
    # (a CK_ULONG passed as little-endian bytes) selects CKP_ML_DSA_44/65/87.
    key_id   = os.urandom(4)
    ps_bytes = ck_ulong(param_set)
    pub_tmpl = [
        (p11.CKA_LABEL,         ALGO),
        (p11.CKA_ID,            key_id),
        (p11.CKA_TOKEN,         False),
        (p11.CKA_VERIFY,        True),
        (p11.CKA_PARAMETER_SET, ps_bytes),
    ]
    priv_tmpl = [
        (p11.CKA_LABEL,         ALGO),
        (p11.CKA_ID,            key_id),
        (p11.CKA_TOKEN,         False),
        (p11.CKA_SIGN,          True),
        (p11.CKA_PARAMETER_SET, ps_bytes),
    ]
    pub_key, priv_key = session.generate_keypair(p11.CKM_ML_DSA_KEY_PAIR_GEN, pub_tmpl, priv_tmpl)

    # Sign
    sig_bytes = session.sign(priv_key, MESSAGE, p11.CKM_ML_DSA)
    print(f'Signature ({len(sig_bytes)} bytes, expected {expected_sig_size}): {sig_bytes[:16].hex()}…')

    # Verify
    if session.verify(pub_key, MESSAGE, sig_bytes, p11.CKM_ML_DSA):
        print('Verification: OK ✓')
    else:
        print('Verification FAILED')

    # Negative test — tampered message
    # p11's verify() returns a clean False for CKR_SIGNATURE_INVALID rather
    # than raising, so no exception handling is needed here.
    if session.verify(pub_key, b'tampered message', sig_bytes, p11.CKM_ML_DSA):
        print('Tampered verification: (unexpected pass)')
    else:
        print('Tampered message correctly rejected ✓')

    session.logout()
    session.close()

print('\nDone.')
