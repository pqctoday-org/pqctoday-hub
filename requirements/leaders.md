# Transformation Leaders Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-06

## 1. Functional Requirements

### 1.1 Leaders View

- A section highlighting key individuals and organizations driving the PQC transition.
- **Grid Layout**: Responsive 3-column grid (1 column on mobile, 2 on tablet, 3 on desktop)
- **Profile Cards**: Each card includes:
  - **Avatar/Headshot**: Professional initial-based avatars with color-coding
    - Cyan/Primary color for Public Sector
    - Purple color for Private Sector
    - Emerald color for Academic Sector
  - **Sector Badge**: Visual indicator (Public / Private / Academic)
  - **Name**: Leader's full name with title (Dr., etc.)
  - **Role**: Current position/title
  - **Organization**: Affiliated institution/company
  - **Contribution**: Brief description of their PQC-related work
  - **Social Links**: Clickable buttons for:
    - **Website**: Organization or personal website/blog
    - **LinkedIn**: Professional profile
    - **Key Resource**: Direct link to a significant contribution or paper
- **Visual Design**:
  - Glass-morphism effect with hover animations
  - Proper spacing and typography hierarchy
  - Icons for role and organization
  - Responsive hover effects on cards and links

### 1.2 Social Integration

- **Website Links**: Globe icon, cyan-themed styling
- **LinkedIn Links**: LinkedIn icon, blue-themed styling
- **Icon Sizing**: 14px × 14px for optimal readability
- **Link Behavior**: Opens in new tab with proper security attributes

## 2. Leaders Data Points

### Public Sector Leaders

- **NIST (USA)**:
  - **Dr. Dustin Moody**: PQC Standardization Lead
    - Leads the global effort to evaluate and standardize post-quantum cryptographic algorithms (FIPS 203/204/205)
    - Website: https://csrc.nist.gov/projects/post-quantum-cryptography
    - LinkedIn: Available
- **NCSC (UK)**:
  - **Ollie Whitehouse**: Chief Technical Officer
    - Driving the UK's strategic roadmap for PQC migration and industry preparedness
    - Website: https://www.ncsc.gov.uk/whitepaper/next-steps-pqc
    - LinkedIn: Available
- **ANSSI (France)**:
  - **Jérôme Plût**: Cryptographer
    - Key figure in defining France's hybrid transition strategy and national security requirements
    - Website: https://www.ssi.gouv.fr/en/
    - LinkedIn: Available

### Private Sector Leaders

- **IBM**:
  - **Mark Hughes**: Security Executive
    - Advocate for Cryptographic Bill of Materials (CBOM) and leader in IBM's quantum-safe initiatives
    - Website: https://www.ibm.com/quantum/quantum-safe
    - LinkedIn: Available
- **SandboxAQ**:
  - **Jack Hidary**: CEO
    - Pioneering the intersection of AI and Quantum security to help enterprises manage the PQC transition
    - Website: https://www.sandboxaq.com/
    - LinkedIn: Available
- **Post-Quantum**:
  - **Andersen Cheng**: CEO
    - Coined the term "Harvest Now, Decrypt Later" and advocates for immediate action on data privacy
    - Website: https://www.post-quantum.com/
    - LinkedIn: Available
- **PQShield**:
  - **Dr. Ali El Kaafarani**: CEO
    - Leading the development of hardware and software PQC solutions and contributing to NIST standards
    - Website: https://pqshield.com/
    - LinkedIn: Available

## 3. Implementation Details

### 3.1 Avatar Generation

- Using `ui-avatars.com` API for consistent, themed avatars
- Parameters:
  - Name-based initials
  - Dark background (#0b0d17)
  - Sector-specific colors (cyan for public, purple for private, emerald for academic)
  - 128px size for high quality
  - Bold text

### 3.2 Card Styling

- Glass panel effect with backdrop blur
- Border animations on hover
- Flexbox layout for consistent card heights
- Proper content hierarchy with visual separators
- Responsive padding and spacing

### 3.3 Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Screen reader friendly labels
