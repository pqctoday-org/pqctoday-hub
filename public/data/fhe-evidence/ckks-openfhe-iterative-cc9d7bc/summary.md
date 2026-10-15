Runs: 4 with OpenFHE's own keys, 4 with the token's keys (each run: new encryption randomness; own keys: new key generation).

OpenFHE decrypts (own keys: own secret; token keys: the test seed's secret, diagnostic). Precision in bits, mean (min to max):

| stage | numIterations | precision arg | own keys | token's keys | levels left | own s | token s |
|---|---|---|---|---|---|---|---|
| boot1 | 1 | - | 13.20 (13.13 to 13.36) | 13.22 (13.13 to 13.32) | 8 | 3.237 | 3.186 |
| boot2_p2 | 2 | 2 | 15.02 (14.68 to 15.30) | 15.26 (15.13 to 15.31) | 7 | 6.432 | 6.068 |
| boot2_p4 | 2 | 4 | 17.08 (16.96 to 17.13) | 17.28 (17.11 to 17.47) | 7 | 6.158 | 5.946 |
| boot2_p6 | 2 | 6 | 19.21 (19.12 to 19.26) | 19.15 (19.03 to 19.26) | 7 | 6.170 | 5.908 |
| boot2_p8 | 2 | 8 | 21.18 (21.00 to 21.33) | 21.07 (20.69 to 21.36) | 7 | 6.081 | 5.807 |
| boot2_p10 | 2 | 10 | 23.17 (22.96 to 23.38) | 23.06 (22.91 to 23.17) | 7 | 6.124 | 5.953 |
| boot2_p11 | 2 | 11 | 24.22 (24.00 to 24.39) | 24.06 (23.90 to 24.22) | 7 | 7.683 | 6.204 |
| boot2_p12 | 2 | 12 | 25.16 (25.01 to 25.30) | 25.23 (25.10 to 25.45) | 7 | 6.882 | 6.411 |
| boot2_p13 | 2 | 13 | 26.18 (25.86 to 26.36) | 26.20 (26.18 to 26.25) | 7 | 6.252 | 6.404 |
| boot2_p14 | 2 | 14 | 27.22 (27.15 to 27.32) | 27.39 (27.34 to 27.44) | 7 | 6.099 | 6.217 |
| boot2_p15 | 2 | 15 | 28.07 (27.93 to 28.34) | 28.30 (28.17 to 28.41) | 7 | 6.246 | 6.136 |
| boot1_warm | 1 | - | 13.20 (13.13 to 13.36) | 13.22 (13.13 to 13.32) | 8 | 3.038 | 3.174 |
| boot1_mult | 1 | - | 13.27 (12.99 to 13.44) | 13.36 (13.16 to 13.46) | 7 | 0.028 | 0.022 |
| boot2_p8_mult | 2 | 8 | 21.25 (21.19 to 21.33) | 21.20 (21.15 to 21.33) | 6 | 0.022 | 0.022 |

Through the token's owner release (rounding 2^-30), mean over the runs (min to max): as released, and after multiplying the release by 2^52 / (the ciphertext's true scale):

| stage | as released | scale-corrected |
|---|---|---|
| boot1 | 13.22 (13.13 to 13.32) | 13.22 (13.13 to 13.32) |
| boot2_p2 | 15.26 (15.13 to 15.31) | 15.26 (15.13 to 15.31) |
| boot2_p4 | 17.28 (17.11 to 17.46) | 17.28 (17.11 to 17.47) |
| boot2_p6 | 19.15 (19.03 to 19.26) | 19.15 (19.03 to 19.26) |
| boot2_p8 | 21.07 (20.69 to 21.35) | 21.07 (20.69 to 21.36) |
| boot2_p10 | 23.07 (22.98 to 23.20) | 23.06 (22.91 to 23.17) |
| boot2_p11 | 24.09 (24.01 to 24.21) | 24.06 (23.89 to 24.22) |
| boot2_p12 | 25.04 (24.84 to 25.22) | 25.25 (25.10 to 25.46) |
| boot2_p13 | 25.79 (25.70 to 25.88) | 26.19 (26.13 to 26.27) |
| boot2_p14 | 26.37 (26.28 to 26.43) | 27.34 (27.31 to 27.37) |
| boot2_p15 | 26.71 (26.65 to 26.75) | 28.20 (28.05 to 28.31) |
| boot1_warm | 13.22 (13.13 to 13.32) | 13.22 (13.13 to 13.32) |
| boot1_mult | 13.36 (13.15 to 13.46) | 13.36 (13.16 to 13.46) |
| boot2_p8_mult | 21.21 (21.15 to 21.32) | 21.20 (21.15 to 21.32) |

Peak memory of the OpenFHE process (GiB): own keys 16.6, token's keys 16.6.
