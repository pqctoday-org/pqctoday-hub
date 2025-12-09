# About Section Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-08

## Overview

The **About** section serves as a central hub for user interaction, transparency, and project information. It provides users with context about the project, mechanisms to provide feedback, and detailed information about the software supply chain.

## Features

### 1. Project Bio & Introduction

- **Purpose**: Introduce PQC Today and its mission.
- **Content**:
  - Brief description of the project's goal (tracking PQC transition).
  - Mission statement (demystifying quantum threats).
  - **Social Proof**: Link to the creator's LinkedIn profile (Eric Amador).

### 2. Submit Change Request Form

- **Purpose**: Allow users to submit structured feedback, feature requests, or bug reports.
- **Mechanism**: Client-side `mailto` link generation (no backend required).
- **Target Email**: `submitchangerequest@pqctoday.com`
- **Fields**:
  - **User Type** (Dropdown): Technical, Sales, Marketing, Curious.
  - **Feature** (Dropdown): Timeline, Algorithms, Library, Playground, OpenSSL Studio, Threats, Leaders.
  - **Subfeature** (Dropdown): Dynamic list based on selected Feature.
  - **Category** (Dropdown): Feature Request, Bug Report, Content Update, Other.
  - **Description** (Textarea): Free-form text.

### 3. Give Kudos Form

- **Purpose**: Capture positive feedback and constructive criticism.
- **Mechanism**: Client-side `mailto` link generation.
- **Target Email**: `kudos@pqctoday.com`
- **Fields**:
  - **What do you like?** (Checkboxes): Multi-select from feature list.
  - **What can we improve?** (Checkboxes): Multi-select from feature list.
  - **Get rid of it!** (Checkboxes): Multi-select from feature list (for negative feedback).
  - **Message** (Textarea): Free-form text.

### 4. Software Bill of Materials (SBOM)

- **Purpose**: Provide transparency regarding the open-source components used in the application.
- **Format**: Categorized list with Version and Release Date for each component.
- **Categories**:
  - **UI Frameworks & Libraries**: React, Framer Motion, Lucide React, clsx.
  - **Cryptography & PQC**:
    - **OpenSSL**: v3.5.4 (Custom Emscripten build).
    - **liboqs**: v0.14.3 (Clarified usage: ML-DSA, ML-KEM).
    - **mlkem-wasm**, **openssl-wasm**, **pqcrypto**, **noble-hashes**.
  - **State Management**: Zustand.
  - **Analytics**: React GA4.
  - **Build & Development**: Vite, TypeScript, ESLint, Prettier.
  - **Testing**: Vitest, Playwright, Testing Library.

### 5. AI Technology Acknowledgment

- **Purpose**: Transparently disclose the use of AI in the project's lifecycle.
- **Content**: Acknowledgment of tools used (Google Antigravity, ChatGPT, Claude AI, Perplexity, Gemini Pro) and a disclaimer about potential errors.

## Technical Implementation

- **Component**: `src/components/About/AboutView.tsx`
- **Routing**: Accessible via `/about` route and navigation menu.
- **Styling**: Uses the project's glassmorphism design system (`glass-panel`).
- **Accessibility**:
  - All form inputs must have associated `<label>` elements.
  - Grouped checkboxes must use semantic grouping or descriptive text.
