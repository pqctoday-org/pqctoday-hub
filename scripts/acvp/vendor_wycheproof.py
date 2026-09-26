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
Does NOT: subset, renumber, re-derive, normalize, or regenerate anything; it is
not wired to any `gen:*` npm script (the regeneration chain is owned elsewhere).

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
}

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "src" / "data" / "acvp"


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def provenance(name: str, upstream_sha: str) -> dict[str, object]:
    spec = VENDORED[name]
    upstream_path = f"testvectors_v1/{name}"
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
        "retrieved": RETRIEVED,
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
        doc = json.loads(raw)
        out = {"_provenance": provenance(name, got)}
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
                else:
                    print(f"OK   {dest.name}  {cases} cases  upstream {got[:12]}")
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
