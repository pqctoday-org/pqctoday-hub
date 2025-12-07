# Accessibility Requirements

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-06

## Overview

The PQC Timeline Application is committed to meeting **WCAG 2.1 Level AA** accessibility standards to ensure the application is usable by all users, including those with disabilities. This document consolidates all accessibility requirements across the application.

---

## 1. Core Accessibility Standards

### 1.1 Compliance Level

- **Standard**: Web Content Accessibility Guidelines (WCAG) 2.1
- **Level**: AA (Target)
- **Regulations**: ADA (Americans with Disabilities Act) compliant

### 1.2 Supported Assistive Technologies

- **Screen Readers**: NVDA, JAWS, VoiceOver, TalkBack
- **Keyboard Navigation**: Full keyboard support without mouse
- **Screen Magnification**: ZoomText, built-in browser zoom
- **Voice Control**: Dragon NaturallySpeaking, Voice Control (macOS/iOS)

---

## 2. Semantic HTML

### 2.1 Document Structure

- **Requirement**: Use proper HTML5 semantic elements throughout the application
- **Elements**:
  - `<header>`: Page and section headers
  - `<nav>`: Navigation menus and breadcrumbs
  - `<main>`: Primary content area (one per page)
  - `<article>`: Self-contained content (cards, posts)
  - `<section>`: Thematic grouping of content
  - `<aside>`: Complementary content (sidebars)
  - `<footer>`: Page and section footers

### 2.2 Heading Hierarchy

- **Requirement**: Maintain logical heading hierarchy (h1 → h2 → h3)
- **Rules**:
  - One `<h1>` per page (main page title)
  - No skipping levels (e.g., h1 → h3)
  - Headings describe content that follows

---

## 3. ARIA (Accessible Rich Internet Applications)

### 3.1 ARIA Labels

- **Requirement**: All interactive elements must have descriptive ARIA labels
- **Implementation**:
  - `aria-label`: For elements without visible text
  - `aria-labelledby`: Reference visible label by ID
  - `aria-describedby`: Additional context/instructions

**Examples:**

```tsx
// Icon-only button
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Form input with description
<input
  id="email"
  aria-describedby="email-help"
/>
<span id="email-help">We'll never share your email</span>
```

### 3.2 ARIA Roles

- **Requirement**: Proper ARIA roles for custom components
- **Common Roles**:
  - `role="navigation"`: Navigation regions
  - `role="search"`: Search forms
  - `role="banner"`: Site header
  - `role="contentinfo"`: Site footer
  - `role="complementary"`: Sidebars
  - `role="alert"`: Error messages
  - `role="status"`: Status updates
  - `role="dialog"`: Modal dialogs
  - `role="tablist"`, `role="tab"`, `role="tabpanel"`: Tab interfaces

### 3.3 ARIA Live Regions

- **Requirement**: Dynamic content updates must be announced to screen readers
- **Implementation**:
  - `aria-live="polite"`: Non-urgent updates (logs, status)
  - `aria-live="assertive"`: Urgent updates (errors, alerts)
  - `aria-atomic="true"`: Announce entire region
  - `aria-atomic="false"`: Announce only changed content

**Examples:**

```tsx
// Operation log
<div role="log" aria-live="polite" aria-atomic="false">
  {logs.map(log => <div key={log.id}>{log.message}</div>)}
</div>

// Error alert
<div role="alert" aria-live="assertive">
  {error}
</div>
```

### 3.4 ARIA States and Properties

- **Requirement**: Communicate component state to assistive technologies
- **Common Attributes**:
  - `aria-expanded`: Expandable sections (true/false)
  - `aria-pressed`: Toggle buttons (true/false)
  - `aria-selected`: Selected items (true/false)
  - `aria-checked`: Checkboxes (true/false/mixed)
  - `aria-disabled`: Disabled state (true/false)
  - `aria-hidden`: Hide decorative elements (true)
  - `aria-current`: Current item in navigation (page/step/location)

---

## 4. Keyboard Navigation

### 4.1 Tab Order

- **Requirement**: All interactive elements must be keyboard accessible
- **Implementation**:
  - Logical tab order (left-to-right, top-to-bottom)
  - No keyboard traps (users can always navigate away)
  - Skip to main content link for keyboard users

### 4.2 Keyboard Shortcuts

- **Standard Keys**:
  - `Tab`: Move forward through interactive elements
  - `Shift+Tab`: Move backward
  - `Enter`: Activate buttons, links
  - `Space`: Activate buttons, toggle checkboxes
  - `Escape`: Close dialogs, cancel operations
  - `Arrow Keys`: Navigate within components (dropdowns, tabs, tables)
  - `Home/End`: Jump to first/last item

### 4.3 Focus Management

- **Requirement**: Visible focus indicators on all interactive elements
- **Implementation**:
  - CSS focus styles: `ring-2 ring-primary`
  - Focus trap in modals (focus stays within dialog)
  - Return focus to trigger element when closing modals
  - Auto-focus on first interactive element in modals

**Example:**

```css
/* Global focus style */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

---

## 5. Visual Design

### 5.1 Color Contrast

- **Requirement**: Minimum contrast ratios per WCAG 2.1 AA
- **Standards**:
  - Normal text (< 18pt): **4.5:1** minimum
  - Large text (≥ 18pt or 14pt bold): **3:1** minimum
  - UI components and graphics: **3:1** minimum

### 5.2 Color Independence

- **Requirement**: Information must not rely solely on color
- **Implementation**:
  - Use icons + color for status (✓ + green, ✗ + red)
  - Text labels for color-coded categories
  - Patterns or textures in addition to color

### 5.3 Text Sizing

- **Requirement**: Text must be resizable up to 200% without loss of functionality
- **Implementation**:
  - Use relative units (rem, em) instead of px
  - Responsive layouts that adapt to text size
  - No horizontal scrolling at 200% zoom

---

## 6. Forms

### 6.1 Form Labels

- **Requirement**: All form controls must have associated labels
- **Implementation**:
  - `<label>` element with `htmlFor` attribute
  - Labels must be visible (not placeholder-only)
  - Required fields indicated with `aria-required="true"`

**Example:**

```tsx
<label htmlFor="username" className="block text-sm font-medium">
  Username <span aria-label="required">*</span>
</label>
<input
  id="username"
  type="text"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "username-error" : undefined}
/>
{hasError && (
  <span id="username-error" role="alert">
    Username is required
  </span>
)}
```

### 6.2 Error Handling

- **Requirement**: Errors must be clearly identified and associated with inputs
- **Implementation**:
  - `aria-invalid="true"` on invalid fields
  - `aria-describedby` linking to error message
  - `role="alert"` on error messages
  - Visual indicators (red border, error icon)

### 6.3 Input Instructions

- **Requirement**: Provide clear instructions for complex inputs
- **Implementation**:
  - `aria-describedby` for help text
  - Placeholder text as hints (not labels)
  - Format examples (e.g., "MM/DD/YYYY")

---

## 7. Tables

### 7.1 Table Structure

- **Requirement**: Data tables must have proper semantic structure
- **Implementation**:
  - `<caption>`: Table title/description
  - `<thead>`, `<tbody>`, `<tfoot>`: Table sections
  - `<th scope="col">`: Column headers
  - `<th scope="row">`: Row headers

### 7.2 Sortable Tables

- **Requirement**: Sort state must be announced to screen readers
- **Implementation**:
  - `aria-sort="ascending"` or `aria-sort="descending"` on sorted column
  - `aria-sort="none"` on unsortable columns
  - Visual indicators (arrows) for sort direction

**Example:**

```tsx
<th
  scope="col"
  aria-sort={sortColumn === 'name' ? sortDirection : 'none'}
  onClick={() => handleSort('name')}
>
  Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
</th>
```

---

## 8. Images and Media

### 8.1 Alternative Text

- **Requirement**: All images must have descriptive alt text
- **Implementation**:
  - `alt` attribute describing image content
  - Empty `alt=""` for decorative images
  - `aria-hidden="true"` for purely decorative elements

### 8.2 Icons

- **Requirement**: Icon-only elements must have text alternatives
- **Implementation**:
  - `aria-label` on icon buttons
  - `<span className="sr-only">` for screen reader text
  - Decorative icons: `aria-hidden="true"`

**Example:**

```tsx
// Informative icon
<Download className="h-4 w-4" aria-label="Download file" />

// Decorative icon (button has text)
<button>
  <Download className="h-4 w-4" aria-hidden="true" />
  Download
</button>
```

---

## 9. Interactive Components

### 9.1 Buttons

- **Requirement**: Buttons must be keyboard accessible and have clear labels
- **Implementation**:
  - Use `<button>` element (not `<div>` with click handler)
  - Descriptive text or `aria-label`
  - Disabled state: `disabled` attribute + `aria-disabled="true"`

### 9.2 Dropdowns/Select

- **Requirement**: Dropdowns must be keyboard navigable
- **Implementation**:
  - Native `<select>` when possible
  - Custom dropdowns: `role="listbox"`, `role="option"`
  - Arrow key navigation
  - Type-ahead search

### 9.3 Modals/Dialogs

- **Requirement**: Modals must trap focus and be dismissible
- **Implementation**:
  - `role="dialog"` or `role="alertdialog"`
  - `aria-modal="true"`
  - `aria-labelledby` referencing dialog title
  - Focus trap (Tab cycles within dialog)
  - Escape key closes dialog
  - Return focus to trigger element on close

### 9.4 Tabs

- **Requirement**: Tab interfaces must follow ARIA tab pattern
- **Implementation**:
  - `role="tablist"` on container
  - `role="tab"` on tab buttons
  - `role="tabpanel"` on content panels
  - `aria-selected="true"` on active tab
  - Arrow key navigation between tabs

---

## 10. Feature-Specific Requirements

### 10.1 Timeline (Gantt Chart)

- **Accessibility Challenges**: Complex visual timeline
- **Solutions**:
  - Table alternative view for screen readers
  - Keyboard navigation through events
  - Detailed event descriptions in popovers
  - `aria-label` on timeline bars describing phase and duration

### 10.2 Interactive Playground

- **Accessibility Challenges**: Complex multi-step operations
- **Solutions**:
  - Clear step-by-step instructions
  - Operation status announced via `aria-live`
  - Keyboard shortcuts for common operations
  - Error messages clearly associated with inputs

### 10.3 OpenSSL Studio

- **Accessibility Challenges**: Terminal-like interface
- **Solutions**:
  - Command preview with copy button
  - Terminal output in accessible text area
  - File manager with keyboard navigation
  - Operation logs with sortable table

---

## 11. Testing Requirements

### 11.1 Automated Testing

- **Tools**:
  - `axe-playwright`: Automated accessibility testing in E2E tests
  - `eslint-plugin-jsx-a11y`: Lint-time accessibility checks
  - Lighthouse: Accessibility audits in CI/CD

### 11.2 Manual Testing

- **Keyboard Navigation**: Test all features with keyboard only
- **Screen Reader**: Test with NVDA (Windows) or VoiceOver (macOS)
- **Zoom**: Test at 200% browser zoom
- **Color Blindness**: Test with color blindness simulators

### 11.3 Acceptance Criteria

- **Automated**: axe-playwright reports 0 violations
- **Keyboard**: All features accessible without mouse
- **Screen Reader**: All content and interactions announced correctly
- **Zoom**: No horizontal scrolling, all content readable at 200%

---

## 12. Implementation Checklist

### For Every New Component

- [ ] Use semantic HTML elements
- [ ] Add proper ARIA labels and roles
- [ ] Ensure keyboard accessibility
- [ ] Verify focus indicators are visible
- [ ] Test with screen reader
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Add to E2E accessibility tests

### For Every Form

- [ ] All inputs have associated labels
- [ ] Required fields marked with `aria-required`
- [ ] Error messages linked with `aria-describedby`
- [ ] Error states use `aria-invalid`
- [ ] Submit button has clear label

### For Every Interactive Element

- [ ] Keyboard accessible (Tab, Enter, Space, Escape)
- [ ] Has visible focus indicator
- [ ] State changes announced (aria-live, aria-expanded, etc.)
- [ ] Disabled state properly communicated

---

## 13. Resources

### Official Guidelines

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Screen Readers

- [NVDA](https://www.nvaccess.org/) (Windows, Free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, Paid)
- VoiceOver (macOS/iOS, Built-in)

---

## 14. Maintenance

- **Review Frequency**: Quarterly accessibility audits
- **Regression Testing**: Accessibility tests in CI/CD pipeline
- **User Feedback**: Dedicated accessibility feedback channel
- **Training**: Regular team training on accessibility best practices

---

## Summary

This document serves as the single source of truth for accessibility requirements across the PQC Timeline Application. All feature-specific requirements should reference this document rather than duplicating accessibility guidelines.

**Key Takeaway**: Accessibility is not an afterthought—it's integrated into every aspect of development from design to deployment.
