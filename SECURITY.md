# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our cryptographic implementations seriously.

If you discover a security vulnerability within this project, please **DO NOT** open a public issue.

Instead, please report it via email to `security@pqctimeline.app` (placeholder).

Please include:

- A description of the vulnerability.
- Steps to reproduce.
- Potential impact.

We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.

## Cryptographic Disclaimer

This application uses WebAssembly builds of `liboqs` and OpenSSL. While these libraries are industry standards, the WASM implementation in this browser-based environment is intended for **educational and testing purposes**.

**Do not use keys generated in this playground for production systems.** Side-channel attacks and other browser-based vulnerabilities may compromise key material.
