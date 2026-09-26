#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Build the src/data/validation/vector-manifest.json entries for the vendored
Project Wycheproof files (see scripts/acvp/vendor_wycheproof.py for the scope
rule WYC-SCOPE-1 and the attribution requirements).

Every case of every vendored file is registered, because
scripts/audit-validation-manifest.ts fails on an UNREGISTERED_CASE and a
partially registered file would silently claim less coverage than it executes.

`expectation` mapping — deliberate and documented, never overstating:
  Wycheproof valid       -> positive
  Wycheproof invalid     -> negative   (real reject-path coverage)
  Wycheproof acceptable  -> positive + a per-case note. Upstream states either
                            outcome is defensible, so counting these as
                            `negative` would inflate reject-path coverage with
                            cases the engine is ALLOWED to accept. They are
                            registered positive so they can never be read as
                            assurance we do not have; the executed row still
                            asserts "refused OR exactly the upstream value".

Usage:
  python3 scripts/acvp/wycheproof_manifest_entries.py            # write
  python3 scripts/acvp/wycheproof_manifest_entries.py --print    # stdout only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
ACVP = ROOT / "src" / "data" / "acvp"
MANIFEST = ROOT / "src" / "data" / "validation" / "vector-manifest.json"

COMMIT = "3fa63dd0344abb611f1fb1d77e119938603ea230"
REPO = "https://github.com/C2SP/wycheproof"
RETRIEVED = "2026-09-26"
ATTRIB = "Project Wycheproof, maintained by Google / C2SP"
LICENSE_NOTE = (
    "Apache License 2.0. Project Wycheproof, maintained by Google / C2SP "
    f"({REPO}), LICENSE at the pinned commit {COMMIT[:8]} vendored verbatim to "
    "src/data/acvp/WYCHEPROOF-LICENSE.txt. Apache-2.0 is a permissive licence "
    "compatible with redistribution inside this GPL-3.0-only tree; the vendored "
    "files keep their upstream content and carry the required attribution in "
    "their own `_provenance` block. NOT a standards publication: Google/C2SP is "
    "not a standards body, so these values are independent-oracle evidence, "
    "never a conformance claim."
)
VERIFY_METHOD = (
    "Cloned C2SP/wycheproof at the pinned commit, verified `git rev-parse HEAD` equals "
    f"{COMMIT}, and recorded the sha256 of each upstream testvectors_v1 file. Each local "
    "file is that upstream file byte-for-byte with ONE added top-level `_provenance` key: "
    "no testGroup, test, tcId, flag, result or hex value is changed, dropped, renumbered or "
    "re-derived. `python3 scripts/acvp/vendor_wycheproof.py --clone <clone> --check` "
    "re-verifies both the upstream sha256 and the byte-equality of the local file."
)

# local file stem -> (upstream name, upstream sha256, operation, local op, algorithm name)
FILES = {
    "wycheproof_x25519_test": ("x25519_test.json", "derive", "derive", "XDH (X25519)"),
    "wycheproof_x448_test": ("x448_test.json", "derive", "derive", "XDH (X448)"),
    "wycheproof_ed25519_test": ("ed25519_test.json", "sigVer", "sigVer", "EDDSA (Ed25519)"),
    "wycheproof_ed448_test": ("ed448_test.json", "sigVer", "sigVer", "EDDSA (Ed448)"),
    "wycheproof_aes_wrap_test": ("aes_wrap_test.json", "decrypt", "unwrap", "AES-WRAP"),
    "wycheproof_aes_kwp_test": ("aes_kwp_test.json", "decrypt", "unwrap", "AES-KWP"),
}

# The caseRecord schema has no free-text field, so the `acceptable` policy is
# machine-readable on every case as parameters.wycheproofResult and stated once
# per file in `notes` (below) and in the file's own `_provenance.result_policy`.
ACCEPTABLE_NOTE = (
    "Cases with parameters.wycheproofResult = 'acceptable' (Wycheproof states refusing them and "
    "accepting them are both defensible) are registered expectation=positive so they can NEVER be "
    "read as reject-path coverage we do not have; the executed row still asserts 'refused OR exactly "
    "the upstream value', and a third answer fails."
)

# Playground scenario fixtures that carry the same published RFC 3394 §4.6 KAT
# value as one Wycheproof case (upstream comment: "RFC 3394"). Neither copies the
# other — both carry the RFC's value — but the manifest's copy gate wants the
# relationship declared.
RFC3394_COPY_PATHS = [
    "kat/DatabaseEncryptionPQC/DatabaseMigrationReadiness/step_1_execution.json",
    "kat/DatabaseEncryptionPQC/TDEMigrationPlanner/step_1_algorithm_selection.json",
    "kat/KmsPqc/KeyHierarchyDesigner/step_1_execution.json",
    "kat/KmsPqc/KmsRotationPlanner/step_1_algorithm_selection.json",
]
RFC3394_CASE = "wycheproof_aes_wrap_test#/testGroups/2/tests/67"


def params_for(stem: str, group: dict, test: dict) -> dict:
    flags = ",".join(test.get("flags", [])) or "none"
    p: dict[str, object] = {"wycheproofResult": test["result"], "flags": flags}
    if stem.startswith("wycheproof_x"):
        p["curve"] = "X25519" if "x25519" in stem else "X448"
    elif stem.startswith("wycheproof_ed"):
        p["curve"] = "Ed25519" if "ed25519" in stem else "Ed448"
        p["msgBytes"] = len(test.get("msg", "")) // 2
    else:
        p["mode"] = "KWP" if "kwp" in stem else "KW"
        p["keyLen"] = group["keySize"]
        p["wrappedBytes"] = len(test.get("ct", "")) // 2
    return p


def entry(stem: str) -> dict:
    upstream_name, operation, local_op, alg = FILES[stem]
    path = ACVP / f"{stem}.json"
    raw = path.read_bytes()
    doc = json.loads(raw)
    prov = doc["_provenance"]
    upstream_path = f"testvectors_v1/{upstream_name}"
    url = f"https://raw.githubusercontent.com/C2SP/wycheproof/{COMMIT}/{upstream_path}"
    lineage_id = stem.replace("_", "-") + "-1"

    containers, cases = [], []
    for gi, g in enumerate(doc["testGroups"]):
        containers.append({"pointer": f"/testGroups/{gi}/tests", "kind": "array"})
        for ti, t in enumerate(g.get("tests", [])):
            pointer = f"/testGroups/{gi}/tests/{ti}"
            res = t["result"]
            c: dict[str, object] = {
                "caseId": f"{stem}#{pointer}",
                "pointer": pointer,
                "algorithm": {"name": alg, "revision": None},
                "operation": operation,
                "parameters": params_for(stem, g, t),
                "testType": g["type"],
                "expectation": "negative" if res == "invalid" else "positive",
                "upstream": {
                    "tgId": gi + 1,
                    "tcId": t["tcId"],
                    "label": (t.get("comment") or "").strip() or ",".join(t.get("flags", [])),
                },
                "lineage": [lineage_id],
            }
            cases.append(c)

    return {
        "id": stem,
        "path": f"src/data/acvp/{stem}.json",
        "sha256": hashlib.sha256(raw).hexdigest(),
        "status": "active",
        "evidenceClass": "independent-oracle",
        "source": {
            "kind": "oracle-generated",
            "citation": f"{ATTRIB} — {upstream_path} @ {COMMIT[:8]} ({REPO}), Apache-2.0",
            "url": url,
            "revision": COMMIT,
            "generator": "python3 scripts/acvp/vendor_wycheproof.py --clone <clone of C2SP/wycheproof "
            f"at {COMMIT[:8]}>  (re-verify: same command with --check); manifest entries: "
            "python3 scripts/acvp/wycheproof_manifest_entries.py",
            "oracle": {
                "name": f"{ATTRIB} — adversarial test-vector corpus",
                "version": COMMIT,
            },
            "verification": {
                "date": RETRIEVED,
                "method": VERIFY_METHOD,
                "result": "match",
                "evidence": [
                    {
                        "title": f"C2SP/wycheproof {upstream_path} @ {COMMIT[:8]}",
                        "url": url,
                        "sha256": prov["source_sha256"],
                        "retrieved": RETRIEVED,
                    },
                    {
                        "title": "C2SP/wycheproof LICENSE (Apache-2.0) at the pinned commit",
                        "url": f"https://raw.githubusercontent.com/C2SP/wycheproof/{COMMIT}/LICENSE",
                        "retrieved": RETRIEVED,
                        "mirror": True,
                        "localCopy": "src/data/acvp/WYCHEPROOF-LICENSE.txt",
                    },
                ],
            },
        },
        "license": {"note": LICENSE_NOTE, "reviewed": True},
        "caseContainers": containers,
        "cases": cases,
        "lineage": [
            {
                "id": lineage_id,
                "appliesTo": [c["caseId"] for c in cases],
                "upstreamOperation": prov["upstream_operation"],
                "localOperation": prov["local_operation"],
                "transformations": [
                    {
                        "type": "field-add",
                        "detail": "ONE top-level `_provenance` key added (attribution, pinned commit, "
                        "upstream path + sha256, Apache-2.0 licence, evidence class and result policy). "
                        "Everything else is the pinned upstream file byte-for-byte: no case dropped, "
                        "no tcId renumbered, no value re-derived or normalized.",
                    }
                ],
            }
        ],
        "copies": [
            {
                "path": p,
                "kind": "shared-upstream-value",
                "cases": [RFC3394_CASE],
                "fields": ["ct"],
                "note": "Both carry the published RFC 3394 §4.6 KAT ciphertext (this Wycheproof case's own "
                "comment is \"RFC 3394\"); the playground scenario fixture does not copy the Wycheproof "
                "file and the Wycheproof file does not copy it.",
            }
            for p in (RFC3394_COPY_PATHS if stem == "wycheproof_aes_wrap_test" else [])
        ],
        "publishabilityGaps": [],
        "notes": "Scope rule WYC-SCOPE-1 (scripts/acvp/vendor_wycheproof.py): vendored because a runner "
        "executes every case of this file against both engines. Reject-path evidence NIST does not "
        "publish. " + ACCEPTABLE_NOTE,
    }


def main() -> int:
    entries = [entry(s) for s in FILES]
    if "--print" in sys.argv:
        print(json.dumps(entries, indent=2))
        return 0
    # TEXT splice, not a json round-trip: re-serialising the whole manifest
    # reflows every pre-existing entry (expanded objects collapse, — escapes
    # become literal em dashes) and buries 6 new entries in 1200 lines of
    # cosmetic churn on a file other sessions are editing. Run
    # `npx prettier --write` on the result.
    text = MANIFEST.read_text(encoding="utf-8")
    assert text.endswith("\n  ]\n}\n"), "manifest tail is not the expected `files` array close"
    if any(f'"id": "{s}"' in text for s in FILES):
        print("Wycheproof entries are already present; remove them first", file=sys.stderr)
        return 1
    body = text[: -len("\n  ]\n}\n")]
    chunks = [
        "\n".join("    " + ln for ln in json.dumps(e, indent=2, ensure_ascii=False).split("\n"))
        for e in entries
    ]
    MANIFEST.write_text(body + ",\n" + ",\n".join(chunks) + "\n  ]\n}\n", encoding="utf-8")
    man = json.loads(MANIFEST.read_text(encoding="utf-8"))
    total = sum(len(e["cases"]) for e in entries)
    neg = sum(1 for e in entries for c in e["cases"] if c["expectation"] == "negative")
    acc = sum(
        1
        for e in entries
        for c in e["cases"]
        if c["parameters"].get("wycheproofResult") == "acceptable"
    )
    print(
        f"wrote {len(entries)} Wycheproof entries, {total} cases "
        f"({neg} negative, {acc} acceptable-registered-positive) into {MANIFEST.name}; "
        f"manifest now holds {len(man['files'])} files"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
