# Yu-Gi-Oh! "Ink & Steel" Project Instructions

This project is a high-contrast Yu-Gi-Oh! card viewer built with React, MUI, and Supabase.

## Core Mandates

### Image Caching & Hotlinking
- **NO HOTLINKING:** Never use images directly from `images.ygoprodeck.com` in the frontend.
- **Cache Pattern:** All images must be served from Supabase Storage via the `cache-ygo-image` Edge Function.

### Visual Identity: Ink & Steel
- **Palette**: Deep Obsidian (`#0a0a0a`), Pure White (`#ffffff`), and Electric Yellow (`#ffea00`) accents.
- **Design Style**: Geometric, sharp borders (no shadows), high contrast, minimalist.
- **Mobile First**: 2-column grid and bottom-sheet modals are mandatory for mobile UX.

## Technical Stack
- **Build Tool:** Vite / pnpm
- **Frontend:** React (TypeScript) + Material UI
- **Backend:** Supabase (DB, Storage, Edge Functions)
- **Icons:** Lucide React

## Architectural Patterns
- **Theme Isolation**: Keep the Ink & Steel MUI theme in `src/theme.ts`.
- **Filter State**: Centralize search and filter logic in `CardList.tsx`.
- **Responsive Layout**: Use MUI's responsive breakpoints strictly to maintain the 2-column grid on small screens.
