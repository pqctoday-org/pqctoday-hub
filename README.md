# PQC Timeline App

Test your PQC readiness with this interactive web application visualizing the global transition to Post-Quantum Cryptography.

## Features

- **Migration Timeline**: Visualization of global regulatory recommendations and migration phases
- **Algorithm Comparison**: Comparison table showing the shift from Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) standards
- **Interactive Playground**: Hands-on testing environment for ML-KEM and ML-DSA cryptographic operations
  - WASM-powered real cryptography using `@openforge-sh/liboqs`
  - Key Store with sortable/resizable columns and detailed inspection
  - ACVP Testing: Automated validation against NIST test vectors
- **Quantum Threat Impacts**: Dashboard showing specific risks to industries
- **Transformation Leaders**: Profiles of key figures driving the transition

## Tech Stack

- React + TypeScript + Vite
- WebAssembly (liboqs) for real cryptographic operations
- Vanilla CSS for styling

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Development

This project uses Vite with HMR and ESLint. See the original Vite template documentation below for advanced configuration options.

---

### Vite Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
