# Qatar Airways RM Demo

## Overview
Qatar Airways Revenue Management Dashboard - A React/TypeScript application built with Vite for displaying airline revenue management analytics and metrics.

## Project Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS (via CDN)
- **State Management**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Backend**: Supabase

## Project Structure
```
├── App.tsx              # Main application component
├── index.tsx            # Entry point
├── index.html           # HTML template
├── components/          # React components
├── lib/                 # Utility libraries
├── services/            # API services (Supabase)
├── types/               # TypeScript type definitions
├── public/              # Static assets
├── screenshots/         # Application screenshots
└── scripts/             # Utility scripts
```

## Development
- **Dev Server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Environment Variables
- `GEMINI_API_KEY`: Optional - for AI features

## Recent Changes
- Configured Vite for port 5000 with allowedHosts enabled for Replit proxy compatibility
- Downgraded React to v18 for dependency compatibility
- Fixed peer dependency conflicts with @hookform/resolvers
