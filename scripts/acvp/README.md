# `scripts/acvp/` — the scripts behind the vector manifest's verification claims

`src/data/validation/vector-manifest.json` records, for every vector file in
`src/data/acvp`, how that file's provenance was verified. Some of those records name a
tool. Until these scripts existed, none of the named tools was in the repository, so the
`source.verification.method` and `_provenance.construction_note` text was an
unreproducible self-assertion. This directory makes each cited method runnable.

Nothing here reads `src/services`, `src/wasm` or any other hub implementation. Every check
either moves bytes from the pinned upstream file or recomputes a value from the published
specification with the Python standard library (plus `cryptography` for AES/CMAC). That
independence is the point: a check satisfied by our own code agreeing with itself would
verify nothing.

## What is cited, and which script is it

| Manifest / file text                                                                                                                                                                                                                              | Script                         | npm                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------ |
| `source.verification.method`: "every local case was produced by a **byte-copying subset script** and re-compared field-by-field with the upstream case of the same tcId" (11 entries), and the same wording in the plural for `sha_mct_full_test` | `subset_reproduce.py`          | `npm run acvp:subset-reproduce`      |
| `source.verification.method`: "every field of every local case equals the upstream case with the same tcId **after the renames/normalizations recorded in lineage**" (36 entries) — same mechanism, so the same script covers it                  | `subset_reproduce.py`          | `npm run acvp:subset-reproduce`      |
| `hkdf_acvp_test.json` `_provenance.construction_note`: "checked against all 1000 single-expansion upstream cases with an **independent HKDF (Python hashlib/hmac)** … 1000/1000 dispositions reproduced"                                          | `crosscheck_hkdf_fixedinfo.py` | `npm run acvp:crosscheck:hkdf`       |
| `kbkdf_acvp_test.json` `_provenance.construction_note`: "checked with an **independent SP 800-108 implementation (Python hmac/cryptography CMAC)** against every byte-aligned upstream case of the executed macModes (4680 cases…)"               | `crosscheck_kbkdf_segments.py` | `npm run acvp:crosscheck:kbkdf`      |
| `sha_mct_full_test.json` `_provenance.construction_note`: "Both MCT versions were reproduced for all 100 outer iterations of all 10 upstream cases **with Python hashlib**"                                                                       | `crosscheck_sha_mct.py`        | `npm run acvp:crosscheck:sha-mct`    |
| `aescbc_mct_full_test.json` `_provenance.construction_note`: "The AESAVS 6.4 outer loop … reproduced for all 100 outer iterations of the six upstream cases **with an independent AES (Python cryptography)**"                                    | `crosscheck_aescbc_mct.py`     | `npm run acvp:crosscheck:aescbc-mct` |

`npm run acvp:crosschecks` runs all four cross-checks.

Two citations in the manifest are **not** covered here, deliberately:

- `scripts/regen-composite-kat.ts`, named in `composite-sigs-jose-kat`'s
  `source.generator`. It is a one-shot generator of PQC Today's own output from all-zero
  seeds, not a verification of an external source, and the manifest already flags its
  absence itself (`publishabilityGaps: ["generator-script-not-in-repo"]`). Writing a
  replacement would not make the file's values externally checkable.
- `jose-pqc-kem-jwe-kat`'s `source.generator` ("Node 24 one-shot …"), which names no file
  at all. Same reason.

## Recording a source check as the review — `record-source-checks.ts`

Maintainer decision, 2026-09-26: NIST and Google (Project Wycheproof) are trusted
sources, and for them an automated match against the pinned upstream counts as the
review. No person's sign-off is needed. `npm run acvp:source-check -- --wycheproof-clone <clone>`
runs `subset_reproduce.py --all --strict` and `vendor_wycheproof.py --check`. For
every eligible file that fully matches, it writes
`src/data/validation/reviews/<id>.source-check.json`, bound to the manifest entry's
hash and the file's bytes. A file that fails gets no record, and any old record for
it is deleted.

`audit:validation-manifest` and `gen:release-evidence` accept a current record as
the review (status `source-verified`). They reject one written for older bytes.
Only `sourceCheckEligible` sources qualify (NIST ACVP-Server, and Wycheproof pinned
to a full commit). Oracle output we generated ourselves, published-document
transcriptions and self-pinned snapshots still need named reviewers. A named
review record, if one exists, always takes precedence.

Re-run it after any change to a vector file or its manifest entry: the old record
goes stale and the audit fails until it is refreshed.

## How the two halves fit together

The cross-checks recompute expected values from the **upstream** file, not from the
committed vector file. That is the right target because `subset_reproduce.py` separately
proves that the committed file's cases are byte-for-byte the upstream cases. Run together,
the two give a full chain: upstream file → digest-pinned → byte-copied into our file, and
upstream expected values → independently recomputed from the specification.

## The subset script

```
python3 scripts/acvp/subset_reproduce.py --all              # all 48 nist-acvp-server entries
python3 scripts/acvp/subset_reproduce.py --id aescbc_acvp_test --emit /tmp/out
python3 scripts/acvp/subset_reproduce.py --all --offline    # cache only, no network
python3 scripts/acvp/subset_reproduce.py --all --strict     # undeclared changes fail too
```

Per entry it hashes the committed file against the manifest `sha256`, fetches every
declared upstream path at the pinned commit and refuses any file whose SHA-256 is not the
recorded one, then walks the manifest's own `cases[]` — each of which gives a JSON pointer
into the local file plus the `upstream.tgId` / `upstream.tcId` it came from — applies only
the transformations that case's `lineage[].transformations[]` declare (`field-rename`,
`field-drop`, `field-add`, `value-normalize`, `renumber`), byte-copies every remaining
retained field from upstream, and diffs the result against the committed file.

Upstream files are cached under `tmp/acvp-upstream-cache/` (gitignored), keyed by commit
and path, and re-verified against the recorded digest on every reuse.

Three classes of finding:

- **mismatch** — a committed value is not the upstream value, a declared tcId is absent
  upstream, or the committed digest does not match the manifest. Always a failure.
- **undeclared normalization** — the bytes differ only by something the lineage does not
  record (a hex-case change, a local field with no `field-add`). A warning by default, a
  failure under `--strict`; the verdict prints as `MATCH*`.
- **skip** — the entry is not `nist-acvp-server`, or a case is declared
  `locally-generated` / `derived-within-file` and so has no upstream case to copy.

### Proving it can fail

Copy a vector file to a scratch directory, change one nibble in the copy, and point the
script at the copy. Never perturb a file under `src/data/acvp`.

```
mkdir -p /tmp/sabotage && cp src/data/acvp/aescbc_acvp_test.json /tmp/sabotage/
# flip the last nibble of testGroups[0].tests[0].ct in the COPY
python3 scripts/acvp/subset_reproduce.py --id aescbc_acvp_test \
    --vector-file /tmp/sabotage/aescbc_acvp_test.json
```

reports, and exits 1:

```
[MISMATCH] aescbc_acvp_test  (/tmp/sabotage/aescbc_acvp_test.json)
  committed digest vs manifest sha256: DIFFERS
  ! aescbc_acvp_test/testGroups/0/tests/0/ct: committed "…5ED3D600" != upstream "…5ED3D601"
  -          "ct": "459264F4798F6A78BACB89C15ED3D600"
  +          "ct": "459264F4798F6A78BACB89C15ED3D601"
```

## Requirements

Python 3.11+ and `cryptography` (for the AES and CMAC primitives in
`crosscheck_aescbc_mct.py` and `crosscheck_kbkdf_segments.py`). Everything else is stdlib.
Network access to `raw.githubusercontent.com` on the first run; `--offline` afterwards.

These are not wired into `gate:data` — they reach the network and the ACVP-Server
projections are large. Run them when the manifest's provenance records change.
