### What This Is About

Web gateways—such as reverse proxies, WAFs, load balancers, and CDNs—are the central nervous system for TLS termination. Deploying PQC at the gateway level instantly shields thousands of backend services without requiring any application code changes.

### Why It Matters

Security appliances like Next-Gen Firewalls (NGFWs) often have strict hardware buffer limits (around ~4 KB) for Deep Packet Inspection. A massive PQC Hybrid handshake (~15+ KB) violently shatters these limits, causing firewalls to blindly drop the connections entirely.

### The Key Takeaway

A phased architecture is critical: deploy classical TLS at your local inspection points (maintaining WAF visibility) while enabling Hybrid PQC (X25519MLKEM768) on the internet-facing edge. This shields the perimeter against quantum harvesting without breaking internal inspection.
