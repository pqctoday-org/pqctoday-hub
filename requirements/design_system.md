# PQC Timeline App Design System

This document outlines the design principles, visual language, and technical implementation of the user interface for the PQC Timeline App. It serves as a reference for maintaining consistency and scalability across the application.

## 1. Design Philosophy

The PQC Timeline App adopts a **Modern, Technical, and Futuristic** aesthetic, suitable for a Post-Quantum Cryptography timeline and educational platform.

### Key Principles

- **Glassmorphism**: Extensive use of semi-transparent backgrounds (`glass-panel`), blurs, and subtle borders to create depth and a modern feel.
- **Deep Dark Mode**: The default theme uses deep blues/blacks (`hsl(230 35% 7%)`) representing a secure, technical environment, contrasted with bright accents.
- **Vibrant Accents**: Cyan (`primary`) and Purple (`secondary`) gradients provide a high-tech, cryptographic feel.
- **Accessibility**: High contrast text, clear focus states, and semantic HTML structure (WIP).

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
- Use `hsl(var(--param))` format defined in `@theme` block in `src/styles/index.css`.

### Usage Guide

1. **New Page**: Wrap content in `.container`.
2. **New Section**: Use `Card` component for grouping related content.
3. **Headings**: Use `text-gradient` class for main page titles to reinforce brand identity.
4. **Interactive Actions**: Use `Button` with `variant="gradient"` for the main CTA, `variant="outline"` or `ghost` for secondary.

### File Structure

- `src/styles/index.css`: Global variables, resets, and utility classes.
- `src/components/ui`: Primitive components (Buttons, Cards, Inputs).
- `src/lib/utils.ts`: `cn` utility for class merging.
