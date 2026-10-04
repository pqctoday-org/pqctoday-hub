# Image provenance: K26 CACP image 20261004145201

This is the board image the FHE service was installed in for the run `kv260-service-installed-sw-40114ab`.

| Item | Value |
|---|---|
| Image | CACP K26 image, AMD Embedded Development Framework 26.06 (Scarthgap), machine `k26-smk-kv-sdt-multidomain`, build `20261004145201`, exported 2026-10-04T14:57:13Z |
| Compressed image (`.wic.zst`) sha256 | `f212ce677fc80ec38c9268e5d895d433c39a58d9fc0e428a2e6d536658b6fb33` (this is the `wic_sha256` field of the bundle's build metadata) |
| Raw image (`.wic`) | 2,025,913,344 bytes, sha256 `472b6f54f6a0895c8392bfda13796e8b7071cb2f9a8d8ba6f1e50172e039eaed` |
| HSM source | pqctoday-hsm `1e797dd743087a42273cb3520bf69595507ec93a` |
| FHE service source | pqctoday-fhe `609aa42297458233be4bebab381f76a17a5c411f` (PR #21, merged as `cd2271ce5fc24975ef6645241d5908e377776b11`); locks `cc` 1.4.4, `aws-lc-rs` 1.18.0, `aws-lc-sys` 0.44.0; TFHE-rs 1.8.1 (`187fc0b95ab35352422deec6c027d0bd8743b6db`) |
| FHE service binary in the image | `/usr/bin/kv260-fhe-server`, 10,040,640 bytes, sha256 `0a7cc68f4357cad99b0496ed9536c623331f396b075bae2448107c36859e3501`; the file on the running board has the same hash (`installed-unit.txt`) |
| Recipe and build inputs | pqctoday-cacp base `e83de52253eb753687f3870fc8cb2fedfaef2875`, plus the two files of pqctoday-cacp PR #53 (head `aa4e0f319b59e7b71c88e4d4af5ca150af4bcff2`, merged as `c291fa88d3e014b3a6400f14e6421f8306e8a8cd`): the FHE source pin and the regenerated `crates.inc` |
| FPGA profiles in the image | `hashsig` (default) bitstream sha256 `619571de6fc69f8febaaec8cf4cb92c8b95fab03693022fc0b4773ba34c44fde`; `mldsa` `92490c8b0a3f9243ecfc8c9b4cf51cbdc2306da69da236e11f7ec1c30e43402e` |
| Service limits baked in | MemoryHigh and MemoryMax 3 GiB, no swap, CPUs 1 to 3, CPU weight 800 |

## The build ran from a local commit

The image was built from a local commit of pqctoday-cacp, `bb639f7ea60e3822442e2734708379e5504549eb` (one commit on top of `e83de522`), which the bundle's build metadata records as `cacp_git_revision`. That commit was never published. The published commit `aa4e0f319b59e7b71c88e4d4af5ca150af4bcff2` (PR #53) differs from it in one file, `meta-pqc-hsm/conf/pqctoday-fhe-src.inc`: the `nobranch=1` flag was removed from the FHE source URI, and one comment was reworded. The pinned source commit (`609aa422`) and the regenerated `crates.inc` are identical in both. After the change, a forced re-fetch of the FHE source for this image succeeded without the flag.

## Written to the card and verified

The image was written to a microSD card and the card was read back against the image: partition table at the start and end, root filesystem byte for byte, and every boot file by content all matched. The board then booted from the card, and its model, card serial and service binary hash were read over SSH and match.
