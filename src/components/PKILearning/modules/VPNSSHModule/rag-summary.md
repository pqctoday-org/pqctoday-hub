# VPN/IPsec and SSH PQC

## Overview

The VPN/IPsec and SSH PQC module explores how post-quantum key exchange is being integrated into the three major tunnel and remote-access protocols: IKEv2 (for IPsec VPNs), SSH, and WireGuard. It covers the IKEv2 two-phase handshake and how the multiple key exchanges framework (RFC 9370) enables hybrid ML-KEM integration, the evolution of PQC in OpenSSH from sntrup761 to ML-KEM-768, protocol size impacts of PQC key exchange, and the distinction between control plane migration (key exchange and authentication) and the already quantum-resistant data plane (AES-GCM, ChaCha20-Poly1305). It also covers WireGuard's crypto agility challenge and the Rosenpass add-on.

## Key Concepts

- **IKEv2 handshake** (RFC 7296) — two-phase process: IKE_SA_INIT (Diffie-Hellman key exchange with KE payload, nonces, and SPIs) and IKE_AUTH (identity verification with encrypted auth payloads); derives SKEYSEED from shared secret
- **ML-KEM in IKEv2** — draft-ietf-ipsecme-ikev2-mlkem uses the multiple key exchanges framework (RFC 9370) to add ML-KEM encapsulation in IKE_INTERMEDIATE with RFC 9370 limiting its changes to the exchanged messages and the IKEv2 state machine; encapsulation key is 1,184 bytes; combined SKEYSEED derived from both DH and KEM shared secrets via PRF
- **ML-DSA in IKEv2** — draft-ietf-ipsecme-ikev2-pqc-auth updates IKE_AUTH to support ML-DSA (FIPS 204) for post-quantum certificate-based authentication
- **SSH PQC evolution**: OpenSSH 8.5 (2021) added sntrup761x25519-sha512; OpenSSH 9.0 (2022) made it the default KEX; OpenSSH 9.9 (2024) added mlkem768x25519-sha256, OpenSSH's hybrid of ML-KEM-768 (FIPS 203, standardised by NIST) and X25519, enabled by default; OpenSSH 10.0 (2025) made it the default KEX
- **SSH hybrid KEX** works by concatenating classical and PQC public keys in SSH_MSG_KEX_ECDH_INIT and combining shares in SSH_MSG_KEX_ECDH_REPLY
- **WireGuard** uses a fixed cipher suite (X25519, ChaCha20-Poly1305, BLAKE2s) with zero crypto agility — algorithms cannot be negotiated
- **Rosenpass** — a companion daemon that runs a separate post-quantum key exchange (Classic McEliece-460896 for the static keys, round-3 Kyber-512 for the ephemeral keys; this is not FIPS 203 ML-KEM) and injects the resulting PSK into WireGuard's pre-shared key slot; WireGuard's classical security holds even if Rosenpass is compromised, but the post-quantum protection does not
- **Protocol size impact** (this workshop's message model): IKEv2 classical 1,400 B to hybrid 3,784 B (+170%); SSH 984 B to 3,296 B (+235%); WireGuard is not in the comparison: adding Rosenpass means four extra Rosenpass messages totalling 2,464 B (InitHello 1,092, RespHello 1,132, InitConf 176, EmptyData 64; Rosenpass white paper, Figure 2), the paper gives no WireGuard comparison, and the McEliece public keys are exchanged out of band; TLS 1.3 1,200 B to 3,500 B (+192%)
- **Control plane vs data plane** — PQC migration applies only to the control plane (key exchange and authentication); the data plane's symmetric algorithms (AES-GCM, ChaCha20-Poly1305) are affected by Grover's algorithm rather than Shor's; per NIST (cited in RFC 9370), applications can continue using AES with a minimum key length of 128 bits, and a longer key size can be considered for data that must remain secure for many years
- **IKEv2 fragmentation** — handled explicitly via RFC 7383 over UDP, but only for encrypted messages (not IKE_SA_INIT); SSH handles larger payloads natively via TCP transport
- **Pure ML-KEM in IKEv2 limits** (draft-ietf-ipsecme-ikev2-mlkem-09 §2.1) — pure PQC puts ML-KEM in IKE_SA_INIT, which cannot be IKEv2-fragmented; ML-KEM-512 MAY be used there as a quantum-resistant-only key exchange; implementations transporting IKE over UDP and not performing PMTU discovery SHOULD NOT use ML-KEM-768 or ML-KEM-1024 in IKE_SA_INIT on networks where the PMTU is unknown or restricted, and MAY use any ML-KEM parameter when reliable transport (for example RFC 9329) is used or a sufficient PMTU is guaranteed. CNSA 2.0 lists ML-KEM-1024 for key establishment; the hybrid route (Appendix A) carries ML-KEM in IKE_INTERMEDIATE where RFC 7383 applies

## Workshop / Interactive Activities

The workshop has 3 simulation steps:

1. **IKEv2 Handshake Simulator** — step through the full IKEv2 handshake in three modes: Classical (ECP-256 DH), Hybrid (ECP-256 + ML-KEM-768 additional key exchange), and Pure PQC (ML-KEM-768 only); shows packet sizes, round trips, and key derivation at each stage
2. **SSH Key Exchange Simulator** — compare SSH KEX algorithms side by side: curve25519-sha256 (classical), sntrup761x25519-sha512 (NTRU hybrid), and mlkem768x25519-sha256 (ML-KEM hybrid); shows key sizes, exchange messages, and derived session keys
3. **Protocol Comparison Table** — comprehensive comparison of IKEv2 vs SSH vs WireGuard vs TLS 1.3 covering handshake sizes, round trips, key exchange mechanisms, authentication methods, crypto agility, and PQC readiness

## Related Standards

- RFC 7296 (IKEv2)
- RFC 9370 (Multiple Key Exchanges in IKEv2)
- draft-ietf-ipsecme-ikev2-mlkem-09 (ML-KEM for IKEv2; in the RFC Editor queue, October 2026)
- draft-ietf-ipsecme-ikev2-pqc-auth-12 (Post-Quantum Authentication in IKEv2 using ML-DSA and SLH-DSA; in the RFC Editor queue, October 2026)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- OpenSSH 9.9 Release Notes (mlkem768x25519-sha256)
- Rosenpass white paper (protocol specification)
