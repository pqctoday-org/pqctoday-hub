# Timeline UI Audit & Analysis

## Structure Overview

The `SimpleGanttChart` component renders a **HTML Table** with specific styling properties:

- `table-fixed`: Fixed column widths.
- `border-collapse`: Collapsed borders (this affects stacking contexts).
- `overflow-visible`: Applied to the container and cells.

## DOM Hierarchy

```html
<div class="overflow-x-auto ...">
  <!-- Wrapper -->
  <table class="...">
    <thead>
      ...
    </thead>
    <tbody>
      <tr>
        <!-- Start of Phase Row -->
        <td class="sticky ...">Country</td>
        <td class="sticky ...">Org</td>
        <!-- Phase Cells Loop -->
        <td style="position: relative; overflow: visible; background-color: ...">
          <!-- Year 1 -->
          <button class="z-20 ...">
            <span>Label</span>
          </button>
        </td>
        <td style="position: relative; overflow: visible; background-color: ...">
          <!-- Year 2 -->
          <button class="z-0 ...">
            <!-- Content -->
          </button>
        </td>
        ...
      </tr>
    </tbody>
  </table>
</div>
```

## The Issue: Stacking Contexts

The problem is strictly a **Stacking Context** issue, specifically related to the `td` elements.

### Current Behavior

1. The **Label** is inside the `td` for the **Start Year** (e.g., 2024).
2. The **Background Color** for the phase is applied directly to the `td` elements for _all_ years in the phase (2024, 2025, 2026...).
3. DOM Rendering Order: The browser renders `td` elements left-to-right.
   - `td` (2024) is rendered.
   - `td` (2025) is rendered _after_ and strictly _on top of_ `td` (2024) in the default stacking order (since both are positioned).
4. The `button` inside `td` (2024) has `z-index: 20`. This keeps it above other content _within_ `td` (2024), but it does **not** allow it to break out above the _background_ of `td` (2025) if `td` (2025) is higher in the stacking order than `td` (2024).

### Why the Previous Fix Failed

The previous fix applied `z-index` to the _child_ (`button`). While this raised the button, the `td` (2025) itself (with its background color) sits at a higher stacking level than the `td` (2024) because they are siblings and strict DOM order dictates the later one is on top when no `z-index` is present on the parents.

## The Solution

To fix this, we must ensure that the `td` containing the label (the **First** cell of the phase) has a higher `z-index` than the subsequent `td` cells in that same row.

**Required Changes:**

1.  Evaluation of `td` stylings.
2.  Apply `z-index: 20` (or similar high value) to the **`td` element itself** when `isFirst` is true.
3.  Ensure subsequent `td` elements have a lower `z-index` (e.g., `0` or `auto`).
4.  Maintain `position: relative` on the `td` to ensure `z-index` is respected.

## Verification

- **Scenario**: Phase spans 2024–2026.
- **2024 Cell**: `isFirst=true`. `z-index: 20`. Renders _on top_ of siblings. Label overflows freely.
- **2025 Cell**: `isFirst=false`. `z-index: 0`. Renders _below_ 2024 cell.
