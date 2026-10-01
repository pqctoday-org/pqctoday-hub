#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Vendor Project Wycheproof test vectors into src/data/acvp/ (user ruling 2026-09-26:
"support completely Wycheproof tests and state it - attribute it to google - add
link to this source ; what is not covered by Wycheproof self derive").

WHY WYCHEPROOF AT ALL
---------------------
Our validation corpus is almost entirely POSITIVE derivation: given correct
input, is the output correct. An engine that computes correctly but ACCEPTS a
malformed key or a forged signature passes all of it. NIST publishes nothing for
most of those reject paths (the ACVP key-disposition enums are closed at three
values with no order member, and the KAS-ECC spec puts key assurance "outside
the scope of ACVP testing"). Wycheproof is the only broad public source of such
cases.

EVIDENCE CLASS — READ THIS BEFORE CHANGING ANYTHING
---------------------------------------------------
Wycheproof is `independent-oracle`, never `published-standard-kat`. Google/C2SP
is not a standards body and no standard prints these values. The only claim a
passing Wycheproof case supports is "agrees with Project Wycheproof <commit> for
this case" — NOT conformance. See src/data/validation/evidenceClasses.ts, whose
`published-standard-kat` definition says so explicitly.

SCOPE RULE (WYC-SCOPE-1) — what "completely" means, checkably
------------------------------------------------------------
Upstream testvectors_v1/ holds 343 files / 144,910 cases / 111 MB at the pinned
commit. Vendoring all of it is not defensible and not possible here:

  * every case in a vendored file must be registered in
    src/data/validation/vector-manifest.json (audit-validation-manifest.ts
    UNREGISTERED_CASE), which costs ~350-1800 bytes of reviewed manifest per
    case; and
  * scripts/ci/check-vector-reachability.ts fails a vendored file that no
    executing test loads. A file we do not EXECUTE may therefore not be
    vendored at all — "held but unused" is precisely the defect that gate
    exists to stop.

So the scope is the intersection of four filters, each recorded per file:

  F1 mechanism    the file's algorithm maps to a mechanism in
                  src/data/validation/capability-map.json `mechanisms`.
  F2 parameter    every parameter the file fixes (curve, modulus size, key
                  size) is inside that mechanism's declared
                  `parameterSetGroups` set. A curve the hub does not offer
                  (brainpool*, sect*, secp160/192/224*) is out of scope, not
                  skipped coverage.
  F3 encoding     the file's key/signature encoding is one the hub actually
                  hands to PKCS#11 (raw value, uncompressed point, P1363
                  r||s). Pure transport variants (_pem, _jwk, _webcrypto, and
                  the ASN.1 SPKI _asn files) test a JavaScript decoder, not
                  the engine, so they are out.
  F4 executed     a runner for the file's Wycheproof `schema` exists in this
                  tree and runs every case of the file against both engines.

F1+F2+F3 yield 173 of 343 files (39,849 cases). F4 is the live frontier: each
schema not yet implemented is reported as an open gap WITH its case count, so
what is missing is a number, not a shrug. VENDORED below is exactly the set that
passes all four.

ATTRIBUTION (the user asked for this specifically)
--------------------------------------------------
Every vendored file carries a top-level `_provenance` naming Project Wycheproof,
its maintainer (Google / C2SP), the repository URL, the pinned commit, the
upstream path, the upstream sha256 and the Apache-2.0 licence. The upstream
LICENSE text is vendored to src/data/acvp/WYCHEPROOF-LICENSE.txt. The visible
per-row source tag in the app is built by `wycTag()` in
src/components/Playground/hsm/acvp/sections/wycheproofNegative.ts so a reader
sees the evidence is Google's, not NIST's.

WHAT THIS SCRIPT DOES / DOES NOT DO
-----------------------------------
Does: copy each upstream file byte-for-byte, verify its sha256 against the
PINNED_SHA256 table below (recorded at adoption), inject ONE new top-level key
`_provenance`, and write src/data/acvp/wycheproof_<upstream name>. tcIds, group
order, case order, flags, results and every hex value are untouched.
Does NOT: renumber, re-derive, normalize, or regenerate anything; it is not
wired to any `gen:*` npm script (the regeneration chain is owned elsewhere).

ONE EXCEPTION, DECLARED (PQC batch, 2026-09-30): the EXCLUSIONS rules below drop
the upstream cases whose expected output cannot be reproduced through PKCS#11
because the interface has no input for a value the case fixes — the encapsulation
randomness m (valid MLKEMEncapsTest cases) and an explicit signing rnd
(`Randomized` MlDsaSign cases). The dropped tcIds are listed in the file's
`_provenance.excluded_cases`, and --check re-applies the rule to the pinned
upstream file and fails unless the vendored file holds exactly the kept cases and
lists exactly the dropped ones. Nothing else is ever subset.

USAGE
  python3 scripts/acvp/vendor_wycheproof.py --clone <path to a wycheproof clone>
  npx prettier --write src/data/acvp/wycheproof_*.json       # required: format:check gate
  python3 scripts/acvp/wycheproof_manifest_entries.py        # manifest entries
  npx prettier --write src/data/validation/vector-manifest.json
  python3 scripts/acvp/vendor_wycheproof.py --clone <path> --check   # verify only
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

REPO_URL = "https://github.com/C2SP/wycheproof"
# Pinned 2026-09-26. `git -C <clone> rev-parse HEAD` must equal this.
PIN_COMMIT = "3fa63dd0344abb611f1fb1d77e119938603ea230"
PIN_DATE = "2026-09-02"
RETRIEVED = "2026-09-26"
LICENCE = "Apache-2.0"
PRODUCER = "Project Wycheproof, maintained by Google / C2SP (third-party adversarial test vectors; NOT a standards publication)"

# sha256 of each upstream testvectors_v1 file at PIN_COMMIT, recorded at
# adoption. A mismatch is a hard failure: it means the clone is not the pinned
# tree.
PINNED_SHA256 = {
    "x25519_test.json": "35c3f5231cf25cc640b524d403461deee9e49441d5d915a3a25b2c8ff5adbe7d",
    "x448_test.json": "0f8f7199dbd47d1805cb9b13dfb29c207406bc786827bfd9ba7b73374b830fe5",
    "ed25519_test.json": "752d2ea7d7c6cf4736381b6cbacb61f8182b126ab7cd9b058f00c50084975536",
    "ed448_test.json": "3b3c7995853deb2fbbb49fba0fd292f314dc081f9154bd33252f294ca211289a",
    "aes_kwp_test.json": "e89624734deeba8bb937acba5381a5cb137c7050bf8bfd0bd70bd8438170b436",
    "aes_wrap_test.json": "2fdb3661fd8823d1ec50e03886b24066415018975677dff83d83e77f5a51562d",
    "rsa_pss_2048_sha256_mgf1_32_test.json": "7f6efafc160f4816b96cbf1c12188a31051d7e3f001e27505d9edb5f2a0e325c",
    # PQC batch, recorded 2026-09-30 at the SAME pinned commit 3fa63dd0 (which
    # is also upstream main's HEAD on that day: its last commit is "mlkem: add
    # re-encryption comparison vectors to the seed-key files"). No newer pin
    # was needed.
    "mldsa_44_sign_noseed_test.json": "ee55e18b1944db496b2539d3884dfacc04a96db21bcec239063df5e4cd1ee6cb",
    "mldsa_44_sign_seed_test.json": "b29b0dcca2e52c988e1b9c06f8b521889ffbaadfc6a9dbf52f0f0f8f4c5b6b92",
    "mldsa_44_verify_test.json": "0ca1b5df4575263e29b31fae7569a3da41df9a3b6fee56720a992d0cd1153b68",
    "mldsa_65_sign_noseed_test.json": "8587a53e7e3ca20b006b661316b89c762acdecf3fa902746b01cbc09fe14130d",
    "mldsa_65_sign_seed_test.json": "d72e9c2f514c9f7490c33785ae0027d942ba2c45a9b8ebfc8fb1802b4913bf38",
    "mldsa_65_verify_test.json": "49ac366d76115eab56b7116f10d06e288e6f23fe6cfb90b26bfb2d731a8d1e02",
    "mldsa_87_sign_noseed_test.json": "bd4c997f1fb90d985dbcca9a5ab52cef1f5c22d2cc0ba332d8dbe68703a5b40d",
    "mldsa_87_sign_seed_test.json": "e83c292318134faa6af777e86c619c4643e2705dba91dfa5adcd1fddfd4f40ce",
    "mldsa_87_verify_test.json": "e9e04216d4217265a5affba2568476d35742dbd8ffc9d4c23b3441334a08a224",
    "mlkem_512_encaps_test.json": "85a69664f2e8243f5085f01fb22f9635b100b16a8935cf2b2ac94c127511a20c",
    "mlkem_512_keygen_seed_test.json": "877ae6f5550d0e802086e5812bdbd23c16afa31cd3bff9669cd9661d3fbf2d85",
    "mlkem_512_semi_expanded_decaps_test.json": "bb90c7997dc3695e52882608b7c79675a012c031dd50dc08e76c4775a762ad14",
    "mlkem_512_test.json": "18bc5455d5bf8226b3ab1d1deb51f3ed7c44b3d90039eb25416d40fa77e76f20",
    "mlkem_768_encaps_test.json": "9d4381f94c40853bba430245b94968b7390d9175aacd9f1ae4e250a71c78b713",
    "mlkem_768_keygen_seed_test.json": "fde5abe284396f4cb3c4610b90d680f0b57782e94c3365c97aee59e24881ebe4",
    "mlkem_768_semi_expanded_decaps_test.json": "e4438ab7d4dd7b6ace7165e45aeed4403082f981f86300c8369f69d3d071060a",
    "mlkem_768_test.json": "c59c067ae794c343df575dd90f6f7458f51881b11a22d6e9d8677c8d9ee21e90",
    "mlkem_1024_encaps_test.json": "da41e8daf57e40a6b334a722e3f56067817352f5583fdb2434da1a2cd611358e",
    "mlkem_1024_keygen_seed_test.json": "cd9241bf5d65a78e005866ea2c660615c17f50caa9afc2b96fd1573cc65617b5",
    "mlkem_1024_semi_expanded_decaps_test.json": "a4a7c88152df3d8d4b3f33aad584167dfaff67195cfde08aac4b981030b4d05c",
    "mlkem_1024_test.json": "17c5b764d78c05522f1980fcb41d82add573f11de5d13004ae0b83bf46d9c43a",
}

# The files that pass F1-F4. `mechanisms` is the PKCS#11 mechanism list the
# runner drives for that file; `local` describes what we do with the case.
VENDORED: dict[str, dict[str, str]] = {
    "x25519_test.json": {
        "mechanisms": "CKM_ECDH1_DERIVE (CKK_EC_MONTGOMERY X25519 keys)",
        "upstream_operation": "XdhComp (public, private -> shared)",
        "local": "C_CreateObject(CKO_PRIVATE_KEY, CKK_EC_MONTGOMERY, CKA_VALUE = private) then "
        "C_DeriveKey(CKM_ECDH1_DERIVE, pPublicData = public) and C_GetAttributeValue(CKA_VALUE) "
        "of the derived secret, byte-compared with `shared`.",
    },
    "x448_test.json": {
        "mechanisms": "CKM_ECDH1_DERIVE (CKK_EC_MONTGOMERY X448 keys)",
        "upstream_operation": "XdhComp (public, private -> shared)",
        "local": "as x25519_test.json, with the 56-byte X448 values.",
    },
    "ed25519_test.json": {
        "mechanisms": "CKM_EDDSA",
        "upstream_operation": "EddsaVerify (publicKey.pk, msg, sig -> result)",
        "local": "C_CreateObject(CKO_PUBLIC_KEY, CKK_EC_EDWARDS, CKA_EC_PARAMS = Ed25519 OID, "
        "CKA_EC_POINT = pk) then C_VerifyInit/C_Verify(CKM_EDDSA) over msg with sig.",
    },
    "ed448_test.json": {
        "mechanisms": "CKM_EDDSA",
        "upstream_operation": "EddsaVerify (publicKey.pk, msg, sig -> result)",
        "local": "as ed25519_test.json, with the Ed448 OID and 57-byte pk.",
    },
    "aes_kwp_test.json": {
        "mechanisms": "CKM_AES_KEY_WRAP_KWP",
        "upstream_operation": "KeywrapTest (key, msg, ct -> result)",
        "local": "C_UnwrapKey(CKM_AES_KEY_WRAP_KWP, ct) with the upstream KEK as a "
        "CKK_AES session key, then C_GetAttributeValue(CKA_VALUE) byte-compared with msg; "
        "a `valid` case additionally wraps msg and byte-compares with ct.",
    },
    "aes_wrap_test.json": {
        "mechanisms": "CKM_AES_KEY_WRAP",
        "upstream_operation": "KeywrapTest (key, msg, ct -> result)",
        "local": "as aes_kwp_test.json with CKM_AES_KEY_WRAP (RFC 3394, no padding).",
    },
    # Maintainer ruling 2026-09-26: replaces the Node/OpenSSL-generated
    # rsapss_test.json. Source priority NIST ACVP > Wycheproof > published
    # standard > custom; the NIST RSA-SigVer-FIPS186-5 sample has PSS only with
    # SHA3-256 / SHAKE hashes (already run), none with SHA2-256, so this file is
    # the highest-priority source for SHA-256 PSS.
    "rsa_pss_2048_sha256_mgf1_32_test.json": {
        "mechanisms": "CKM_SHA256_RSA_PKCS_PSS (CK_RSA_PKCS_PSS_PARAMS: CKM_SHA256, CKG_MGF1_SHA256, sLen 32)",
        "upstream_operation": "RsassaPssVerify (publicKey.modulus/publicExponent, msg, sig -> result)",
        "local": "C_CreateObject(CKO_PUBLIC_KEY, CKK_RSA, CKA_MODULUS = modulus without the ASN.1 "
        "sign byte, CKA_PUBLIC_EXPONENT) then C_VerifyInit/C_Verify(CKM_SHA256_RSA_PKCS_PSS, "
        "hashAlg/MGF/sLen from the group) over msg with sig.",
    },
}

# ── PQC batch (2026-09-30): ML-KEM (FIPS 203) and ML-DSA (FIPS 204) ──────────
# Runner: src/components/Playground/hsm/acvp/sections/wycheproofPqc.ts, both
# engines. Every file is vendored; two files kinds carry a DECLARED subset (see
# EXCLUSIONS below), every other file is whole.
for _ps in ("512", "768", "1024"):
    VENDORED[f"mlkem_{_ps}_keygen_seed_test.json"] = {
        "mechanisms": f"CKM_ML_KEM_KEY_PAIR_GEN (CKP_ML_KEM_{_ps})",
        "upstream_operation": "MLKEMKeyGen (seed d||z -> ek, dk)",
        "local": "C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN) with the 64-byte seed as CKA_SEED in the "
        "private-key template, then C_GetAttributeValue(CKA_VALUE) of both keys, byte-compared with "
        "ek and dk.",
    }
    VENDORED[f"mlkem_{_ps}_test.json"] = {
        "mechanisms": f"CKM_ML_KEM_KEY_PAIR_GEN + CKM_ML_KEM (CKP_ML_KEM_{_ps})",
        "upstream_operation": "MLKEMTest (seed d||z, c -> K; ek when given)",
        "local": "C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN, CKA_SEED = seed); when the case carries ek, "
        "the generated public CKA_VALUE is byte-compared with it; then C_DecapsulateKey(CKM_ML_KEM, c) "
        "and C_GetAttributeValue(CKA_VALUE) of the derived secret, byte-compared with K. An `invalid` "
        "case (wrong ciphertext length) must be refused by C_DecapsulateKey.",
    }
    VENDORED[f"mlkem_{_ps}_semi_expanded_decaps_test.json"] = {
        "mechanisms": f"CKM_ML_KEM (CKP_ML_KEM_{_ps})",
        "upstream_operation": "MLKEMDecapsValidationTest (expanded dk, c -> K)",
        "local": "C_CreateObject(CKO_PRIVATE_KEY, CKK_ML_KEM, CKA_VALUE = dk) then "
        "C_DecapsulateKey(CKM_ML_KEM, c), K byte-compared. An `invalid` case (wrong dk or c length, "
        "dk whose embedded H(ek) or ek is corrupted — FIPS 203 §7.3) must be refused at "
        "C_CreateObject or at C_DecapsulateKey.",
    }
    VENDORED[f"mlkem_{_ps}_encaps_test.json"] = {
        "mechanisms": f"CKM_ML_KEM (CKP_ML_KEM_{_ps})",
        "upstream_operation": "MLKEMEncapsTest (ek, m -> c, K)",
        "local": "C_CreateObject(CKO_PUBLIC_KEY, CKK_ML_KEM, CKA_VALUE = ek) then "
        "C_EncapsulateKey(CKM_ML_KEM). Only the `invalid` cases are vendored (see excluded_cases): "
        "each carries an ek that must be refused (FIPS 203 §7.2 modulus check, or a wrong length), "
        "at C_CreateObject or at C_EncapsulateKey.",
    }
for _ps in ("44", "65", "87"):
    VENDORED[f"mldsa_{_ps}_verify_test.json"] = {
        "mechanisms": f"CKM_ML_DSA (CKP_ML_DSA_{_ps}; CK_SIGN_ADDITIONAL_CONTEXT when ctx is given)",
        "upstream_operation": "MlDsaVerify (publicKey, msg, ctx, sig -> result)",
        "local": "C_CreateObject(CKO_PUBLIC_KEY, CKK_ML_DSA, CKA_VALUE = publicKey) then "
        "C_VerifyInit(CKM_ML_DSA, context = ctx) / C_Verify over msg with sig. publicKeyDer is not "
        "used (transport encoding).",
    }
    VENDORED[f"mldsa_{_ps}_sign_noseed_test.json"] = {
        "mechanisms": f"CKM_ML_DSA, vendor CKM_ML_DSA_EXTERNAL_MU 0x403c for `Internal` cases (CKP_ML_DSA_{_ps})",
        "upstream_operation": "MlDsaSign (privateKey, msg|mu, ctx -> sig), deterministic (rnd = 0)",
        "local": "C_CreateObject(CKO_PRIVATE_KEY, CKK_ML_DSA, CKA_VALUE = privateKey) then "
        "C_SignInit(hedgeVariant = CKH_DETERMINISTIC_REQUIRED, context = ctx) / C_Sign over msg (or over "
        "mu with the vendor external-mu mechanism for an `Internal` case), byte-compared with sig. An "
        "`invalid` case (wrong sk length, sk out of range, ctx > 255 bytes) must be refused.",
    }
    VENDORED[f"mldsa_{_ps}_sign_seed_test.json"] = {
        "mechanisms": f"CKM_ML_DSA_KEY_PAIR_GEN + CKM_ML_DSA, vendor CKM_ML_DSA_EXTERNAL_MU 0x403c for `Internal` cases (CKP_ML_DSA_{_ps})",
        "upstream_operation": "MlDsaSign (privateSeed, msg|mu, ctx -> sig), deterministic (rnd = 0)",
        "local": "C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN, CKA_SEED = privateSeed in the private "
        "template); the generated public CKA_VALUE is byte-compared with publicKey; then deterministic "
        "C_Sign as in the noseed file, byte-compared with sig. privateKeyPkcs8 is not used (transport "
        "encoding). An `invalid` case (seed of the wrong length, ctx > 255 bytes) must be refused.",
    }

# Declared, checkable exclusions. A case is excluded ONLY when the PKCS#11 v3.2
# interface has no input for a value the case fixes, so the upstream expected
# output cannot be reproduced through it. Each rule is applied to the pinned
# upstream file by --check: the vendored file must contain exactly the upstream
# cases the rule keeps (deep-equal, upstream order) and list exactly the tcIds
# it drops. Empty groups are kept so local tgId = upstream group index + 1.
EXCLUSIONS: dict[str, dict[str, str]] = {
    "encaps-valid": {
        "rule": "result == 'valid' in an MLKEMEncapsTest file",
        "reason": "C_EncapsulateKey (PKCS#11 v3.2 §5.18.8) takes no caller-supplied randomness: the token "
        "draws m itself, so (ek, m) -> (c, K) cannot be reproduced and the upstream c/K cannot be "
        "byte-compared. The same limit already makes NIST's encapsulation AFT groups a declared skip "
        "(mlkem_encapdecap_val_test notExecuted). The `invalid` cases need no m — their ek must be "
        "refused — so they are vendored and executed.",
    },
    "sign-randomized": {
        "rule": "flags contain 'Randomized' in an MlDsaSign file",
        "reason": "CK_SIGN_ADDITIONAL_CONTEXT (PKCS#11 v3.2) carries hedgeVariant and context only; there is "
        "no parameter for an explicit rnd, so a hedged signature made with the upstream rnd cannot be "
        "reproduced. Same limit as NIST's hedged sigGen groups (declaredUnreachable mldsa-hedged-rnd).",
    },
}


def exclusion_of(name: str, test: dict) -> str | None:
    """-> the EXCLUSIONS key that drops this upstream case, or None to keep it."""
    if "_encaps_" in name and name.startswith("mlkem_") and test.get("result") == "valid":
        return "encaps-valid"
    if "_sign_" in name and name.startswith("mldsa_") and "Randomized" in test.get("flags", []):
        return "sign-randomized"
    return None


def apply_exclusions(name: str, doc: dict) -> tuple[dict, dict | None]:
    """-> (vendored document, excluded_cases block or None when the file is whole)."""
    dropped: list[dict[str, object]] = []
    groups = []
    for gi, g in enumerate(doc.get("testGroups", [])):
        kept = []
        for t in g.get("tests", []):
            why = exclusion_of(name, t)
            if why:
                dropped.append({"tgId": gi + 1, "tcId": t["tcId"], "result": t["result"], "rule": why})
            else:
                kept.append(t)
        groups.append({**g, "tests": kept})
    if not dropped:
        return doc, None
    rules = sorted({str(d["rule"]) for d in dropped})
    block = {
        "count": len(dropped),
        "rules": {r: EXCLUSIONS[r] for r in rules},
        "cases": dropped,
        "note": "Upstream `numberOfTests` is left as upstream wrote it (it counts the excluded cases too). "
        "Groups emptied by the rule are kept so tgId stays the upstream group index + 1.",
    }
    return {**doc, "testGroups": groups}, block

# Files vendored on a later day than the first batch carry their own date.
RETRIEVED_BY_FILE = {n: "2026-09-30" for n in VENDORED if n.startswith(("mlkem_", "mldsa_"))}

ROOT =pathlib.Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "src" / "data" / "acvp"


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def provenance(name: str, upstream_sha: str, excluded: dict | None = None) -> dict[str, object]:
    spec = VENDORED[name]
    upstream_path = f"testvectors_v1/{name}"
    out = _provenance_whole(name, upstream_sha, spec, upstream_path)
    if excluded is None:
        return out
    out["transformation"] = (
        "this `_provenance` key added, and a DECLARED subset: the upstream cases listed in "
        "`excluded_cases` are dropped by the rule named there, because PKCS#11 has no input for a value "
        "they fix. Every kept testGroup, test, tcId, flag, result and hex value is byte-copied from the "
        "upstream file in upstream order; no kept case is renumbered, re-derived or normalized."
    )
    out["excluded_cases"] = excluded
    return out


def _provenance_whole(name: str, upstream_sha: str, spec: dict, upstream_path: str) -> dict[str, object]:
    return {
        "producer": PRODUCER,
        "attribution": "Project Wycheproof, maintained by Google / C2SP. "
        f"Source: {REPO_URL}. Used under the Apache License 2.0 "
        "(src/data/acvp/WYCHEPROOF-LICENSE.txt).",
        "source_repo": REPO_URL,
        "source_commit": PIN_COMMIT,
        "source_commit_date": PIN_DATE,
        "source_path": upstream_path,
        "source_url": f"https://raw.githubusercontent.com/C2SP/wycheproof/{PIN_COMMIT}/{upstream_path}",
        "source_release": PIN_COMMIT,
        "source_sha256": upstream_sha,
        "license": LICENCE,
        "license_file": "src/data/acvp/WYCHEPROOF-LICENSE.txt",
        "retrieved": RETRIEVED_BY_FILE.get(name, RETRIEVED),
        "evidence_class": "independent-oracle",
        "evidence_class_reason": "Google/C2SP is not a standards body and no standard prints these "
        "values. A passing case supports only 'agrees with Project Wycheproof "
        f"{PIN_COMMIT[:8]} for this case', never a conformance claim.",
        "upstream_operation": spec["upstream_operation"],
        "local_operation": spec["local"],
        "local_mechanisms": spec["mechanisms"],
        "transformation": "none beyond this `_provenance` key: every testGroup, test, tcId, flag, "
        "result and hex value is byte-copied from the upstream file in upstream order. No case is "
        "dropped, renumbered, re-derived or normalized.",
        "result_policy": "Wycheproof `valid` must be accepted and `invalid` must be refused. "
        "`acceptable` is a case upstream states either outcome is defensible: the observed "
        "behaviour is RECORDED and no pass/fail assertion is made on it.",
        "scope_rule": "WYC-SCOPE-1 (see scripts/acvp/vendor_wycheproof.py).",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clone", required=True, help="path to a clone of C2SP/wycheproof")
    ap.add_argument("--check", action="store_true", help="verify only; write nothing")
    args = ap.parse_args()

    clone = pathlib.Path(args.clone).resolve()
    head = subprocess.run(
        ["git", "-C", str(clone), "rev-parse", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    if head != PIN_COMMIT:
        print(f"FAIL clone HEAD is {head}, pinned commit is {PIN_COMMIT}", file=sys.stderr)
        return 1

    lic = (clone / "LICENSE").read_bytes()
    problems: list[str] = []
    for name in sorted(VENDORED):
        src = clone / "testvectors_v1" / name
        if not src.exists():
            problems.append(f"{name}: missing from the pinned clone")
            continue
        raw = src.read_bytes()
        got = sha256(raw)
        want = PINNED_SHA256.get(name)
        if want != got:
            problems.append(f"{name}: upstream sha256 {got} != pinned {want}")
            continue
        upstream_doc = json.loads(raw)
        # `doc` is what is vendored: the upstream document, minus only the cases
        # a declared EXCLUSIONS rule drops (none for most files).
        doc, excluded = apply_exclusions(name, upstream_doc)
        out = {"_provenance": provenance(name, got, excluded)}
        out.update(doc)  # every upstream key, upstream order, byte-identical values
        text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
        dest = OUT_DIR / f"wycheproof_{name}"
        cases = sum(len(g.get("tests", [])) for g in doc.get("testGroups", []))
        if args.check:
            # CONTENT comparison, not text: the vendored file is re-indented by
            # `npx prettier --write` (every other file in src/data/acvp is
            # prettier-formatted, and format:check is a CI gate), so byte equality
            # of the serialisation is not the invariant. The invariant is that
            # every upstream key is present and DEEP-EQUAL to the pinned upstream
            # document — no case dropped, no tcId renumbered, no value changed —
            # and that `_provenance` is the only added key.
            if not dest.exists():
                problems.append(f"{dest.name}: not vendored yet")
            else:
                local = json.loads(dest.read_text(encoding="utf-8"))
                extra = set(local) - set(doc) - {"_provenance"}
                missing = set(doc) - set(local)
                diff = [k for k in doc if k in local and local[k] != doc[k]]
                if extra or missing or diff:
                    problems.append(
                        f"{dest.name}: diverged from the pinned upstream — "
                        f"added {sorted(extra)}, missing {sorted(missing)}, changed {sorted(diff)}"
                    )
                elif "_provenance" not in local:
                    problems.append(f"{dest.name}: no _provenance attribution block")
                elif local["_provenance"].get("excluded_cases") != excluded:
                    # The declared exclusion list must be exactly what the rule
                    # drops from the PINNED upstream file — a case dropped
                    # silently, or listed but still present, fails here.
                    problems.append(
                        f"{dest.name}: _provenance.excluded_cases does not equal the exclusion rule "
                        "applied to the pinned upstream file"
                    )
                else:
                    tail = f"  ({excluded['count']} excluded by rule)" if excluded else ""
                    print(f"OK   {dest.name}  {cases} cases  upstream {got[:12]}{tail}")
        else:
            dest.write_text(text, encoding="utf-8")
            print(f"WROTE {dest.name}  {cases} cases  local {sha256(text.encode())[:12]}")

    lic_dest = OUT_DIR / "WYCHEPROOF-LICENSE.txt"
    header = (
        "Project Wycheproof test vectors vendored under src/data/acvp/wycheproof_*.json\n"
        f"come from {REPO_URL} at commit {PIN_COMMIT} ({PIN_DATE}),\n"
        "maintained by Google / C2SP, and are used under the licence below.\n"
        "Unmodified copy of that repository's LICENSE at the pinned commit.\n"
        + "=" * 78
        + "\n\n"
    )
    if args.check:
        if not lic_dest.exists() or not lic_dest.read_bytes().endswith(lic):
            problems.append("WYCHEPROOF-LICENSE.txt missing or not the pinned upstream LICENSE")
    else:
        lic_dest.write_bytes(header.encode() + lic)
        print(f"WROTE {lic_dest.name}  upstream LICENSE sha256 {sha256(lic)[:12]}")

    for p in problems:
        print(f"FAIL {p}", file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
