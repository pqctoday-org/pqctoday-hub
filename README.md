# PQC Timeline App

Test your PQC readiness with this interactive web application visualizing the global transition to Post-Quantum Cryptography.

## Features

- **Migration Timeline**: Visualization of global regulatory recommendations and migration phases
- **Algorithm Comparison**: Comparison table showing the shift from Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) standards
- **Interactive Playground**: Hands-on testing environment for ML-KEM and ML-DSA cryptographic operations
  - WASM-powered real cryptography using `@openforge-sh/liboqs`
  - Key Store with sortable/resizable columns and detailed inspection
  - ACVP Testing: Automated validation against NIST test vectors
- **OpenSSL Studio**: A fully simulated OpenSSL workbench in the browser
  - Generate keys, CSRs, and certificates using a familiar CLI-like interface
  - Support for both Classical (RSA, EC) and Post-Quantum (ML-KEM, ML-DSA) algorithms
  - File manager for handling generated artifacts
- **Quantum Threat Impacts**: Dashboard showing specific risks to industries
- **Transformation Leaders**: Profiles of key figures driving the transition

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Cryptography**: WebAssembly (liboqs) for real cryptographic operations
- **Styling**: Vanilla CSS with a custom "Glassmorphism" design system
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pqc-timeline-app.git
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

# Run Tests
npm run test
```

## Architecture Overview

The application is structured into several key components:

-   **`src/components/Algorithms/InteractivePlayground`**: The core interactive component allowing users to generate keys, sign/verify messages, and encapsulate/decapsulate secrets.
-   **`src/wasm`**: Contains TypeScript wrappers for the underlying WebAssembly cryptographic libraries (`liboqs`).
-   **`src/components/OpenSSLStudio`**: A simulated OpenSSL workbench for advanced users.
-   **`src/utils`**: Utility functions for data conversion and common operations.

## Project Structure

```
src/
├── components/       # React components
│   ├── ACVP/         # Automated Cryptographic Validation Protocol testing
│   ├── Algorithms/   # Interactive Playground and Algorithm details
│   ├── Impacts/      # Impact Dashboard
│   ├── OpenSSLStudio/# OpenSSL Workbench simulation
│   └── Playground/   # Shared Playground components (KeyStore, DataInput)
├── data/             # Static data (timelines, test vectors)
├── wasm/             # WASM integration and wrappers
├── utils/            # Helper functions
└── types.ts          # Global TypeScript definitions
```

## License

[MIT](LICENSE)
