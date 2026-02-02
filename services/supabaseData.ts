/**
 * Supabase Data Service
 * Fetches data from Supabase database for the AirlineDashboard
 */

import { supabase } from './supabase';
import type {
    DbRouteKPI, DbFlight, DbKPI, DbBookingCurve, DbCompetitorData,
    DbWaterfallData, DbElasticityScenario, DbOverbookingScenario,
    DbPricingForecast, DbPricingMatrix, DbNoShowRisk, DbUnconstrainingData,
    DbRagMetrics, DbChartData
} from './supabase';
import type {
    RouteKPI, Flight, KPI, BookingCurvePoint, CompetitorDataPoint,
    WaterfallItem, ElasticityScenario, OverbookingScenario, PricingData,
    NoShowData, UnconstrainingItem, RAGMetric, ChartDataPoint
} from '../types';

// Check if Supabase is configured
export const isSupabaseEnabled = (): boolean => {
    return supabase !== null;
};

// Route KPIs
export const fetchRouteKPIs = async (route: string): Promise<RouteKPI | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('route_kpis')
        .select('*')
        .eq('route_code', route)
        .single();

    if (error || !data) return null;

    const dbData = data as DbRouteKPI;
    return {
        id: dbData.id,
        route: dbData.route_code,
        loadFactor: Number(dbData.load_factor),
        targetLoadFactor: Number(dbData.target_load_factor),
        rask: Number(dbData.rask),
        raskTrend: Number(dbData.rask_trend),
        yield: Number(dbData.yield),
        yieldTrend: Number(dbData.yield_trend),
    };
};

// Flights
export const fetchFlights = async (): Promise<Flight[] | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('flights')
        .select('*');

    if (error || !data) return null;

    return (data as DbFlight[]).map(f => ({
        id: f.id,
        flightNumber: f.flight_number,
        origin: f.origin,
        destination: f.destination,
        departureDate: f.departure_date,
        aircraft: f.aircraft,
        capacity: f.capacity,
        booked: f.booked,
        forecastLoadFactor: Number(f.forecast_load_factor),
        currentLoadFactor: Number(f.current_load_factor),
        rask: Number(f.rask),
        yield: Number(f.yield),
        status: f.status as Flight['status'],
    }));
};

// Global KPIs
export const fetchKPIs = async (): Promise<KPI[] | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('kpis')
        .select('*');

    if (error || !data) return null;

    return (data as DbKPI[]).map(k => ({
        label: k.label,
        value: k.value,
        trend: Number(k.trend),
        trendDirection: k.trend_direction as KPI['trendDirection'],
        description: k.description,
    }));
};

// Chart Data (Revenue Forecast)
export const fetchChartData = async (): Promise<ChartDataPoint[] | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('chart_data')
        .select('*')
        .order('date', { ascending: true });

    if (error || !data) return null;

    return (data as DbChartData[]).map(c => ({
        date: c.date_label,
        actual: Number(c.actual),
        forecast: Number(c.forecast),
        budget: Number(c.budget),
    }));
};

// Booking Curves
export const fetchBookingCurve = async (route: string): Promise<BookingCurvePoint[] | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('booking_curves')
        .select('*')
        .eq('route_code', route)
        .order('days_out', { ascending: false });

    if (error || !data) return null;

    return (data as DbBookingCurve[]).map(b => ({
        daysOut: b.days_out,
        actual: b.actual,
        forecast: b.forecast,
        ly: b.last_year,
    }));
};

// Competitor Data
export const fetchCompetitorData = async (route: string): Promise<CompetitorDataPoint[] | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('competitor_data')
        .select('*')
        .eq('route_code', route)
        .order('date');

    if (error || !data) return null;

    return (data as DbCompetitorData[]).map(c => ({
        date: new Date(c.date).toLocaleDateString('en-US', { weekday: 'short' }),
        ourPrice: Number(c.our_price),
        compPrice: Number(c.comp_price),
        marketAverage: Number(c.market_average),
    }));
};

// Waterfall Data
export const fetchWaterfallData = async (route: string): Promise<WaterfallItem[] | null> => {
    if (!supabase) return null;

    // Try route-specific first, fallback to DEFAULT
    let { data, error } = await supabase
        .from('waterfall_data')
        .select('*')
        .eq('route_code', route)
        .order('sort_order');

    if (error || !data || data.length === 0) {
        const defaultResult = await supabase
            .from('waterfall_data')
            .select('*')
            .eq('route_code', 'DEFAULT')
            .order('sort_order');

        if (defaultResult.error || !defaultResult.data) return null;
        data = defaultResult.data;
    }

    return (data as DbWaterfallData[]).map(w => ({
        name: w.name,
        value: Number(w.value),
        type: w.item_type as WaterfallItem['type'],
    }));
};

// Elasticity Scenarios
export const fetchElasticityData = async (route: string): Promise<ElasticityScenario[] | null> => {
    if (!supabase) return null;

    let { data, error } = await supabase
        .from('elasticity_scenarios')
        .select('*')
        .eq('route_code', route)
        .order('price_change');

    if (error || !data || data.length === 0) {
        const defaultResult = await supabase
            .from('elasticity_scenarios')
            .select('*')
            .eq('route_code', 'DEFAULT')
            .order('price_change');

        if (defaultResult.error || !defaultResult.data) return null;
        data = defaultResult.data;
    }

    return (data as DbElasticityScenario[]).map(e => ({
        x: Number(e.price_change),
        y: Number(e.revenue_uplift),
    }));
};

// Overbooking Scenarios
export const fetchOverbookingData = async (route: string): Promise<OverbookingScenario[] | null> => {
    if (!supabase) return null;

    let { data, error } = await supabase
        .from('overbooking_scenarios')
        .select('*')
        .eq('route_code', route);

    if (error || !data || data.length === 0) {
        const defaultResult = await supabase
            .from('overbooking_scenarios')
            .select('*')
            .eq('route_code', 'DEFAULT');

        if (defaultResult.error || !defaultResult.data) return null;
        data = defaultResult.data;
    }

    return (data as DbOverbookingScenario[]).map(o => ({
        name: o.scenario_name,
        value: Number(o.net_value),
    }));
};

// Pricing Data (combines forecast and matrix)
export const fetchPricingData = async (route: string): Promise<PricingData | null> => {
    if (!supabase) return null;

    // Fetch forecast
    let { data: forecastData, error: forecastError } = await supabase
        .from('pricing_forecast')
        .select('*')
        .eq('route_code', route)
        // Order by specific case statement or just ensure ordering is handled if needed
        // Since we are using full month names, simple alpha sort might be wrong
        // but let's assume insertion order or manage it in app
        .order('id', { ascending: true }); // Assume inserted in order

    if (forecastError || !forecastData || forecastData.length === 0) {
        const defaultResult = await supabase
            .from('pricing_forecast')
            .select('*')
            .eq('route_code', 'DEFAULT')
            .order('id', { ascending: true });

        if (!defaultResult.error && defaultResult.data) {
            forecastData = defaultResult.data;
        }
    }

    // Fetch matrix
    let { data: matrixData, error: matrixError } = await supabase
        .from('pricing_matrix')
        .select('*')
        .eq('route_code', route);

    if (matrixError || !matrixData || matrixData.length === 0) {
        const defaultResult = await supabase
            .from('pricing_matrix')
            .select('*')
            .eq('route_code', 'DEFAULT');

        if (!defaultResult.error && defaultResult.data) {
            matrixData = defaultResult.data;
        }
    }

    if (!forecastData || !matrixData) return null;

    return {
        forecast: (forecastData as DbPricingForecast[]).map(f => ({
            month: f.month,
            historical: Number(f.historical),
            forecast: Number(f.forecast),
            optimal: Number(f.optimal),
        })),
        matrix: (matrixData as DbPricingMatrix[]).map(m => ({
            segment: m.segment,
            values: m.values,
        })),
    };
};

// No-Show Data
export const fetchNoShowData = async (route: string): Promise<NoShowData | null> => {
    if (!supabase) {
        console.warn('Supabase client not initialized in fetchNoShowData');
        return null;
    }

    let { data, error } = await supabase
        .from('noshow_risk')
        .select('*')
        .eq('route_code', route);

    if (error) {
        console.error('Supabase fetchNoShowData error:', error);
        return null;
    }

    if (!data || data.length === 0) {
        console.log(`No no-show data for ${route}, trying DEFAULT`);
        const defaultResult = await supabase
            .from('noshow_risk')
            .select('*')
            .eq('route_code', 'DEFAULT');

        if (defaultResult.error || !defaultResult.data) {
            console.warn('Supabase fetchNoShowData default fallback failed');
            return null;
        }
        data = defaultResult.data;
    }

    console.log('Supabase fetchNoShowData success:', data.length, 'records');

    const riskData = (data as DbNoShowRisk[]).map(n => ({
        name: n.risk_name,
        value: Number(n.risk_value),
        color: n.color,
    }));

    // Generate scatter data (same logic as mock)
    const scatter = Array.from({ length: 50 }).map(() => ({
        x: Math.random(),
        y: Math.floor(Math.random() * 1000) + 200,
        fill: Math.random() > 0.5 ? '#8884d8' : '#82ca9d',
    }));

    return { risk: riskData, scatter };
};

// Unconstraining Data
export const fetchUnconstrainingData = async (route: string): Promise<UnconstrainingItem[] | null> => {
    if (!supabase) return null;

    let { data, error } = await supabase
        .from('unconstraining_data')
        .select('*')
        .eq('route_code', route)
        .order('price');

    if (error) {
        console.error('Supabase fetchUnconstrainingData error:', error);
        return null;
    }

    if (!data || data.length === 0) {
        console.log(`No unconstraining data for ${route}, trying DEFAULT`);
        const defaultResult = await supabase
            .from('unconstraining_data')
            .select('*')
            .eq('route_code', 'DEFAULT')
            .order('price');

        if (defaultResult.error || !defaultResult.data) return null;
        data = defaultResult.data;
    }

    console.log('Supabase fetchUnconstrainingData success:', data.length, 'records');

    return (data as DbUnconstrainingData[]).map(u => ({
        price: u.price,
        bookings: u.bookings,
        latent: u.latent,
        denial: u.denial,
    }));
};

// RAG Metrics
export const fetchRAGMetrics = async (): Promise<RAGMetric | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('rag_metrics')
        .select('*')
        .limit(1)
        .single();

    if (error || !data) return null;

    const dbData = data as DbRagMetrics;
    return {
        faithfulnessScore: Number(dbData.faithfulness_score),
        sources: dbData.sources,
    };
};
