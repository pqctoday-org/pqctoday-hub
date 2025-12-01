# PQC Migration Timeline Requirements

## 1. Functional Requirements

### 1.1 Country Selection

- Users must be able to select a country from a list of available nations.
- **Interface**: Selection via a dropdown menu with search functionality.
- **Filtering**: Users can filter the Gantt chart by country name.

### 1.2 Timeline Visualization (Gantt Chart)

- **Layout**: A table-based Gantt chart with sticky columns for "Country" and "Organization".
- **Columns**:
  - **Country**: Displays the country name and flag.
  - **Organization**: Displays the organization name (text only, no logos).
  - **Years**: A horizontal timeline from 2024 to 2035. The first column is labeled **<2024** and groups all events starting before 2025.
- **Rows**: Each row represents a specific phase or milestone for a country/organization.
- **Visual Elements**:
  - **Phases**: Rendered as colored bars spanning from `StartYear` to `EndYear`.
  - **Milestones**: Rendered as **Flag markers** (🚩) at the `StartYear`.
  - **Deadlines**: Events with the category "Deadline" are treated as **Milestones** (Flags), regardless of their original type.

### 1.3 Interaction & Details

- **Popover**: Clicking a phase bar or milestone flag opens a detail popover.
- **Popover Layout**:
  - **Header**: Displays the phase title, color-coded badge, and a close button (top-left).
  - **Body**: Displays the description with automatic text wrapping for long content.
  - **Details Grid**: A 4x2 table displaying:
    - Row 1: **Start** (Year) | **End** (Year)
    - Row 2: **Source** (Link) | **Date** (Source Date)
- **Popover Sizing**:
  - **Responsive Width**: Maximum width of 36rem (576px) or 90% of viewport width, whichever is smaller.
  - **Text Wrapping**: Long descriptions automatically wrap using `break-words` to prevent overflow.
- **Popover Positioning**:
  - **Horizontal Boundary Detection**: Automatically adjusts horizontal position to prevent left/right truncation.
  - **Vertical Boundary Detection**: Flips to appear below the element when near the top of the screen to prevent top truncation.
  - **Smart Alignment**: Centers on the clicked element when space allows, aligns to edges when necessary.

### 1.4 Legend

- A legend explains the color coding for different phases (Guidance, Policy, Regulation, Research, Discovery, Testing, POC, Migration, Standardization).
- **Milestones**: Explicitly described as "Flag markers".

## 2. Data Structure

### 2.1 CSV Format

The application parses a CSV file (`timeline_MMDDYYYY.csv`) with the following columns:

- `Country`, `FlagCode`, `OrgName`, `OrgFullName`, `OrgLogoUrl`
- `Type` (Phase/Milestone), `Category` (Discovery, Migration, Deadline, etc.)
- `StartYear`, `EndYear` (Defining the duration)
- `Title`, `Description`
- `SourceUrl`, `SourceDate`

### 2.2 Data Logic

- **Phases**: Grouped by `Category`.
- **Duration**: Calculated using `StartYear` and `EndYear`.
- **Sorting Logic**:
  1.  **Start Year**: Primary sort key. All events starting **before 2025** are treated as starting in **2024** for sorting purposes.
  2.  **Type**: Secondary sort key. **Milestones** appear before **Phases** when they share the same effective start year.
  3.  **Phase Order**: Tertiary sort key based on a predefined sequence (Guidance -> Policy -> Regulation -> Research -> Discovery -> ...).
- **Overrides**: "Deadline" category is forced to be a "Milestone" type.

## 3. Supported Countries/Bodies (Data)

- **USA** (NIST, NSA, White House)
- **UK** (NCSC)
- **Germany** (BSI)
- **France** (ANSSI)
- **EU** (ENISA/Commission)
- **China** (CAC/SCA)
- **Australia** (ASD)
- **Singapore** (CSA/MAS)
- **Canada** (CCCS)
- **Netherlands** (AIVD/NCSC)
- **South Korea** (NIS)
- **Japan** (CRYPTREC/NISC)
- **Czech Republic** (NUKIB)
- **New Zealand** (GCSB)
- **Israel** (INCD)
- **Italy** (ACN)
- **Spain** (CCN)
- **G7** (Cyber Expert Group)

## 4. Testing Strategy

### 4.1 E2E Testing with Mock Data

To ensure End-to-End (E2E) tests remain stable and independent of changes to the production CSV data:

- **Mock Data Source**: Tests use `src/data/mockTimelineData.ts`, which contains a fixed set of timeline events (e.g., "Test Country", "Test Org").
- **Configuration**:
  - The `VITE_MOCK_DATA` environment variable is set to `true` in `playwright.config.ts`.
  - `src/data/timelineData.ts` conditionally loads the mock data when this flag is present.
- **Verification**: Tests assert against the known values in the mock data (e.g., checking for "Test Country" instead of dynamic production data).
