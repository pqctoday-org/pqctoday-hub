# Stateful Hash-Based Signatures Module (LMS/XMSS)

The Stateful Hash-Based Signatures module covers LMS (Leighton-Micali Signature) and XMSS (eXtended Merkle Signature Scheme), the most conservative post-quantum signature schemes standardized in NIST SP 800-208. These schemes derive security solely from hash function properties, requiring no new cryptographic hardness assumptions. The module explains Merkle tree signature construction, Winternitz one-time signatures (OTS), the critical state management problem, and the trade-offs between stateful schemes (LMS/XMSS) and stateless alternatives (SLH-DSA). LMS/XMSS are mandated by CNSA 2.0 for firmware and software signing in national security systems.

## Key Concepts

- Hash-based signature security relies solely on hash function collision resistance and second-preimage resistance, the most well-understood cryptographic assumption
- Merkle tree structure: each leaf contains the hash of a unique OTS public key; the tree root serves as the overall public key; signatures include an OTS signature plus an authentication path from leaf to root
- Winternitz OTS (WOTS+): each one-time key pair signs exactly one message; the Winternitz parameter W controls a size/speed trade-off (W=1 fastest/largest, W=8 slowest/smallest) with zero impact on security level
- Catastrophic OTS reuse: signing two different messages with the same leaf enables an attacker to compute enough of the private key to forge arbitrary signatures -- a complete break requiring full key revocation
- LMS (RFC 8554): single-tree scheme with heights H=5 to H=25 (32 to 33M signatures), 56-byte public keys, signature sizes 1.3-9.3 KB; HSS extends LMS with up to 8 tree levels for massive signing capacity
- XMSS (RFC 8391): bitmask-based tree hash for multi-target attack resistance, WOTS+ OTS scheme, tighter security proof requiring only second-preimage resistance, and no forward security as standardised (SP 800-208 and RFC 8391 derive every one-time key from one fixed seed; forward-secure XMSS is a research variant)
- LMS vs XMSS: LMS is simpler with faster key generation (NSA CNSA 2.0 allows single-tree LMS and XMSS only, and prefers LMS with SHA-256/192); XMSS has a tighter security proof (forward security only in a research variant, not as standardised); BSI TR-02102-1 recommends both families
- NIST SP 800-208 §8.1 requires a durable incremented leaf index before signature output or acceptance of another signing request. Section 9.1 discusses hardware monotonic counters as a possible aid, not a universal HSM implementation. The state-management exercise now explains design/code review, crash/power-loss, concurrency and recovery checks, how to interpret leaf reuse, and why finite tests or successful verification do not prove reuse impossible. The Hub does not perform hardware recovery testing or establish validated hardware.
- Stateful vs stateless comparison: LMS/XMSS require state tracking and have bounded leaf counts. SLH-DSA needs no persistent leaf counter, but the security claims for FIPS 205's 12 parameter sets assume at most 2^64 messages per key pair (§11). This analysis limit is not an LMS/XMSS-style counter requirement or a prediction of immediate failure beyond the limit. SLH-DSA has larger signatures (8-49 KB); performance depends on the parameter set and implementation.

## Workshop Activities

- **Step 1 -- LMS Key Generation**: Explore LMS parameter sets (tree height, Winternitz W, hash function), visualize Merkle tree structure, and compare key and signature sizes across configurations
- **Step 2 -- XMSS Key Generation**: Compare XMSS with LMS at equivalent security levels, examine bitmask construction and L-tree compression, and analyze the performance and size trade-offs
- **Step 3 -- State Management Visualizer**: Simulate signing operations, observe leaf index advancement, experience key exhaustion scenarios, and witness the consequences of catastrophic state loss from cloning or rollback

## Related Standards

- NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes, October 2020)
- RFC 8554 (LMS -- Leighton-Micali Signature), RFC 8391 (XMSS -- eXtended Merkle Signature Scheme)
- FIPS 140-3 (HSM validation for state management enforcement), FIPS 205 (SLH-DSA stateless alternative)
- CNSA 2.0 (permits LMS/XMSS for firmware/software signing; 2025 preference and 2030 exclusive-use milestone for that category; FAQ version 2.2 mandates CNSA 2.0 algorithms for NSS by 2031 unless otherwise noted)
- RFC 10033, formerly draft-ietf-pquip-hbs-state (practical guidance on state, backup, and recovery for LMS/XMSS deployments)
- BSI Technical Guideline TR-02102-1 (recommends all SP 800-208 parameter sets of LMS/HSS and XMSS/XMSS^MT)
