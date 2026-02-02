
export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string; // ISO String
  aircraft: string;
  capacity: number;
  booked: number;
  forecastLoadFactor: number; // 0-100
  currentLoadFactor: number; // 0-100
  rask: number; // Revenue per Available Seat Kilometer
  yield: number;
  status: 'On Track' | 'Critical' | 'Overbooked' | 'Opportunity';
}

export interface RouteKPI {
  id: string;
  route: string; // e.g., "DOH-JFK"
  loadFactor: number;
  targetLoadFactor: number;
  rask: number;
  raskTrend: number;
  yield: number;
  yieldTrend: number;
}

export interface BookingCurvePoint {
  daysOut: number;
  actual: number;
  forecast: number;
  ly: number; // Last Year
}

export interface CompetitorDataPoint {
  date: string;
  ourPrice: number;
  compPrice: number;
  marketAverage: number;
}

export interface WaterfallItem {
  name: string;
  value: number;
  type: 'increase' | 'decrease' | 'total';
  start?: number; // Helper for Recharts visualization
  end?: number;   // Helper for Recharts visualization
}

export interface KPI {
  label: string;
  value: string;
  trend: number; // Percentage
  trendDirection: 'up' | 'down' | 'neutral';
  description: string;
}

export interface ChartDataPoint {
  date: string;
  actual: number;
  forecast: number;
  budget: number;
}

export enum Region {
  GLOBAL = 'Global',
  NAM = 'North America',
  EUR = 'Europe',
  APAC = 'Asia Pacific',
  MENA = 'Middle East & Africa'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PricingForecast {
  month: string;
  historical: number;
  forecast: number;
  optimal: number;
}

export interface PricingMatrixRow {
  segment: string;
  values: number[];
}

export interface PricingData {
  forecast: PricingForecast[];
  matrix: PricingMatrixRow[];
}

export interface RiskProfile {
  name: string;
  value: number;
  color: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  fill: string;
}

export interface NoShowData {
  risk: RiskProfile[];
  scatter: ScatterPoint[];
}

export interface ElasticityScenario {
  x: number; // Price Change %
  y: number; // Revenue Uplift %
}

export interface OverbookingScenario {
  name: string; // e.g. "+2 Seats"
  value: number; // Net Result
}


export interface RAGMetric {
  faithfulnessScore: number;
  sources: { name: string; matchScore: number; type: string }[];
}

export interface UnconstrainingItem {
  price: string;
  bookings: number;
  latent: number;
  denial: number;
}
