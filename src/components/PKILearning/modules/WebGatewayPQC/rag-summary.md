# Web Gateway PQC Module

## Overview

Learn how to deploy post-quantum cryptography at the web infrastructure edge: reverse proxies, load balancers, WAFs, and CDNs. This module covers TLS termination patterns, certificate lifecycle at scale, performance optimization for larger PQC handshakes, and vendor-specific migration paths.

## Key Topics

- Web gateway architecture: reverse proxies, load balancers, WAFs, CDN positioning as TLS termination points
- Four TLS termination patterns: terminate-and-inspect, passthrough, re-encrypt-backend, split TLS
- Certificate lifecycle at edge scale: ACME automation, CT log impact, rotation across hundreds of PoPs
- PQC handshake performance: retained OpenSSL 3.6.3 samples captured 9 November 2026 total 2,233 B (X25519 + RSA-2048), 4,499 B (X25519MLKEM768 + RSA-2048), and 16,944 B (ML-KEM-768 + ML-DSA-65). These count seven complete handshake-layer messages, including headers and leaf plus intermediate (root omitted); record/TCP/IP framing is excluded. They are sample profiles, not estimates for every algorithm or chain depth
- Certificate alternatives: exact Certificate-body zlib compression saves 181 B in the RSA-authenticated samples or 175 B in the ML-DSA-65 sample after counting the 7-byte client offer. Same-leaf SPKI alternatives count 11 negotiation bytes and preserve CertificateVerify, requiring negotiated support and external identity-to-key trust. These are modelled substitutions, not negotiated captures. Compression plus SPKI has no retained measurement. QUIC does not discount cryptographic message bytes; connection reuse changes only the explicitly selected new-handshake rate. PSK and MTC component comparisons have separate envelopes and are not compounded whole-handshake discounts
- WAF/IDS inspection challenges when gateways cannot terminate PQC TLS
- CDN edge deployment: origin shielding, key distribution across edge PoPs
- Vendor readiness: F5 BIG-IP, NGINX, HAProxy, Envoy, Kong, Traefik, Cloudflare, AWS ALB, Imperva, Palo Alto, Broadcom Avi

## Workshop Steps

- Step 1: Topology Builder — construct a web gateway architecture and identify PQC upgrade points with 4 preset topologies
- Step 2: TLS Termination Patterns — compare 4 patterns (terminate-inspect, passthrough, re-encrypt, split TLS) under classical vs PQC
- Step 3: Handshake Budget Calculator — compare all seven measured sample messages, exact certificate alternatives and bandwidth at an explicit new-handshake rate; export the declared boundary and unsupported combinations
- Step 4: Certificate Rotation Planner — plan certificate migration across edge nodes with phased rollout timeline
- Step 5: Vendor Readiness Matrix — assess gateway products against PQC readiness criteria with gap analysis

## Referenced Standards

- RFC 9846 (TLS 1.3; obsoletes RFC 8446)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- RFC 8879 (Certificate Compression)
- IETF MTC Draft (Merkle Tree Certificates)
- NIST SP 800-227 (PQC Migration Guidelines)
