# VPN/IPsec and SSH PQC

## Overview

The VPN/IPsec and SSH PQC module explores how post-quantum key exchange is being integrated into the three major tunnel and remote-access protocols: IKEv2 (for IPsec VPNs), SSH, and WireGuard. It covers the IKEv2 two-phase handshake and how the Additional Key Exchange (AKE) framework enables hybrid ML-KEM integration, the evolution of PQC in OpenSSH from sntrup761 to ML-KEM-768, WireGuard's crypto agility challenge and the Rosenpass solution, protocol size impacts of PQC key exchange, and the distinction between control plane migration (key exchange and authentication) and the already quantum-resistant data plane (AES-GCM, ChaCha20-Poly1305).

## Key Concepts

- **IKEv2 handshake** (RFC 7296) — two-phase process: IKE_SA_INIT (Diffie-Hellman key exchange with KE payload, nonces, and SPIs) and IKE_AUTH (identity verification with encrypted auth payloads); derives SKEYSEED from shared secret
- **ML-KEM in IKEv2** — draft-ietf-ipsecme-ikev2-mlkem uses the Additional Key Exchange (AKE) framework (RFC 9370) to add ML-KEM encapsulation in IKE_INTERMEDIATE without modifying the core IKEv2 state machine; encapsulation key is 1,184 bytes; combined SKEYSEED derived from both DH and KEM shared secrets via PRF
- **ML-DSA in IKEv2** — draft-ietf-ipsecme-ikev2-mldsa updates IKE_AUTH to support ML-DSA (FIPS 204) for post-quantum certificate-based authentication
- **SSH PQC evolution**: OpenSSH 8.5 (2021) added sntrup761x25519-sha512; OpenSSH 9.0 (2022) made it the default KEX; OpenSSH 9.9 (2024) added NIST-standard mlkem768x25519-sha256
- **SSH hybrid KEX** works by concatenating classical and PQC public keys in SSH_MSG_KEX_ECDH_INIT and combining shares in SSH_MSG_KEX_ECDH_REPLY
- **WireGuard** uses a fixed cipher suite (X25519, ChaCha20-Poly1305, BLAKE2s) with zero crypto agility — algorithms cannot be negotiated
- **Rosenpass** — a companion daemon that runs a separate PQC key exchange (ML-KEM-768 + Classic McEliece) and injects the resulting PSK into WireGuard's pre-shared key slot; preserves WireGuard's simplicity while adding quantum resistance
- **Protocol size impact**: IKEv2 classical 1,400 B to hybrid 3,768 B (+169%); SSH 984 B to 3,296 B (+235%); WireGuard 304 B to 6,800 B (+2,137%); TLS 1.3 1,200 B to 3,500 B (+192%)
- **Control plane vs data plane** — PQC migration applies only to the control plane (key exchange and authentication); the data plane already uses quantum-resistant symmetric algorithms (AES-GCM, ChaCha20-Poly1305) that only need standard 256-bit key lengths for Grover resistance
- **IKEv2 fragmentation** — handled explicitly via RFC 7383 over UDP; SSH handles larger payloads natively via TCP transport

## Workshop / Interactive Activities

The workshop has 3 simulation steps:

1. **IKEv2 Handshake Simulator** — step through the full IKEv2 handshake in three modes: Classical (ECP-256 DH), Hybrid (ECP-256 + ML-KEM-768 AKE), and Pure PQC (ML-KEM-768 only); shows packet sizes, round trips, and key derivation at each stage
2. **SSH Key Exchange Simulator** — compare SSH KEX algorithms side by side: curve25519-sha256 (classical), sntrup761x25519-sha512 (NTRU hybrid), and mlkem768x25519-sha256 (ML-KEM hybrid); shows key sizes, exchange messages, and derived session keys
3. **Protocol Comparison Table** — comprehensive comparison of IKEv2 vs SSH vs WireGuard vs TLS 1.3 covering handshake sizes, round trips, key exchange mechanisms, authentication methods, crypto agility, and PQC readiness

## Related Standards

- RFC 7296 (IKEv2)
- RFC 9370 (Additional Key Exchange in IKEv2)
- draft-ietf-ipsecme-ikev2-mlkem (ML-KEM for IKEv2)
- draft-ietf-ipsecme-ikev2-mldsa (ML-DSA Authentication for IKEv2)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- OpenSSH 9.9 Release Notes (mlkem768x25519-sha256)
- Rosenpass Protocol Specification
