/**
 * Data Aggregator Service
 * Combines data from multiple sources into dashboard-ready formats
 */

import { getRouteActivity, getAircraftNearAirport } from './opensky';
import { getCompetitorData, getPriceSnapshot } from './serpapi';
import { getEconomicIndicators, getJetFuelPrice, getFuelSurchargeRecommendation } from './fred';
import { getAirportWeather, getMultiAirportWeather, getWeatherImpact } from './weather';
import { routeMetadata, logAPICall } from './config';
import { apiCache } from './cache';
import {
    forecastDemand,
    predictBookingCurve,
    getNoShowChartData,
    analyzeFlightNoShowRisk,
    getPricingChartData,
    generatePricingRecommendations,
} from '../ml';

import type { RouteKPI, WaterfallItem, CompetitorDataPoint } from '../../types';

export interface DataSourceStatus {
    name: string;
    status: 'connected' | 'degraded' | 'offline';
    lastUpdated: Date | null;
    cached: boolean;
}

export interface AggregatedRouteData {
    kpi: RouteKPI;
    bookingCurve: { name: string; actual: number; predicted: number; optimal: number }[];
    competitors: CompetitorDataPoint[];
    waterfall: WaterfallItem[];
    weather: { origin: any; destination: any };
    dataSources: DataSourceStatus[];
}

/**
 * Get comprehensive route KPIs with live data
 */
export async function getRouteKPIs(route: string): Promise<RouteKPI> {
    const metadata = routeMetadata[route];
    const [origin, destination] = route.split('-');

    // Fetch data from multiple sources
    const [flightActivity, economicData, weatherImpact, priceSnapshot] = await Promise.all([
        getRouteActivity(origin, destination),
        getEconomicIndicators(),
        getWeatherImpact(origin, destination),
        getPriceSnapshot(route),
    ]);

    // Get demand forecast
    const forecast = await forecastDemand(route, 1);
    const demandMultiplier = forecast[0]?.factors.economic || 1.0;

    // Calculate metrics
    const baseCapacity = metadata?.baseCapacity || 300;
    const avgFare = priceSnapshot.ourPrice || metadata?.avgFare || 1000;
    const loadFactor = Math.min(0.98, (metadata?.avgLoadFactor || 0.82) * demandMultiplier);
    const revenue = baseCapacity * loadFactor * avgFare;

    // Competitor position
    const priceVsMarket = priceSnapshot.ourPrice && priceSnapshot.marketAverage
        ? ((priceSnapshot.ourPrice / priceSnapshot.marketAverage) - 1) * 100
        : 2.5;

    const calculatedLoadFactor = Math.round(loadFactor * 1000) / 10;
    const calculatedRask = Math.round((revenue / baseCapacity) * 100) / 100;
    const calculatedYield = Math.round(avgFare / (metadata?.distance || 5000) * 1000) / 100;
    const trendMultiplier = (demandMultiplier - 1) * 100;

    return {
        id: route,
        route,
        loadFactor: calculatedLoadFactor,
        targetLoadFactor: 90,
        rask: calculatedRask,
        raskTrend: Math.round(trendMultiplier * 10) / 10,
        yield: calculatedYield,
        yieldTrend: Math.round(priceVsMarket * 10) / 10,
    };
}

/**
 * Get booking curve with predictions
 */
export async function getBookingCurve(route: string): Promise<
    { name: string; actual: number; predicted: number; optimal: number }[]
> {
    const curveData = await predictBookingCurve(route);

    return curveData.map(point => ({
        name: point.daysOut === 0 ? 'D' : `-${point.daysOut}`,
        actual: point.actual,
        predicted: point.predicted,
        optimal: point.optimal,
    })).reverse();
}

/**
 * Get waterfall analysis data
 */
export async function getWaterfallData(route: string): Promise<WaterfallItem[]> {
    const [kpi, pricing, noShow] = await Promise.all([
        getRouteKPIs(route),
        getPriceSnapshot(route),
        analyzeFlightNoShowRisk(route, new Date().toISOString()),
    ]);

    // Calculate revenue from RASK and estimated capacity
    const estimatedCapacity = routeMetadata[route]?.baseCapacity || 300;
    const estimatedRevenue = kpi.rask * estimatedCapacity;
    const baseRevenue = estimatedRevenue * 0.85;

    return [
        { name: 'Base Revenue', value: baseRevenue, type: 'total' as const },
        { name: 'Price Optimization', value: baseRevenue * 0.08, type: 'increase' as const },
        { name: 'Overbooking Revenue', value: noShow.optimalOverbooking * (pricing.ourPrice || 1000) * 0.5, type: 'increase' as const },
        { name: 'Spill Recovery', value: baseRevenue * 0.03, type: 'increase' as const },
        { name: 'Competitor Loss', value: -baseRevenue * 0.02, type: 'decrease' as const },
        { name: 'Weather Impact', value: -baseRevenue * 0.01, type: 'decrease' as const },
        { name: 'Total Revenue', value: estimatedRevenue, type: 'total' as const },
    ];
}

/**
 * Get all dashboard data for a route
 */
export async function getAggregatedRouteData(route: string): Promise<AggregatedRouteData> {
    const [origin, destination] = route.split('-');

    const [kpi, bookingCurve, competitors, waterfall, weather] = await Promise.all([
        getRouteKPIs(route),
        getBookingCurve(route),
        getCompetitorData(route),
        getWaterfallData(route),
        getMultiAirportWeather([origin, destination]),
    ]);

    const dataSources = getDataSourceStatuses();

    return {
        kpi,
        bookingCurve,
        competitors,
        waterfall,
        weather: {
            origin: weather[origin],
            destination: weather[destination],
        },
        dataSources,
    };
}

/**
 * Get pricing panel data
 */
export async function getPricingData(route: string) {
    const [chartData, recommendations, snapshot] = await Promise.all([
        getPricingChartData(route),
        generatePricingRecommendations(route),
        getPriceSnapshot(route),
    ]);

    return {
        historical: chartData.historical,
        sensitivity: chartData.sensitivity,
        recommendations,
        currentPrice: snapshot.ourPrice,
        competitorAverage: snapshot.marketAverage,
    };
}

/**
 * Get no-show panel data
 */
export async function getNoShowData(route: string) {
    const [chartData, analysis] = await Promise.all([
        getNoShowChartData(route),
        analyzeFlightNoShowRisk(route, new Date().toISOString()),
    ]);

    return {
        riskProfile: chartData.riskProfile,
        scatterData: chartData.scatterData,
        analysis,
        recommendedOverbooking: analysis.optimalOverbooking,
        predictedNoShows: analysis.predictedNoShows,
    };
}

/**
 * Get elasticity panel data
 */
export async function getElasticityData(route: string) {
    const [fuel, economic, pricing] = await Promise.all([
        getFuelSurchargeRecommendation(),
        getEconomicIndicators(),
        generatePricingRecommendations(route),
    ]);

    return {
        fuelPrice: fuel.currentPrice,
        fuelTrend: fuel.trend,
        fuelSurcharge: fuel.recommendedSurcharge,
        economicIndicators: economic,
        pricingRecommendations: pricing,
    };
}

/**
 * Get data source connection statuses
 */
export function getDataSourceStatuses(): DataSourceStatus[] {
    const stats = apiCache.getStats();
    const now = new Date();

    return [
        {
            name: 'OpenSky Network',
            status: stats.hits > 0 || stats.misses > 0 ? 'connected' : 'offline',
            lastUpdated: now,
            cached: stats.hits > 0,
        },
        {
            name: 'SerpAPI',
            status: 'connected', // Simulated data available
            lastUpdated: now,
            cached: true, // Always show cached for rate-limited API
        },
        {
            name: 'FRED Economic',
            status: 'connected',
            lastUpdated: now,
            cached: stats.size > 0,
        },
        {
            name: 'OpenWeather',
            status: 'connected',
            lastUpdated: now,
            cached: false,
        },
    ];
}

/**
 * Refresh all cached data
 */
export async function refreshAllData(): Promise<void> {
    apiCache.clear();
    logAPICall('System', 'cache-clear', true);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return apiCache.getStats();
}
