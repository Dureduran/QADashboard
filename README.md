<div align="center">
<img width="1200" height="475" alt="Qatar Airways RM Demo Dashboard" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ✈️ Qatar Airways RM Demo - Airline Revenue Management Dashboard

**A modern, AI-powered revenue management dashboard for airlines**

![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-purple?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan?logo=tailwindcss)

</div>

---

## 📋 Overview

Qatar Airways RM Demo is a comprehensive airline revenue management dashboard that provides strategic insights, demand forecasting, dynamic pricing optimization, and an AI-powered assistant. Built with React, TypeScript, and powered by Google's Gemini AI.

## ✨ Features

- **📊 Strategic Dashboard** - Real-time KPIs including Load Factor, RASK gauges, and route profitability analysis
- **📈 Demand Forecasting** - Interactive demand prediction with booking pace S-curves
- **💰 Dynamic Pricing** - Price elasticity analysis and optimization tools
- **🎟️ No-Show Predictor** - Overbooking risk assessment and no-show forecasting
- **🤖 RM Assistant** - AI-powered revenue management assistant using Gemini
- **📉 Competitor Tracking** - Monitor and compare competitor pricing strategies
- **📖 Business Rules** - Configure and view assumptions & rules driving the system

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/AirlineDashboard.git
   cd AirlineDashboard
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure your API key**
   
   Open `.env.local` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
AirlineDashboard/
├── components/
│   ├── dashboard/       # Dashboard views and panels
│   ├── layout/          # Header, Sidebar components
│   └── ui/              # Reusable UI components
├── lib/
│   └── utils.ts         # Utility functions
├── services/
│   └── mockData.ts      # Mock data for development
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── index.html           # HTML template with Tailwind config
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🔧 Configuration

The app uses environment variables for configuration:

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

## 🎨 Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS (via CDN)
- **Charts**: Recharts 2.12
- **Data Fetching**: TanStack React Query 5
- **Form Handling**: React Hook Form 7.50 + Zod
- **Icons**: Lucide React
- **Tables**: TanStack React Table 8

## 📊 Dashboard Views

1. **Dashboard** - Main strategic overview with KPIs
2. **Demand Forecasting** - Interactive demand prediction tools
3. **No-Show Predictor** - Overbooking optimization
4. **Pricing Optimizer** - Dynamic pricing controls
5. **RM Assistant** - AI-powered Q&A assistant
6. **Rationale for Route Selection** - Route analysis documentation
7. **Assumptions & Rules** - Business rule configuration
8. **Data Sources & Schema** - Data architecture overview

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

---

<div align="center">
<strong>Built with ❤️ for airline revenue optimization</strong>
</div>
