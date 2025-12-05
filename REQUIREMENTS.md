# PQC Timeline Application - Master Requirements

## 1. Project Overview

The goal is to build a high-end, visually stunning web application that visualizes the global transition to Post-Quantum Cryptography (PQC). The application serves as a comprehensive resource for understanding regulatory timelines, algorithm transitions, industry impacts, and key leaders in the field.

## 2. Functional Modules

The application is divided into five main modules. Detailed requirements for each are linked below:

1.  **[Migration Timeline](requirements/timeline.md)**: Visualization of global regulatory recommendations and migration phases.
2.  **[Algorithms Transition](requirements/algorithms.md)**: Comparison table showing the shift from Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) standards.
3.  **[Interactive Playground](requirements/playground.md)**: Hands-on testing environment for ML-KEM and ML-DSA cryptographic operations.
    - Includes **[ACVP Testing](requirements/acvp_testing.md)**: Automated validation against NIST test vectors.
4.  **[Quantum Threat Impacts](requirements/impacts.md)**: Dashboard showing specific risks to industries like Finance, IoT, and Government.
5.  **[Transformation Leaders](requirements/leaders.md)**: Profiles of key public and private figures driving the transition.
6.  **[PKI Learning Platform](requirements/learn.md)**: Educational modules for PKI lifecycle and Digital Assets cryptography.
7.  **[About & Feedback](requirements/about.md)**: Project information, feedback mechanisms, and Software Bill of Materials (SBOM).

## 3. Non-Functional Requirements

### 3.1 Design & Aesthetics

- **Premium Feel**: The app must have a "wow" factor.
- **Style**: Modern, tech-forward, potentially dark mode with vibrant accents (neon blues/purples/greens) representing "quantum" themes.
- **Animations**: Smooth transitions between views, staggered entrance animations, and interactive elements.
- **Glassmorphism**: Use of translucent elements to create depth.
- **Navigation**: A persistent, intuitive navigation bar to switch between the four main modules.

### 3.2 Accessibility (ADA/WCAG 2.1 Level AA)

- **Semantic HTML**: Use proper HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`)
- **ARIA Labels**: All interactive elements must have descriptive ARIA labels
- **Keyboard Navigation**: All functionality must be accessible via keyboard (Tab, Enter, Escape, Arrow keys)
- **Focus Indicators**: Visible focus states on all interactive elements
- **Screen Reader Support**: Proper ARIA roles, labels, and live regions for dynamic content
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Form Labels**: All form controls must have associated labels
- **Alternative Text**: Descriptive alt text for images, aria-hidden for decorative elements
- **Landmark Roles**: Proper ARIA landmark roles for navigation regions
- **Table Accessibility**: Tables must have captions, scope attributes, and sort state announcements

### 3.3 Tech Stack

- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox/Grid) for maximum control and performance.
- **Deployment**: Static build (ready for Netlify/Vercel).
- **Analytics**: Google Analytics 4 (GA4) with route tracking.
- **Build Info**: Static build timestamp injected at compile time.

### 3.4 User Interface

- **No Login Required**: Publicly accessible.
- **Responsive Design**: Must work seamlessly on desktop and mobile devices.

## 4. Global Data Model

The application will use a static JSON configuration. Below are the shared interfaces:

```typescript
// --- Timeline Types ---
type Phase = 'Discovery' | 'Testing' | 'POC' | 'Migration' | 'Deadline' | 'Standardization'

interface TimelineEvent {
  year: number
  quarter?: string
  phase: Phase
  title: string
  description: string
  sourceUrl: string
  sourceDate: string
}

interface RegulatoryBody {
  name: string
  fullName: string
  countryCode: string
  events: TimelineEvent[]
}

interface CountryData {
  countryName: string
  flagCode: string
  bodies: RegulatoryBody[]
}

// --- Algorithm Types ---
interface AlgorithmTransition {
  classical: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature'
  deprecationDate: string
  standardizationDate: string
}

// --- Impact Types ---
interface IndustryImpact {
  industry: string
  icon: string
  threats: string[]
  riskLevel: 'High' | 'Critical'
  description: string
}

// --- Leader Types ---
interface Leader {
  name: string
  role: string
  organization: string
  type: 'Public' | 'Private'
  contribution: string
  imageUrl?: string
}
```
