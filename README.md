# PQC Timeline App

Test your PQC readiness with this interactive web application visualizing the global transition to Post-Quantum Cryptography.

## Features

- **Migration Timeline**: Global regulatory recommendations and migration phases visualization
- **Algorithm Comparison**: Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) transition table
- **Interactive Playground**: Hands-on cryptographic testing environment
  - Real WASM-powered cryptography (`@openforge-sh/liboqs`)
  - Key Store with sortable/resizable columns
  - ACVP Testing against NIST test vectors
- **OpenSSL Studio**: Browser-based OpenSSL workbench
  - CLI-like interface for keys, CSRs, and certificates
  - Classical (RSA, EC) and Post-Quantum (ML-KEM, ML-DSA, SLH-DSA) support
  - Virtual file system and artifact management
- **PKI Learning Platform**: Interactive PKI lifecycle education
  - 4-step PKI Workshop (CSR → Root CA → Certificate Issuance → Parsing)
  - X.509 profile-based certificate generation
  - Support for both classical and post-quantum algorithms
- **Digital Assets Program**: Blockchain cryptography deep-dive
  - Bitcoin (BTC): secp256k1, P2PKH/SegWit addresses, ECDSA signing
  - Ethereum (ETH): Keccak-256, EIP-55 addresses, EIP-1559 transactions
  - Solana (SOL): Ed25519, Base58 addresses, EdDSA signing
  - HD Wallet: BIP32/39/44 multi-chain derivation
- **Standards Library**: Comprehensive PQC standards repository
  - NIST FIPS documents (203, 204, 205)
  - Protocol specifications (TLS, SSH, IKEv2)
  - Categorized by algorithm type and use case
- **Quantum Threat Impacts**: Industry-specific quantum threat analysis
- **Transformation Leaders**: Profiles of key PQC transition figures

> 📋 See [REQUIREMENTS.md](REQUIREMENTS.md) for detailed specifications of each feature.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Cryptography**: WebAssembly (liboqs) for real cryptographic operations
- **Styling**: Tailwind CSS 4 with custom design system
- **Testing**: Vitest + React Testing Library + Playwright

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/pqctoday/pqc-timeline-app.git
   cd pqc-timeline-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

Build the application for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Contributing

We welcome contributions! Please follow these steps:

1.  **Fork the repository**.
2.  **Create a feature branch**: `git checkout -b feature/my-new-feature`.
3.  **Commit your changes**: `git commit -m 'Add some feature'`.
4.  **Push to the branch**: `git push origin feature/my-new-feature`.
5.  **Open a Pull Request**.

### Testing & Linting

Before submitting a PR, please ensure all tests and lint checks pass:

```bash
# Run Linting
npm run lint

# Run Unit Tests
npm run test

# Run End-to-End Tests
npm run test:e2e
```

## Architecture Overview

The application is structured into several key components:

- **`src/components/Algorithms/InteractivePlayground`**: The core interactive component allowing users to generate keys, sign/verify messages, and encapsulate/decapsulate secrets.
- **`src/wasm`**: Contains TypeScript wrappers for the underlying WebAssembly cryptographic libraries (`liboqs`).
- **`src/components/OpenSSLStudio`**: A simulated OpenSSL workbench for advanced users.
- **`src/utils`**: Utility functions for data conversion and common operations.

## Project Structure

```
src/
├── components/          # React components
│   ├── About/           # About page and feedback forms
│   ├── ACVP/            # Automated Cryptographic Validation Protocol testing
│   ├── Algorithms/      # Algorithm comparison table
│   ├── Leaders/         # PQC transformation leaders profiles
│   ├── Layout/          # Main layout and navigation components
│   ├── Leaders/         # PQC transformation leaders profiles
│   ├── Library/         # PQC standards library
│   ├── OpenSSLStudio/   # OpenSSL workbench simulation
│   ├── PKILearning/     # PKI Workshop educational module
│   ├── Playground/      # Interactive cryptography playground
│   ├── Threats/         # Industry-specific threat analysis
│   ├── Timeline/        # Migration timeline visualization
│   └── ui/              # Reusable UI components (Button, Card, etc.)
├── data/                # Static data (timelines, test vectors, profiles)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and helpers
├── services/            # OpenSSL service and WASM integration
├── store/               # Zustand state management stores
├── styles/              # Global CSS and design system
├── utils/               # Helper functions
└── types.ts             # Global TypeScript definitions
```

## License

[GPL-3.0](LICENSE)

---

<p align="center">
  Built with <strong>Google Antigravity</strong> 🚀
</p>
