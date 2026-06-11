# Yu-Gi-Oh! "Ink & Steel" Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the app into the "Ink & Steel" edition with high-contrast minimalist design, 2-column mobile grid, hamburger sidebar, and bottom-sheet modals.

**Architecture:** 
1. Overhaul `theme.ts` with the Obsidian/White/Electric Yellow palette.
2. Create `FilterSidebar.tsx` to handle deep filtering (Archetypes, Types).
3. Update `CardList.tsx` to include the Hamburger menu trigger and lifted filter state.
4. Update `CardDetailsModal.tsx` with a bottom-sheet layout for mobile.
5. Fix `YgoCard.tsx` aspect ratios for the 2-column grid.

**Tech Stack:** React, Material UI, Lucide React, Supabase.

---

## File Structure

- `src/`
  - `theme.ts` (Modify: Full palette and component override)
  - `components/`
    - `FilterSidebar.tsx` (Create: Drawer-based filter menu)
    - `YgoCard.tsx` (Modify: Update styles and aspect ratio)
    - `CardList.tsx` (Modify: Add sidebar trigger and integrate FilterSidebar)
    - `CardDetailsModal.tsx` (Modify: Add responsive bottom-sheet behavior)

---

### Task 1: Overhaul Theme to "Ink & Steel"

**Files:**
- Modify: `src/theme.ts`

- [ ] **Step 1: Implement the Ink & Steel palette and component overrides**

```typescript
import { createTheme } from '@mui/material';

export const inkAndSteelTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ffea00' }, // Electric Yellow
    secondary: { main: '#ffffff' }, // Pure White
    background: { default: '#0a0a0a', paper: '#111111' },
    text: { primary: '#ffffff', secondary: '#a0a0a0' },
    divider: '#333333',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 900, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 0 }, // Sharp corners
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, textTransform: 'none', fontWeight: 700 },
        containedPrimary: { color: '#000000' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #333333',
          backgroundImage: 'none',
          backgroundColor: '#111111',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: '1px solid #333333', backgroundImage: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#0a0a0a', borderRight: '1px solid #333333' },
      },
    },
  },
});
```

- [ ] **Step 2: Update App.tsx to use the new theme**
(Ensure `ThemeProvider` uses `inkAndSteelTheme`).

- [ ] **Step 3: Commit**
```bash
git add src/theme.ts src/App.tsx
git commit -m "ui: overhaul theme to Ink & Steel aesthetic"
```

---

### Task 2: Create FilterSidebar Component

**Files:**
- Create: `src/components/FilterSidebar.tsx`

- [ ] **Step 1: Implement Drawer-based filters with Archetype search**

```tsx
import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, TextField, Autocomplete, IconButton, List, ListItem, ListItemText, Divider, Checkbox, FormControlLabel } from '@mui/material';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: any;
  onFilterChange: (newFilters: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ open, onClose, filters, onFilterChange }) => {
  const [archetypes, setArchetypes] = useState<string[]>([]);

  useEffect(() => {
    fetch('https://db.ygoprodeck.com/api/v7/archetypes.php')
      .then(res => res.json())
      .then(data => setArchetypes(data.map((a: any) => a.archetype_name)));
  }, []);

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={onClose}><X /></IconButton>
        </Box>
        
        <Divider />

        <Box>
          <Typography variant="overline" color="primary">Archetype</Typography>
          <Autocomplete
            options={archetypes}
            renderInput={(params) => <TextField {...params} variant="standard" placeholder="Select archetype..." />}
            value={filters.archetype || null}
            onChange={(_, newValue) => onFilterChange({ ...filters, archetype: newValue })}
          />
        </Box>

        <Box>
          <Typography variant="overline" color="primary">Card Type</Typography>
          <List dense>
            {['Monster', 'Spell', 'Trap'].map((type) => (
              <ListItem key={type} disablePadding>
                <FormControlLabel
                  control={<Checkbox size="small" checked={filters.type === type} onChange={() => onFilterChange({ ...filters, type: filters.type === type ? null : type })} />}
                  label={type}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};
```

- [ ] **Step 2: Commit**
```bash
git add src/components/FilterSidebar.tsx
git commit -m "feat: add FilterSidebar with archetype autocomplete"
```

---

### Task 3: Integrate Sidebar and 2-Column Grid in CardList

**Files:**
- Modify: `src/components/CardList.tsx`

- [ ] **Step 1: Add Hamburger trigger and 2-column mobile grid**

Update `CardList.tsx` to include `FilterSidebar`, a menu icon button, and adjust `Grid2` to be `xs: 6` (2 columns).

```tsx
// Inside CardList.tsx
// Add state: const [isSidebarOpen, setIsSidebarOpen] = useState(false);
// Add state: const [activeFilters, setActiveFilters] = useState({ archetype: null, type: null });

// Update fetchCards to include archetype and type from activeFilters

// In JSX:
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <IconButton onClick={() => setIsSidebarOpen(true)} color="primary">
    <Menu />
  </IconButton>
  <Typography variant="h4">Yu-Gi-Oh! Explorer</Typography>
</Box>

<Grid2 container spacing={1}> // Tighter spacing for 2-column
  {cards.map(card => (
    <Grid2 key={card.id} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}> // 2 cols on mobile, 5 on lg
      <YgoCard card={card} onClick={setSelectedCard} />
    </Grid2>
  ))}
</Grid2>

<FilterSidebar 
  open={isSidebarOpen} 
  onClose={() => setIsSidebarOpen(false)} 
  filters={activeFilters}
  onFilterChange={(newFilters) => {
    setActiveFilters(newFilters);
    fetchCards(true, searchTerm, newFilters);
  }}
/>
```

- [ ] **Step 2: Commit**
```bash
git add src/components/CardList.tsx
git commit -m "ui: implement 2-column mobile grid and sidebar integration"
```

---

### Task 4: Responsive Bottom-Sheet Modal

**Files:**
- Modify: `src/components/CardDetailsModal.tsx`

- [ ] **Step 1: Implement mobile bottom-sheet behavior**

Update `Dialog` to use `fullScreen` on mobile or custom `sx` for bottom-sheet slide-up.

```tsx
// Inside CardDetailsModal.tsx
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

<Dialog 
  open={!!card} 
  onClose={onClose} 
  fullScreen={isMobile}
  maxWidth="md"
  fullWidth
  TransitionComponent={isMobile ? SlideUpTransition : undefined}
  PaperProps={{ 
    sx: { 
      bgcolor: 'background.default',
      ...(isMobile && {
        marginTop: '10vh',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        border: 'none',
        borderTop: '2px solid #333333'
      })
    } 
  }}
>
```

- [ ] **Step 2: Commit**
```bash
git add src/components/CardDetailsModal.tsx
git commit -m "ui: implement mobile bottom-sheet modal"
```
