# PQC Standards Library Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-16

## Overview

The **PQC Standards Library** is a feature designed to provide users with a comprehensive, organized, and interactive view of Post-Quantum Cryptography (PQC) standards, drafts, and related documents. It serves as a central repository for tracking the status and dependencies of various PQC initiatives.

## Core Features

### 1. Data Source & Ingestion

- **Source**: The system ingests data from a CSV file (e.g., `library_MMDDYYYY.csv`).
- **Dynamic Loading**: The application automatically detects and loads the most recent version of the library CSV file based on the date in the filename.
- **Error Handling**: Graceful error state display when data files are missing or corrupt.
- **Data Fields**:
  - Reference ID (e.g., FIPS 203)
  - Document Title
  - Download URL
  - Publication & Update Dates
  - Status (e.g., Final, Draft)
  - Document Type (Algorithm, Protocol, Guidance, etc.)
  - Dependencies (semicolon-separated list of Reference IDs)
  - Category (Derived or manual via `manual_category` field)

### 2. Categorization & Grouping

Documents are categorized into the following sections based on their metadata (Title, Type):

- **Digital Signature**: Signature algorithms (e.g., ML-DSA, SLH-DSA).
- **KEM**: Key Encapsulation Mechanisms (e.g., ML-KEM).
- **PKI Certificate Management**: Documents related to X.509, PKI, and certificates.
- **Protocols**: Security protocols like TLS, SSH, IKEv2.
- **General Recommendations**: Policy, guidance, and terminology documents.

**Auto-Detection Rules**: Categories are detected using `documentTitle` and `documentType` fields:

| Category                       | Detection Keywords                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **PKI Certificate Management** | Type contains "pki" or "certificate", OR title contains "x.509"                            |
| **Protocols**                  | Type is "protocol", OR title contains "tls", "ssh", "ikev2", "cms", "ipsec"                |
| **KEM**                        | Title contains "kem", "kyber", "key-encapsulation" AND type is "algorithm" or "pki"        |
| **Digital Signature**          | Title contains "signature", "dsa", "dilithium", "sphincs" AND type is "algorithm" or "pki" |
| **General Recommendations**    | Fallback when no other category matches                                                    |

**Multi-Category Support**: Documents can belong to multiple categories when they match multiple rules. For example:

- `Algorithm Identifiers for ML-KEM in X.509 PKI` → **PKI Certificate Management + KEM**
- `Composite ML-DSA for Use in X.509 PKI and CMS` → **PKI Certificate Management + Protocols + Digital Signature**

Items appear in ALL applicable category sections in the UI.

**Category Alias Mapping**: CSV `manual_category` values are mapped to UI categories:

- `General PQC Migration` → `General Recommendations`
- `Government Guidance` → `General Recommendations`
- `PQC Protocol Specification` → `Protocols`
- `PQC Certificate Standard` → `PKI Certificate Management`

### 3. User Interface (UI)

#### 3.1 Navigation & Filtering

- **Unified Control Bar**:
  - Implements a single-row layout consistent with the Threats dashboard.
  - **Filters**: "Ghost"-style dropdowns for **Category** and **Region**.
  - **Search**: Integrated search input with 200ms debounce for real-time document filtering.
- **Responsive Design**:
  - **Desktop**: Single row [Category] [Region] [Search].
  - **Mobile**: Stacked layout with filters on one row and search below.

#### 3.2 Library Table

- **Columns**:
  - **Reference ID**: Unique identifier (e.g., FIPS 203)
  - **Title**: Document name with download link
  - **Status**: Visual badge (Final, Draft, etc.)
  - **Type**: Document classification
  - **Published**: Publication date
  - **Updated**: Last update date
- **Sorting**: Click column headers to sort ascending/descending (memoized for performance)
- **Visual Design**:
  - Glass-morphism effect consistent with app theme
  - Hover effects on rows
  - Color-coded status badges
- **Download Links**: Direct links to PDF/document sources
- **Accessibility**:
  - Supports keyboard navigation (Tab, Enter, Escape)
  - Proper ARIA roles and labels (`aria-sort`, `aria-expanded`, `aria-controls`)
  - Search input with `aria-label` for screen readers
  - Screen reader friendly table structure

#### 3.3 Detail Popover

- **Modal Dialog**: Displays document details in a centered popover
- **Accessibility**:
  - Focus trap to keep keyboard focus within dialog
  - Escape key closes the dialog
  - Visible close button (X) in header
  - `role="dialog"` and `aria-modal="true"` for screen readers
- **Content**: Description, status, authors, dates, region, urgency, and download link

#### 3.4 Tree Hierarchy & Navigation

- **Dependency-Based Hierarchy**:
  - The tree structure is dynamically built based on the `dependencies` column in the source data.
  - **Logic**: If **Document A** lists **Document B** in its `dependencies` field, then **Document B** is the **Parent** and **Document A** is the **Child**.
  - This allows for multi-level nesting reflecting the standards ecosystem (e.g., Base Standard -> Profile -> Guideline).

- **Root Node Determination**:
  - Items are primarily grouped by **Category**.
  - An item is displayed as a **Root Node** (top-level item) if it is **not a child** of any other item _within that same category_.

- **Programmatic Expansion**:
  - **Default State**: The tree view initializes in a **Fully Expanded** state (`defaultExpandAll={true}`).
  - **Toggle Controls**: "Expand All" and "Collapse All" buttons with `aria-controls` linking to the table.
  - **Safety**: The expansion logic includes robust **Cycle Detection** (`visited` set) to prevent infinite recursion if circular dependencies exist in the data.

### 4. Technical Requirements

- **Route**: The feature is accessible at `/library`.
- **Performance**:
  - Memoized sorting for efficient re-renders
  - Debounced search to prevent lag during typing
  - Tree structure handles 100+ documents efficiently
- **Responsiveness**: The table layout should adapt to different screen sizes:
  - Desktop: Full table with all columns
  - Tablet: Condensed view with priority columns
  - Mobile: Card-based layout with expandable details
- **State Management**: React local state for filtering and expansion
- **Data Parsing**: CSV parsing with proper handling of quoted fields and special characters
- **Dependencies**: `react-focus-lock` for dialog focus management

## Future Considerations

- ~~**Search**: Add a global search bar to filter documents by keyword.~~ ✅ Implemented
- **Filter by Status**: Allow filtering by "Final", "Draft", etc.
- **Dependency Visualization**: Interactive graph showing document relationships.
- **Export**: Download filtered results as CSV or PDF.
