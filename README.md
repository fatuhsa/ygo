# Yu-Gi-Oh! Explorer: Ink & Steel Edition

A high-contrast, minimalist Yu-Gi-Oh! card viewer built with a focus on speed, mobile ergonomics, and legal compliance (mandatory image caching).

![Theme](https://img.shields.io/badge/Theme-Ink%20%26%20Steel-ffea00?style=for-the-badge&labelColor=0a0a0a)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=for-the-badge&logo=supabase)

## ✨ Features

- **Ink & Steel Aesthetic**: A striking high-contrast UI using Deep Obsidian, Pure White, and Electric Yellow highlights.
- **On-Demand Image Caching**: Fully compliant with YGOPRODeck rules. All images are automatically cached in Supabase Storage via Edge Functions to prevent hotlinking.
- **Mobile-First UX**: 
  - Strict 2-column grid for maximum legibility on small screens.
  - Slide-up "Bottom Sheet" modals for ergonomic one-handed use.
- **Advanced Filtering**: 
  - Hamburger sidebar for deep filtering (Card Type, Attribute, Level/Rank).
  - Dynamic Archetype Autocomplete search (supporting 600+ archetypes).
- **Industrial Details**: Custom stat modules for ATK/DEF and live market price tickers from TCGPlayer and Cardmarket.

## 🛠️ Tech Stack

- **Frontend**: React 19 (TypeScript), Vite
- **UI Library**: Material UI (MUI v6)
- **Icons**: Lucide React
- **Backend**: Supabase (Database, Storage, Edge Functions)
- **Styling**: Emotion + MUI `sx` prop

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- A Supabase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/fatuhsa/ygo.git
   cd ygo
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (use `.env.example` as a template):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**:
   ```bash
   pnpm dev
   ```

## 🔐 Deployment

### 1. Supabase Setup
- Run the SQL migration found in `supabase/migrations/20260611_init.sql` in your Supabase SQL Editor.
- Ensure the `ygo-images` bucket is created and set to **Public**.
- Deploy the Edge Function:
  ```bash
  pnpm supabase functions deploy cache-ygo-image
  ```

### 2. Frontend Deployment
- Push your code to GitHub/Vercel/Netlify.
- Add your `.env` variables to the deployment platform's dashboard.

## ⚖️ License & Compliance

This project utilizes the [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/). To ensure compliance with their terms of service, this application **strictly avoids hotlinking images**. Every image viewed is processed through a private Supabase Storage proxy.

---

Built with ⚡ by Gemini CLI
