# Design System - Nix Finance

**Last Updated**: April 2026  
**Version**: 2.2

---

## Overview

The Nix Finance Design System follows the **"Human & Organic"** philosophy - interfaces that feel hand-crafted, warm, and sophisticated. The goal is to completely avoid generic AI or template aesthetics.

**UI Stack**: The app uses **Radix UI** (Themes and primitives) as the base for custom components (Nix colors, glassmorphism, colored shadows). MUI remains for layout (Box, Grid, Drawer), DatePicker, and some legacy components in migration.

---

## Radix UI Components

### Imports

```typescript
import { Theme, Button, Card, Dialog, Select, Text, Heading, IconButton, Avatar } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./radix-theme.css"; // Overrides Nix (purple accent, radius 20px, shadows)
```

### Nix Base Components

All reusable custom components are in `components/radix/`:

- **NixButton** – Buttons with canonical sizes `sm` (32px), `md` (40px), `lg/fab` (48px). Legacy aliases `small/medium/large` are accepted. The `loading` prop disables the button and applies `cursor: wait`. Hover: lift; active: sink; disabled: 0.45 opacity. Variants: `solid`, `soft`, `ghost`, `outline`, `surface`. Colors: `purple`, `gray`, `red`, `green`, `cyan`.
- **NixCard** – Card with responsive padding (24px desktop, 16px mobile), border-radius 20px, glassmorphism option, and hover lift.
- **NixInput** – Wrapper around `TextField.Root` with large radius (20px), support for `startAdornment`/`endAdornment` (via `TextField.Slot`), and inline `errorMessage` displayed below the field in the error color.
- **Dialog** – Re-export of Radix Dialog; use `NixDialogContent` for fullscreen on mobile and 24px padding.
- **Select** – Re-export of Radix Select; use `NixSelectTrigger` / `NixSelectContent` for 20px radius.
- **EmptyState** – Unified empty state component with specific illustrations by type, floating animation, and a consistent action button (medium size).

### Using NixInput with Adornments

```tsx
import NixInput from "@/components/radix/Input";
import { Search as SearchIcon, Visibility as EyeIcon } from "@mui/icons-material";

// Input with search icon
<NixInput
  placeholder="Search..."
  startAdornment={<SearchIcon fontSize="small" />}
/>

// Input with validation error
<NixInput
  type="email"
  placeholder="your@email.com"
  errorMessage="Invalid e-mail"
  endAdornment={<EyeIcon fontSize="small" />}
/>
```

### Using NixButton with Loading

```tsx
import NixButton from "@/components/radix/Button";

<NixButton size="md" loading={isSubmitting} onClick={handleSave}>
  Save
</NixButton>

// Canonical sizes
<NixButton size="sm">Small</NixButton>
<NixButton size="md">Medium</NixButton>
<NixButton size="lg">Large</NixButton>
```

### Button Sizes (Standard across all screens)

| Context | Size | Height | Usage |
|---------|---------|--------|-----|
| FAB (Add) | `fab` | 64px | Main action button on mobile |
| Primary Action (modal footer) | `md` | 40px | Save, Confirm |
| Secondary Action (modal) | `md` + variant `soft` | 40px | Cancel, Go Back |
| Action in Card | `sm` | 32px | Edit, Delete in cards |
| Large Action/CTA | `lg` | 48px | Featured CTA |
| Icon button | Radix `IconButton` size="3" | 48px | Touch-friendly in header/nav |

> **Note**: Legacy aliases `small/medium/large` are also supported for backwards compatibility.

### Radix Theme (Nix)

- **File**: `radix-theme.css` – overrides `--accent-9` (purple Nix), `--radius-5`/`--radius-6` (20px), colored shadows, and the `.nix-glass-panel` class.
- **App.tsx**: `<Theme appearance={darkMode ? "dark" : "light"} accentColor="purple" radius="large" />`.

---

## CSS Tokens (index.css)

All tokens are defined in `:root` in `index.css` and are available via `var()` in any context (MUI `sx`, Radix, pure CSS):

### Radius Tokens

| Token | Value | Usage |
|-------|-------|-----|
| `--radius-card` | `20px` | Cards, Paper, Modals |
| `--radius-input` | `20px` | Inputs, Selects |
| `--radius-button-sm` | `10px` | Small buttons |
| `--radius-button-md` | `12px` | Medium buttons |
| `--radius-button-lg` | `14px` | Large buttons |

### Shadow Tokens

| Token | Usage |
|-------|-----|
| `--shadow-soft` | Default card shadow (soft purple) |
| `--shadow-card` | Resting card shadow |
| `--shadow-elevated` | Elevated element shadow (modals, dropdowns) |
| `--shadow-teal-soft` | Teal shadow for income/success elements |

```tsx
// Using in MUI sx
<Paper sx={{ boxShadow: "var(--shadow-soft)", borderRadius: "var(--radius-card)" }}>

// Using in CSS
.my-card { box-shadow: var(--shadow-card); border-radius: var(--radius-card); }
```

---

## Design Philosophy

### Core Principle: "Human & Organic"

Build interfaces that feel hand-crafted, welcoming, and sophisticated. Actively fight against generic template aesthetics.

### Anti-Patterns (NEVER DO)

- **NEVER** use pure black shadows. Use colored shadows (Nix purple) defined in `radix-theme.css` or `theme.ts`.
- **NEVER** use high-saturation colors (like pure `#0000FF` or `#FF0000`).
- **NEVER** use rigid animations or instant transitions.
- **NEVER** leave empty states with text only. Use friendly icons, illustrations, or copy.
- **NEVER** use standard "Lorem Ipsum". Use realistic financial data for placeholders.

### Design Rules (ALWAYS DO)

#### 1. Visual Hierarchy & Depth (Glassmorphism & Soft Shadows)

- Instead of black shadows, use **colored shadows** derived from the contents of the element.
  - **Bad**: `box-shadow: 0 4px 6px rgba(0,0,0,0.5)`
  - **Good**: `box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.15)` (tinted with Indigo)

- Use **Glassmorphism** for cards and overlays:
  ```typescript
  backdropFilter: "blur(12px)"
  background: "rgba(255, 255, 255, 0.7)" // light mode
  border: "1px solid rgba(255, 255, 255, 0.3)"
  ```

#### 2. Typography & Copywriting

- Use a modern geometric sans-serif (assume "Plus Jakarta Sans" or "Inter").
- **UX Writing**: Be friendly and conversational.
  - **Instead of**: "Transaction Error"
  - **Say**: "Oops, we couldn't save that transaction."
- Use distinct font weights: 600/700 for titles, 400/500 for body. Avoid generic `fontWeight="bold"`.

#### 3. Spacing & Radius (Organic Feel)

- Use generous padding. Allow the UI to breathe.
- **Border Radius:**
  - Small elements (buttons/inputs): `8px` or `10px` (0.5 or 1 in the MUI spacing system)
  - Large elements (cards/modals): `20px` or `24px` (2.5 or 3 in the MUI system) - Superellipse feel
- Avoid 90-degree corners unless strictly necessary.

#### 4. Color Palette (Sophisticated)

- **Primary**: Use a slightly desaturated Indigo/Violet (e.g., `#6366F1` → `#5B5FC7`) or a deep Emerald.
- **Backgrounds**: Never pure white (`#FFFFFF`) or pure black (`#000000`).
  - Light: `#F8FAFC` (Slate-50) or `#F9FAFB` (Gray-50)
  - Dark: `#0F172A` (Slate-900)

**MUI Theme Colors:**
- Primary: Indigo (#6366f1)
- Secondary: Pink (#ec4899)
- Success: Emerald (#10b981)
- Error: Red (#ef4444)
- Warning: Amber (#f59e0b)

#### 5. Micro-Interactions

- All interactive elements MUST have hover and active states.
- Add `transition: all 0.2s ease-in-out` to buttons and cards.
- On hover, lift elements slightly: `transform: translateY(-2px)`.

---

## Spacing System

### Overview

Nix's spacing system uses multiples of 8px (default MUI spacing) to create a consistent visual hierarchy.

### Spacing Scale

```typescript
// Base unit: 8px (theme.spacing(1))
XS:  0.5 =  4px  // Minimum gaps between closely related elements
SM:  1   =  8px  // Compact elements, intra-component separation
MD:  2   = 16px  // **DEFAULT** - Component internal padding
LG:  3   = 24px  // **DEFAULT** - Spacing between sections/cards
XL:  4   = 32px  // Separation of main modules
```

### Application by Context

#### 1. Cards and Containers

```typescript
// Internal padding
<Card sx={{ p: 3 }}>           // Desktop: 24px
<Card sx={{ p: isMobile ? 2 : 3 }}> // Mobile: 16px, Desktop: 24px

// Margin between cards
<Grid container spacing={2.5}>  // 20px between cards
```

#### 2. Forms and Inputs

```typescript
// Spacing between fields
<Stack spacing={2.5}>          // 20px between inputs

// Internal padding of inputs
// Set automatically by MUI, do not customize
```

#### 3. Modals and Dialogs

```typescript
<DialogContent sx={{ pt: 2, pb: 3 }}>
  // pt: 16px (top)
  // pb: 24px (bottom)
</DialogContent>

<DialogActions sx={{ p: 3, pt: 0 }}>
  // Sides: 24px
  // Top: 0 (already has padding from content)
</DialogActions>
```

#### 4. Sidebar and Navigation

```typescript
// Padding container
<Box sx={{ px: 2, py: 2 }}>   // 16px horizontal and vertical

// Padding of items
<ListItemButton sx={{ py: 1.5, px: 2 }}>
  // 12px vertical, 16px horizontal
</ListItemButton>
```

#### 5. Gaps between Elements

```typescript
// Closely related elements (icons + text)
gap: 0.5  // 4px

// Related elements (buttons in group)
gap: 1    // 8px

// Independent elements (sections of a form)
gap: 2.5  // 20px
```

### Important Rules

#### DO

1. **Use multiples of 0.5** (4px)
   ```typescript
   sx={{ p: 2.5 }}    //  20px
   sx={{ gap: 1.5 }}  //  12px
   ```

2. **Maintain consistency by type**
   - Cards always `p: 3` (desktop)
   - Inputs always `spacing: 2.5`
   - Modals always `p: 3` on action blocks

3. **Responsive with breakpoints**
   ```typescript
   sx={{ p: isMobile ? 2 : 3 }}  // 
   ```

#### AVOID

1. **Hardcoded values outside the system**
   ```typescript
   sx={{ padding: "18px" }}     //  Not a multiple of 8
   sx={{ marginTop: "25px" }}   //  Use theme.spacing()
   ```

2. **Inconsistent spacings**
   ```typescript
   // Card A
   <Card sx={{ p: 2 }}>         //  Should be p: 3

   // Card B (same context)
   <Card sx={{ p: 3 }}>         // 
   ```

3. **Different paddings in similar components**
   ```typescript
   // Dialog 1
   <DialogContent sx={{ p: 2 }}>    // 

   // Dialog 2
   <DialogContent sx={{ p: 3 }}>    // 
   ```

### Quick Reference Table

| Context | Desktop | Mobile | Property |
|-------------------------|---------|---------|----------------|
| Card padding | `p: 3` | `p: 2` | 24px / 16px |
| Form field gap | `spacing: 2.5` | 20px |
| Modal padding | `p: 3` | `p: 2` | 24px / 16px |
| Sidebar container | `px: 2, py: 2` | 16px |
| Button group gap | `gap: 1` | 8px |
| Section separation | `mt: 2.5` or `3` | 20px / 24px |
| Icon + Text | `gap: 0.5` | 4px |

### Practical Examples

#### Card with Content

```typescript
<Card sx={{ p: 3 }}>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Title
  </Typography>
  <Stack spacing={2.5}>
    <TextField />
    <TextField />
  </Stack>
</Card>
```

#### Modal with Actions

```typescript
<Dialog>
  <DialogTitle sx={{ pb: 2 }}>
    New Item
  </DialogTitle>
  
  <DialogContent sx={{ pt: 2, pb: 3 }}>
    <Stack spacing={2.5}>
      {/* Form fields */}
    </Stack>
  </DialogContent>
  
  <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
    <Button>Cancel</Button>
    <Button variant="contained">Save</Button>
  </DialogActions>
</Dialog>
```

#### Grid of Cards

```typescript
<Grid container spacing={2.5}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Card sx={{ p: isMobile ? 2 : 3 }}>
      {/* Content */}
    </Card>
  </Grid>
</Grid>
```

### Allowed Exceptions

- **BorderRadius**: 20px (2.5) is the global standard defined in the theme.
- **IconSize**: 16px, 18px, 20px, 24px (defined by MUI).
- **LineHeight**: Controlled automatically by typography styling.

---

## Components and Patterns

### Cards

```typescript
<Card
  sx={{
    borderRadius: "20px",
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha("#FFFFFF", 0.8),
    backdropFilter: "blur(12px)",
    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
    boxShadow: `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.15)}`,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: `0 16px 48px -12px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
  }}
>
  <CardContent sx={{ p: 3 }}>
    {/* Content */}
  </CardContent>
</Card>
```

### Dialogs/Modals

```typescript
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: isMobile ? 0 : "20px",
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.paper, 0.95)
        : alpha("#FFFFFF", 0.98),
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: isMobile
        ? "none"
        : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
      boxShadow: isDarkMode
        ? `0 24px 80px -20px ${alpha("#000000", 0.6)}`
        : `0 24px 80px -20px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  }}
  slotProps={{
    backdrop: {
      sx: {
        bgcolor: isDarkMode
          ? alpha("#0F172A", 0.8)
          : alpha("#64748B", 0.4),
        backdropFilter: "blur(8px)",
      },
    },
  }}
>
  {/* Content */}
</Dialog>
```

### Buttons

```typescript
<Button
  variant="contained"
  sx={{
    borderRadius: "20px",
    px: 2.5,
    py: 1.25,
    fontWeight: 600,
    textTransform: "none",
    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  }}
>
  Button Text
</Button>
```

### Inputs

```typescript
<TextField
  fullWidth
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.primary.main, 0.02),
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.1)
          : alpha(theme.palette.primary.main, 0.12),
        borderWidth: 1.5,
      },
      "&:hover fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.2)
          : alpha(theme.palette.primary.main, 0.25),
      },
      "&.Mui-focused": {
        bgcolor: isDarkMode
          ? alpha(theme.palette.primary.main, 0.08)
          : alpha(theme.palette.primary.main, 0.04),
      },
    },
  }}
/>
```

---

## Animations and Transitions

### Principles

- All transitions must be smooth: `transition: all 0.2s ease-in-out`
- Hover state should lift elements: `transform: translateY(-2px)` or `translateY(-4px)`
- Avoid rigid or instant transitions and animations.

### Animation Standards

```typescript
// Hover on cards
"&:hover": {
  transform: "translateY(-4px)",
  transition: "all 0.2s ease-in-out",
}

// Hover on buttons
"&:hover": {
  transform: "translateY(-2px)",
  transition: "all 0.2s ease-in-out",
}

// Loading states
<CircularProgress sx={{ animation: "spin 1s linear infinite" }} />
```

---

## Dark Mode

### Backgrounds

- **Light Mode**: `#F8FAFC` (Slate-50) or `#F9FAFB` (Gray-50)
- **Dark Mode**: `#0F172A` (Slate-900)

### Cards and Surfaces

```typescript
bgcolor: isDarkMode
  ? alpha(theme.palette.background.paper, 0.6)
  : alpha("#FFFFFF", 0.8)
```

### Borders

```typescript
border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`
```

---

## Responsiveness

### Breakpoints

- **Mobile**: `theme.breakpoints.down("md")` (< 900px)
- **Desktop**: `theme.breakpoints.up("md")` (≥ 900px)

### Responsive Patterns

```typescript
// Adaptive padding
sx={{ p: isMobile ? 2 : 3 }}  // Mobile: 16px, Desktop: 24px

// Full screen on mobile
fullScreen={isMobile}

// Responsive Grid
<Grid container spacing={2.5}>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
    {/* Content */}
  </Grid>
</Grid>
```

---

## Verification Checklist

Before submitting a commit, verify:

1. All `p`, `px`, `py`, `m`, `mx`, `my` parameters are multiples of 0.5.
2. Similar cards share the same padding.
3. Gaps are consistent by group type.
4. Mobile/Desktop maintain correct proportions (typically 2 vs 3 spacing units).
5. Border-radius is 20px (2.5) for large elements, 12px (1.5) for small ones.
6. Shadows are colored, not black.
7. Transitions are smooth (0.2s ease-in-out).
8. Hover states are properly implemented.
9. Dark mode has been visually tested.
10. Empty states feature friendly icons or illustrations.

---

## References

- **MUI Theme**: Configured in `theme.ts`
- **Colors**: Accessed via `theme.palette.primary.main`, etc.
- **Spacing**: Use `theme.spacing()` or numeric shorthand values (multiples of 0.5)
- **Alpha**: Use MUI's `alpha()` helper for custom transparencies.

---

**Maintained by**: Nix Team  
**Document Version**: 2.0
