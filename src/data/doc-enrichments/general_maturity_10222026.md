---
generated: 2026-10-22
category: Technical Standards
document_count: 2
requirement_count: 11
---

## Post-Quantum-PCI-Use-Cases-ATM-and-POS-Card-Capture-ATM-and
- **Source**: Post Quantum PCI Use Cases: ATM and POS Card Capture; ATM and POS Setup with Backend Acquiring Systems
- **URL**: https://fsisac.com/hubfs/Knowledge/PQC/PCIUseCases-ATM&POSCardCapture_ATM&POSSetupWithBackendAcquiringSystems.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Ensure the bootloader of EPP or POS devices uses quantum-secure cryptography and that implemented algorithms are resistant to side-channel attacks per PCI PTS.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Update EPP or POS manufacturer certificates to quantum-safe algorithms or modify the Remote Key Loading protocol to use quantum-safe cryptography.
    - _T2 Risk-Informed · keys_: Migrate Terminal Master Keys (TMK) and Terminal PIN Keys (TPK) from Triple-DES to AES to mitigate quantum vulnerabilities in PIN encryption.

## RFC-10033-Hash-Based-Signatures-State-and-Backup-Management
- **Source**: RFC 10033: Hash-Based Signatures: State and Backup Management
- **URL**: https://www.rfc-editor.org/rfc/rfc10033.html
- **Requirement count**: 8
- **Governance**:
    - _T2 Risk-Informed · all_: Implement M-of-N controls, least-privilege access, and separation of duties to mitigate insider threats, ensuring separation persists across operator generations.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Consider backups of private keys and associated states as part of the security architecture to mitigate device failure and facilitate disaster recovery.
    - _T3 Repeatable · keys_: Ensure signature generation and state update appear as an atomic transaction, preventing signature release without irrevocable state update.
    - _T3 Repeatable · keys_: Implement state management satisfying ACID properties: Atomicity, Consistency, Isolation, and Durability to prevent state reuse and ensure crash resilience.
    - _T3 Repeatable · keys_: Ensure non-volatile and volatile memory copies of the private key are perfectly synchronized, preventing other system parts from reading key versions during load, write, or modify procedures.
    - _T3 Repeatable · keys_: Ensure backup mechanisms do not lead to the reuse of previously used OTS keys by avoiding rollback to states where used keys are still available.
    - _T3 Repeatable · keys_: Ensure that when private keys are distributed to multiple signers, synchronization mechanisms prevent the use of the same OTS key across all signers.
- **Observability**:
    - _T2 Risk-Informed · keys_: Provide configurable warning thresholds for signature exhaustion that require explicit user acknowledgment via a mechanism that cannot be trivially skipped.
