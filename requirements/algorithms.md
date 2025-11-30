# PQC Algorithms Transition Requirements

## 1. Overview

The Algorithms Transition view provides a comprehensive comparison table showing the migration from classical cryptographic algorithms (RSA, ECC) to post-quantum cryptographic (PQC) algorithms standardized by NIST.

## 2. Functional Requirements

### 2.1 Algorithm Comparison Table

- **Purpose**: Visualize the shift from Classical to PQC algorithms
- **Layout**: Responsive table with horizontal scrolling support
- **Styling**:
  - Zebra striping for improved readability
  - Center-aligned columns with generous spacing
  - Glass-morphism design consistent with app theme

### 2.2 Table Columns

1. **Function**: Type of cryptographic operation (Encryption/KEM or Signature)
2. **Classical Algorithm**: Legacy algorithm with key size
3. **PQC Alternative**: NIST-standardized replacement algorithm
4. **Transition / Deprecation**: Timeline for migration and deprecation

### 2.3 Interactive Features

- **Column Sorting**: Click column headers to sort ascending/descending
  - Function (alphabetical)
  - Classical Algorithm (alphabetical)
  - PQC Alternative (alphabetical)
  - Transition / Deprecation (chronological with special handling for formats like "2030+", "2030 (Disallowed)")
- **Column Resizing**: Drag column borders to adjust widths
  - Minimum width: 150px
  - Visual feedback on hover
  - Persistent during session
- **Sort Indicators**: Visual arrows showing current sort state
- **Accessibility**:
  - ARIA sort attributes
  - Screen reader announcements for sort state
  - Keyboard-accessible sorting

## 3. Data Structure

### 3.1 Classical Algorithms

- **RSA**: 2048-bit, 3072-bit, 4096-bit
- **ECC**: SecP 256-bit, SecP 384-bit

### 3.2 PQC Algorithms (NIST Standards)

#### KEM (Key Encapsulation) - FIPS 203

- **ML-KEM-512** (NIST Level 1)
- **ML-KEM-768** (NIST Level 3)
- **ML-KEM-1024** (NIST Level 5)

#### Signatures - FIPS 204 & 205

- **ML-DSA** (FIPS 204):
  - ML-DSA-44 (NIST Level 2)
  - ML-DSA-65 (NIST Level 3)
  - ML-DSA-87 (NIST Level 5)
- **SLH-DSA** (FIPS 205)

## 4. Transition Timeline

### Key Dates

- **2024**: NIST Standards Published (FIPS 203, 204, 205)
- **2030**: Deprecation of legacy algorithms (<112-bit security, RSA-2048 legacy use)
- **2035**: Disallowance of classical algorithms for federal systems

### Algorithm Mapping

- **Encryption/KEM**: RSA/ECC → ML-KEM
- **Signatures**: RSA/ECDSA → ML-DSA / SLH-DSA

## 5. User Interface Requirements

### 5.1 Visual Design

- Consistent with app's dark theme and glassmorphism aesthetic
- Vibrant accent colors for interactive elements
- Smooth transitions and hover effects

### 5.2 Responsive Design

- Horizontal scrolling for narrow viewports
- Maintains readability on all screen sizes
- Touch-friendly for mobile devices

### 5.3 Accessibility

- **Table Caption**: Screen-reader-only description
- **Column Headers**: Proper `scope="col"` attributes
- **Sort State**: ARIA attributes announcing current sort
- **Keyboard Navigation**: All features accessible via keyboard
- **Focus Indicators**: Visible focus states on interactive elements

## 6. Technical Implementation

### 6.1 Component Structure

- **AlgorithmComparison.tsx**: Main table component
- **algorithmsData.ts**: Static data source

### 6.2 State Management

- React hooks for column widths, sort column, sort direction
- Event handlers for resize and sort interactions

### 6.3 Performance

- Efficient sorting algorithms
- Optimized re-renders
- Smooth animations with Framer Motion

## 7. Future Enhancements

- Export table data to CSV/PDF
- Filter by function type (Encryption vs Signature)
- Search functionality
- Detailed algorithm information on row click
