import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using mock data.');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Type definitions for Supabase tables
export interface DbRouteKPI {
    id: string;
    route_code: string;
    load_factor: number;
    target_load_factor: number;
    rask: number;
    rask_trend: number;
    yield: number;
    yield_trend: number;
}

export interface DbFlight {
    id: string;
    flight_number: string;
    origin: string;
    destination: string;
    departure_date: string;
    aircraft: string;
    capacity: number;
    booked: number;
    forecast_load_factor: number;
    current_load_factor: number;
    rask: number;
    yield: number;
    status: string;
}

export interface DbKPI {
    id: string;
    label: string;
    value: string;
    trend: number;
    trend_direction: string;
    description: string;
}

export interface DbBookingCurve {
    id: string;
    route_code: string;
    days_out: number;
    actual: number;
    forecast: number;
    last_year: number;
}

export interface DbCompetitorData {
    id: string;
    route_code: string;
    date: string;
    our_price: number;
    comp_price: number;
    market_average: number;
}

export interface DbWaterfallData {
    id: string;
    route_code: string;
    name: string;
    value: number;
    item_type: string;
    sort_order: number;
}

export interface DbElasticityScenario {
    id: string;
    route_code: string;
    price_change: number;
    revenue_uplift: number;
}

export interface DbOverbookingScenario {
    id: string;
    route_code: string;
    scenario_name: string;
    net_value: number;
}

export interface DbPricingForecast {
    id: string;
    route_code: string;
    month: string;
    historical: number;
    forecast: number;
    optimal: number;
}

export interface DbPricingMatrix {
    id: string;
    route_code: string;
    segment: string;
    values: number[];
}

export interface DbNoShowRisk {
    id: string;
    route_code: string;
    risk_name: string;
    risk_value: number;
    color: string;
}

export interface DbUnconstrainingData {
    id: string;
    route_code: string;
    price: string;
    bookings: number;
    latent: number;
    denial: number;
}

export interface DbRagMetrics {
    id: string;
    faithfulness_score: number;
    sources: { name: string; matchScore: number; type: string }[];
}

export interface DbChartData {
    id: string;
    date: string;
    date_label: string;
    actual: number;
    forecast: number;
    budget: number;
}
