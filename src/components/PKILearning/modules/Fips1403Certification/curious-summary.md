### What This Is About

A closer look at FIPS 140-3, the US and Canadian standard for cryptographic modules; the validation program behind it, the CMVP, is a joint effort of NIST and the Canadian Centre for Cyber Security. It builds on the certification fundamentals module; payment approval (PCI) has its own module. A hands-on step reads the real algorithm and Security Policy records of two modules, side by side.

### Why It Matters

Passing algorithm tests is only the first step toward FIPS 140-3; the module certificate is a separate result. Adding post-quantum algorithms changes the module, so it needs a new validation route.

### The Key Takeaway

A listing on the Modules In Process list (voluntary, and not every module in review is shown) is a queue position, not a certificate; a module is validated only once NIST and CCCS issue a FIPS 140-3 certificate. Adding ML-KEM, ML-DSA or SLH-DSA also requires module-internal cryptographic algorithm self-tests (CASTs) and pair-wise consistency tests (PCTs) under IG 10.3.A, not just external ACVP vectors.

### What's Happening

All FIPS 140-2 certificates moved to the CMVP Historical list in September 2026 (still usable for existing systems, but not recommended for new federal procurements). Meanwhile, US Executive Order 14412 directs the Secretary of Commerce, through NIST's Director, to revise CMVP processes within 180 days (around 19 December 2026) to accelerate validations of cryptographic modules.
