### 2026-10-16-id3-x86-vm-mx95pro-kmip-r3

Server: ; 12 cores, 12.2 GiB, Linux 6.12.111+deb13-cloud-amd64 x86_64. Token: KMIP server (PQCTODAY_FHE_1_0), reached from the Mac. Client: container on the Mac. Result: PASS. Batch 32768 customers, 1 worker(s).

| Measurement | Value |
|---|---|
| Customers in the request | 32,768 (6,000 held-out rows, repeated) |
| Request: 23 ciphertexts of 8,388,632 bytes | 192,938,536 bytes (184.0 MiB) |
| **Server time, first batch** | **325 ms** (weighted sum and t 51, t^2 89, t^3 26, a t 12, final add 0, total 325) |
| Client: encrypt the batch (on the Mac) / upload until accepted / wait / download | 6.3 s / 1.66 s / 0.41 s / 26 ms |
| **Server time per batch, 3 repetitions** (each / median) | **321 / 302 / 295 ms** / 302 ms |
| Upload until accepted, repetitions (each) | 1657 / 1649 / 1649 ms |
| Whole cycle per request (upload, queue, run, download), mean | 2001 ms (1,799 requests per hour; bounded by the server's run time alone: 11,777) |
| Four requests submitted together (2 uploads at a time) | 7215 ms wall, 1,996 per hour; run times 282 / 283 / 281 / 318 ms |
| Server wall time over all 8 jobs of the run (min / median / max) | 280 / 301 / 325 ms |
| Server CPU time of the evaluating thread, same jobs (min / median / max) | 279 / 297 / 321 ms |
| Key admission (token-signed manifest, public key, relinearization key; server verify / assemble / Mac client wall) | 40 / 99 / 1093 ms |
| **Server peak resident set** (/proc VmHWM / the service's own figure / Go heap in use at the end) | **1178 MiB** / 1178 MiB / 1093 MiB |
| Token: key-set export (registry ID 3, 1,201 bounded calls, 4.41 GB generated) | 197 s on the token (22.4 MB/s), token peak resident set not measured (KMIP service) |
| Token stream to the Mac (all frames hashed; 30 files / 94 MB stored) | 197 s (22.4 MB/s), manifest mismatches 0 / 0 |
| Token init / export wall time / decrypt of the score | 0 s / 197 s / released 524292 B in 0.176 s (wall 0.231 s over KMIP) |
| Total wall time of the run | 240 s |

| Accuracy | Value |
|---|---|
| Released score vs plaintext cubic, 6,000 held-out rows | max error 4.77e-07 = **21.00 bits**, mean 2.4e-07 |
| Same, all 32,768 slots of the batch | max 4.77e-07 = 21.00 bits |
| Released score vs exact sigmoid | max 0.104 = **3.27 bits**, mean 0.00623 |
| Plaintext cubic vs exact sigmoid (the model's approximation) | max 0.104 = 3.27 bits, mean 0.00623 |
| Release rounding step (token policy) | 2^-20 = 9.54e-07 |
| Decision agreement at 0.5 / 0.25, released vs plaintext cubic | 100.000 % / 100.000 % |
| Decision agreement at 0.5, released vs exact sigmoid / plaintext cubic vs exact sigmoid | 99.03 % / 99.03 % |
| AUC on the held-out rows: encrypted / plaintext cubic / exact sigmoid | 0.717298 / 0.717299 / 0.717299 |
| Imaginary parts of the released slots | max 0 |
