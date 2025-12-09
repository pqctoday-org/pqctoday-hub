# Interactive Playground Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-08

## 1. Overview

The Interactive Playground provides a hands-on environment for testing post-quantum cryptographic algorithms (ML-KEM and ML-DSA) in real-time within the browser. Users can generate keys, perform cryptographic operations, and see immediate results.

**Execution Modes:**

- **Mock Mode**: Simulated operations with instant results (for demonstration/testing)
- **WebAssembly Mode**: Real cryptographic operations using WASM libraries (`mlkem-wasm` and `@openforge-sh/liboqs`)

## 2. Functional Requirements

### 2.1 Execution Mode Toggle

- **Toggle Switch**: Allow users to switch between Mock and WebAssembly modes
- **Visual Indicator**: Clear indication of current mode
- **Mode Labels**:
  - "Mock Mode" (fast, simulated)
  - "WASM Mode" (real cryptography)
- **Performance Notice**: Display expected execution times for each mode
- **Default Mode**: Mock mode (faster for initial exploration)
- **Persistence**: Remember user's mode preference in session storage

### 2.2 Algorithm Selection (Unified Interface)

- **Unified Interface**: Seamless access to both KEM and DSA operations without global toggling.
- **Consolidated Tabs**: Operations are grouped into "KEM & Encrypt" and "Sign & Verify" tabs for better workflow.

### 2.3 Key Generation

#### Key Size Selection

- **ML-KEM Options**:
  - ML-KEM-512 (NIST Level 1)
  - ML-KEM-768 (NIST Level 3)
  - ML-KEM-1024 (NIST Level 5)
- **ML-DSA Options**:
  - ML-DSA-44 (NIST Level 2)
  - ML-DSA-65 (NIST Level 3)
  - ML-DSA-87 (NIST Level 5)

#### Key Labeling

- Generated keys include:
  - Algorithm name and size (e.g., "ML-KEM-768")
  - Mode prefix (e.g., "(Mock)" or "(WASM)")
  - Key type (Public/Private)
  - Timestamp (e.g., "[14:30:45]")
- Example: "ML-KEM-768 Public Key (WASM) [14:30:45]"

#### Key Store

- **Table View** displaying all generated keys:
  - **Sortable Columns**: Name, Type, Algorithm, ID, Timestamp.
  - **Resizable Columns**: User can adjust column widths.
  - **Selection**: Clicking a row reveals detailed key information.
- **Detail View** (Single Column):
  - **Raw Value**: Hex/ASCII toggle, copy to clipboard.
  - **PKCS#8 Preview**: Simulated PEM/Hex display.
  - **Alignment Header**: "Ruler" (0-9) above text boxes for column checking.
  - **Edit Mode**: Local editing enabled for text boxes.
  - **Font**: Fixed-width (`Courier New`) for precise alignment.
- **Management Options**:
  - Clear all keys button.
  - **Backup & Restore (✨ NEW)**:
    - **Backup All**: Export all keys to a ZIP archive (`playground-keys-backup-YYYY-MM-DD.zip`).
    - **Import ZIP**: Restore keys from a previously created backup.
    - **Logging**: Operations are logged to the activity log.
- **Empty State**: Message when no keys exist.

### 2.4 ML-KEM & Encryption Operations (Merged Tab)

#### 1. Key Encapsulation (KEM)

- **Encapsulate**:
  - Select Public Key.
  - Generates **Shared Secret** and **Ciphertext**.
  - Outputs are displayed in **editable text boxes** with ASCII/HEX toggles.
- **Decapsulate**:
  - Select Private Key.
  - Input **Ciphertext** (editable, allows tampering).
  - Recovers Shared Secret.
  - **Visual Result**: Displays "SECRET RECOVERED" (Green) if matches original, or "DECAPSULATION FAILED" (Red).

#### 2. Hybrid Encryption (AES-GCM)

- **Encrypt Message**:
  - Input **Message** (editable).
  - Uses established **Shared Secret** (editable).
  - Generates **Encrypted Data** (editable).
- **Decrypt Message**:
  - Input **Encrypted Data** (editable).
  - Uses established **Shared Secret**.
  - Recovers **Decrypted Data**.
- **Data Handling**: All fields support ASCII/HEX toggles for easy inspection and modification.

### 2.5 ML-DSA Operations (Merged Tab)

#### 1. Sign Message

- Select Private Key.
- Input **Message** (editable text box).
- Generates **Signature** (editable text box with ASCII/HEX toggle).

#### 2. Verify Signature

- Select Public Key.
- Input **Message** (editable).
- Input **Signature** (editable, allows testing tampered signatures).
- **Visual Result**: Displays "VERIFICATION OK" (Green) or "VERIFICATION FAILED" (Red).
- **Interactive Testing**: Users can modify the message or signature to instantly see verification fail.

### 2.6 Classical Cryptography Integration

- **Algorithms**: Support for generating and using classical keys alongside PQC.
  - **Signature**: RSA (2048/3072/4096), ECDSA (P-256), Ed25519.
  - **Key Exchange**: X25519, P-256 ECDH.
  - **Symmetric**: AES-128-GCM, AES-256-GCM.
- **Implementation**: Uses native browser Web Crypto API (always "Real" mode).
- **Key Generation**: Dedicated section in Key Store for generating classical keys.
- **Operations**:
  - **Sign/Verify**: RSA, ECDSA, Ed25519 keys integrated into Sign/Verify tabs.
  - **Encapsulate/Decapsulate**: X25519/P-256 keys integrated into KEM tab (using Ephemeral-Static ECDH flow).
  - **Encrypt/Decrypt**: Uses AES-GCM (via shared secret from KEM).

## 3. User Interface Requirements

### 3.1 Layout

- **Tabbed Interface**:
  - **Settings**: Execution Mode toggle, Algorithm Configuration (enable/disable algorithms)
  - **Data**: Input Message, Shared Secret Display, Signature Display
  - **KEM & Encrypt**: Combined Encapsulate/Decapsulate and Hybrid Encryption operations
  - **Sym Encrypt**: Symmetric Encryption (AES-GCM)
  - **Hashing**: Cryptographic hash computation with 8 algorithms
  - **Sign & Verify**: Combined Sign and Verify operations
  - **Key Store**: Key generation controls + list of generated keys with details
  - **Logs**: Operation history with sortable/resizable columns
  - **ACVP**: Automated validation against NIST test vectors
- **Responsive**: Stacks vertically on mobile devices
- **Main Scrollbar**: Entire playground is scrollable

### 3.1.1 Settings Tab

#### Execution Mode Section

- Toggle between Mock and WASM modes
- Visual indicators for current mode
- Mode descriptions

#### Algorithm Configuration Section (✨ NEW)

Comprehensive enable/disable controls for all cryptographic algorithms:

**KEM Algorithms:**

- **Post-Quantum:**
  - ML-KEM-512 (NIST Level 1) - ✅ Enabled by default
  - ML-KEM-768 (NIST Level 3) - ✅ Enabled by default
  - ML-KEM-1024 (NIST Level 5) - ✅ Enabled by default
- **Classical:**
  - X25519 (Curve25519 ECDH) - ✅ Enabled (Web Crypto)
  - P-256 (NIST P-256 ECDH) - ✅ Enabled (Web Crypto)

**Signature Algorithms:**

- **Post-Quantum:**
  - ML-DSA-44 (NIST Level 2) - ✅ Enabled by default
  - ML-DSA-65 (NIST Level 3) - ✅ Enabled by default
  - ML-DSA-87 (NIST Level 5) - ✅ Enabled by default
- **Classical:**
  - RSA-2048 (2048 bits) - ✅ Enabled (Web Crypto)
  - RSA-3072 (3072 bits) - ✅ Enabled (Web Crypto)
  - RSA-4096 (4096 bits) - ✅ Enabled (Web Crypto)
  - ECDSA-P256 (NIST P-256) - ✅ Enabled (Web Crypto)
  - Ed25519 (Curve25519) - ✅ Enabled (Web Crypto)

**Symmetric Encryption:**

- **AES-128-GCM (FIPS 197)** - ✅ Enabled (Web Crypto)
- **AES-256-GCM (FIPS 197)** - ✅ Enabled (Web Crypto)

**Hash Algorithms:**

- SHA-256 (FIPS 180-4) - ✅ Enabled (Implemented)
- SHA-384 (FIPS 180-4) - ✅ Enabled (Implemented)
- SHA-512 (FIPS 180-4) - ✅ Enabled (Implemented)
- SHA3-256 (FIPS 202, Quantum Resistant) - ✅ Enabled (Implemented)
- Keccak-256 (Ethereum) - ✅ Enabled (Implemented)
- RIPEMD-160 (ISO/IEC 10118-3) - ✅ Enabled (Implemented)
- BLAKE2b-256 (RFC 7693) - ✅ Enabled (Implemented)
- BLAKE2b-512 (RFC 7693) - ✅ Enabled (Implemented)

**Features:**

- Visual toggle buttons with checkboxes
- Color-coded by category (KEM=cyan, Signature=violet, Symmetric=emerald, Hash=cyan)
- FIPS standard labels
- Quantum resistance indicators
- Session storage persistence
- All implemented algorithms enabled by default

#### Quick Actions Section

- "Go to Key Store" button for easy navigation

### 3.1.2 Key Store Tab (✨ UPDATED)

**Key Generation Section** (moved from Settings):

- Unified Algorithm & Security Level dropdown (ML-KEM and ML-DSA options combined)
- Generate Keys button with loading state
- Compact horizontal layout

**Key Table:**

- Sortable columns: Name, Type, Algorithm, ID, Timestamp
- Resizable columns with drag handles
- Row selection for detailed view
- Clear All Keys button
- **Backup Controls**: "Backup All" and "Import ZIP" buttons

**Detail View** (when key selected):

- Raw Value display (Hex/ASCII toggle)
- PKCS#8 Preview (PEM/Hex toggle)
- Alignment ruler for column checking
- Copy to clipboard buttons
- Fixed-width font (Courier New)

### 3.1.3 Logs Tab

- **Sortable Columns**: Timestamp, Key Label, Operation, Result, Execution Time
- **Resizable Columns**: User can drag column borders
- **Color-Coded Performance**:
  - Green (<100ms)
  - Yellow (100-500ms)
  - Red (>500ms)
- **Newest First**: Latest operations at top
- **Clear Log** button
- **Persistence**: Logs maintained across tab switches

### 3.2 Input Controls

- **Input Text Area**: Multi-line text input for messages/data
  - Placeholder text for guidance
  - Resizable
- **Key Selection Dropdowns**:
  - Filtered by key type (Public/Private)
  - Filtered by algorithm
  - Empty state message when no keys available
- **Key Size Dropdown**: Pre-operation selection of security level
- **ASCII/Hex Toggles**: View data in either format

### 3.3 Operation Buttons

- **Color Coding**:
  - Encapsulate/Encrypt: Blue tones
  - Decapsulate/Decrypt: Purple tones
  - Sign: Green tones
  - Verify: Orange tones
- **Icons**: Lucide React icons for visual clarity
- **Disabled States**: When prerequisites not met
- **Loading States**: Spinner during operations
- **Hover Effects**: Visual feedback on interaction

### 3.4 Output Display

- **Output Log**:
  - **History**: Array of log entries
  - **Order**: Newest logs at the top
  - **Persistence**: Logs persist when switching algorithms
  - **Controls**: "Clear Log" button
  - Scrollable area
  - Monospace font for data display
  - Syntax highlighting for different data types
  - Timestamps for each operation
- **Error Messages**:
  - Alert styling (red background)
  - Icon indicator
  - Clear, actionable error text

### 3.5 Visual Feedback

- **Success States**: Green accents
- **Error States**: Red accents
- **Loading States**: Animated spinner
- **Hover Effects**: Subtle background changes
- **Transitions**: Smooth animations (200-300ms)
- **Header Bands**: Visual separation for sections

## 4. Accessibility Requirements

### 4.1 Form Labels

- All form controls have associated `<label>` elements
- Labels use `htmlFor` attribute linking to input `id`
- Descriptive label text

### 4.2 ARIA Attributes

- **Algorithm Toggle**: `role="group"`, `aria-label`, `aria-pressed`
- **Dropdowns**: Proper `id` and `label` associations
- **Output Log**: `role="log"`, `aria-live="polite"`, `aria-atomic="false"`
- **Error Messages**: `role="alert"`, `aria-describedby` linking to inputs
- **Buttons**: Descriptive `aria-label` when needed

### 4.3 Keyboard Navigation

- All interactive elements accessible via Tab key
- Dropdowns navigable with arrow keys
- Buttons activated with Enter/Space
- Logical tab order

### 4.4 Screen Reader Support

- Operation status announced via ARIA live regions
- Error messages associated with relevant form fields
- Button states (disabled, loading) announced
- Dynamic content updates announced

## 5. Technical Implementation

### 5.1 Current Implementation

- **Mock Operations**: Simulated cryptographic operations for demonstration
- **WASM Operations**: Real operations using `mlkem-wasm` and `@openforge-sh/liboqs`
- **State Management**: React hooks (useState, useEffect)
- **Key Storage**: In-memory array of key objects
- **Operation Simulation**: Timeout-based async operations with random data (Mock mode)

### 5.2 State Variables

- `algorithm`: Current selected algorithm (ML-KEM | ML-DSA)
- `keySize`: Selected security level
- `keyStore`: Array of generated keys
- `input`: User input message/data
- `logs`: Array of log strings (history)
- `error`: Error message state
- `loading`: Operation in progress state
- `sharedSecret`: ML-KEM shared secret
- `signature`: ML-DSA signature
- `ciphertext`: Encrypted data
- Selected key IDs for each operation type

### 5.3 Component Structure

- **InteractivePlayground.tsx**: Main component
- **PlaygroundView.tsx**: View wrapper with header
- Organized in `src/components/Playground/` folder

## 6. WebAssembly Implementation Requirements

> [!NOTE]
> **Status: Completed**
> The WebAssembly integration has been fully implemented using `mlkem-wasm` and `@openforge-sh/liboqs`, with a toggle to switch between Mock and WASM modes.

### 6.1 Library Dependencies

- **ML-KEM**: `@openforge-sh/liboqs` (npm package) - Replaced `mlkem-wasm` for better compatibility.
- **ML-DSA**: `@openforge-sh/liboqs` (npm package)
- **Loading Strategy**: Dynamic import (lazy loading) only when WASM mode is activated.

### 6.2 WASM Integration Architecture

- **Mode Detection**: `executionMode` state ('mock' | 'wasm').
- **Operation Abstraction**: `runOperation` handles both modes transparently.
- **Error Handling**: Graceful fallback if WASM fails to load or browser is incompatible.

### 6.3 ML-KEM Operations (WASM)

- **Key Generation**: `liboqs.KeyEncapsulation.generate_keypair()`
- **Encapsulation**: `liboqs.KeyEncapsulation.encapsulate()`
- **Decapsulation**: `liboqs.KeyEncapsulation.decapsulate()`
- **Encryption/Decryption**: Uses Web Crypto API (AES-GCM) with the shared secret derived from ML-KEM.

### 6.4 ML-DSA Operations (WASM)

- **Key Generation**: `MLDSA.generateKey()`
- **Signing**: `MLDSA.sign(privateKey, message)`
- **Verification**: `MLDSA.verify(signature, message, publicKey)`

### 6.5 Performance Metrics

- **Measurement**: `performance.now()` for precise timing.
- **Display**: Color-coded execution time in output log.
  - < 100ms: Green
  - 100ms - 500ms: Yellow
  - > 500ms: Red

### 6.6 Binary Data Handling

- **Format**: Hexadecimal string representation for display.
- **Storage**: Raw `Uint8Array` stored in state for cryptographic operations.
- **Display**: "Hex String (N bytes)" format.

### 6.7 User Interface Requirements

#### Mode Toggle Control

- **Location**: Top of playground, near algorithm selector
- **Style**: Toggle switch with labels
- **States**:
  - OFF (left) = Mock Mode (gray/blue)
  - ON (right) = WASM Mode (green/cyan)
- **Icon**: Chip/Cpu icon for WASM mode
- **Tooltip**: Explain difference between modes

#### Performance Display

- Show execution time below each operation result
- Format: `⏱️ Execution time: 123.45ms`
- Color code:
  - Green: < 100ms
  - Yellow: 100-500ms
  - Red: > 500ms

#### Loading States

- Show spinner during WASM operations
- Disable buttons during execution
- Progress indicator for long operations (> 1s)

### 6.8 Browser Compatibility

**Minimum Requirements:**

- Chrome/Edge 91+
- Firefox 89+
- Safari 15+
- WebAssembly support required

**Feature Detection:**

```typescript
const isWasmSupported = typeof WebAssembly === 'object'
if (!isWasmSupported) {
  // Force mock mode, show warning
}
```

### 6.9 Security Considerations

#### Key Storage

- Keys stored in memory only (React state)
- No persistence to localStorage (security best practice)
- Clear all keys on page reload
- No server transmission

#### Random Number Generation

- Use browser's `crypto.getRandomValues()`
- WASM libraries handle RNG internally
- No custom RNG implementation

#### Side-Channel Protection

- WASM provides some isolation from JavaScript
- Constant-time operations in WASM libraries
- No timing attack mitigation in mock mode

### 6.10 Error Messages

#### WASM-Specific Errors

- "WebAssembly not supported in this browser" → Fallback to mock mode
- "WASM module failed to load" → Check network/CDN
- "Operation timeout (>5s)" → Retry or use mock mode
- "Invalid key format" → Regenerate keys
- "Shared secret mismatch" → Check encapsulation/decapsulation keys

### 6.11 Testing Requirements

#### Unit Tests

- Test mock mode operations
- Test WASM mode operations (if available)
- Test mode switching
- Test error handling

#### Integration Tests

- Full workflow: gen → enc → dec (both modes)
- Full workflow: gen → sign → verify (both modes)
- Mode persistence across operations
- Performance measurement accuracy

#### Browser Tests

- WASM loading in all supported browsers
- Fallback behavior when WASM unavailable
- Mobile browser compatibility

### 6.12 Documentation Requirements

#### User-Facing

- Tooltip explaining Mock vs WASM modes
- Performance expectations for each mode
- "Why use WASM?" explanation
- Browser compatibility notice

#### Developer-Facing

- WASM integration guide
- Library API documentation links
- Troubleshooting common issues
- Performance optimization tips

---

## 7. Implementation Priority

### Phase 1: Mock Mode (✅ Complete)

- Simulated operations
- UI/UX foundation
- Accessibility features

### Phase 2: WASM Integration (✅ Complete)

1. Install npm packages (`mlkem-wasm`, `@openforge-sh/liboqs`)
2. Add mode toggle UI
3. Implement WASM key generation
4. Implement WASM ML-KEM operations
5. Implement WASM ML-DSA operations
6. Add performance metrics
7. Add error handling
8. Browser testing

### Phase 3: Enhancements (✅ Complete)

- Tabbed Interface
- Logging Improvements (History, Clear, Persistence)
- Data Handling (Shared Secret, Signature Editing)
- UI Polish (Scrollbars, Headers)

## 8. Error Handling

### 8.1 User Errors

- No keys generated → "Please generate keys first"
- Wrong key type selected → "Please select a [public/private] key"
- Missing shared secret → "Please encapsulate first to establish shared secret"
- Missing ciphertext → "Please encrypt data first"
- Invalid signature → Clear "INVALID" message with explanation

### 8.2 System Errors

- Operation timeout → "Operation timed out, please try again"
- Invalid state → "Invalid operation state, please refresh"
- Generic fallback → "An error occurred, please try again"

## 9. Performance Requirements

- Key generation: < 100ms (mock), < 1s (real WASM)
- Cryptographic operations: < 200ms (mock), < 2s (real WASM)
- UI responsiveness: No blocking operations
- Smooth animations: 60fps target
- Memory management: Proper cleanup of large data structures

---

## 10. Recent Updates (November 2025)

### 10.1 Key Generation Relocation (✅ Complete)

**Change:** Moved key generation controls from Settings tab to Key Store tab

**Rationale:**

- Better workflow - users generate keys where they'll see them
- Settings tab now focuses on configuration
- More intuitive user experience

**Implementation:**

- Added key generation section to `KeyStoreView` component
- Includes algorithm selection, key size dropdown, and generate button
- Compact horizontal layout for efficient space usage
- Settings tab now has "Go to Key Store" quick action button

### 10.2 Algorithm Configuration System (✅ Complete)

**Change:** Added comprehensive algorithm enable/disable configuration in Settings tab

**Features:**

- **4 Algorithm Categories:**
  1. KEM Algorithms (5 options: 3 PQC + 2 Classical)
  2. Signature Algorithms (8 options: 3 PQC + 5 Classical)
  3. Symmetric Encryption (2 options: AES-128/256-GCM)
  4. Hash Algorithms (3 options: SHA-256/384, SHA3-256)

**Visual Design:**

- Toggle buttons with checkbox icons
- Color-coded by category
- FIPS standard labels
- Quantum resistance indicators (QR)
- Disabled state for unimplemented algorithms

**Default State:**

- Only implemented algorithms enabled (ML-KEM and ML-DSA)
- All classical and additional algorithms disabled until implemented
- Reflects actual WASM capabilities

**Persistence:**

- User preferences saved in session storage
- Maintained across page refreshes

### 10.3 UI/UX Improvements (✅ Complete)

- **Tabbed Navigation:** Clearer separation of concerns
- **Resizable Columns:** Both Key Store and Logs tables support column resizing
- **Sortable Tables:** Click column headers to sort
- **Visual Feedback:** Improved hover states and transitions
- **Session Persistence:** Algorithm configuration and execution mode preferences saved

### 10.4 Documentation Updates (✅ Complete)

- Updated requirements to reflect new tab structure
- Documented algorithm configuration system
- Added implementation status for all algorithms
- Clarified which algorithms are WASM-supported vs. planned

### 10.5 Key Handling & UI Enhancements (✅ Complete)

**Change:** Improved key management and operation details.

**Features:**

- **Robust Key Handling:** Fixed "Invalid public key" errors by storing specific algorithm variants (e.g., 'ML-KEM-768') in key objects.
- **Legacy Support:** Added fallback logic to infer algorithm variants from key size for existing keys.
- **Detailed Operation Views:**
  - **Sign Tab:** Displays Algorithm, Signature Scheme (e.g., Pure ML-DSA, RSA-PSS), and Hash Function for selected keys.
  - **Encapsulate/Decapsulate Tabs:** Displays Algorithm, Scheme (e.g., ML-KEM, Ephemeral-Static ECDH), Shared Secret Size, and Derivation method (Raw Secret).
- **Classical Algorithm Support:**
  - Enabled generation of **ECDSA-P256** signing keys.
  - Confirmed support for **Ed25519** signing keys.
  - Confirmed support for **X25519** and **P-256** (ECDH) for KEM-like operations.

### 10.6 Symmetric Encryption Tab (✅ Complete)

**Change:** Added a dedicated tab for Symmetric Encryption operations.

**Features:**

- **Dedicated Tab:** "Sym Encrypt" tab added to the main navigation.
- **Key Selection:** Dropdown to select generated Symmetric Keys (AES-128-GCM, AES-256-GCM).
- **Info Display:** Shows Algorithm, Mode (GCM), and IV details (12 bytes, prepended) for the selected key.
- **Operations:**
  - **Encrypt:** Encrypts input data (Hex/ASCII) using AES-GCM. Result (IV + Ciphertext) is displayed in the Output box.
- **Decrypt:** Decrypts the content of the Output box. Result (Plaintext) is displayed in the Input box.
- **Data Handling:**
  - Supports both Hex and ASCII input/output.
  - "Cross-wired" flow (Encrypt -> Output, Decrypt -> Input) enables easy round-trip testing.

### 10.7 Hashing Tab (✅ Complete)

**Change:** Added a dedicated tab for cryptographic hashing operations.

**Features:**

- **Dedicated Tab:** "Hashing" tab added to the main navigation (positioned between "Sym Encrypt" and "Sign & Verify").
- **Hash Algorithm Selection:** Dropdown to select from 8 hash algorithms:
  - **SHA-2 Family (FIPS 180-4):**
    - SHA-256 (32 bytes) - Bitcoin, Ethereum, General Purpose
    - SHA-384 (48 bytes) - High Security Applications
    - SHA-512 (64 bytes) - Solana, HD Wallets
  - **SHA-3 Family (FIPS 202):**
    - SHA3-256 (32 bytes) - NIST Standard
    - Keccak-256 (32 bytes) - Ethereum (pre-NIST version)
  - **Legacy:**
    - RIPEMD-160 (20 bytes) - Bitcoin Hash160
  - **Modern (RFC 7693):**
    - BLAKE2b-256 (32 bytes) - High Performance
    - BLAKE2b-512 (64 bytes) - High Performance
- **Input/Output:**
  - Input data field with ASCII/Hex toggle (default: "Hello Hashing World!")
  - Hash output field (hex-encoded)
  - Copy to clipboard functionality
- **Algorithm Information:** Displays output size and use cases for selected algorithm
- **Implementation:** Uses `@noble/hashes` library (synchronous, browser-native)
- **Test Vectors:** Comprehensive test vectors from official standards (FIPS 180-4, FIPS 202, RFC 7693, ISO/IEC 10118-3)
- **Validation:** All 8 algorithms validated against official test vectors (16/16 tests passed)

### 10.8 Tab Consolidation & Enhanced Interactivity (✅ Complete)

**Change:** Merged related operations into unified tabs and added comprehensive data editing.

**Features:**

- **Merged Tabs:**
  - **KEM & Encrypt:** Combines Key Encapsulation and AES-GCM Encryption in a single view.
  - **Sign & Verify:** Combines Signing and Verification in a single view.
- **Editable Data:**
  - All inputs and outputs (Shared Secret, Ciphertext, Signature, Messages) are now **fully editable**.
  - **ASCII/HEX Toggles:** Users can view and edit data in either format.
- **Visual Verification:**
  - **Decapsulation:** "SECRET RECOVERED" (Green) vs "DECAPSULATION FAILED" (Red) indicator.
  - **Signature Verification:** "VERIFICATION OK" (Green) vs "VERIFICATION FAILED" (Red) indicator.
- **Workflow Improvement:** Reduced tab switching and enabled easier "tamper testing" (e.g., modifying a signature to see verification fail).

### 10.8 Status Bar & Metrics (✅ Complete)

**Change:** Added a global status bar for immediate feedback.

**Features:**

- **Location:** Fixed at the bottom of the screen.
- **Metrics:** Displays the last operation's execution time (e.g., "Last Op: 45ms") and key details.
- **Visuals:** Color-coded performance indicators (Green/Yellow/Red).

### 10.9 Classical Key Size Display (✅ Complete)

**Change:** Fixed the display of classical key sizes in the Key Store.

**Features:**

- **Explicit Sizes:** Keys now show their full size/curve (e.g., "RSA-2048", "ECC-P256") instead of generic names.
- **Consistency:** Matches the naming convention used for PQC keys (e.g., "ML-KEM-768").

### 10.10 Backup & Restore (✅ Complete)

**Change:** Added functionality to backup and restore keys in the Key Store.

**Features:**

- **Backup All Keys:**
  - Exports all generated keys (PQC and Classical) to a ZIP archive.
  - Filename format: `playground-keys-backup-YYYY-MM-DD.zip`.
  - Includes full key data and metadata.
- **Import ZIP:**
  - Restores keys from a previously created backup ZIP.
  - Preserves key names, types, and values.
  - Logs import success and count to the activity log.
- **UI Integration:**
  - "Backup All" button in Key Store header (disabled if empty).
  - "Import ZIP" button always visible.

---

## 11. ACVP Testing (Automated Cryptographic Validation)

> **Note**: This section was previously in `acvp_testing.md` and has been merged here as ACVP is a sub-feature of the Interactive Playground.

### 11.1 Objective

Integrate Automated Cryptographic Validation Protocol (ACVP) testing capabilities to validate the correctness of the WebAssembly (WASM) implementations of ML-KEM and ML-DSA against NIST standards (FIPS 203 and FIPS 204).

### 11.2 Scope

- **Algorithms**: ML-KEM (Key Encapsulation Mechanism) and ML-DSA (Digital Signature Algorithm)
- **Key Sizes**:
  - ML-KEM: 512, 768, 1024
  - ML-DSA: 44, 65, 87
- **Operations**:
  - ML-KEM: Encapsulate and Decapsulate
  - ML-DSA: Signature Generation and Verification
- **Test Type**: Algorithm Functional Tests (AFT) using Known Answer Tests (KATs)

### 11.3 ACVP Test Data Import

- **Mechanism**: Import ACVP test vectors from NIST standard sources
- **Source**: Test vectors derived from `usnistgov/ACVP-Server` repository
- **Constraint**: Import limited to **one** test key pair per algorithm and key size combination
  - Total imported keys: 6 pairs (3 for ML-KEM, 3 for ML-DSA)
- **Naming Convention**: `ACVP [Algorithm]-[Size] [Type]`
  - Example: `ACVP ML-KEM-768 Public Key`, `ACVP ML-DSA-44 Private Key`

### 11.4 Key Store Integration

- Imported ACVP keys stored in existing Key Store
- Selectable in Interactive Playground for manual operations
- Primary use: Automated ACVP validation tests

### 11.5 Automated Validation

**ML-KEM Validation:**

- For each key size:
  1. Use ACVP public key to **Encapsulate** shared secret
  2. Compare resulting ciphertext and shared secret against expected results
  3. Use ACVP private key and ciphertext to **Decapsulate**
  4. Verify recovered shared secret matches expected value

**ML-DSA Validation:**

- For each key size:
  1. Use ACVP private key to **Sign** a message
  2. **Verify** generated signature using corresponding public key
  3. Use ACVP public key, message, and signature to **Verify** (Known Answer Test)

> **Note**: ML-DSA signatures are probabilistic. Validation relies on verification step rather than exact binary match unless deterministic signing is enforced.

### 11.6 User Interface

**ACVP Tab:**

- New tab in main navigation: "ACVP"
- **Import Button**: "Import ACVP Test Keys"
  - Triggers loading/parsing of internal JSON test vector files
  - Populates Key Store with test keys
  - Provides feedback on imported keys
- **Run Tests Button**: Executes validation suite
- **Results Display**:
  - Summary table showing pass/fail status per algorithm and key size
  - Detailed logs in Output Log showing inputs and outputs

### 11.7 Data Sources

- **Repository**: `https://github.com/usnistgov/ACVP-Server`
- **Path**: `gen-val/json-files`
- **File Types**: `internalProjection.json` (contains inputs and expected outputs)
- **JSON Properties**:
  - `testGroups`: Test cases grouped by configuration
  - `tests`: Individual test cases with `pt`, `ct`, `ss`, `msg`, `sig`, `pk`, `sk`

### 11.8 Implementation Status

- ✅ **Completed**: 2025-11-27
- ✅ ACVP Testing tab integrated into Interactive Playground
- ✅ Real ACVP test vectors (ML-DSA FIPS 204, ML-KEM FIPS 203) imported
- ✅ ML-KEM: Uses `@openforge-sh/liboqs` for all variants (512, 768, 1024)
- ✅ ML-DSA: Uses `@openforge-sh/liboqs` for all variants (44, 65, 87)
- ✅ Automated validation suite implemented and verified (all tests pass)
