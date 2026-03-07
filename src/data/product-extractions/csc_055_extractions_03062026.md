---
generated: 2026-03-06
collection: csc_055
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## Kubernetes

- **Category**: Container Orchestration & Service Mesh
- **Product Name**: Kubernetes (K8s)
- **Product Brief**: Open source system for managing containerized applications across multiple hosts.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Container orchestration system (managing containerized applications)
- **Infrastructure Layer**: Cloud, Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Go environment, Docker environment
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/kubernetes/kubernetes

---

## Istio Service Mesh

- **Category**: Container Orchestration & Service Mesh
- **Product Name**: Istio
- **Product Brief**: An open source service mesh that layers transparently onto existing distributed applications to secure, connect, and monitor services.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "service-to-service authentication" and "certificate management" but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Certificate-based auth (implied by "certificate management" in Istiod description); specific exchange protocols (e.g., IKE) not stated.
- **Supported Blockchains**: Not applicable / Not stated
- **Architecture Type**: Service mesh with sidecar proxies (Envoy) and lightweight data plane proxy (Ztunnel for Ambient mode).
- **Infrastructure Layer**: Network, Cloud (Kubernetes, Nomad), Application (Microservices)
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Not stated
- **Release Date**: 2026-03-06 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: No mention
- **Primary Platforms**: Kubernetes, Nomad
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable / Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/istio/istio

---

## Linkerd

- **Category**: Container Orchestration & Service Mesh
- **Product Name**: Linkerd
- **Product Brief**: Ultralight, security-first service mesh for Kubernetes.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Service mesh (control plane and data plane proxy)
- **Infrastructure Layer**: Network, Cloud
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 2.x
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Kubernetes
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/linkerd/linkerd2

---

## HashiCorp Consul Connect (Service Mesh)

- **Category**: Container Orchestration & Service Mesh
- **Product Name**: HashiCorp Consul Connect (Service Mesh)
- **Product Brief**: A service networking solution enabling secure network connectivity, service discovery, and identity-based authorization across environments.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions mTLS encryption and a built-in certificate authority but does not mention Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: mTLS (Mutual TLS)
- **Key Management Model**: Built-in certificate authority for enforcing mTLS; identity-based authorization using service intentions and ACLs.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Service mesh with sidecar proxies (Envoy), gateways, control plane, and data plane architecture.
- **Infrastructure Layer**: Network, Security Stack, Cloud
- **License Type**: Open Source/Commercial
- **License**: Not stated (Document mentions Enterprise and Community editions but does not specify the license name).
- **Latest Version**: v1.22.x (Connect service mesh), v1.21.x (Consul)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Virtual machine (VM), Kubernetes, Docker, AWS ECS, AWS Lambda, Nomad, RedHat OpenShift
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Raft protocol (for cluster consensus)
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---
