#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Compute and record the Wycheproof adoption census — the artifact that makes
"support completely Wycheproof tests" a CHECKABLE claim rather than a vague one.

It applies scope rule WYC-SCOPE-1 (documented in scripts/acvp/vendor_wycheproof.py)
to every file in the pinned clone's testvectors_v1/ and writes
scripts/acvp/wycheproof-scope.json with, per file: the bucket, the case counts by
upstream `result`, and — for a file we do NOT vendor — the exact reason.

The four filters, each recorded per file:
  F1 mechanism  the file's algorithm maps to a mechanism in capability-map.json
  F2 parameter  every parameter it fixes is in that mechanism's declared
                parameterSetGroups set (a curve/modulus the hub does not offer is
                out of scope, not missing coverage)
  F3 encoding   the key/signature encoding is one the hub hands to PKCS#11
                (raw value, uncompressed point, P1363 r||s) — pure transport
                variants (_pem/_jwk/_webcrypto/_asn SPKI) test a JS decoder
  F4 executed   a runner exists in this tree and runs EVERY case of the file
                against both engines. scripts/ci/check-vector-reachability.ts
                fails a vendored file nothing executes, so a file we do not
                execute must not be vendored — F4 is the live frontier and every
                schema behind it is reported with its case count.

Usage:
  python3 scripts/acvp/wycheproof_scope_census.py --clone <clone of C2SP/wycheproof>
  python3 scripts/acvp/wycheproof_scope_census.py --clone <path> --check
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from vendor_wycheproof import apply_exclusions  # noqa: E402  (same directory)

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "acvp" / "wycheproof-scope.json"
PIN_COMMIT = "3fa63dd0344abb611f1fb1d77e119938603ea230"

# EC / ECDH parameter sets the hub declares in
# src/data/validation/capability-map.json `parameterSetGroups`.
HUB_CURVES = {"secp256r1", "secp384r1", "secp521r1", "secp256k1"}

# Wycheproof schemas a runner in this tree executes end to end.
IMPLEMENTED_SCHEMAS = {
    "xdh_comp_schema_v1.json",
    "eddsa_verify_schema_v1.json",
    "keywrap_test_schema_v1.json",
    "rsassa_pss_verify_schema_v1.json",
    # PQC batch 2026-09-30 — sections/wycheproofPqc.ts. The encaps and sign
    # schemas run with a DECLARED subset (vendor_wycheproof.py EXCLUSIONS): the
    # cases PKCS#11 cannot reproduce are excluded and counted below, per file.
    "mlkem_keygen_seed_test_schema.json",
    "mlkem_test_schema.json",
    "mlkem_semi_expanded_decaps_test_schema.json",
    "mlkem_encaps_test_schema.json",
    "mldsa_verify_schema.json",
    "mldsa_sign_noseed_schema.json",
    "mldsa_sign_seed_schema.json",
}

SYMMETRIC_IN_SCOPE = {
    "AES-GCM",
    "AES-CCM",
    "AES-CMAC",
    "AES-GMAC",
    "AES-XTS",
    "AES-KWP",
    "AES-WRAP",
    "AES-CBC-PKCS5",
}


def classify(name: str, doc: dict) -> tuple[str | None, str | None]:
    """-> (bucket, None) when F1-F3 pass, else (None, reason)."""
    a = doc.get("algorithm") or ""
    if a == "ECDSA":
        m = re.match(r"ecdsa_([a-zA-Z0-9]+)_", name)
        c = m.group(1) if m else "?"
        if c not in HUB_CURVES:
            return None, f"F2: curve {c} is not in the hub-declared EC parameter set"
        if "bitcoin" in name:
            return None, "F1: Bitcoin low-S canonicalization is not a mechanism the hub advertises"
        return "ECDSA", None
    if a == "ECDH":
        m = re.match(r"ecdh_([a-zA-Z0-9]+)_", name)
        c = m.group(1) if m else "?"
        if c not in HUB_CURVES:
            return None, f"F2: curve {c} is not in the hub-declared ECDH parameter set"
        if any(s in name for s in ("_pem", "_webcrypto", "_jwk")):
            return None, "F3: transport-encoding variant (PEM/JWK/WebCrypto), not an encoding the hub hands to PKCS#11"
        return "ECDH", None
    if a == "XDH":
        if any(s in name for s in ("_pem", "_jwk", "_asn")):
            return None, "F3: transport-encoding variant (PEM/JWK/ASN.1 SPKI), not the raw 32/56-byte value the hub hands to PKCS#11"
        return "XDH", None
    if a == "EDDSA":
        return "EDDSA", None
    if a.startswith("RSASSA-PKCS1"):
        m = re.search(r"_(\d+)_", name)
        k = int(m.group(1)) if m else 0
        if k and k < 2048:
            return None, f"F2: RSA {k}-bit is below the hub minimum modulus"
        return "RSA-PKCS1-sig", None
    if a.startswith("RSASSA-PSS"):
        return "RSA-PSS", None
    if a == "RSAES-OAEP":
        if "three_primes" in name:
            return None, "F3: multi-prime RSA private key is not a key form the hub imports"
        return "RSA-OAEP", None
    if a == "RSAES-PKCS1-v1_5":
        if "three_primes" in name:
            return None, "F3: multi-prime RSA private key is not a key form the hub imports"
        return "RSA-PKCS1-enc", None
    if a == "ML-KEM":
        return "ML-KEM", None
    if a.startswith("ML-DSA"):
        return "ML-DSA", None
    if a in SYMMETRIC_IN_SCOPE:
        return "AES", None
    if a == "CHACHA20-POLY1305":
        return "ChaCha20-Poly1305", None
    if a.startswith("HMACSHA") and "SM3" not in a:
        return "HMAC", None
    if a.startswith("KMAC"):
        return "KMAC", None
    if a.startswith("HKDF"):
        return "HKDF", None
    if a.startswith("PBKDF2"):
        return "PBKDF2", None
    return None, f"F1: no PKCS#11 mechanism in capability-map.json for {a or 'this file'}"


def build(clone: pathlib.Path) -> dict:
    head = subprocess.run(
        ["git", "-C", str(clone), "rev-parse", "HEAD"], capture_output=True, text=True, check=True
    ).stdout.strip()
    if head != PIN_COMMIT:
        raise SystemExit(f"clone HEAD {head} is not the pinned commit {PIN_COMMIT}")
    files, totals = [], {
        "upstream": {"files": 0, "cases": 0},
        "inScope": {"files": 0, "cases": 0, "invalid": 0},
        "vendored": {"files": 0, "cases": 0, "invalid": 0, "acceptable": 0},
        # Cases of vendored files that a declared exclusion rule drops (they are
        # NOT in `vendored.cases`, which counts only what is vendored and run).
        "vendoredExcluded": {"files": 0, "cases": 0, "valid": 0, "invalid": 0},
        "inScopeRunnerMissing": {"files": 0, "cases": 0, "invalid": 0},
        "inScopeNotVendored": {"files": 0, "cases": 0, "invalid": 0},
        "outOfScope": {"files": 0, "cases": 0},
    }
    for p in sorted((clone / "testvectors_v1").glob("*.json")):
        doc = json.loads(p.read_text(encoding="utf-8"))
        counts = {"valid": 0, "invalid": 0, "acceptable": 0}
        for g in doc.get("testGroups", []):
            for t in g.get("tests", []):
                counts[t.get("result", "valid")] = counts.get(t.get("result", "valid"), 0) + 1
        n = sum(counts.values())
        bucket, reason = classify(p.name, doc)
        schema = doc.get("schema")
        # A runner is per schema, but vendoring is per file: executed only when
        # the runner exists AND this file is vendored. A schema-level test would
        # count every sibling file (other hashes, key sizes) as executed.
        runner = bucket is not None and schema in IMPLEMENTED_SCHEMAS
        vendored = (ROOT / "src" / "data" / "acvp" / f"wycheproof_{p.name}").exists()
        executed = runner and vendored
        rec = {
            "upstreamPath": f"testvectors_v1/{p.name}",
            "algorithm": doc.get("algorithm"),
            "schema": schema,
            "cases": n,
            "byResult": counts,
            "bucket": bucket,
            "state": "vendored-and-executed"
            if executed
            else (
                "in-scope-not-vendored"
                if runner
                else ("in-scope-runner-missing" if bucket else "out-of-scope")
            ),
        }
        if runner and not executed:
            rec["reason"] = (
                f"a runner for schema {schema} exists, but this file is not vendored: scope is "
                "chosen per file (2026-09-26 maintainer ruling vendored only "
                "rsa_pss_2048_sha256_mgf1_32 for RSA-PSS). Not executed, not claimed."
            )
        elif bucket and not executed:
            rec["reason"] = (
                f"F4: no runner in this tree executes Wycheproof schema {schema}; vendoring it "
                "would create an orphaned vector file (check-vector-reachability.ts fails those)"
            )
        elif reason:
            rec["reason"] = reason
        kept_counts = counts
        if executed:
            rec["localPath"] = f"src/data/acvp/wycheproof_{p.name}"
            _, excl = apply_exclusions(p.name, doc)
            if excl:
                ex = {"valid": 0, "invalid": 0, "acceptable": 0}
                for c in excl["cases"]:
                    ex[str(c["result"])] += 1
                kept_counts = {k: counts[k] - ex[k] for k in counts}
                rec["vendoredCases"] = sum(kept_counts.values())
                rec["excluded"] = {
                    "cases": excl["count"],
                    "byResult": ex,
                    "rules": sorted(excl["rules"]),
                    "reason": "declared subset — see the file's _provenance.excluded_cases and "
                    "EXCLUSIONS in scripts/acvp/vendor_wycheproof.py",
                }
        files.append(rec)
        totals["upstream"]["files"] += 1
        totals["upstream"]["cases"] += n
        if bucket:
            totals["inScope"]["files"] += 1
            totals["inScope"]["cases"] += n
            totals["inScope"]["invalid"] += counts["invalid"]
            k = "vendored" if executed else ("inScopeNotVendored" if runner else "inScopeRunnerMissing")
            totals[k]["files"] += 1
            totals[k]["cases"] += sum(kept_counts.values())
            totals[k]["invalid"] += kept_counts["invalid"]
            if executed:
                totals["vendored"]["acceptable"] += kept_counts["acceptable"]
                if "excluded" in rec:
                    x = rec["excluded"]
                    totals["vendoredExcluded"]["files"] += 1
                    totals["vendoredExcluded"]["cases"] += x["cases"]
                    totals["vendoredExcluded"]["valid"] += x["byResult"]["valid"]
                    totals["vendoredExcluded"]["invalid"] += x["byResult"]["invalid"]
        else:
            totals["outOfScope"]["files"] += 1
            totals["outOfScope"]["cases"] += n
    return {
        "_provenance": {
            "producer": "Project Wycheproof, maintained by Google / C2SP",
            "attribution": "Project Wycheproof, maintained by Google / C2SP — "
            "https://github.com/C2SP/wycheproof (Apache-2.0, see src/data/acvp/WYCHEPROOF-LICENSE.txt)",
            "source_repo": "https://github.com/C2SP/wycheproof",
            "source_commit": PIN_COMMIT,
            "retrieved": "2026-09-26",
            "evidence_class": "independent-oracle",
            "scope_rule": "WYC-SCOPE-1, filters F1-F4 — see scripts/acvp/vendor_wycheproof.py",
            "generator": "python3 scripts/acvp/wycheproof_scope_census.py --clone <clone>",
            "why_this_file_exists": "So that 'we support Wycheproof completely' is a checkable claim: "
            "every one of the 343 upstream files is accounted for here as vendored-and-executed, "
            "in-scope-not-vendored (a runner exists for its schema but the file was not chosen), "
            "vendored with a declared exclusion (vendoredCases + excluded, every excluded case counted), "
            "in-scope-runner-missing (with its case count, so the gap is a number) or out-of-scope "
            "(with the filter that excluded it).",
        },
        "totals": totals,
        "files": files,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clone", required=True)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    census = build(pathlib.Path(args.clone).resolve())
    text = json.dumps(census, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not OUT.exists() or json.loads(OUT.read_text(encoding="utf-8")) != census:
            print(f"FAIL {OUT.name} is stale — re-run without --check", file=sys.stderr)
            return 1
        print(f"OK   {OUT.name} matches the pinned clone")
        return 0
    OUT.write_text(text, encoding="utf-8")
    t = census["totals"]
    print(
        f"wrote {OUT.name}: upstream {t['upstream']['files']} files / {t['upstream']['cases']} cases; "
        f"in scope {t['inScope']['files']}/{t['inScope']['cases']}; "
        f"vendored+executed {t['vendored']['files']}/{t['vendored']['cases']} "
        f"({t['vendored']['invalid']} invalid, {t['vendored']['acceptable']} acceptable; "
        f"{t['vendoredExcluded']['cases']} excluded by declared rule from {t['vendoredExcluded']['files']} files); "
        f"in-scope runner missing {t['inScopeRunnerMissing']['files']}/{t['inScopeRunnerMissing']['cases']} "
        f"({t['inScopeRunnerMissing']['invalid']} invalid); "
        f"out of scope {t['outOfScope']['files']}/{t['outOfScope']['cases']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
