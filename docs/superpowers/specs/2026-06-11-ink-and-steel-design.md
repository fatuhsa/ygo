# Design Spec: Yu-Gi-Oh! Explorer "Ink & Steel" Edition
**Date:** 2026-06-11
**Status:** Approved

## 1. Overview
A major UI/UX overhaul focusing on a high-contrast, minimalist "Ink & Steel" aesthetic. The update introduces a mobile-optimized 2-column grid, a functional hamburger sidebar for deep filtering (including Archetypes), and a bottom-sheet modal for better one-handed mobile use.

## 2. Visual Identity: "Ink & Steel"
Moving away from mainstream palettes to a sharp, geometric look:
- **Background**: `#0a0a0a` (Deep Obsidian)
- **Primary Text**: `#ffffff` (Pure White)
- **Secondary Text**: `#a0a0a0` (Cool Gray)
- **Accent Color**: `#ffea00` (Electric Yellow) - used for highlights, active states, and buttons.
- **Borders**: `1px solid #333333` (no shadows, sharp corners).
- **Surfaces**: `#111111` (Matte Black) for cards and sidebars.

## 3. Layout & Components
### 3.1 Mobile Grid
- **2-Column Layout**: Strict grid on mobile devices.
- **Card Aspect Ratio**: Fixed ratio to ensure card images fit perfectly within the container without cropping.
- **Interactions**: Subtle border highlight on hover/touch using Electric Yellow.

### 3.2 Navigation (Hamburger Sidebar)
- **Trigger**: Menu icon in the top-left header.
- **Filter Content**:
  - **Archetype Search**: Dynamic autocomplete field using the YGOPRODeck `archetype` parameter.
  - **Card Type**: Checkbox/List filter.
  - **Attribute/Race**: Categorized filter sections.

### 3.3 Optimized Modal (Bottom Sheet)
- **Behavior**: Slides up from the bottom on mobile; centered dialog on desktop.
- **Content**: Large card image at the top, followed by stats in a clean, high-contrast list.

## 4. Technical Changes
- **State Management**: Lift state for `filters` (archetype, type, etc.) to `CardList`.
- **API Integration**: Update fetch logic to support `archetype` and multiple filter parameters.
- **Theme Update**: Overhaul `src/theme.ts` with the new palette and component overrides.
- **Component Refactor**: Introduce `FilterSidebar.tsx` and update `YgoCard` for the new aspect ratio logic.
