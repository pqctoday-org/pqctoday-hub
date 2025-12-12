# PQC Standards Library Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-11

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

#### 3.1 Navigation & Filtering

- **Category Filter**:
  - Users can filter the view using tabs or a dropdown:
  - **All**: Displays all documents (grouped by section).
  - **[Category Name]**: Displays only documents within that specific category.
- **Region Filter**:
  - A dropdown filter allows users to filter documents by `regionScope` (e.g., Global, US, EU, APAC).
  - **Logic**: Filters for items where the `regionScope` field contains the selected region string.
  - **Default**: "All" (shows documents from all regions).
- **Active Selection**: Visual highlight showing current selection in dropdowns.
- **Responsive Design**: Controls stack vertically on mobile devices, side-by-side on desktop.

#### 3.2 Library Table

- **Columns**:
  - **Reference ID**: Unique identifier (e.g., FIPS 203)
  - **Title**: Document name with download link
  - **Status**: Visual badge (Final, Draft, etc.)
  - **Type**: Document classification
  - **Published**: Publication date
  - **Updated**: Last update date
- **Sorting**: Click column headers to sort ascending/descending
- **Visual Design**:
  - Glass-morphism effect consistent with app theme
  - Hover effects on rows
  - Color-coded status badges
- **Download Links**: Direct links to PDF/document sources
- **Accessibility**:
  - Supports keyboard navigation (Tab, Enter, Escape)
  - Proper ARIA roles and labels
  - Screen reader friendly table structure

#### 3.3 Tree Hierarchy & Navigation

- **Dependency-Based Hierarchy**:
  - The tree structure is dynamically built based on the `dependencies` column in the source data.
  - **Logic**: If **Document A** lists **Document B** in its `dependencies` field, then **Document B** is the **Parent** and **Document A** is the **Child**.
  - This allows for multi-level nesting reflecting the standards ecosystem (e.g., Base Standard -> Profile -> Guideline).

- **Root Node Determination**:
  - Items are primarily grouped by **Category**.
  - An item is displayed as a **Root Node** (top-level item) if it is **not a child** of any other item _within that same category_.

- **Programmatic Expansion**:
  - **Default State**: The tree view initializes in a **Fully Expanded** state (`defaultExpandAll={true}`).
  - **Toggle Controls**: "Expand All" and "Collapse All" buttons are provided in the table header.
  - **Safety**: The expansion logic includes robust **Cycle Detection** (`visited` set) to prevent infinite recursion if circular dependencies exist in the data.

### 4. Technical Requirements

- **Route**: The feature is accessible at `/library`.
- **Performance**: The tree structure and sorting should handle the dataset efficiently (100+ documents).
- **Responsiveness**: The table layout should adapt to different screen sizes:
  - Desktop: Full table with all columns
  - Tablet: Condensed view with priority columns
  - Mobile: Card-based layout with expandable details
- **State Management**: Uses Zustand for category selection and sort state
- **Data Parsing**: CSV parsing with proper handling of quoted fields and special characters

## Future Considerations

- **Search**: Add a global search bar to filter documents by keyword.
- **Filter by Status**: Allow filtering by "Final", "Draft", etc.
- **Dependency Visualization**: Interactive graph showing document relationships.
- **Export**: Download filtered results as CSV or PDF.
