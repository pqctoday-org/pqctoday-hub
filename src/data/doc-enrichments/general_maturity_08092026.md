---
generated: 2026-08-09
category: Technical Standards
document_count: 1
requirement_count: 10
---

## Ethereum-EIP4337-AA
- **Source**: EIP-4337: Account Abstraction Using Alt Mempool
- **URL**: https://eips.ethereum.org/EIPS/eip-4337
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Smart Contract Accounts MUST validate that the caller is a trusted EntryPoint contract before processing operations.
    - _T3 Repeatable · software_: Smart Contract Accounts MUST validate that the signature is a valid signature of the userOpHash.
    - _T3 Repeatable · software_: UserOperation signatures MUST depend on chainid and the EntryPoint address to prevent replay attacks.
    - _T3 Repeatable · software_: Smart Contract Accounts MUST pay the EntryPoint at least the missingAccountFunds to cover gas costs.
    - _T3 Repeatable · software_: The EntryPoint MUST create the sender Smart Contract Account if it does not yet exist, using the provided initcode.
    - _T3 Repeatable · software_: If the sender does not exist and initcode is empty or fails to deploy, the EntryPoint call MUST fail.
    - _T3 Repeatable · software_: If the factory address is 0x7702, the sender MUST be an EOA with an EIP-7702 authorization designation.
    - _T3 Repeatable · software_: The EntryPoint MUST validate that the authorized address matches the one specified in the UserOperation signature for EIP-7702.
    - _T3 Repeatable · software_: The EntryPoint MUST revert the bundle if nonce validation fails for a UserOperation.
    - _T3 Repeatable · software_: The EntryPoint MUST perform verification and execution loops for each UserOperation in the handleOps call.
