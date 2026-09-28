# ACVP cross-target evidence — run 2026-09-24b

This run repeats [run 2026-09-24](../2026-09-24/README.md) with the **current** plan and
formats. It is frozen the same way. Run 2026-09-24 is unchanged and still replays under the
formats it was produced with.

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.

## What changed since 2026-09-24

- **Plan:** WS-F now dispatches the ML-DSA `internal` + `externalMu: true` groups (45 cases)
  to the **vendor-defined** pqctoday-hsm mechanism `CKM_ML_DSA_EXTERNAL_MU` (`0x0000403c`).
  This mechanism is not part of PKCS#11 v3.2. The calls are `C_VerifyInit` followed by
  `C_Verify(mu, sig)`. ML-DSA now has 127 answered and 53 unsupported cases; before it had
  82 answered and 98 unsupported.
- **Evidence format:** `pqctoday.acvp-evidence/2`. It adds a mechanism and mechanism kind to
  each case, plus a `vendorDefinedMechanisms` list. The native runner writes
  `codePath: "native"`.
- **Comparator policy:** `pqctoday.acvp-comparator-policy/2`, declared in `targets.json`.
  It adds `ml-dsa.verify-external-mu` with a byte-equal comparison.
- **ML-DSA bundle manifest:** SHA-256 `966ec2faeba6d85fe862b3bead4f0aebf47b784cecd472c2e5fb3a30905f444f`.
  The ML-KEM bundle is unchanged at `d2ea5cd4…`.

## Engines

The engines are the same artifacts as in run 2026-09-24:

- WASM: `2187f9a8…` (C++, hsm `7795799b`) and `a4582ff0…` (Rust, hsm `417c47a2`).
- Linux Arm64: `ba5d00ac…` (C++) and `e3cf1bd4…` (Rust). Both were built for 2026-09-24,
  and those builds are bit-reproducible. Each binary was kept outside the container and
  re-staged with `run-in-container.sh --module-from-host`.
- Linux x86-64: the same sandbox-image engines as 2026-09-24. They still run under
  Rosetta 2 and are **still non-publishable**, because their source commit is unknown.

## Replay

```bash
npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-24b --bundle-dir /tmp/acvp-bundles --verify-bundles-only
npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/2026-09-24b --check
```

The native re-execution steps are the ones in the 2026-09-24 README.

## Result

Every run target passes 157 of 157 executable cases byte-equal:

- 30 ML-KEM decapsulations
- 82 ML-DSA external-interface verifications
- 45 ML-DSA externalMu verifications through the vendor mechanism

The other 188 cases are unsupported, each with a declared reason. No case failed and none
was `not comparable`, so there are no divergences.
