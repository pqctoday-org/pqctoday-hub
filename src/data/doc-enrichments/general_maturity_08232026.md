---
generated: 2026-08-23
category: Technical Standards
document_count: 5
requirement_count: 28
---

## 5G-Americas-PQCS-2025
- **Source**: Post Quantum Computing Security
- **URL**: https://www.5gamericas.org/wp-content/uploads/2025/02/WP_PQCS-.pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Educate key executives and stakeholders on the urgency and risks of quantum computing threats to cryptographic systems.
    - _T2 Risk-Informed · all_: Conduct a risk analysis and priority assessment for cryptographic assets as part of PQC migration planning.
    - _T2 Risk-Informed · all_: Engage with suppliers and customers to align on roadmap plans and dependencies for PQC migration.
- **Inventory**:
    - _T2 Risk-Informed · all_: Develop a cryptographic inventory of assets to support migration planning to Post-Quantum Cryptography.

## BIS-Paper-158
- **Source**: BIS Paper 158 — Quantum-Readiness Roadmap for Financial Systems
- **URL**: https://www.bis.org/publ/bppdf/bispap158.pdf
- **Requirement count**: 2
- **Governance**:
    - _T2 Risk-Informed · all_: Implement robust governance structures to support the transition to quantum-safe cryptographic infrastructures.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain comprehensive cryptographic inventories as a critical foundation for quantum-readiness.

## Ethereum-EIP4337-AA
- **Source**: EIP-4337: Account Abstraction Using Alt Mempool
- **URL**: https://eips.ethereum.org/EIPS/eip-4337
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Smart Contract Accounts must validate that the caller is a trusted EntryPoint contract before processing operations.
    - _T3 Repeatable · software_: Smart Contract Accounts must validate that the signature is a valid signature of the userOpHash.
    - _T3 Repeatable · software_: UserOperation signatures must depend on chainid and the EntryPoint address to prevent replay attacks.
    - _T3 Repeatable · software_: Smart Contract Accounts must pay the EntryPoint at least the missingAccountFunds to cover gas costs.
    - _T3 Repeatable · software_: The return value from validation must be packed with aggregator/authorizer, validUntil, and validAfter timestamps.
    - _T3 Repeatable · software_: If the factory address is 0x7702, the sender must be an EOA with an EIP-7702 authorization designation.
    - _T3 Repeatable · software_: For classic sequential nonce enforcement, the validation function must require the nonce to be less than the max uint64 value.

## GSMA-PQ01
- **Source**: GSMA PQ.01: Post-Quantum Telco Network Impact Assessment
- **URL**: https://www.gsma.com/newsroom/wp-content/uploads/PQ.1-Post-Quantum-Telco-Network-Impact-Assessment-Whitepaper-Version1.0.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Deploy standardised Quantum-Safe algorithms.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a Post-Quantum Cryptography plan to guide the transition to Quantum-Safe technology.
    - _T2 Risk-Informed · all_: Plan to perform a risk assessment of cryptography used in network systems.
    - _T2 Risk-Informed · all_: Engage with industry groups, government, and vendors on roadmaps to implement PQC.
    - _T2 Risk-Informed · all_: Complete risk assessments across the broad set of cryptographic applications in operations.
- **Inventory**:
    - _T2 Risk-Informed · all_: Plan to establish a cryptographic inventory of currently used algorithms, key-lengths, and dependent systems.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Overhaul existing PKI architectures as existing algorithms become obsolete.
    - _T2 Risk-Informed · all_: Prepare how to handle legacy systems, services, or products that may not be updated.
    - _T2 Risk-Informed · all_: Consider how to reduce the creation of technical cryptographic debt, e.g., by assessing available quantum-safe symmetric cryptography.
    - _T2 Risk-Informed · keys_: Adapt or account for impacts to key management systems during the PQC transition.

## GopherSecurity-PQC-Agility-MCP-2026
- **Source**: Post-Quantum Cryptographic Agility in Model Context Protocol Transport
- **URL**: https://www.gopher.security/blog/post-quantum-cryptographic-agility-mcp-transport
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Sign audit trails with lattice-based signatures to ensure long-term integrity.
- **Governance**:
    - _T3 Repeatable · all_: Enforce YAML-based policies to ensure sensitive data never touches non-PQC connections.
    - _T3 Repeatable · software_: Block specific tools if the incoming connection uses legacy algorithms like RSA.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Automate credential rotation via the proxy to avoid manual management.
- **Observability**:
    - _T3 Repeatable · all_: Monitor for handshake anomalies and alert on latency spikes indicating interception.
