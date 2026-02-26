# Quantum Key Distribution (QKD) Module

This module explores Quantum Key Distribution, a method of distributing encryption keys using the laws of quantum physics rather than mathematical hardness assumptions. Unlike post-quantum cryptography (PQC), which relies on computationally hard problems, QKD derives its security from the no-cloning theorem and the principle that measuring a quantum state inevitably disturbs it, providing information-theoretic security. The module covers the BB84 protocol, practical limitations, satellite QKD initiatives, integration with PQC and HSMs, and the global deployment landscape.

## Key Concepts

- **QKD vs PQC**: QKD provides information-theoretic security from physics; PQC provides computational security from quantum-hard mathematical problems; QKD requires dedicated quantum channels while PQC runs on standard networks
- **BB84 protocol**: First QKD protocol (Bennett & Brassard, 1984); uses single photons encoded in two conjugate bases (rectilinear and diagonal); four steps: qubit preparation, measurement, basis reconciliation (sifted key ~50% of transmitted bits), and eavesdropper detection via QBER threshold (~11%)
- **State of the art**: Fiber single link (~100 km, commercial), fiber with trusted nodes (>2,000 km, deployed), satellite (>7,000 km, demonstrated), free-space urban (~10 km, research)
- **Satellite QKD**: Two modes -- trusted-node satellite relay (Micius demonstrated China-Austria 7,600 km, 2017) and entanglement-based (no key material on satellite, Micius over 1,120 km, 2020); key initiatives include Micius/QUESS (China), EAGLE-1/EuroQCI (EU), QEYSSat (Canada), SOCRATES (Japan), SpooQy-1 (Singapore), QKDSat (UK)
- **NIST position**: NIST IR 8301 does not generally recommend QKD; recommends PQC (FIPS 203/204/205) as primary solution; acknowledges QKD may have niche applications in high-security environments
- **Limitations**: ~100 km fiber distance without trusted nodes, trusted node compromise risk, high cost (dedicated fiber, cryogenic detectors), side-channel vulnerabilities in real devices, low key rates, no built-in authentication
- **QKD + PQC hybrid integration**: Combines QKD-derived key and ML-KEM shared secret via HKDF; security holds if either source remains unbroken (defense in depth)
- **QKD + HSM integration**: PKCS#11 key import (C_UnwrapKey/C_CreateObject), HSM manages lifecycle including rotation and destruction; continuous fresh key generation
- **Global adoption**: 15+ major deployments, 27 EU states in EuroQCI, 2,000 km longest QKD backbone (Beijing-Shanghai, China)

## Workshop Activities

1. **BB84 Protocol Simulator**: Visual simulation with configurable Eve interception slider and adjustable qubit count; observe basis matching, sifted key generation, and QBER calculation
2. **Post-Processing**: Error correction, privacy amplification, and hybrid key derivation from raw QKD output
3. **Global Deployments Explorer**: Interactive database of worldwide QKD deployments including satellite and terrestrial networks with adoption trends
4. **QKD + Classical Protocol Integration**: Integrate QKD keys into TLS 1.3, IKEv2, MACsec, and SSH nonce/PSK fields
5. **HSM Key Derivation**: Use QKD secret as NIST SP 800-108 key material inside an HSM via PKCS#11

## Related Standards

- NIST IR 8301 (Transition to Post-Quantum Cryptography)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- NIST SP 800-108 (KDF in Counter Mode)
- ETSI QKD standards (GS QKD series)
- EuroQCI initiative (pan-European quantum communication infrastructure)
- BB84 protocol (Bennett & Brassard, 1984)
