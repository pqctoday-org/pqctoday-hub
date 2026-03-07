---
generated: 2026-03-06
collection: csc_007
documents_processed: 9
enrichment_method: ollama-qwen3.5:27b
---

## MongoDB Queryable Encryption

- **Category**: Database Encryption Software
- **Product Name**: MongoDB Queryable Encryption
- **Product Brief**: Client-side field-level encryption enabling equality and range queries on encrypted data without server knowledge.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It describes an "industry-first fast, searchable encryption scheme" but does not specify the underlying cryptographic primitives as being post-quantum.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "Cryptographic Primitives" as a documentation section title but does not list specific algorithms like AES, RSA, or ECDSA).
- **Key Management Model**: Client-side key management where only the client has access to encryption keys; supports integration with KMS providers ("Back KMS Providers"); supports rotation and rewrapping of encryption keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Client-side field-level encryption (application-level); data is encrypted on the client and stored as randomized encrypted data on the server.
- **Infrastructure Layer**: Database, Application
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (for libmongocrypt library); Commercial (for MongoDB Atlas/Enterprise features)
- **Latest Version**: 8.2 (MongoDB Server version mentioned in context of Queryable Encryption features)
- **Release Date**: Not stated (Text mentions "Last Updated: 2026-02-27" for the repository, but this is a metadata timestamp, not a product release date).
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows, macOS, Linux (Debian, Ubuntu, RedHat, Suse, Amazon Linux), x86_64, AArch64
- **Target Industries**: Financial Services, Telecommunications, Healthcare, Retail, Public Sector, Manufacturing
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/mongodb/libmongocrypt (for library); MongoDB Documentation (implied via text structure)

---

## SQL Server TDE/Always Encrypted

- **Category**: Database Encryption Software
- **Product Name**: SQL Server TDE/Always Encrypted
- **Product Brief**: Transparent data encryption (TDE) encrypts SQL Server, Azure SQL Database, and Azure Synapse Analytics data files at rest.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It only references classical symmetric (AES, 3DES) and asymmetric encryption methods.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES, 3DES, Asymmetric keys, Certificates, Windows Data Protection API (DPAPI)
- **Key Management Model**: Hierarchical key management using Windows DPAPI at the root to protect the Service Master Key (SMK), which protects the Database Master Key (DMK). The DMK protects certificates or asymmetric keys, which in turn protect the symmetric Database Encryption Key (DEK). Supports Extensible Key Management (EKM) modules for protecting asymmetric keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Transparent encryption at the database engine level; native integration within SQL Server/Azure SQL.
- **Infrastructure Layer**: Database, Cloud
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: SQL Server 2019 (15.x)
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: SQL Server, Azure SQL Database, Azure SQL Managed Instance, Azure Synapse Analytics, Analytics Platform System (PDW)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## PostgreSQL pgcrypto

- **Category**: Database Encryption Software
- **Product Name**: pgcrypto
- **Product Brief**: A PostgreSQL module providing cryptographic functions including hashing, password hashing, and PGP encryption.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms or support. It lists classical algorithms such as MD5, SHA-1, SHA-256, SHA-512, Blowfish, AES, 3DES, and CAST5 for hashing and encryption.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: md5, sha1, sha224, sha256, sha384, sha512, bf (Blowfish), aes128, aes192, aes256, 3des, cast5, xdes, des
- **Key Management Model**: Not stated (Functions accept keys/passwords as input parameters; no external KMS or hierarchical key management described).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Native database extension module providing application-level cryptographic functions.
- **Infrastructure Layer**: Database
- **License Type**: Open Source
- **License**: Not stated (Document mentions "The PostgreSQL Global Development Group" but does not specify the license text).
- **Latest Version**: 18.3
- **Release Date**: 2026-02-26
- **FIPS Validated**: No
- **Primary Platforms**: PostgreSQL (versions 14, 15, 16, 17, 18)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document covers hashing and encryption; signature schemes are not explicitly listed).
- **Authoritative Source URL**: Not stated

---

## MySQL Enterprise Encryption

- **Category**: Database Encryption Software
- **Product Name**: MySQL Enterprise Encryption
- **Product Brief**: An extension in MySQL Enterprise Edition exposing OpenSSL capabilities at the SQL level for asymmetric cryptography and hashing.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any migration plans for PQC. It only references standard public-key asymmetric cryptography via OpenSSL.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, SHA-256, Caching SHA-2, Public-key asymmetric cryptography (OpenSSL)
- **Key Management Model**: Uses the MySQL Keyring component with support for file-based keyrings, encrypted file-based keyrings, and external KMS integration via plugins for KMIP, AWS, HashiCorp Vault, and Oracle Cloud Infrastructure.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Native database component providing SQL-level encryption functions; supports external KMS integration via Keyring plugins.
- **Infrastructure Layer**: Database, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (included in MySQL Enterprise Edition)
- **Latest Version**: 8.6.1
- **Release Date**: Not stated
- **FIPS Validated**: FIPS Support is mentioned as a feature category, but specific validation status (e.g., FIPS 140-2/3 validated) is not explicitly detailed in the text.
- **Primary Platforms**: MySQL Enterprise Edition; compatible with Windows, Linux (implied by OpenSSL and OS references), and cloud environments via OCI/AWS/Azure integration for keyring plugins.
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Digital signatures using public-key asymmetric cryptography (specific algorithms like ECDSA or Ed25519 are not explicitly named, only "public and private keys" and "digital signatures").
- **Authoritative Source URL**: https://www.mysql.com/products/

---

## CockroachDB Encryption

- **Category**: Database Encryption Software
- **Product Name**: CockroachDB
- **Product Brief**: Cloud-native distributed SQL database designed for high availability, effortless scale, and control over data placement.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or PQC migration plans. Only classical symmetric encryption (AES) is described.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES-128, AES-192, AES-256
- **Key Management Model**: Local file-based key management using `--enterprise-encryption` flags; supports manual key rotation via `old-key` and `key` parameters; no external KMS integration mentioned in text.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Native database encryption (Encryption at Rest) configured at node start time via command-line flags.
- **Infrastructure Layer**: Database, Cloud
- **License Type**: Open Source/Commercial
- **License**: CockroachDB Software License (CSL) for versions v24.3 and later; NOASSERTION listed in repository metadata.
- **Latest Version**: v26.1.0
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Self-hosted clusters, CockroachCloud (various cloud platforms), Linux/Unix implied by CLI usage.
- **Target Industries**: Banking & Fintech, Retail & eCommerce, Software & Tech, Media & Streaming, Gaming, Manufacturing & Logistics, Gambling, Healthcare.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated (Text mentions "strongly-consistent ACID transactions" and "transactional key-value store" but does not name the specific consensus algorithm).
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/cockroachdb/cockroach

---

## PostgreSQL

- **Category**: Database Encryption Software
- **Product Name**: PostgreSQL
- **Product Brief**: Advanced object-relational database management system supporting an extended subset of the SQL standard.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Database
- **License Type**: Open Source
- **License**: NOASSERTION (Note: Text states "Copyright and license information can be found in the file COPYRIGHT" but does not specify the license name in this excerpt).
- **Latest Version**: Not stated (Text references "devel" documentation and "latest version" via URL, but no specific version number is listed).
- **Release Date**: 2026-03-06 (Last Updated date of the repository mirror)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Text mentions C language bindings and source code distribution, but does not list specific OS or cloud platforms).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.postgresql.org/

---

## MySQL Community Server

- **Category**: Database Encryption Software
- **Product Name**: MySQL Server
- **Product Brief**: The world's most popular open source database, and MySQL Cluster, a real-time, open source transactional database.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Database
- **License Type**: Open Source
- **License**: NOASSERTION (referenced as "open source" in description, specific license file content not provided)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/mysql/mysql-server

---

## Redis

- **Category**: Database Encryption Software
- **Product Name**: Redis
- **Product Brief**: Fastest, feature-rich cache, data structure server, and document/vector query engine for real-time applications.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions TLS support but does not specify Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (TLS is mentioned, but specific primitives like ECDSA or RSA are not listed).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: In-memory data structure server; supports modules API for extension.
- **Infrastructure Layer**: Database, Cloud
- **License Type**: Open Source/Commercial
- **License**: NOASSERTION (Open Source); Commercial options available via Redis Software and Redis Cloud.
- **Latest Version**: v8.0 (mentioned in context of renaming to Redis Open Source)
- **Release Date**: 2026-03-06 (Last Updated date in document metadata)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Ubuntu, Debian, AlmaLinux, Rocky Linux, macOS, Docker, Google Cloud, Azure, AWS.
- **Target Industries**: Not explicitly stated; use cases include real-time analytics, fraud detection, AI/GenAI, and session management.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable (Not a blockchain protocol)
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/redis/redis

---

## MariaDB Server

- **Category**: Database Encryption Software
- **Product Name**: MariaDB Server
- **Product Brief**: A community developed fork of MySQL server delivering a featureful, stable, and sanely licensed open SQL server.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Database
- **License Type**: Open Source
- **License**: GPL-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Topics mention amazon-web-services)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/MariaDB/server

---
