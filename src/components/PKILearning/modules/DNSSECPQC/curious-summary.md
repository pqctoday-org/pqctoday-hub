### What This Is About

DNSSEC signs DNS answers so resolvers can prove they weren't forged. IANA has assigned DNSSEC algorithm number 18 to ML-DSA-44, with resolver validation of ML-DSA-44 serving as one of the first deployment steps.

### Why It Matters

DNSSEC's PQC problem isn't cryptographic strength, it's size: an ML-DSA-44 signature is 2,420 bytes, about 38x larger than the ECDSA P-256 signatures DNSSEC mostly uses today, and exceeds a common conservative ~1,232-byte UDP payload limit. Responses that large need another transport, normally TCP — a real operational cost that's one of several reasons this remains an individual IETF draft rather than a working-group standard.

### The Key Takeaway

Cloudflare's milestone proves a production resolver CAN validate ML-DSA-44 at scale, against a real signed zone. It does NOT mean any production zone is actually signed with a post-quantum algorithm yet. Resolver-side validation and authoritative-side signing are two different, still-separate steps.

### What's Happening

Cloudflare's own next steps are authoritative-side signing support and registrar DS-record support. Cloudflare's company-wide post-quantum security target is ~2029, but full end-to-end PQ DNSSEC also needs the root and other registries to adopt it. Separately, the RSA-to-RSA rollover to KSK-2024 began on 11 October 2026; ICANN's March 2026 proposal for the next classical algorithm rollover describes ECDSA key generation in 2027 and RSA key decommissioning in 2030, subject to community feedback. Verisign's 2023 comments describe a possible later PQ rollover in the mid-2030s, a conditional scenario rather than an ICANN plan or forecast.
