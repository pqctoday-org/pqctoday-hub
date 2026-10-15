### 2026-10-15-id3-mx95pro-server

Server: NXP FRDM-IMX95-PRO; 6 cores, 15.4 GiB, Linux 6.18.20-2.0.0-gb096ce610e95 aarch64. Token: NXP FRDM-IMX95. Client: container on the Mac. Result: PASS. Batch 32768 customers, 1 worker(s).

| Measurement | Value |
|---|---|
| Customers in the request | 32,768 (6,000 held-out rows, repeated) |
| Request: 23 ciphertexts of 8,388,632 bytes | 192,938,536 bytes (184.0 MiB) |
| **Server time, first batch** | **4195 ms** (weighted sum and t 755, t^2 836, t^3 505, a t 236, final add 2, total 4193) |
| Client: encrypt the batch (on the Mac) / upload until accepted / wait / download | 3.6 s / 1.67 s / 4.37 s / 37 ms |
| **Server time per batch, 3 repetitions** (each / median) | **4297 / 4278 / 4288 ms** / 4288 ms |
| Upload until accepted, repetitions (each) | 1670 / 1660 / 1657 ms |
| Whole cycle per request (upload, queue, run, download), mean | 6004 ms (600 requests per hour; bounded by the server's run time alone: 840) |
| Four requests submitted together (2 uploads at a time) | 20667 ms wall, 697 per hour; run times 4662 / 4271 / 4278 / 4158 ms |
| Server wall time over all 8 jobs of the run (min / median / max) | 4158 / 4278 / 4662 ms |
| Server CPU time of the evaluating thread, same jobs (min / median / max) | 4112 / 4234 / 4539 ms |
| Key admission (token-signed manifest, public key, relinearization key; server verify / assemble / Mac client wall) | 170 / 497 / 1571 ms |
| **Server peak resident set** (/proc VmHWM / the service's own figure / Go heap in use at the end) | **1870 MiB** / 1870 MiB / 674 MiB |
| Token: key-set export (registry ID 3, 1,201 bounded calls, 4.41 GB generated) | 124 s on the token (35.7 MB/s), token peak resident set 83 MiB |
| Token stream to the Mac (all frames hashed; 32 files / 94 MB stored) | 124 s (35.5 MB/s), manifest mismatches 0 / 0 |
| Token init / export wall time / decrypt of the score | 1 s / 125 s / released 524292 B in 0.176 s |
| Total wall time of the run | 202 s |

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
