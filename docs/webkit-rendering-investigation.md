# WebKit Rendering Investigation - Timeline Feature

**Date**: 2026-02-16
**Issue**: E2E test skipped on WebKit due to "rendering instability with large tables in CI"
**File**: `e2e/timeline.spec.ts` (line 34-36)

## Problem Analysis

### Symptoms

- Popover E2E test fails/times out on Safari/WebKit in CI
- Test works on Chromium and Firefox
- Issue manifests when clicking phase cells to open detail popover

### Root Cause Identification

The SimpleGanttChart component uses a complex sticky table layout that triggers performance issues in WebKit:

#### 1. **Multiple Sticky Columns with High z-index Stacking**

```tsx
// Two sticky columns at different left offsets
<th className="sticky left-0 z-30 ...">Country</th>
<th className="sticky left-[180px] z-30 ...">Organization</th>

// Body cells also use sticky positioning
<td rowSpan={totalRows} className="sticky left-0 z-20 ...">...</td>
<td rowSpan={totalRows} className="sticky left-[180px] z-20 ...">...</td>
```

**Issue**: WebKit's sticky positioning implementation requires re-calculating layout on every scroll event for multiple sticky elements, especially with varying z-index values (z-20, z-30).

#### 2. **Inline Styles with Dynamic Calculations**

```tsx
// renderPhaseCells() creates 12 cells per phase row with inline styles
<td style={{
  borderRight: isLast ? '1px solid var(--color-border)' : 'none',
  backgroundColor: isMilestone ? 'transparent' : colors.start,
  boxShadow: isMilestone ? 'none' : `0 0 8px ${colors.glow}`,
  opacity: isMilestone ? 1 : 0.9,
  zIndex: isFirst || isMilestone ? 20 : 0,
}}>
```

**Issue**: Inline styles prevent browser optimization. WebKit cannot batch style recalculations when each cell has unique inline styling.

#### 3. **Nested Positioned Elements**

```tsx
<button className="...relative...">
  <div className="absolute -top-3 -right-3 z-20">
    <StatusBadge status={phaseData.status} size="sm" />
  </div>
</button>
```

**Issue**: Absolutely positioned elements inside relatively positioned buttons inside table cells create complex layout containment issues.

#### 4. **Large Table Dimensions**

- Typical dataset: ~20 countries × avg 2-3 phases = 40-60 rows
- 12 year columns + 2 sticky columns = 14 total columns
- Total cells: 40-60 rows × 14 cols = **560-840 cells**
- Each cell renders a button with potential nested absoluteelements

**Issue**: WebKit's table rendering engine struggles with large tables containing complex nested layouts and dynamic styling.

#### 5. **Shadow DOM and Backdrop Blur**

```tsx
<div className="overflow-x-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm">
```

**Issue**: `backdrop-blur-sm` forces WebKit to create a stacking context and apply blur filters on scroll, adding significant GPU overhead.

## Performance Bottlenecks

### Layout Thrashing Triggers

1. **Scroll events** → recalculate sticky positions (2 columns × 40-60 rows)
2. **Hover effects** → `hover:bg-muted/50` triggers repaint on 14 cells per row
3. **Transform animations** → `hover:scale-[1.02]` on buttons creates new layers
4. **StatusBadge animations** → `animate-in fade-in zoom-in` on mount

### WebKit-Specific Issues

- **Sticky positioning bug**: WebKit has known issues with `position: sticky` in tables with `rowSpan`
- **Backdrop filter**: `-webkit-backdrop-filter` is less optimized than Chromium's implementation
- **Composite layering**: WebKit creates more composite layers for overlapping z-index elements

## Proposed Solutions

### Option 1: CSS Containment (Lowest Risk)

Add layout containment to reduce rendering scope:

```tsx
<td
  className="p-0 h-10 overflow-visible relative"
  style={{
    ...existingStyles,
    contain: 'layout style',  // NEW
  }}
>
```

**Pros**:

- Tells browser to isolate layout calculations to this element
- Minimal code changes
- No visual regression risk

**Cons**:

- May not fully solve the issue
- `contain: layout` might clip box-shadow effects

### Option 2: Optimize Sticky Columns (Medium Risk)

Reduce z-index complexity and use `will-change`:

```tsx
<th className="sticky left-0 z-20 ...">
  {' '}
  // Reduce from z-30
  <div style={{ willChange: 'transform' }}>Country</div>
</th>
```

**Pros**:

- `will-change: transform` hints browser to create GPU layer upfront
- Simplifying z-index reduces stacking context calculations

**Cons**:

- `will-change` can increase memory usage if overused
- May require z-index adjustments across component

### Option 3: Virtual Scrolling (High Risk, High Reward)

Only render visible rows using `react-window` or `react-virtual`:

**Pros**:

- Dramatically reduces DOM node count (render ~10-15 rows instead of 60)
- Improves scroll performance across all browsers
- Future-proofs for larger datasets (100+ countries)

**Cons**:

- Significant refactoring required
- Adds new dependency
- Complex interaction with sticky columns
- Testing overhead

### Option 4: Replace Backdrop Blur (Low Risk)

Replace `backdrop-blur-sm` with solid background:

```tsx
<div className="overflow-x-auto rounded-xl border border-border bg-card">
```

**Pros**:

- Removes GPU-intensive filter
- Immediate performance gain

**Cons**:

- Visual design regression (loses glass effect)
- May not fully solve layout thrashing

## Recommended Approach

**Phase 1** (Immediate - Low Risk):

1. Add `contain: layout style` to phase cells
2. Replace `backdrop-blur-sm` with `bg-card`
3. Add `will-change: transform` to sticky headers
4. Test on WebKit/Safari

**Phase 2** (If Phase 1 insufficient):

1. Profile in Safari DevTools to identify remaining bottlenecks
2. Consider extracting inline styles to CSS classes
3. Reduce z-index complexity (consolidate to 2-3 levels max)

**Phase 3** (Future optimization):

1. Implement virtual scrolling if dataset grows beyond 100 countries
2. Consider Web Workers for data transformation

## Testing Plan

### Local Testing

1. Test on Safari (macOS) with 20, 50, 100 country scenarios
2. Use Safari Timeline profiler to measure layout/paint times
3. Test popover interaction with different datasets

### CI Testing

1. Re-enable skipped E2E test in `timeline.spec.ts`
2. Monitor WebKit test suite success rate
3. Add performance assertions if needed

## Success Criteria

- [ ] Popover E2E test passes consistently on WebKit (95%+ success rate)
- [ ] No visual regressions (shadows, glows, positioning)
- [ ] Scroll performance acceptable (<16ms frame time for 60fps)
- [ ] All browsers (Chromium, Firefox, WebKit) pass E2E tests

## References

- [MDN: CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [WebKit Sticky Positioning Bugs](https://bugs.webkit.org/buglist.cgi?quicksearch=sticky%20position)
- [Safari Web Inspector Performance Guide](https://webkit.org/web-inspector/timeline/)
