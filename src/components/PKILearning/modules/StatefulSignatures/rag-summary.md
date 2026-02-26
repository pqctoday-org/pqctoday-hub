# Stateful Hash-Based Signatures Module (LMS/XMSS)

The Stateful Hash-Based Signatures module covers LMS (Leighton-Micali Signature) and XMSS (eXtended Merkle Signature Scheme), the most conservative post-quantum signature schemes standardized in NIST SP 800-208. These schemes derive security solely from hash function properties, requiring no new cryptographic hardness assumptions. The module explains Merkle tree signature construction, Winternitz one-time signatures (OTS), the critical state management problem, and the trade-offs between stateful schemes (LMS/XMSS) and stateless alternatives (SLH-DSA). LMS/XMSS are mandated by CNSA 2.0 for firmware and software signing in national security systems.

## Key Concepts

- Hash-based signature security relies solely on hash function collision resistance and second-preimage resistance, the most well-understood cryptographic assumption
- Merkle tree structure: each leaf contains the hash of a unique OTS public key; the tree root serves as the overall public key; signatures include an OTS signature plus an authentication path from leaf to root
- Winternitz OTS (WOTS+): each one-time key pair signs exactly one message; the Winternitz parameter W controls a size/speed trade-off (W=1 fastest/largest, W=8 slowest/smallest) with zero impact on security level
- Catastrophic OTS reuse: signing two different messages with the same leaf enables an attacker to compute enough of the private key to forge arbitrary signatures -- a complete break requiring full key revocation
- LMS (RFC 8554): single-tree scheme with heights H=5 to H=25 (32 to 33M signatures), 56-byte public keys, signature sizes 1.3-9.3 KB; HSS extends LMS with up to 8 tree levels for massive signing capacity
- XMSS (RFC 8391): bitmask-based tree hash for multi-target attack resistance, WOTS+ OTS scheme, tighter security proof requiring only second-preimage resistance, and forward security (past signatures remain secure if current key is compromised)
- LMS vs XMSS: LMS is simpler with faster key generation (preferred by NSA CNSA 2.0); XMSS has stronger security proofs and forward security (preferred by BSI Germany)
- State management requirements: state must be persisted to non-volatile storage before signing, updates must be atomic, state must never be cloned or rolled back; HSMs with monotonic counters are the recommended deployment model
- Stateful vs stateless comparison: LMS/XMSS offer smaller signatures (1.3-9 KB) and faster signing but require state tracking and have bounded signature counts; SLH-DSA (FIPS 205) is stateless with unlimited signatures but larger signatures (8-49 KB) and slower signing

## Workshop Activities

- **Step 1 -- LMS Key Generation**: Explore LMS parameter sets (tree height, Winternitz W, hash function), visualize Merkle tree structure, and compare key and signature sizes across configurations
- **Step 2 -- XMSS Key Generation**: Compare XMSS with LMS at equivalent security levels, examine bitmask construction and L-tree compression, and analyze the performance and size trade-offs
- **Step 3 -- State Management Visualizer**: Simulate signing operations, observe leaf index advancement, experience key exhaustion scenarios, and witness the consequences of catastrophic state loss from cloning or rollback

## Related Standards

- NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes, October 2020)
- RFC 8554 (LMS -- Leighton-Micali Signature), RFC 8391 (XMSS -- eXtended Merkle Signature Scheme)
- FIPS 140-3 (HSM validation for state management enforcement), FIPS 205 (SLH-DSA stateless alternative)
- CNSA 2.0 (mandates LMS/XMSS for firmware/software signing; 2025 preference, 2030 requirement, 2033-35 full enforcement)
- IETF draft-ietf-pquip-hbs-state (practical guidance on state, backup, and recovery for LMS/XMSS deployments)
- BSI Technical Guideline TR-02102 (German preference for XMSS/XMSS^MT)
