### What This Is About

IT Operations and DevOps teams deploy, monitor, and maintain the cryptography that protects the organization. The PQC migration is fundamentally an operations challenge, encompassing certificate rotation, VPN IPsec tunnels, SSH key management, and CI/CD pipeline deployments.

### Why It Matters

Because PQC signatures and public keys are much larger than today's (GSMA PQ.04 lists an ML-DSA-65 signature of 3,309 bytes against 64 bytes for ECDSA-256), certificates grow too, and automated lifecycle management tools (like cert-manager or ACME) configured for small ECDSA certificates can exceed their size limits and fail silently. Furthermore, the different performance profiles of PQC algorithms will trigger thousands of false-positive latency alerts if monitoring baselines and SLAs are not properly recalibrated.

### The Key Takeaway

Operations teams are on the front line of the quantum transition. They must immediately inventory all cryptographic assets, lab-test PQC protocols (like the hybrid mlkem768x25519-sha256 key exchange, added in OpenSSH 9.9 and the default from OpenSSH 10.0), and update deployment playbooks before executing automated, phased rollovers.

### What's Happening

Operations teams are establishing PQC lab environments to test hybrid protocol deployments—including the hybrid ML-KEM key exchange in OpenSSH 9.9 and later—and recalibrating monitoring baselines to account for the larger certificate sizes and different latency profiles of quantum-safe algorithms.
