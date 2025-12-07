# Contributing to PQC Timeline App

Thank you for your interest in contributing to the PQC Timeline App! We welcome contributions from the community to help visualize the transition to Post-Quantum Cryptography.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1.  Check the [Issues](https://github.com/pqctoday/pqc-timeline-app/issues) to see if the bug has already been reported.
2.  If not, open a new issue with a clear title and description.
3.  Include steps to reproduce, expected behavior, and screenshots if applicable.

### Suggesting Enhancements

1.  Open a new issue with the "enhancement" label.
2.  Describe the feature you would like to see and why it would be useful.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Linting and Formatting

We use ESLint for linting and Prettier for formatting.

```bash
# Run linting
npm run lint

# Run formatting check
npm run format:check

# Fix formatting issues
npm run format
```

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

### Pull Requests

1.  **Fork the repository** and create your branch from `main`.
2.  **Make your changes**. Ensure code style is consistent.
3.  **Open a Pull Request** targeting the `main` branch.
4.  Fill out the Pull Request Template with details about your changes.

## Development Guidelines

- **Tech Stack**: React, TypeScript, Vite, Tailwind CSS (via vanilla CSS/utility classes), Vitest, Playwright.
- **Styling**: We use a custom "Glassmorphism" design system. Please reuse existing CSS variables and utility classes where possible.
- **Cryptography**: Use the `useOpenSSL` hook or `liboqs` wrappers for cryptographic operations. Do not implement crypto primitives from scratch.

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.
