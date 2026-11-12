### Problem

An architect decides where cryptography sits, who controls keys, which certificate formats clients must accept and how a system can change algorithms. Those decisions determine what must be tested during post-quantum migration.

### What You Can Do Here

The six workshop steps include descriptive impact/scenario cards, skill self-ratings, a phased action checklist with Markdown export and a nine-item exposure checklist. The Strangler Fig model illustrates migration behind a PQC API gateway. Trust Hardware Selector compares eight kinds of trust hardware, with a source-attributed grid and two exercises. It distinguishes TPMs, Caliptra, Tessera, hardware and cloud HSMs, confidential computing, and customer and cloud-operator DPUs; specification or code is not a shipping product or certificate.

### Try the Separate Tools

Use the [Cert Capacity Calculator](/playground/cert-capacity) to compare estimated certificate-related TLS payload and annual leaf issuance storage. Try the [TLS Simulator](/playground/tls-simulator) for sample configuration interactions and [Hybrid Certificates](/playground/hybrid-certs) to compare parsed formats and verification results. These are separate tools, not calculators embedded in the role cards.

### The Decision to Take Back

Choose the PKI assumptions, client/server combinations and trust boundaries to test with your own infrastructure tools. The capacity model excludes the root from TLS payload and does not calculate OCSP sizes, CPU capacity or P99 latency. Sample certificate verification does not establish relying-party compatibility or product certification.
