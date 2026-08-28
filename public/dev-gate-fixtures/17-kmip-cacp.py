#!/usr/bin/env python3
"""
17 — KMIP 3.0 key management + crypto-agility control plane (CACP).

Samples 01-16 talk PKCS#11 to softhsmv3 (the C++ engine) inside this
container. This sample talks **KMIP** to the MIT-licensed `pqctoday-kmip`
server, built on the from-scratch `softhsmrustv3` Rust engine, running in
the sibling `pqc-kmip` container — the same architecture as an enterprise KMS: every operation
crosses the crypto-agility policy plane before it reaches the engine, and
all three planes (policy → KMIP lifecycle → PKCS#11) are recorded in the
server's audit trail.

What it shows:
  1. Full KMIP lifecycle for an ML-DSA-65 signing key:
     CreateKeyPair → Activate → Sign → Locate/GetAttributes → Revoke → Destroy
  2. ML-KEM-768 Encapsulate / Decapsulate with shared-secret comparison
  3. Governance in action — two operations the control plane must refuse:
     Sign with a not-yet-activated key (lifecycle plane) and Sign with an
     encapsulation-only key (usage-mask plane).

Uses the official `pqctoday-kmip-client` package (stdlib-only, ships in
this image). Endpoint: KMIP_HOST / KMIP_PORT (default pqc-kmip:5696).

Run:
  python3 17-kmip-cacp.py
"""

import os
import sys

try:
    from pqctoday_kmip import KmipClient
except ImportError:
    sys.exit("pqctoday-kmip-client not installed — rebuild the dev-sandbox image "
             "(pip install pqctoday-hsm/kmip/python-client)")

HOST = os.environ.get("KMIP_HOST", "pqc-kmip")
PORT = int(os.environ.get("KMIP_PORT", "5696"))

# 2026-08-24: pqc-kmip's data plane (5696) has required a client cert +
# credentials since 2026-08-09 (KMIP 3.0 Profiles §3.3.4) — a connection
# with neither is refused during the TLS handshake, before any KMIP
# message. AGILE_KMIP_CERTS is the shared admin-certs volume (mounted into
# dev-sandbox for this sample); AGILE_KMIP_USER/PASS match pqc-kmip's
# --auth-user (sandbox-only, not a secret).
_CERT_DIR = os.environ.get("AGILE_KMIP_CERTS", "/admin-certs")
_USER = os.environ.get("AGILE_KMIP_USER", "sandbox")
_PASS = os.environ.get("AGILE_KMIP_PASS", "sandbox")
_client_cert = os.path.join(_CERT_DIR, "client.crt")
_client_key = os.path.join(_CERT_DIR, "client.key")
_have_certs = os.path.exists(_client_cert) and os.path.exists(_client_key)

failures = 0


def step(label, ok, detail=""):
    global failures
    mark = "✓" if ok else "✗"
    print(f"  [{mark}] {label}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures += 1


def expect_deny(label, result, plane):
    """A governed refusal is a PASS for this sample."""
    denied = not result.ok
    reason = result.get("ResultReason") or result.get("ResultMessage") or "denied"
    step(label, denied,
         f"refused by the {plane} plane ({reason})" if denied
         else "UNEXPECTEDLY ALLOWED — governance hole")


def main():
    print(f"=== KMIP + CACP demo against {HOST}:{PORT} (pqctoday-kmip / softhsmrustv3) ===\n")
    c = KmipClient(
        HOST, PORT,
        username=_USER, password=_PASS,
        client_cert=_client_cert if _have_certs else None,
        client_key=_client_key if _have_certs else None,
    )

    # ── 1. ML-DSA-65 lifecycle ────────────────────────────────────────────────
    print("1) ML-DSA-65 signing key lifecycle")
    kp = c.create_key_pair("ML_DSA_65", "Sign Verify")
    step("CreateKeyPair ML-DSA-65", kp.ok)
    if not kp.ok:
        sys.exit(f"cannot continue: CreateKeyPair failed ({kp.get('ResultMessage')})")
    priv = kp.get("PrivateKeyUniqueIdentifier")
    pub = kp.get("PublicKeyUniqueIdentifier")
    print(f"      priv={priv}  pub={pub}")

    # Governance check #1: signing with a PreActive key must be refused
    early = c.sign(priv, b"too early", "ML_DSA_65")
    expect_deny("Sign before Activate", early, "KMIP lifecycle")

    step("Activate", c.activate(priv).ok)
    sig = c.sign(priv, b"pqctoday: KMIP-governed PQC signature", "ML_DSA_65")
    sig_hex = sig.get("SignatureData") or ""
    step("Sign (ML-DSA-65)", sig.ok and len(sig_hex) // 2 == 3309,
         f"signature {len(sig_hex) // 2} bytes (FIPS 204: 3309)")

    attrs = c.get_attributes(priv)
    step("GetAttributes", attrs.ok)
    loc = c.locate()
    step("Locate", loc.ok)

    step("Revoke", c.revoke(priv).ok)
    step("Destroy", c.destroy(priv).ok)

    # ── 2. ML-KEM-768 encapsulate / decapsulate ──────────────────────────────
    print("\n2) ML-KEM-768 encapsulation")
    kem = c.create_key_pair("ML_KEM_768", "Encapsulate Decapsulate")
    if not kem.ok:  # older policy tables may require KeyAgreement usage
        kem = c.create_key_pair("ML_KEM_768", "KeyAgreement")
    step("CreateKeyPair ML-KEM-768", kem.ok)
    kpub = kem.get("PublicKeyUniqueIdentifier")
    kpriv = kem.get("PrivateKeyUniqueIdentifier")
    c.activate(kpub)
    c.activate(kpriv)

    enc = c.encapsulate(kpub)
    if enc.ok:
        ct = enc.get("Data") or ""
        step("Encapsulate", len(ct) // 2 == 1088,
             f"ciphertext {len(ct) // 2} bytes (FIPS 203: 1088)")
        dec = c.decapsulate(kpriv, bytes.fromhex(ct))
        step("Decapsulate", dec.ok)

        # Both shared secrets persist as SecretData objects on the server —
        # Get each and compare the KeyMaterial (never leaves the KMS in
        # production; extractable here for the demo).
        ss_enc = c.get(enc.get("UniqueIdentifier")).get("KeyMaterial") or ""
        ss_dec = c.get(dec.get("UniqueIdentifier")).get("KeyMaterial") or ""
        step("Shared secrets match", bool(ss_enc) and ss_enc == ss_dec,
             f"{len(ss_dec) // 2} bytes, sender and recipient agree")
    else:
        step("Encapsulate", False,
             f"server refused ({enc.get('ResultMessage')}) — the pqc-kmip image "
             "likely predates the Encapsulate op; update images (HSM_REF bump)")

    # Governance check #2: a KEM key must not sign (usage-mask plane)
    wrong_use = c.sign(kpriv, b"KEM keys must not sign", "ML_DSA_65")
    expect_deny("Sign with encapsulation-only key", wrong_use, "usage-mask")

    c.revoke(kpriv); c.destroy(kpriv)

    # ── Verdict ───────────────────────────────────────────────────────────────
    print()
    if failures:
        print(f"RESULT: {failures} check(s) failed ✗")
        sys.exit(1)
    print("RESULT: all KMIP lifecycle, KEM, and governance checks passed ✓")
    print("(Every operation above crossed the CACP policy plane and is in the "
          "server audit trail — see scenario 22 for the three-plane audit story.)")


if __name__ == "__main__":
    main()
