### What This Is About

Web gateways—such as reverse proxies, WAFs, load balancers, and CDNs—are the central nervous system for TLS termination. Deploying PQC at the gateway level instantly shields thousands of backend services without requiring any application code changes.

### Why It Matters

The retained seven-message sample is 4,499 B for X25519MLKEM768 with RSA-2048 authentication, or 16,944 B for ML-KEM-768 with ML-DSA-65 authentication, versus 2,233 B for X25519 with RSA-2048. These handshake-layer totals exclude record and transport framing. Test your own gateway’s parsing, buffering and inspection with representative captures; these measurements do not establish a universal 4 KB limit or a guaranteed connection drop.

### The Key Takeaway

A phased architecture is critical: deploy classical TLS at your local inspection points (maintaining WAF visibility) while enabling Hybrid PQC (X25519MLKEM768) on the internet-facing edge. This shields the perimeter against quantum harvesting without breaking internal inspection.

### What's Happening

Security vendors are updating their NGFW and WAF firmware to handle larger PQC handshakes, while organizations are testing phased gateway architectures that deploy hybrid PQC (X25519MLKEM768) at the internet edge while maintaining classical TLS at internal inspection points.
