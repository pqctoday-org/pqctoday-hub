---
generated: 2026-03-06
collection: csc_038
documents_processed: 12
enrichment_method: ollama-qwen3.5:27b
---

## Nginx

- **Category**: Application Servers
- **Product Name**: NGINX
- **Product Brief**: The world's most popular Web Server, high performance Load Balancer, Reverse Proxy, API Gateway and Content Cache.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions TLS, HTTPS, and OpenSSL dependencies but contains no explicit mention of Post-Quantum Cryptography algorithms, hybrid modes, or PQC migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "TLS", "SSL certificates", and "OpenSSL library" as a dependency, but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not applicable (Web Server/Reverse Proxy architecture described; no crypto-specific architecture like MPC or HSM mentioned).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-2-Clause
- **Latest Version**: Not stated (Document mentions "Stable" and "Mainline" branches but no specific version number).
- **Release Date**: 2026-03-06 (Last Updated timestamp)
- **FIPS Validated**: No
- **Primary Platforms**: Linux, FreeBSD, Windows (Proof-of-Concept), macOS (implied by "all major operating systems")
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/nginx/nginx

---

## Apache HTTP Server

- **Category**: Application Servers
- **Product Name**: Apache HTTP Server
- **Product Brief**: A powerful and flexible HTTP/1.1 compliant web server designed as a replacement for the NCSA HTTP Server.
- **PQC Support**: No
- **PQC Capability Description**: The document mentions support for asymmetric algorithms via OpenSSL or platform-specific SSL facilities but contains no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Asymmetric algorithms (general), Symmetrical cryptographic functions (via apr_crypto interface); specific primitives like ECDSA or RSA are not explicitly listed in the text.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application Server with optional SSL/TLS modules (mod_ssl) and session encryption (mod_session_crypto).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 2.0 and later versions (specific latest version number not stated)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Platform-specific notes available in README.platforms; no specific OS listed in text.
- **Target Industries**: Not stated
- **Regulatory Status**: Export Commodity Control Number (ECCN) 5D002.C.1; eligible for export under License Exception ENC Technology Software Unrestricted (TSU).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://httpd.apache.org/

---

## Envoy Proxy

- **Category**: Application Servers
- **Product Name**: Envoy Proxy
- **Product Brief**: Cloud-native high-performance edge/middle/service proxy hosted by CNCF.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only mentions general security audits and fuzzing infrastructure.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Network
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Not stated
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: C++ (Language), ppc64le, s390x (Architectures mentioned in build status)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/envoyproxy/envoy

---

## Node.js

- **Category**: Application Servers
- **Product Name**: Node.js
- **Product Brief**: An open-source, cross-platform JavaScript runtime environment.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions PGP signatures for release verification but does not list specific primitives used by the runtime).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION (as stated in text; typically MIT, but text explicitly says NOASSERTION)
- **Latest Version**: v22.x (Current branch mentioned); v18 Hydrogen (LTS example mentioned)
- **Release Date**: 2026-03-06 (Last Updated date in metadata)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Linux, macOS, Windows (listed under Topics)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: PGP (used for release signing/verification); specific algorithms not listed.
- **Authoritative Source URL**: https://github.com/nodejs/node

---

## HAProxy

- **Category**: Application Servers
- **Product Name**: HAProxy
- **Product Brief**: A free, very fast and reliable reverse-proxy offering high availability, load balancing, and proxying for TCP and HTTP-based applications.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only lists "tls13" as a topic.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: TLS 1.3 (mentioned in topics); specific primitives like ECDSA or RSA are not explicitly listed in the text.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Network
- **License Type**: Open Source
- **License**: GPL 2 (or any later version) for the main code; LGPL 2.1 for headers.
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Last Updated date of the repository mirror)
- **FIPS Validated**: No
- **Primary Platforms**: Alpine/musl, AWS-LC, Illumos, NetBSD, FreeBSD, Linux (implied by network namespaces doc), VTest environment.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/haproxy/haproxy

---

## NGINX Plus

- **Category**: Application Servers
- **Product Name**: NGINX Plus
- **Product Brief**: An all-in-one, cloud-native load balancer, reverse proxy, web server, content cache, and API gateway.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document lists "Post quantum cryptography readiness" as a solution category but does not specify implementation details, algorithms, or maturity levels for NGINX Plus specifically.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native load balancer, reverse proxy, web server, content cache, and API gateway; also available as SaaS (NGINX One) or IaaS (NGINXaaS).
- **Infrastructure Layer**: Application, Network, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Perpetual licensing (GBB), Subscriptions)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Azure, Google Cloud Platform, Amazon Web Services, Kubernetes, Hardware, Software, SaaS
- **Target Industries**: Banking and financial services, E-commerce, Healthcare, Public sector, Service provider
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Only "Post quantum cryptography readiness" is mentioned as a general solution area)
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Traefik

- **Category**: Application Servers
- **Product Name**: Traefik
- **Product Brief**: A modern HTTP reverse proxy and load balancer that makes deploying microservices easy.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text mentions HTTPS and Let's Encrypt but does not specify Post-Quantum Cryptography algorithms or support.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: TLS (implied by HTTPS/Let's Encrypt), ECDSA (implied by Let's Encrypt standard, but not explicitly named in text)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Reverse proxy, load balancer, cloud-native application proxy
- **Infrastructure Layer**: Network, Application
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: v3 (mentioned in documentation link and migration guide context)
- **Release Date**: 2026-03-06 (Last Updated date from repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Docker, Kubernetes, Amazon ECS, Consul, Etcd, Rancher v2, Mesos, Marathon
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/traefik/traefik

---

## Apache Traffic Server

- **Category**: Application Servers
- **Product Name**: Apache Traffic Server
- **Product Brief**: A fast, scalable and extensible HTTP/1.1 and HTTP/2 compliant caching proxy server.
- **PQC Support**: No
- **PQC Capability Description**: The document contains no mention of Post-Quantum Cryptography (PQC) algorithms, migration plans, or quantum-resistant capabilities. It only mentions general cryptographic software usage via OpenSSL/BoringSSL dependencies.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions dependency on `openssl`/`boringssl` and `libressl` but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Caching proxy server (forwardproxy, reverseproxy)
- **Infrastructure Layer**: Network, Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 9.1.3 (mentioned in build example); Version 10 mentioned regarding cmake transition; Version 9.0.0 mentioned regarding gcc requirements.
- **Release Date**: Not stated (Last Updated: 2026-03-06T00:16:04Z refers to repository update, not a specific product release date).
- **FIPS Validated**: No
- **Primary Platforms**: CentOS 7, Debian 11/12, Fedora 39/40, FreeBSD, macOS (including arm64), Rocky Linux 8/9, Ubuntu 22.04, Alpine Linux, EC2.
- **Target Industries**: Not stated (Described as a building block for cloud services and large scale web applications).
- **Regulatory Status**: Not stated (Mentions Export Commodity Control Number ECCN 5D002.C.1 and License Exception ENC TSU).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/apache/trafficserver

---

## Apache Tomcat

- **Category**: Application Servers
- **Product Name**: Apache Tomcat
- **Product Brief**: Open source implementation of Jakarta Servlet, Pages, Expression Language, and WebSocket technologies.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Tomcat 11
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Java-based)
- **Target Industries**: Diverse range of industries and organizations
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/apache/tomcat

---

## Eclipse Jetty

- **Category**: Application Servers
- **Product Name**: Eclipse Jetty
- **Product Brief**: A highly scalable and memory-efficient web server and servlet container supporting HTTP/3,2,1 and WebSocket.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC), PQC algorithms, or migration plans. It only mentions general security support without specific algorithmic details.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: EPL2 and Apache2
- **Latest Version**: 12.1
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (mentions embedding in devices, tools, frameworks, application servers, and cloud services)
- **Target Industries**: Not stated (mentions use by billion-dollar companies, cloud services, Mars missions, and ocean devices)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (text mentions "Documentation page", "Github", and "@JettyProject" but does not provide a specific URL string)

---

## WildFly (JBoss)

- **Category**: Application Servers
- **Product Name**: WildFly Application Server
- **Product Brief**: A fast, modular Java application server supporting Jakarta EE and MicroProfile.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown (text references `[version]` as a placeholder)
- **Release Date**: 2026-03-05 (Last Updated timestamp)
- **FIPS Validated**: No
- **Primary Platforms**: \*nix systems, Linux, Windows
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://wildfly.org

---

## Payara Server

- **Category**: Application Servers
- **Product Name**: Payara Server
- **Product Brief**: Open source middleware platform supporting Jakarta EE and MicroProfile applications in any environment.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document describes the product as a Java EE/MicroProfile middleware platform but contains no mention of Post-Quantum Cryptography algorithms, implementations, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: NOASSERTION (Community Edition); Commercial (Enterprise Edition)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: On-premise, cloud, hybrid; Java environment
- **Target Industries**: Enterprise (implied by "mission-critical systems" and "development projects")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/payara/Payara

---
