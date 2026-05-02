
import {
  Flight, KPI, ChartDataPoint, Region, RouteKPI, BookingCurvePoint,
  CompetitorDataPoint, WaterfallItem, PricingData, NoShowData,
  ElasticityScenario, OverbookingScenario, RAGMetric, UnconstrainingItem
} from '../types';
import { sleep } from '../lib/utils';
import * as supabaseData from './supabaseData';

// --- HIGH POTENTIAL ROUTES ---
const ROUTES = ['DOH-SFO', 'DOH-JFK', 'DOH-LOS', 'DOH-PVG', 'DOH-ZAG'];

// 1. KPI Data for the 5 Routes
export const MOCK_ROUTE_KPIS: Record<string, RouteKPI> = {
  'DOH-SFO': { id: '1', route: 'DOH-SFO', loadFactor: 82, targetLoadFactor: 90, rask: 9.8, raskTrend: 4.2, yield: 11.5, yieldTrend: 1.2 },
  'DOH-JFK': { id: '2', route: 'DOH-JFK', loadFactor: 88, targetLoadFactor: 92, rask: 12.4, raskTrend: 1.5, yield: 14.1, yieldTrend: 0.5 },
  'DOH-LOS': { id: '3', route: 'DOH-LOS', loadFactor: 74, targetLoadFactor: 85, rask: 14.5, raskTrend: -2.1, yield: 18.2, yieldTrend: -1.5 }, // High yield, volatile load
  'DOH-PVG': { id: '4', route: 'DOH-PVG', loadFactor: 65, targetLoadFactor: 80, rask: 7.2, raskTrend: 8.5, yield: 9.1, yieldTrend: 5.4 }, // High growth
  'DOH-ZAG': { id: '5', route: 'DOH-ZAG', loadFactor: 79, targetLoadFactor: 85, rask: 8.9, raskTrend: 0.5, yield: 10.2, yieldTrend: -0.2 },
};

// 2. Booking Curve Data (Days Out 90 -> 0)
const generateBookingCurve = (base: number): BookingCurvePoint[] => {
  return Array.from({ length: 15 }).map((_, i) => {
    const daysOut = 90 - (i * 6);
    const progress = (i + 1) / 15;
    // S-Curve simulation
    const sCurve = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
    return {
      daysOut,
      actual: Math.floor(base * sCurve * 0.95),
      forecast: Math.floor(base * sCurve),
      ly: Math.floor(base * sCurve * 0.85)
    };
  }).reverse();
};

export const MOCK_BOOKING_CURVES: Record<string, BookingCurvePoint[]> = {
  'DOH-SFO': generateBookingCurve(350),
  'DOH-JFK': generateBookingCurve(480),
  'DOH-LOS': generateBookingCurve(280),
  'DOH-PVG': generateBookingCurve(300),
  'DOH-ZAG': generateBookingCurve(180),
};

// 3. Competitor Price Analysis
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const generateCompetitorData = (
  basePrice: number,
  ourOffsets: number[],
  compOffsets: number[],
  marketOffset = -20
) => WEEKDAYS.map((date, i) => ({
  date,
  ourPrice: basePrice + ourOffsets[i],
  compPrice: basePrice + compOffsets[i],
  marketAverage: basePrice + marketOffset + Math.round((ourOffsets[i] + compOffsets[i]) / 4),
}));

export const MOCK_COMPETITOR_DATA: Record<string, CompetitorDataPoint[]> = {
  // Soft demand: QR stays slightly below the market to rebuild load without starting a price war.
  'DOH-SFO': generateCompetitorData(1400, [-45, -40, -35, -30, -25, -20, -15], [10, 8, 5, 0, -5, -8, -10]),
  // Mature/high-volume market: fares are stable with a mild weekend firming.
  'DOH-JFK': generateCompetitorData(1200, [0, 5, 10, 12, 18, 22, 24], [-15, -12, -8, -5, 0, 4, 6]),
  // High-yield but volatile: QR holds a premium while competitors soften late in the week.
  'DOH-LOS': generateCompetitorData(1800, [90, 85, 80, 72, 65, 58, 50], [35, 25, 12, 0, -15, -25, -35], 10),
  // Recovery/growth market: both QR and competitors step down tactically to stimulate demand.
  'DOH-PVG': generateCompetitorData(900, [-20, -28, -36, -44, -52, -58, -62], [-10, -18, -28, -38, -48, -56, -60], -35),
  // Thin seasonal route: disciplined, small moves around market average.
  'DOH-ZAG': generateCompetitorData(750, [-5, -2, 0, 4, 8, 10, 12], [5, 4, 2, 0, -2, -3, -5]),
};

// 4. Profitability Decomposition (Waterfall)
export const MOCK_WATERFALL_DATA: Record<string, WaterfallItem[]> = {
  'DOH-SFO': [
    { name: 'Base Fare', value: 45000, type: 'total' },
    { name: 'Fuel Surcharge', value: 12000, type: 'increase' },
    { name: 'Ancillaries', value: 5000, type: 'increase' },
    { name: 'Spoilage', value: -4000, type: 'decrease' },
    { name: 'Spill Cost', value: -1500, type: 'decrease' },
    { name: 'Ops Cost', value: -25000, type: 'decrease' },
    { name: 'Net Profit', value: 31500, type: 'total' }
  ],
  'DOH-LOS': [
    { name: 'Base Fare', value: 55000, type: 'total' },
    { name: 'Fuel Surcharge', value: 14000, type: 'increase' },
    { name: 'Ancillaries', value: 8000, type: 'increase' },
    { name: 'Spoilage', value: -8000, type: 'decrease' },
    { name: 'Ops Cost', value: -35000, type: 'decrease' },
    { name: 'Net Profit', value: 34000, type: 'total' }
  ],
  'DOH-JFK': [
    { name: 'Base Fare', value: 65000, type: 'total' },
    { name: 'Fuel Surcharge', value: 18000, type: 'increase' },
    { name: 'Ancillaries', value: 9000, type: 'increase' },
    { name: 'Spoilage', value: -3000, type: 'decrease' },
    { name: 'Ops Cost', value: -40000, type: 'decrease' },
    { name: 'Net Profit', value: 49000, type: 'total' }
  ],
  'DEFAULT': [
    { name: 'Base Fare', value: 40000, type: 'total' },
    { name: 'Ancillaries', value: 4000, type: 'increase' },
    { name: 'Spoilage', value: -2000, type: 'decrease' },
    { name: 'Ops Cost', value: -20000, type: 'decrease' },
    { name: 'Net Profit', value: 22000, type: 'total' }
  ]
};

// 5. Elasticity Data (Visual E)
export const MOCK_ELASTICITY: Record<string, ElasticityScenario[]> = {
  'DOH-SFO': [{ x: -10, y: 15 }, { x: -5, y: 8 }, { x: 0, y: 0 }, { x: 5, y: -12 }, { x: 10, y: -25 }],
  'DOH-LOS': [{ x: -10, y: 8 }, { x: -5, y: 4 }, { x: 0, y: 0 }, { x: 5, y: -4 }, { x: 10, y: -10 }], // Less elastic
  'DOH-JFK': [{ x: -10, y: 20 }, { x: -5, y: 12 }, { x: 0, y: 0 }, { x: 5, y: -18 }, { x: 10, y: -40 }], // Highly elastic
  'DOH-PVG': [{ x: -10, y: 18 }, { x: -5, y: 10 }, { x: 0, y: 0 }, { x: 5, y: -10 }, { x: 10, y: -22 }],
  'DOH-ZAG': [{ x: -10, y: 10 }, { x: -5, y: 5 }, { x: 0, y: 0 }, { x: 5, y: -7 }, { x: 10, y: -16 }],
  'DEFAULT': [{ x: -10, y: 12 }, { x: -5, y: 6 }, { x: 0, y: 0 }, { x: 5, y: -8 }, { x: 10, y: -18 }],
};

// 6. Overbooking Data (Visual F)
export const MOCK_OVERBOOKING: Record<string, OverbookingScenario[]> = {
  'DOH-SFO': [{ name: '+2 Seats', value: 1200 }, { name: '+4 Seats', value: 2100 }, { name: '+6 Seats', value: 1500 }, { name: '+8 Seats', value: -800 }, { name: '+10 Seats', value: -2500 }],
  'DOH-LOS': [{ name: '+2 Seats', value: 800 }, { name: '+4 Seats', value: 1200 }, { name: '+6 Seats', value: 1800 }, { name: '+8 Seats', value: 1500 }, { name: '+10 Seats', value: 500 }], // Higher tolerance
  'DOH-JFK': [{ name: '+2 Seats', value: 2500 }, { name: '+4 Seats', value: 1800 }, { name: '+6 Seats', value: 500 }, { name: '+8 Seats', value: -1500 }, { name: '+10 Seats', value: -4000 }], // Strict
  'DOH-PVG': [{ name: '+2 Seats', value: 900 }, { name: '+4 Seats', value: 1600 }, { name: '+6 Seats', value: 1300 }, { name: '+8 Seats', value: -200 }, { name: '+10 Seats', value: -1200 }],
  'DOH-ZAG': [{ name: '+2 Seats', value: 700 }, { name: '+4 Seats', value: 1100 }, { name: '+6 Seats', value: 900 }, { name: '+8 Seats', value: -100 }, { name: '+10 Seats', value: -900 }],
  'DEFAULT': [{ name: '+2 Seats', value: 1000 }, { name: '+4 Seats', value: 1500 }, { name: '+6 Seats', value: 1200 }, { name: '+8 Seats', value: -500 }, { name: '+10 Seats', value: -1500 }]
};

// 7. RAG Metrics (Visual G & H)
export const MOCK_RAG_METRICS: RAGMetric = {
  faithfulnessScore: 92,
  sources: [
    { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 98, type: 'Policy' },
    { name: 'Q3_2025_Revenue_Report.pdf', matchScore: 85, type: 'Report' },
    { name: 'DOH_SFO_Market_Brief.docx', matchScore: 78, type: 'Brief' }
  ]
};

// Legacy & General Data
export const MOCK_FLIGHTS: Flight[] = [
  { id: 'f1', flightNumber: 'QR737', origin: 'DOH', destination: 'SFO', departureDate: new Date().toISOString(), aircraft: 'A350', capacity: 327, booked: 268, forecastLoadFactor: 88, currentLoadFactor: 82, rask: 9.8, yield: 11.5, status: 'Opportunity' },
  { id: 'f2', flightNumber: 'QR701', origin: 'DOH', destination: 'JFK', departureDate: new Date().toISOString(), aircraft: 'B777', capacity: 354, booked: 280, forecastLoadFactor: 85, currentLoadFactor: 79.1, rask: 10.8, yield: 13.5, status: 'Opportunity' },
];

export const MOCK_KPIS: KPI[] = [
  { label: 'Total Revenue', value: '$124.5M', trend: 12.5, trendDirection: 'up', description: 'vs. last month' },
  { label: 'Avg Load Factor', value: '82.4%', trend: 2.1, trendDirection: 'up', description: 'vs. target' },
  { label: 'RASK', value: '8.4¢', trend: 1.2, trendDirection: 'down', description: 'Yield pressure in APAC' },
  { label: 'Pax Flown', value: '412k', trend: 5.4, trendDirection: 'up', description: 'Strong leisure demand' },
];

export const MOCK_CHART_DATA: ChartDataPoint[] = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  actual: 40000 + Math.random() * 10000,
  forecast: 42000 + Math.random() * 8000,
  budget: 50000,
}));

const PRICING_MONTHS = [
  { month: 'Feb 2026', periodStart: '2026-02-01', historical: 0.9, forecast: 0.95, optimal: 1 },
  { month: 'Mar 2026', periodStart: '2026-03-01', historical: 0.85, forecast: 0.9, optimal: 0.95 },
  { month: 'Apr 2026', periodStart: '2026-04-01', historical: 1, forecast: 1.05, optimal: 1.1 },
  { month: 'May 2026', periodStart: '2026-05-01', historical: 1.05, forecast: 1.1, optimal: 1.15 },
  { month: 'Jun 2026', periodStart: '2026-06-01', historical: 1.1, forecast: 1.15, optimal: 1.25 },
  { month: 'Jul 2026', periodStart: '2026-07-01', historical: 1.15, forecast: 1.2, optimal: 1.3 },
];

const generatePricingForecast = (base: number) => PRICING_MONTHS.map(point => ({
  month: point.month,
  periodStart: point.periodStart,
  historical: Math.round(base * point.historical),
  forecast: Math.round(base * point.forecast * 10) / 10,
  optimal: Math.round(base * point.optimal * 10) / 10,
}));

export const MOCK_PRICING_BY_ROUTE: Record<string, PricingData> = {
  'DOH-SFO': {
    forecast: generatePricingForecast(450),
    matrix: [
      { segment: 'Leisure', values: [15, 25, 45, 65, 85, 90, 95, 100] },
      { segment: 'Business', values: [5, 10, 20, 40, 60, 80, 90, 95] },
      { segment: 'Corporate', values: [0, 5, 10, 25, 50, 75, 85, 90] },
    ]
  },
  'DOH-JFK': {
    forecast: generatePricingForecast(550),
    matrix: [
      { segment: 'Leisure', values: [10, 20, 40, 60, 80, 85, 90, 95] },
      { segment: 'Business', values: [5, 8, 15, 30, 50, 70, 85, 90] },
      { segment: 'Corporate', values: [0, 2, 8, 20, 40, 65, 80, 85] },
    ]
  },
  'DOH-LOS': {
    forecast: generatePricingForecast(600),
    matrix: [
      { segment: 'Leisure', values: [20, 30, 50, 70, 90, 95, 98, 100] },
      { segment: 'Business', values: [10, 20, 30, 50, 70, 90, 95, 100] },
      { segment: 'Corporate', values: [5, 10, 20, 35, 60, 80, 90, 95] },
    ]
  },
  'DOH-PVG': {
    forecast: generatePricingForecast(380),
    matrix: [
      { segment: 'Leisure', values: [25, 35, 55, 74, 88, 94, 97, 100] },
      { segment: 'Business', values: [8, 15, 28, 44, 63, 79, 88, 93] },
      { segment: 'Corporate', values: [4, 9, 18, 31, 52, 70, 82, 88] },
    ]
  },
  'DOH-ZAG': {
    forecast: generatePricingForecast(320),
    matrix: [
      { segment: 'Leisure', values: [18, 30, 48, 68, 84, 91, 96, 100] },
      { segment: 'Business', values: [6, 12, 24, 42, 58, 74, 84, 91] },
      { segment: 'Corporate', values: [2, 6, 14, 28, 46, 66, 78, 86] },
    ]
  },
  'DEFAULT': {
    forecast: generatePricingForecast(400),
    matrix: [
      { segment: 'Leisure', values: [15, 25, 45, 65, 85, 90, 95, 100] },
      { segment: 'Business', values: [5, 10, 20, 40, 60, 80, 90, 95] },
      { segment: 'Corporate', values: [0, 5, 10, 25, 50, 75, 85, 90] },
    ]
  }
};

export const MOCK_NOSHOW_BY_ROUTE: Record<string, NoShowData> = {
  'DOH-SFO': {
    risk: [{ name: 'High Risk', value: 30, color: '#ef4444' }, { name: 'Medium Risk', value: 45, color: '#f59e0b' }, { name: 'Low Risk', value: 25, color: '#10b981' }],
    scatter: Array.from({ length: 50 }).map(() => ({ x: Math.random(), y: Math.floor(Math.random() * 1000) + 200, fill: Math.random() > 0.5 ? '#8884d8' : '#82ca9d' }))
  },
  'DOH-JFK': {
    risk: [{ name: 'High Risk', value: 15, color: '#ef4444' }, { name: 'Medium Risk', value: 35, color: '#f59e0b' }, { name: 'Low Risk', value: 50, color: '#10b981' }], // Safe
    scatter: Array.from({ length: 50 }).map(() => ({ x: Math.random(), y: Math.floor(Math.random() * 1200) + 300, fill: Math.random() > 0.3 ? '#8884d8' : '#82ca9d' }))
  },
  'DOH-LOS': {
    risk: [{ name: 'High Risk', value: 50, color: '#ef4444' }, { name: 'Medium Risk', value: 30, color: '#f59e0b' }, { name: 'Low Risk', value: 20, color: '#10b981' }], // Risky
    scatter: Array.from({ length: 50 }).map(() => ({ x: Math.random(), y: Math.floor(Math.random() * 900) + 150, fill: Math.random() > 0.7 ? '#8884d8' : '#82ca9d' }))
  },
  'DOH-PVG': {
    risk: [{ name: 'High Risk', value: 22, color: '#ef4444' }, { name: 'Medium Risk', value: 42, color: '#f59e0b' }, { name: 'Low Risk', value: 36, color: '#10b981' }],
    scatter: Array.from({ length: 50 }).map(() => ({ x: Math.random(), y: Math.floor(Math.random() * 850) + 180, fill: Math.random() > 0.45 ? '#8884d8' : '#82ca9d' }))
  },
  'DOH-ZAG': {
    risk: [{ name: 'High Risk', value: 28, color: '#ef4444' }, { name: 'Medium Risk', value: 34, color: '#f59e0b' }, { name: 'Low Risk', value: 38, color: '#10b981' }],
    scatter: Array.from({ length: 50 }).map(() => ({ x: Math.random(), y: Math.floor(Math.random() * 650) + 120, fill: Math.random() > 0.55 ? '#8884d8' : '#82ca9d' }))
  },
  'DEFAULT': {
    risk: [{ name: 'High Risk', value: 25, color: '#ef4444' }, { name: 'Medium Risk', value: 40, color: '#f59e0b' }, { name: 'Low Risk', value: 35, color: '#10b981' }],
    scatter: Array.from({ length: 50 }).map(() => ({ x: Math.random(), y: Math.floor(Math.random() * 1000) + 200, fill: Math.random() > 0.5 ? '#8884d8' : '#82ca9d' }))
  }
};

export const MOCK_UNCONSTRAINING_BY_ROUTE: Record<string, UnconstrainingItem[]> = {
  'DOH-SFO': [
    { price: '100', bookings: 80, latent: 95, denial: 15 },
    { price: '120', bookings: 70, latent: 75, denial: 5 },
    { price: '140', bookings: 60, latent: 62, denial: 2 },
    { price: '160', bookings: 45, latent: 45, denial: 0 },
    { price: '180', bookings: 30, latent: 30, denial: 0 },
  ],
  'DOH-JFK': [
    { price: '150', bookings: 90, latent: 120, denial: 30 },
    { price: '180', bookings: 80, latent: 100, denial: 20 },
    { price: '210', bookings: 65, latent: 75, denial: 10 },
    { price: '240', bookings: 50, latent: 55, denial: 5 },
    { price: '270', bookings: 40, latent: 40, denial: 0 },
  ],
  'DOH-LOS': [
    { price: '80', bookings: 100, latent: 150, denial: 50 }, // Massive spill
    { price: '100', bookings: 90, latent: 130, denial: 40 },
    { price: '120', bookings: 75, latent: 90, denial: 15 },
    { price: '140', bookings: 50, latent: 55, denial: 5 },
    { price: '160', bookings: 30, latent: 30, denial: 0 },
  ],
  'DOH-PVG': [
    { price: '90', bookings: 88, latent: 118, denial: 30 },
    { price: '115', bookings: 76, latent: 95, denial: 19 },
    { price: '140', bookings: 64, latent: 72, denial: 8 },
    { price: '165', bookings: 50, latent: 53, denial: 3 },
    { price: '190', bookings: 35, latent: 35, denial: 0 },
  ],
  'DOH-ZAG': [
    { price: '70', bookings: 72, latent: 88, denial: 16 },
    { price: '95', bookings: 64, latent: 74, denial: 10 },
    { price: '120', bookings: 51, latent: 56, denial: 5 },
    { price: '145', bookings: 39, latent: 40, denial: 1 },
    { price: '170', bookings: 24, latent: 24, denial: 0 },
  ],
  'DEFAULT': [
    { price: '100', bookings: 80, latent: 90, denial: 10 },
    { price: '120', bookings: 70, latent: 75, denial: 5 },
    { price: '140', bookings: 60, latent: 62, denial: 2 },
    { price: '160', bookings: 45, latent: 45, denial: 0 },
    { price: '180', bookings: 30, latent: 30, denial: 0 },
  ]
};


// Feature flag for live data (set via environment or toggle)
const USE_LIVE_DATA = import.meta.env.VITE_USE_LIVE_DATA === 'true';

// Import live data services
import * as liveApi from './api';
import * as mlServices from './ml';

export const api = {
  getRouteKPIs: async (route: string): Promise<RouteKPI> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchRouteKPIs(route);
      if (sbData) return sbData;
    } catch (error) {
      console.warn('Supabase failed, trying alternatives:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await liveApi.getRouteKPIs(route);
        return {
          id: data.id,
          route: data.route,
          loadFactor: data.loadFactor,
          targetLoadFactor: data.targetLoadFactor,
          rask: data.rask,
          raskTrend: data.raskTrend,
          yield: data.yield,
          yieldTrend: data.yieldTrend,
        };
      } catch (error) {
        console.warn('Live API failed, using mock data:', error);
      }
    }
    await sleep(400);
    return MOCK_ROUTE_KPIS[route] || MOCK_ROUTE_KPIS['DOH-SFO'];
  },
  getBookingCurve: async (route: string): Promise<BookingCurvePoint[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchBookingCurve(route);
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase booking curve failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await liveApi.getBookingCurve(route);
        return data.map(d => ({
          daysOut: parseInt(d.name.replace('-', '').replace('D', '0')) || 0,
          actual: d.actual,
          forecast: d.predicted,
          ly: Math.round(d.actual * 0.9),
        }));
      } catch (error) {
        console.warn('Live booking curve failed, using mock:', error);
      }
    }
    await sleep(600);
    return MOCK_BOOKING_CURVES[route] || MOCK_BOOKING_CURVES['DOH-SFO'];
  },
  getCompetitorData: async (route: string): Promise<CompetitorDataPoint[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchCompetitorData(route);
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase competitor data failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await liveApi.getCompetitorData(route);
        return data;
      } catch (error) {
        console.warn('Live competitor data failed, using mock:', error);
      }
    }
    await sleep(500);
    return MOCK_COMPETITOR_DATA[route] || MOCK_COMPETITOR_DATA['DOH-SFO'];
  },
  getWaterfallData: async (route: string): Promise<WaterfallItem[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchWaterfallData(route);
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase waterfall data failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await liveApi.getWaterfallData(route);
        return data.map(d => ({
          name: d.name,
          value: d.value,
          type: d.value >= 0 ? (d.name.includes('Revenue') ? 'total' : 'increase') : 'decrease',
        }));
      } catch (error) {
        console.warn('Live waterfall data failed, using mock:', error);
      }
    }
    await sleep(700);
    return MOCK_WATERFALL_DATA[route] || MOCK_WATERFALL_DATA['DEFAULT'];
  },
  getElasticityData: async (route: string): Promise<ElasticityScenario[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchElasticityData(route);
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase elasticity data failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await mlServices.getElasticityCurve(route, 1000);
        return data.slice(0, 5).map(d => ({
          x: d.priceChange,
          y: d.demandChange,
        }));
      } catch (error) {
        console.warn('Live elasticity data failed, using mock:', error);
      }
    }
    await sleep(500);
    return MOCK_ELASTICITY[route] || MOCK_ELASTICITY['DEFAULT'];
  },
  getOverbookingData: async (route: string): Promise<OverbookingScenario[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchOverbookingData(route);
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase overbooking data failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const analysis = await mlServices.analyzeFlightNoShowRisk(route, new Date().toISOString());
        const baseRevenue = 1500;
        return [2, 4, 6, 8, 10].map(seats => ({
          name: `+${seats} Seats`,
          value: seats <= analysis.optimalOverbooking
            ? Math.round(baseRevenue * (seats / 4))
            : Math.round(baseRevenue * (seats / 4) - (seats - analysis.optimalOverbooking) * 800),
        }));
      } catch (error) {
        console.warn('Live overbooking data failed, using mock:', error);
      }
    }
    await sleep(600);
    return MOCK_OVERBOOKING[route] || MOCK_OVERBOOKING['DEFAULT'];
  },
  getRAGMetrics: async (): Promise<RAGMetric> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchRAGMetrics();
      if (sbData) return sbData;
    } catch (error) {
      console.warn('Supabase RAG metrics failed:', error);
    }
    await sleep(300);
    return MOCK_RAG_METRICS;
  },
  getFlights: async (): Promise<Flight[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchFlights();
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase flights failed:', error);
    }
    await sleep(800);
    return MOCK_FLIGHTS;
  },
  updateFlight: async (id: string, updates: Partial<Flight>): Promise<Flight> => {
    await sleep(1000);
    return { ...MOCK_FLIGHTS[0], ...updates };
  },
  getKPIs: async (): Promise<KPI[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchKPIs();
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase KPIs failed:', error);
    }
    await sleep(500);
    return MOCK_KPIS;
  },
  getChartData: async (): Promise<ChartDataPoint[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchChartData();
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase chart data failed:', error);
    }
    await sleep(600);
    return MOCK_CHART_DATA;
  },
  getPricingData: async (route: string): Promise<PricingData> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchPricingData(route);
      if (sbData) return sbData;
    } catch (error) {
      console.warn('Supabase pricing data failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await liveApi.getPricingData(route);
        return {
          forecast: data.historical.map((h: any) => ({
            month: h.date,
            historical: h.price,
            forecast: h.forecast,
            optimal: h.optimal,
          })),
          matrix: MOCK_PRICING_BY_ROUTE['DEFAULT'].matrix,
        };
      } catch (error) {
        console.warn('Live pricing data failed, using mock:', error);
      }
    }
    await sleep(700);
    return MOCK_PRICING_BY_ROUTE[route] || MOCK_PRICING_BY_ROUTE['DEFAULT'];
  },
  getNoShowData: async (route: string): Promise<NoShowData> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchNoShowData(route);
      if (sbData) return sbData;
    } catch (error) {
      console.warn('Supabase no-show data failed:', error);
    }

    if (USE_LIVE_DATA) {
      try {
        const data = await liveApi.getNoShowData(route);
        return {
          risk: data.riskProfile,
          scatter: data.scatterData.map((s: any) => ({
            x: s.y / 100,
            y: s.x,
            fill: s.category === 'high' ? '#ef4444' : s.category === 'medium' ? '#f59e0b' : '#10b981',
          })),
        };
      } catch (error) {
        console.warn('Live no-show data failed, using mock:', error);
      }
    }
    await sleep(600);
    return MOCK_NOSHOW_BY_ROUTE[route] || MOCK_NOSHOW_BY_ROUTE['DEFAULT'];
  },
  getUnconstrainingData: async (route: string): Promise<UnconstrainingItem[]> => {
    // Try Supabase first
    try {
      const sbData = await supabaseData.fetchUnconstrainingData(route);
      if (sbData && sbData.length > 0) return sbData;
    } catch (error) {
      console.warn('Supabase unconstraining data failed:', error);
    }
    await sleep(500);
    return MOCK_UNCONSTRAINING_BY_ROUTE[route] || MOCK_UNCONSTRAINING_BY_ROUTE['DEFAULT'];
  },

  // New live data methods
  getDataSourceStatus: async () => {
    return liveApi.getDataSourceStatuses();
  },
  refreshData: async () => {
    await liveApi.refreshAllData();
  },
  getCacheStats: () => {
    return liveApi.getCacheStats();
  },
};
