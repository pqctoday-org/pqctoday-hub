# PQC Timeline Application - Walkthrough

## Overview

The **PQC Timeline Application** is a premium, interactive web experience designed to visualize the global transition to Post-Quantum Cryptography. It features a regulatory timeline, algorithm comparisons with interactive testing, industry impact dashboards, and profiles of key transformation leaders.

## Features Implemented

### 1. Global Migration Timeline

- **Interactive Map/Selector**: Select from key nations (USA, UK, Germany, France, China, etc.).
- **Visual Timeline**: Animated vertical timeline showing regulatory milestones (Discovery, Testing, Migration, Deadline).
- **Data Source**: Real-world data from NIST, NCSC, BSI, ANSSI, and other bodies.

### 2. Algorithms Transition & Playground

- **Comparison View**: Clear mapping of Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) algorithms.
- **Interactive Playground**:
  - **Unified Interface**: Consolidated "KEM & Encrypt" and "Sign & Verify" tabs for streamlined workflows.
  - **Interactive Testing**: Fully editable inputs/outputs (Shared Secret, Ciphertext, Signature) with ASCII/HEX toggles for tamper testing.
  - **Visual Verification**: Clear "Success/Fail" indicators for Decapsulation and Signature Verification.
  - **Key Generation**: Generate public/private key pairs for ML-KEM and ML-DSA from a unified selection menu.
  - **WASM Integration**: Real in-browser cryptographic operations using `mlkem-wasm` and `@openforge-sh/liboqs`.

### 3. Quantum Threat Impacts

- **Dashboard**: Grid view of industries (Finance, IoT, Transport, Gov, Healthcare).
- **Risk Levels**: Visual indicators for High vs. Critical risks.
- **Threat Details**: Specific scenarios like "Harvest Now, Decrypt Later" and "Ghost Incompatibilities".

### 4. Transformation Leaders

- **Profiles**: Cards for key public (NIST, NCSC) and private (IBM, SandboxAQ) leaders.
- **Contributions**: Highlights of their role in the PQC transition.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS with CSS Variables (Quantum Theme: Dark Mode, Neon Accents, Glassmorphism).
- **Icons**: Lucide React.
- **Animations**: Framer Motion.

## How to Run

1.  Navigate to the project directory:
    ```bash
    cd pqc-timeline-app
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your browser at `http://localhost:5173`.

## Verification

- **Build**: The project builds successfully (`npm run build`).
- **Linting**: All lint errors have been resolved.
- **Responsiveness**: The layout adapts to mobile and desktop screens.
