# ACVP Testing Requirements

## 1. Objective

Integrate Automated Cryptographic Validation Protocol (ACVP) testing capabilities into the Interactive Playground to validate the correctness of the WebAssembly (WASM) implementations of ML-KEM and ML-DSA. This will allow users to verify that the cryptographic operations performed in the browser match the expected results defined by NIST standards (FIPS 203 and FIPS 204).

## 2. Scope

- **Algorithms**: ML-KEM (Key Encapsulation Mechanism) and ML-DSA (Digital Signature Algorithm).
- **Key Sizes**:
  - ML-KEM: 512, 768, 1024.
  - ML-DSA: 44, 65, 87.
- **Operations**:
  - ML-KEM: Encapsulate and Decapsulate.
  - ML-DSA: Signature Generation and Verification.
- **Test Type**: Algorithm Functional Tests (AFT) using Known Answer Tests (KATs).

## 3. Functional Requirements

### 3.1. ACVP Test Data Import

- The application MUST provide a mechanism to import ACVP test vectors.
- **Source**: Test vectors should be derived from the `usnistgov/ACVP-Server` repository or equivalent standard sources.
- **Constraint**: The import process MUST limit the import to **one** test key pair per algorithm and key size combination to avoid cluttering the key store.
  - Total imported keys: 6 pairs (3 for ML-KEM, 3 for ML-DSA).

### 3.2. Key Store Integration

- Imported ACVP keys MUST be stored in the existing application Key Store.
- **Naming Convention**: Imported keys MUST follow the format: `ACVP [Algorithm]-[Size] [Type]`.
  - Example: `ACVP ML-KEM-768 Public Key`, `ACVP ML-DSA-44 Private Key`.
- These keys should be selectable in the "Interactive Playground" tab for manual operations if desired, but their primary use is for the automated ACVP tests.

### 3.3. Automated Validation

- The system MUST be able to run a batch validation process using the imported ACVP test vectors.
- **ML-KEM Validation**:
  - For each key size:
    1.  Use the ACVP provided public key to **Encapsulate** a shared secret. Compare the resulting ciphertext and shared secret against the ACVP expected results.
    2.  Use the ACVP provided private key and ciphertext to **Decapsulate**. Verify the recovered shared secret matches the expected value.
- **ML-DSA Validation**:
  - For each key size:
    1.  Use the ACVP provided private key to **Sign** a message. _Note: Since signatures are probabilistic (for ML-DSA), exact binary match might not be possible for all modes unless deterministic signing is strictly enforced and seeds are controlled. If deterministic signing is not exposed, validation may rely on the "Verify" step._
    2.  **Verify** the generated signature using the corresponding public key.
    3.  Use the ACVP provided public key, message, and signature to **Verify** the signature (Known Answer Test).

## 4. User Interface Requirements

### 4.1. New Tab: "ACVP Testing"

- Add a new tab to the main navigation or within the Algorithms view titled "ACVP Testing".

### 4.2. Controls

- **Import Button**: A prominent button labeled "Import ACVP Test Keys".
  - Action: Triggers the loading/parsing of internal JSON test vector files and populates the Key Store.
  - Feedback: detailed toast or log message indicating which keys were imported.
- **Run Tests Button**: A button to execute the validation suite.

### 4.3. Results Display

- Display a summary table or list showing the pass/fail status for each algorithm and key size.
- Detailed logs should be available (or printed to the existing Output Log) showing the inputs and outputs of the tests.

## 5. Data Sources & Technical References

- **Repository**: `https://github.com/usnistgov/ACVP-Server`
- **Path**: `gen-val/json-files`
- **File Types**:
  - `internalProjection.json` (Preferred as it contains both inputs and expected outputs).
  - Alternatively, `prompt.json` (inputs) + `expectedResults.json` (outputs).
- **Relevant JSON Properties**:
  - `testGroups`: Contains the test cases grouped by configuration.
  - `tests`: Individual test cases with `pt` (plaintext), `ct` (ciphertext), `ss` (shared secret), `msg` (message), `sig` (signature), `pk` (public key), `sk` (private key).

## 6. Implementation Notes

- **Deterministic vs Probabilistic**: Be aware that ML-DSA signature generation can be randomized. Standard KATs usually provide the random seed (`z`) or require deterministic mode. If the WASM implementation does not support injecting the random seed, `sigGen` validation might be limited to verifying the generated signature is valid, rather than matching the exact byte sequence of a reference signature.

## 7. Status

- **Completed**: 2025-11-27
- **Implementation**:
  - ACVP Testing tab integrated into Interactive Playground.
  - Real ACVP test vectors (ML-DSA FIPS 204, ML-KEM FIPS 203) imported.
  - **ML-KEM**: Switched to `@openforge-sh/liboqs` to support all variants (512, 768, 1024) and standard key formats.
  - **ML-DSA**: Uses `@openforge-sh/liboqs` for all variants (44, 65, 87).
  - Automated validation suite implemented and **Verified** (All tests pass).
  - Interactive Playground updated to support ML-KEM-512 and ML-KEM-1024.
