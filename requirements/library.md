# PQC Standards Library Requirements

## Overview

The **PQC Standards Library** is a feature designed to provide users with a comprehensive, organized, and interactive view of Post-Quantum Cryptography (PQC) standards, drafts, and related documents. It serves as a central repository for tracking the status and dependencies of various PQC initiatives.

## Core Features

### 1. Data Source & Ingestion

- **Source**: The system ingests data from a CSV file (e.g., `library_MMDDYYYY.csv`).
- **Dynamic Loading**: The application automatically detects and loads the most recent version of the library CSV file based on the date in the filename.
- **Data Fields**:
  - Reference ID (e.g., FIPS 203)
  - Document Title
  - Download URL
  - Publication & Update Dates
  - Status (e.g., Final, Draft)
  - Document Type (Algorithm, Protocol, Guidance, etc.)
  - Dependencies (semicolon-separated list of Reference IDs)
  - Category (Derived)

### 2. Categorization & Grouping

Documents are automatically categorized into the following sections based on their metadata (Title, Type):

- **Digital Signature**: Signature algorithms (e.g., ML-DSA, SLH-DSA).
- **KEM**: Key Encapsulation Mechanisms (e.g., ML-KEM).
- **PKI Certificate Management**: Documents related to X.509, PKI, and certificates.
- **Protocols**: Security protocols like TLS, SSH, IKEv2.
- **General Recommendations**: Policy, guidance, and terminology documents.

### 3. User Interface (UI)

#### Tabbed Navigation

- Users can filter the view using tabs:
  - **All**: Displays all documents (grouped by section).
  - **[Category Name]**: Displays only documents within that specific category.

### 3.2. Library Table

- **Columns**:
- **Accessibility**: Supports keyboard navigation (Escape to close) and has proper ARIA roles.

### 4. Technical Requirements

- **Route**: The feature is accessible at `/library`.
- **Performance**: The tree structure and sorting should handle the dataset efficiently.
- **Responsiveness**: The table layout should adapt to different screen sizes.

## Future Considerations

- **Search**: Add a global search bar to filter documents by keyword.
- **Filter by Status**: Allow filtering by "Final", "Draft", etc.
