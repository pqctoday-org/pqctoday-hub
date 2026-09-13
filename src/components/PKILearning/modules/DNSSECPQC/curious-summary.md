### What This Is About

DNSSEC signs DNS answers so resolvers can prove they weren't forged. IANA has assigned DNSSEC algorithm number 18 to ML-DSA-44, the smallest post-quantum signature in FIPS 204, and on 2026-09-10 Cloudflare's 1.1.1.1 resolver started validating it by default against a real signed test zone, dnstest.dev.

### Why It Matters

DNSSEC's PQC problem isn't cryptographic strength, it's size: an ML-DSA-44 signature is 2,420 bytes, about 38x larger than the ECDSA P-256 signatures DNSSEC mostly uses today, and comfortably exceeds DNS's practical ~1,232-byte UDP response ceiling. That forces a TCP fallback for every PQ-signed answer, which is exactly why this is still an individual IETF draft rather than a working-group standard.

### The Key Takeaway

Cloudflare's milestone proves a production resolver CAN validate ML-DSA-44 at scale, against a real signed zone. It does NOT mean any production zone is actually signed with a post-quantum algorithm yet. Resolver-side validation and authoritative-side signing are two different, still-separate steps.

### What's Happening

Cloudflare's own next steps are authoritative-side signing support, then registrar DS-record support, targeting full PQ DNSSEC around 2029. That's a narrower, vendor-specific target — the DNS root zone's own algorithm rollover is a separate, broader estimate of the mid-2030s.
