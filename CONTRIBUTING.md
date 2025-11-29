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

### Pull Requests

1.  **Fork the repository** and create your branch from `main`.
2.  **Install dependencies**: `npm install`
3.  **Make your changes**. Ensure code style is consistent.
4.  **Run tests**:
    - Unit tests: `npm run test`
    - E2E tests: `npm run test:e2e`
5.  **Ensure linting passes**: `npm run lint`
6.  **Open a Pull Request** targeting the `main` branch.
7.  Fill out the Pull Request Template with details about your changes.

## Development Guidelines

-   **Tech Stack**: React, TypeScript, Vite, Tailwind CSS (via vanilla CSS/utility classes), Vitest, Playwright.
-   **Styling**: We use a custom "Glassmorphism" design system. Please reuse existing CSS variables and utility classes where possible.
-   **Cryptography**: Use the `useOpenSSL` hook or `liboqs` wrappers for cryptographic operations. Do not implement crypto primitives from scratch.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
