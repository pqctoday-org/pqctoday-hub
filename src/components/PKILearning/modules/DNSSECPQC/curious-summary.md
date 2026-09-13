### What This Is About

DNSSEC signs DNS answers so resolvers can prove they weren't forged. IANA has assigned DNSSEC algorithm number 18 to ML-DSA-44, the smallest post-quantum signature in FIPS 204, and on 2026-09-10 Cloudflare's 1.1.1.1 resolver started validating it by default against a real signed test zone, dnstest.dev.

### Why It Matters

DNSSEC's PQC problem isn't cryptographic strength, it's size: an ML-DSA-44 signature is 2,420 bytes, about 38x larger than the ECDSA P-256 signatures DNSSEC mostly uses today, and exceeds a common conservative ~1,232-byte UDP payload limit. Responses that large need another transport, normally TCP — a real operational cost that's one of several reasons this remains an individual IETF draft rather than a working-group standard.

### The Key Takeaway

Cloudflare's milestone proves a production resolver CAN validate ML-DSA-44 at scale, against a real signed zone. It does NOT mean any production zone is actually signed with a post-quantum algorithm yet. Resolver-side validation and authoritative-side signing are two different, still-separate steps.

### What's Happening

Cloudflare's own next steps are authoritative-side signing support and registrar DS-record support. Cloudflare's company-wide post-quantum security target is ~2029, but full end-to-end PQ DNSSEC also needs the root and other registries to adopt it — the DNS root zone's own algorithm rollover is a separate, broader estimate of the mid-2030s.
