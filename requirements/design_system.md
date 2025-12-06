# PQC Timeline App Design System

This document outlines the design principles, visual language, and technical implementation of the user interface for the PQC Timeline App. It serves as a reference for maintaining consistency and scalability across the application.

## 1. Design Philosophy

The PQC Timeline App adopts a **Modern, Technical, and Futuristic** aesthetic, suitable for a Post-Quantum Cryptography timeline and educational platform.

### Key Principles

- **Glassmorphism**: Extensive use of semi-transparent backgrounds (`glass-panel`), blurs, and subtle borders to create depth and a modern feel.
- **Deep Dark Mode**: The default theme uses deep blues/blacks (`hsl(230 35% 7%)`) representing a secure, technical environment, contrasted with bright accents.
- **Vibrant Accents**: Cyan (`primary`) and Purple (`secondary`) gradients provide a high-tech, cryptographic feel.
- **Accessibility**: All interactive elements must have proper ARIA labels and keyboard navigation support.
- **Theme Adaptability**: Design MUST work seamlessly in both **Dark** (default) and Light modes by strictly using semantic tokens (e.g., `bg-card`, `border-border`) instead of hardcoded dark values.

---

## 8. Mobile Design Patterns

### 8.1 Responsive Breakpoints

- **Mobile**: `< 768px` (uses mobile-specific layouts)
- **Desktop**: `>= 768px` (uses full desktop layouts)
- **Breakpoint Prefix**: `md:` in Tailwind CSS

### 8.2 Mobile Timeline

**Card-Based Layout**:

- Each country displayed as a separate card
- Country flag (32px x 24px) and name in header
- Organization name as subtitle

**Swipeable Phase Navigation**:

- Horizontal drag gestures using Framer Motion
- 50px drag threshold for phase transitions
- Smooth 200ms animations between phases
- `cursor: grab` and `cursor: grabbing` feedback

**Phase Indicators**:

- Horizontal row of dots below phase card
- Active indicator: 24px wide x 6px tall pill, colored with phase color
- Inactive indicators: 6px x 6px dots, 30% opacity
- Clickable for direct navigation
- ARIA labels for accessibility

**Icon Distinction**:

- Milestones: Flag icon (14px) with phase color and glow
- Phases: Colored dot (8px diameter) with glow
- Consistent with desktop Gantt chart visual language

### 8.3 Theme Toggle

**Modes**:

- Light Mode
- Dark Mode
- System (follows OS preference)

**Implementation**:

- Global Zustand store with localStorage persistence
- Manual `.dark` class on root element
- CSS variables adapt automatically
- Toggle UI in About page (desktop and mobile)

**Theme-Aware Colors**:

- Use CSS variables: `bg-muted`, `text-foreground`, `border-border`
- Avoid hardcoded colors like `bg-black/30`, `text-green-400`
- Opacity modifiers: `bg-muted/30`, `bg-muted/40` for subtle backgrounds

### 8.4 Mobile Navigation

**Compact Design**:

- Bottom navigation bar on mobile
- Icon-only buttons with labels
- Active state indicators

**Touch Targets**:

- Minimum 44px x 44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)

### 8.5 Mobile Forms & Inputs

**Layout**:

- Full-width inputs on mobile
- Stacked form fields (no side-by-side)
- Larger touch-friendly buttons (min 44px height)

**Keyboards**:

- Appropriate input types (`type="email"`, `type="tel"`, etc.)
- Prevent zoom on input focus (font-size >= 16px)

---

## 2. Visual Language

### Colors

The color system is built on CSS variables using HSL values to support dynamic theming (Dark/Light).

#### Base Colors

| Token          | Dark Mode (Default)            | Light Mode                   | Usage                                                 |
| -------------- | ------------------------------ | ---------------------------- | ----------------------------------------------------- |
| `--background` | `230 35% 7%` (Deep Blue/Black) | `210 40% 98%` (Off White)    | Page background                                       |
| `--foreground` | `210 40% 98%` (White)          | `222.2 84% 4.9%` (Dark Gray) | Main text content                                     |
| `--card`       | `230 35% 7%`                   | `0 0% 100%`                  | Card background (often transparent in implementation) |

#### Brand Colors

| Token           | HSL Value (Dark)             | Usage                                      |
| --------------- | ---------------------------- | ------------------------------------------ |
| `--primary`     | `189 83% 53%` (Cyan)         | Primary actions, highlights, active states |
| `--secondary`   | `255 91% 76%` (Light Purple) | Secondary actions, gradients               |
| `--accent`      | `153 66% 51%` (Green)        | Success states, specific highlights        |
| `--destructive` | `343 93% 71%` (Red/Pink)     | Error states, delete actions               |
| `--muted`       | `217.2 32.6% 17.5%`          | Secondary text, distinct backgrounds       |

#### Gradients

- **Primary Gradient**: `bg-gradient-to-r from-secondary to-primary`
  - Used in: Primary Buttons, Text Gradients (`.text-gradient`).

### Typography

- **Font Family**: `Inter`, `system-ui`, `sans-serif`.
- **Scale**: Standard Tailwind sizing (`text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.).
- **Weights**: Typically `font-medium` (500) for UI elements, `font-bold` (700) for headings and primary actions.

### Spacing & Layout

- **Container**: `max-w-7xl mx-auto px-8` (Centralized content with padding).
- **Radius**:
  - `lg`: `0.5rem` (8px) - Used for Cards (`rounded-2xl` is often used for glass panels), Buttons.
  - `md`: `calc(0.5rem - 2px)`.
  - `sm`: `calc(0.5rem - 4px)`.

---

## 3. UI Components

### Button

Located in: `src/components/ui/button.tsx`
Built with `cva` for variant management.

**Variants:**

- `default`: Solid cyan background (`bg-primary`), black text.
- `gradient`: **(Signature Style)** Gradient background (`from-secondary to-primary`), black text, bold. Hover: lift effect.
- `secondary`: Purple background (`bg-secondary`), foreground text.
- `outline`: Border `white/20`, transparent bg. Used for secondary actions on dark backgrounds.
- `ghost`: Transparent, hover background `white/10`.
- `destructive`: Red background (`bg-destructive`).
- `link`: text-only with underline.

**Classes:** `.btn-primary` and `.btn-secondary` in `index.css` map similarly to these variants but `Button` component is the preferred implementation.

### Card

Located in: `src/components/ui/card.tsx`

**Structure:**

- `Card`: Wrapper with `glass-panel` class.
- `CardHeader`: Padding `p-6`.
- `CardTitle`: `h3`, `text-2xl font-semibold`.
- `CardDescription`: `text-sm text-muted-foreground`.
- `CardContent`: Main content area `p-6 pt-0`.
- `CardFooter`: Footer actions `flex items-center p-6 pt-0`.

**Style (`.glass-panel`):**

- Background: `bg-white/[0.08]` (8% opacity white).
- Border: `border-white/[0.15]`.
- Backdrop: `backdrop-blur-md`.
- Radius: `rounded-2xl`.
- Shadow: `shadow-2xl`.

### Input

Located in: `src/components/ui/input.tsx`

- Standard styling with focus rings matching `--ring` (Primary color).

---

## 4. Interaction Patterns

### Hover Effects

- **Buttons**: Slight opacity reduction (`opacity-90`) or brightness increase.
- **Primary Buttons/Cards**: `translate-y` lift effect (`-translate-y-0.5`) on hover to imply elevation.
- **Glass Elements**: Often increase background opacity or border brightness on hover.

### Animation

- **Transitions**: `transition-all duration-200` is the standard for interactive elements.
- **Keyframes**: `fade-in` animation defined in `index.css` (translateY 10px -> 0, opacity 0 -> 1).

### Inputs

- **Focus**: `ring-2 ring-primary` to clearly indicate active field.
- **Select**: Dropdown options forced to dark background (`rgb(15 23 42)`) to ensure readability even in glass containers.

---

## 5. Technical Implementation

### Stack

- **Framework**: React + Vite.
- **Styling**: Tailwind CSS v4.
- **Icons**: Lucide React.
- **Utils**: `clsx` and `tailwind-merge` via `cn()` helper.

### Variable Usage

- Styles should reference CSS variables (e.g., `bg-primary`, `text-muted-foreground`) rather than hardcoded hex values to maintain theme compatibility.
- **Light Mode Compatibility**:
  - NEVER use hardcoded dark backgrounds (e.g., `bg-slate-900`, `bg-[#0d1117]`).
  - ALWAYS use `bg-card`, `bg-muted`, or `bg-background` to ensure the component adapts to Light Mode (where these values invert to white/gray).
- Use `hsl(var(--param))` format defined in `@theme` block in `src/styles/index.css` via Tailwind v4.

### Usage Guide

1. **New Page**: Wrap content in `.container`.
2. **New Section**: Use `Card` component for grouping related content.
3. **Headings**: Use `text-gradient` class for main page titles to reinforce brand identity.
4. **Interactive Actions**: Use `Button` with `variant="gradient"` for the main CTA, `variant="outline"` or `ghost` for secondary.

### File Structure

- `src/styles/index.css`: Global variables, resets, and utility classes.
- `src/components/ui`: Primitive components (Buttons, Cards, Inputs).
- `src/lib/utils.ts`: `cn` utility for class merging.
