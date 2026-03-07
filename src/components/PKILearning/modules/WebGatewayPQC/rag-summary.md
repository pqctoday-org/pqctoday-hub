# Web Gateway PQC Module

## Overview

Learn how to deploy post-quantum cryptography at the web infrastructure edge: reverse proxies, load balancers, WAFs, and CDNs. This module covers TLS termination patterns, certificate lifecycle at scale, performance optimization for larger PQC handshakes, and vendor-specific migration paths.

## Key Topics

- Web gateway architecture: reverse proxies, load balancers, WAFs, CDN positioning as TLS termination points
- Four TLS termination patterns: terminate-and-inspect, passthrough, re-encrypt-backend, split TLS
- Certificate lifecycle at edge scale: ACME automation, CT log impact, rotation across hundreds of PoPs
- PQC handshake performance: classical ~5KB vs hybrid ~15KB vs pure PQC ~25KB
- Mitigations: session resumption (PSK), certificate compression (RFC 8879), Merkle Tree Certificates, HTTP/3 QUIC, connection coalescing
- WAF/IDS inspection challenges when gateways cannot terminate PQC TLS
- CDN edge deployment: origin shielding, key distribution across 300+ PoPs
- Vendor readiness: F5 BIG-IP, NGINX, HAProxy, Envoy, Kong, Traefik, Cloudflare, AWS ALB, Imperva, Palo Alto, Broadcom Avi

## Workshop Steps

- Step 1: Topology Builder — construct a web gateway architecture and identify PQC upgrade points with 4 preset topologies
- Step 2: TLS Termination Patterns — compare 4 patterns (terminate-inspect, passthrough, re-encrypt, split TLS) under classical vs PQC
- Step 3: Handshake Budget Calculator — calculate PQC handshake sizes, bandwidth costs, and apply mitigations
- Step 4: Certificate Rotation Planner — plan certificate migration across edge nodes with phased rollout timeline
- Step 5: Vendor Readiness Matrix — assess gateway products against PQC readiness criteria with gap analysis

## Referenced Standards

- RFC 8446 (TLS 1.3)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- RFC 8879 (Certificate Compression)
- IETF MTC Draft (Merkle Tree Certificates)
- NIST SP 800-227 (PQC Migration Guidelines)
