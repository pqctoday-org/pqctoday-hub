# Data Migration Guide

**Status:** ✅ Current  
**Last Updated:** 2025-12-06

---

## Overview

This guide provides instructions for updating data files, migrating between application versions, and managing breaking changes in the PQC Timeline Application.

---

## 1. CSV Data File Updates

### 1.1 Timeline Data

**File Location**: `src/data/timeline_MMDDYYYY.csv`

**Update Process:**

1. Create new CSV file with current date: `timeline_12062025.csv`
2. Follow existing column structure:
   ```csv
   Country,Organization,Phase,Start,End,Milestone,Description
   ```
3. Place file in `src/data/` directory
4. Application automatically detects and loads most recent file by date

**Column Requirements:**

- **Country**: Full country name (e.g., "United States")
- **Organization**: Government agency or organization
- **Phase**: Phase name (e.g., "Assessment", "Planning", "Implementation")
- **Start**: Start date in `YYYY-MM-DD` format
- **End**: End date in `YYYY-MM-DD` format (optional for milestones)
- **Milestone**: Boolean (`true`/`false`) - whether this is a milestone event
- **Description**: Detailed description of the phase or milestone

**Validation:**

```bash
# Verify CSV format
npm run validate:timeline

# Preview changes
npm run dev
# Navigate to /timeline
```

---

### 1.2 Library Data (Standards)

**File Location**: `src/data/library_MMDDYYYY.csv`

**Update Process:**

1. Create new CSV file: `library_12062025.csv`
2. Follow column structure:
   ```csv
   Reference,Title,URL,Published,Updated,Status,Type,Dependencies,Category
   ```
3. Place in `src/data/` directory

**Column Requirements:**

- **Reference**: Unique ID (e.g., "FIPS 203", "RFC 8446")
- **Title**: Document title
- **URL**: Direct link to PDF or document
- **Published**: Publication date (`YYYY-MM-DD`)
- **Updated**: Last update date (`YYYY-MM-DD`)
- **Status**: "Final", "Draft", "Deprecated"
- **Type**: "Algorithm", "Protocol", "Guidance", "Standard"
- **Dependencies**: Semicolon-separated list of Reference IDs (e.g., "FIPS 203;FIPS 204")
- **Category**: Auto-derived, can be left empty

**Special Characters:**

- Use quotes for fields containing commas: `"ML-KEM, ML-DSA, SLH-DSA"`
- Escape quotes with double quotes: `"The ""Final"" Standard"`

---

### 1.3 Threat Data

**File Location**: `src/data/quantum_threats_hsm_industries_YYYYMMDD.csv`

**Update Process:**

1. Create new CSV file: `quantum_threats_hsm_industries_20251206.csv`
2. Follow column structure:
   ```csv
   Industry,Threat ID,Description,Criticality,Crypto at Risk,PQC Replacement,Source
   ```

**Column Requirements:**

- **Industry**: Target sector (e.g., "Financial Services / Banking")
- **Threat ID**: Unique identifier (e.g., "FIN-001")
- **Description**: Detailed threat description
- **Criticality**: "Critical", "High", "Medium", "Low"
- **Crypto at Risk**: Current vulnerable algorithms
- **PQC Replacement**: Recommended PQC algorithms
- **Source**: Citation or reference (no URLs)

**Note**: URL field was explicitly excluded from this dataset.

---

### 1.4 Leaders Data

**File Location**: `src/data/leaders.csv`

**Update Process:**

1. Edit existing `leaders.csv` file
2. Follow column structure:
   ```csv
   Name,Title,Organization,Sector,Contribution,Website,LinkedIn
   ```

**Column Requirements:**

- **Name**: Full name with title (e.g., "Dr. Dustin Moody")
- **Title**: Current position
- **Organization**: Affiliated institution/company
- **Sector**: "Public", "Private", "Academic"
- **Contribution**: Brief description of PQC work
- **Website**: Organization or personal website URL
- **LinkedIn**: LinkedIn profile URL

---

## 2. Version Migration

### 2.1 Breaking Changes Policy

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (data format changes, API changes)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### 2.2 Migration Checklist

When upgrading across major versions:

- [ ] Review CHANGELOG.md for breaking changes
- [ ] Backup current data files
- [ ] Update CSV files to new format (if required)
- [ ] Clear browser cache and localStorage
- [ ] Test with mock data first (`VITE_MOCK_DATA=true`)
- [ ] Verify all features work as expected

### 2.3 LocalStorage Migration

**Key Store Backup:**

```javascript
// Export current keys before upgrade
localStorage.getItem('playground-keys')
localStorage.getItem('openssl-studio-files')
localStorage.getItem('theme-preference')
```

**After Upgrade:**

- Theme preference should persist automatically
- Key store may need manual backup/restore
- Use "Backup All" feature in Playground before upgrading

---

## 3. Data File Naming Conventions

### 3.1 Date Formats

| File Type | Format                                        | Example                                       |
| --------- | --------------------------------------------- | --------------------------------------------- |
| Timeline  | `timeline_MMDDYYYY.csv`                       | `timeline_12062025.csv`                       |
| Library   | `library_MMDDYYYY.csv`                        | `library_12062025.csv`                        |
| Threats   | `quantum_threats_hsm_industries_YYYYMMDD.csv` | `quantum_threats_hsm_industries_20251206.csv` |

**Why Different Formats?**

- Timeline/Library: Legacy format, maintained for consistency
- Threats: ISO-style format for better sorting

### 3.2 File Detection Logic

Application automatically loads the most recent file by:

1. Scanning `src/data/` directory
2. Parsing date from filename
3. Loading file with latest date

**Manual Override:**

```typescript
// In src/config.ts
export const DATA_FILES = {
  timeline: 'timeline_12062025.csv',
  library: 'library_12062025.csv',
  threats: 'quantum_threats_hsm_industries_20251206.csv',
}
```

---

## 4. Testing Data Changes

### 4.1 Validation Scripts

```bash
# Validate all CSV files
npm run validate:data

# Validate specific file
npm run validate:timeline
npm run validate:library
npm run validate:threats
```

### 4.2 Preview Changes Locally

```bash
# Start dev server
npm run dev

# Navigate to affected feature
# - Timeline: http://localhost:5175/timeline
# - Library: http://localhost:5175/library
# - Threats: http://localhost:5175/threats
```

### 4.3 E2E Testing with New Data

```bash
# Run E2E tests with new data
npm run test:e2e

# Run specific feature test
npx playwright test e2e/timeline.spec.ts
```

---

## 5. Deployment Process

### 5.1 Pre-Deployment Checklist

- [ ] Update data files with current date
- [ ] Run validation scripts
- [ ] Test locally with new data
- [ ] Run full E2E test suite
- [ ] Update CHANGELOG.md
- [ ] Commit with descriptive message

### 5.2 Deployment Steps

```bash
# 1. Update data files
cp new_data/timeline_12062025.csv src/data/

# 2. Validate
npm run validate:data

# 3. Test
npm run test:e2e

# 4. Build
npm run build

# 5. Commit and push
git add src/data/
git commit -m "data: update timeline data for December 2025"
git push origin main

# 6. GitHub Actions will automatically deploy to GitHub Pages
```

### 5.3 Rollback Procedure

If deployment fails or data is incorrect:

```bash
# 1. Revert commit
git revert HEAD

# 2. Push revert
git push origin main

# 3. Or restore previous data file
git checkout HEAD~1 -- src/data/timeline_MMDDYYYY.csv
git commit -m "data: rollback to previous timeline data"
git push origin main
```

---

## 6. Common Issues and Solutions

### 6.1 CSV Parsing Errors

**Issue**: Commas in data fields break parsing

**Solution**: Wrap fields in quotes

```csv
"Description with, commas, in it",Value2,Value3
```

### 6.2 Date Format Errors

**Issue**: Dates not recognized

**Solution**: Use `YYYY-MM-DD` format consistently

```csv
2025-12-06  ✅ Correct
12/06/2025  ❌ Incorrect
Dec 6, 2025 ❌ Incorrect
```

### 6.3 File Not Loading

**Issue**: New data file not detected

**Solution**:

1. Verify filename matches pattern exactly
2. Check date is in correct format
3. Clear browser cache
4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### 6.4 Special Characters

**Issue**: Special characters (quotes, newlines) in CSV

**Solution**:

```csv
"Field with ""quotes""",Normal Field
"Field with
newline",Normal Field
```

---

## 7. Data Schema Reference

### 7.1 Timeline Schema

```typescript
interface TimelineEvent {
  country: string
  organization: string
  phase: string
  start: string // YYYY-MM-DD
  end?: string // YYYY-MM-DD
  milestone: boolean
  description: string
}
```

### 7.2 Library Schema

```typescript
interface LibraryDocument {
  reference: string
  title: string
  url: string
  published: string // YYYY-MM-DD
  updated: string // YYYY-MM-DD
  status: 'Final' | 'Draft' | 'Deprecated'
  type: 'Algorithm' | 'Protocol' | 'Guidance' | 'Standard'
  dependencies: string[] // Parsed from semicolon-separated
  category?: string // Auto-derived
}
```

### 7.3 Threat Schema

```typescript
interface ThreatData {
  industry: string
  threatId: string
  description: string
  criticality: 'Critical' | 'High' | 'Medium' | 'Low'
  cryptoAtRisk: string
  pqcReplacement: string
  source: string
}
```

---

## 8. Best Practices

### 8.1 Data Updates

- ✅ Update data files monthly or when new information available
- ✅ Use descriptive commit messages
- ✅ Test locally before deploying
- ✅ Keep old data files for reference (git history)
- ✅ Document significant changes in CHANGELOG.md

### 8.2 File Management

- ✅ One data file per month (don't update existing files)
- ✅ Use consistent date formats
- ✅ Validate CSV before committing
- ✅ Keep file sizes reasonable (< 1MB)

### 8.3 Version Control

- ✅ Commit data files separately from code changes
- ✅ Use conventional commit format: `data: update timeline for Dec 2025`
- ✅ Tag releases with version numbers
- ✅ Maintain CHANGELOG.md

---

## 9. Support and Resources

### 9.1 Documentation

- [CSV Format Specification](https://datatracker.ietf.org/doc/html/rfc4180)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### 9.2 Tools

- **CSV Validator**: [csvlint.io](https://csvlint.io/)
- **Date Formatter**: [dateutil.net](https://dateutil.net/)
- **Git GUI**: GitHub Desktop, SourceTree

### 9.3 Getting Help

- **Issues**: [GitHub Issues](https://github.com/pqctoday/pqc-timeline-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pqctoday/pqc-timeline-app/discussions)
- **Email**: submitchangerequest@pqctoday.com

---

## Summary

This migration guide covers:

- ✅ CSV data file update procedures
- ✅ Version migration checklists
- ✅ Data validation and testing
- ✅ Deployment and rollback procedures
- ✅ Common issues and solutions
- ✅ Data schema reference

Always test data changes locally before deploying to production!
