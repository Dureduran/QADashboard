
import { Flight, KPI, ChartDataPoint, Region, RouteKPI, BookingCurvePoint, CompetitorDataPoint, WaterfallItem, PricingData, NoShowData, ElasticityScenario, OverbookingScenario, RAGMetric } from '../types';
import { sleep } from '../lib/utils';

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
const generateCompetitorData = (basePrice: number) => {
    return Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', {weekday: 'short'}),
        ourPrice: basePrice + Math.floor(Math.random() * 100 - 50),
        compPrice: basePrice + Math.floor(Math.random() * 150 - 75),
        marketAverage: basePrice - 20,
    }));
};

export const MOCK_COMPETITOR_DATA: Record<string, CompetitorDataPoint[]> = {
    'DOH-SFO': generateCompetitorData(1400),
    'DOH-JFK': generateCompetitorData(1200),
    'DOH-LOS': generateCompetitorData(1800),
    'DOH-PVG': generateCompetitorData(900),
    'DOH-ZAG': generateCompetitorData(750),
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
    'DEFAULT': [
        { name: 'Base Fare', value: 40000, type: 'total' },
        { name: 'Ancillaries', value: 4000, type: 'increase' },
        { name: 'Spoilage', value: -2000, type: 'decrease' },
        { name: 'Ops Cost', value: -20000, type: 'decrease' },
        { name: 'Net Profit', value: 22000, type: 'total' }
    ]
};

// 5. Elasticity Data (Visual E)
export const MOCK_ELASTICITY: ElasticityScenario[] = [
    { x: -10, y: 15 },
    { x: -5, y: 8 },
    { x: 0, y: 0 },
    { x: 5, y: -12 },
    { x: 10, y: -25 },
];

// 6. Overbooking Data (Visual F)
export const MOCK_OVERBOOKING: OverbookingScenario[] = [
    { name: '+2 Seats', value: 1200 },
    { name: '+4 Seats', value: 2100 },
    { name: '+6 Seats', value: 1500 },
    { name: '+8 Seats', value: -800 },
    { name: '+10 Seats', value: -2500 },
];

// 7. RAG Metrics (Visual G & H)
export const MOCK_RAG_METRICS: RAGMetric = {
    faithfulnessScore: 92,
    sources: [
        { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 98, type: 'Policy' },
        { name: 'Q3_2025_Revenue_Report.pdf', matchScore: 85, type: 'Report' },
        { name: 'DOH_LHR_Market_Brief.docx', matchScore: 78, type: 'Brief' }
    ]
};

// Legacy & General Data
export const MOCK_FLIGHTS: Flight[] = [
  { id: 'f1', flightNumber: 'QR001', origin: 'DOH', destination: 'LHR', departureDate: new Date().toISOString(), aircraft: 'A380', capacity: 517, booked: 510, forecastLoadFactor: 98, currentLoadFactor: 98.6, rask: 12.4, yield: 14.2, status: 'Overbooked' },
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

export const MOCK_PRICING_DATA: PricingData = {
  forecast: [
    { month: 'Jan', historical: 400, forecast: 420, optimal: 450 },
    { month: 'Feb', historical: 380, forecast: 400, optimal: 430 },
    { month: 'Mar', historical: 450, forecast: 480, optimal: 500 },
    { month: 'Apr', historical: 470, forecast: 510, optimal: 530 },
    { month: 'May', historical: 500, forecast: 540, optimal: 580 },
    { month: 'Jun', historical: 520, forecast: 560, optimal: 600 },
  ],
  matrix: [
    { segment: 'Leisure', values: [15, 25, 45, 65, 85, 90, 95, 100] },
    { segment: 'Business', values: [5, 10, 20, 40, 60, 80, 90, 95] },
    { segment: 'Corporate', values: [0, 5, 10, 25, 50, 75, 85, 90] },
  ]
};

export const MOCK_NOSHOW_DATA: NoShowData = {
  risk: [
    { name: 'High Risk', value: 30, color: '#ef4444' },
    { name: 'Medium Risk', value: 45, color: '#f59e0b' },
    { name: 'Low Risk', value: 25, color: '#10b981' },
  ],
  scatter: Array.from({ length: 50 }).map(() => ({
    x: Math.random(),
    y: Math.floor(Math.random() * 1000) + 200,
    fill: Math.random() > 0.5 ? '#8884d8' : '#82ca9d'
  }))
};

export const api = {
  getRouteKPIs: async (route: string): Promise<RouteKPI> => {
      await sleep(400);
      return MOCK_ROUTE_KPIS[route] || MOCK_ROUTE_KPIS['DOH-SFO'];
  },
  getBookingCurve: async (route: string): Promise<BookingCurvePoint[]> => {
      await sleep(600);
      return MOCK_BOOKING_CURVES[route] || MOCK_BOOKING_CURVES['DOH-SFO'];
  },
  getCompetitorData: async (route: string): Promise<CompetitorDataPoint[]> => {
      await sleep(500);
      return MOCK_COMPETITOR_DATA[route] || MOCK_COMPETITOR_DATA['DOH-SFO'];
  },
  getWaterfallData: async (route: string): Promise<WaterfallItem[]> => {
      await sleep(700);
      return MOCK_WATERFALL_DATA[route] || MOCK_WATERFALL_DATA['DEFAULT'];
  },
  getElasticityData: async (route: string): Promise<ElasticityScenario[]> => {
      await sleep(500);
      return MOCK_ELASTICITY;
  },
  getOverbookingData: async (route: string): Promise<OverbookingScenario[]> => {
      await sleep(600);
      return MOCK_OVERBOOKING;
  },
  getRAGMetrics: async (): Promise<RAGMetric> => {
      await sleep(300);
      return MOCK_RAG_METRICS;
  },
  getFlights: async (): Promise<Flight[]> => {
    await sleep(800); 
    return MOCK_FLIGHTS;
  },
  updateFlight: async (id: string, updates: Partial<Flight>): Promise<Flight> => {
    await sleep(1000);
    return { ...MOCK_FLIGHTS[0], ...updates };
  },
  getKPIs: async (): Promise<KPI[]> => {
    await sleep(500);
    return MOCK_KPIS;
  },
  getChartData: async (): Promise<ChartDataPoint[]> => {
    await sleep(600);
    return MOCK_CHART_DATA;
  },
  getPricingData: async (): Promise<PricingData> => {
    await sleep(700);
    return MOCK_PRICING_DATA;
  },
  getNoShowData: async (): Promise<NoShowData> => {
    await sleep(600);
    return MOCK_NOSHOW_DATA;
  }
};
