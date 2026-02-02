/**
 * FRED (Federal Reserve Economic Data) API Client
 * Free tier: Unlimited with API key
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */

import { FREDSeriesResponse, FuelPriceData, EconomicIndicators } from '../../types/api';
import { apiConfig, logAPICall } from './config';
import { withCache } from './cache';
import { cacheConfig } from './config';

const BASE_URL = apiConfig.fred.baseUrl;

// Key FRED series IDs
const SERIES = {
    JET_FUEL: 'DJFUELUSGULF',      // US Gulf Coast Kerosene-Type Jet Fuel
    GDP_GROWTH: 'A191RL1Q225SBEA', // Real GDP growth
    CPI: 'CPIAUCSL',               // Consumer Price Index
    CONSUMER_CONF: 'UMCSENT',       // Consumer Sentiment
};

/**
 * Fetch a FRED series
 */
async function fetchSeries(
    seriesId: string,
    observations: number = 10
): Promise<FREDSeriesResponse | null> {
    const apiKey = apiConfig.fred.apiKey;

    if (!apiKey) {
        logAPICall('FRED', seriesId, false);
        return null;
    }

    const cacheKey = `fred:series:${seriesId}`;

    try {
        const { data, cached } = await withCache<FREDSeriesResponse>(
            cacheKey,
            cacheConfig.economicDataTTL, // 24 hour cache
            async () => {
                const params = new URLSearchParams({
                    series_id: seriesId,
                    api_key: apiKey,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: observations.toString(),
                });

                const response = await fetch(`${BASE_URL}/series/observations?${params}`);

                if (!response.ok) {
                    throw new Error(`FRED API error: ${response.status}`);
                }

                return await response.json();
            }
        );

        logAPICall('FRED', seriesId, true, cached);
        return data;
    } catch (error) {
        logAPICall('FRED', seriesId, false);
        console.error('FRED API error:', error);
        return null;
    }
}

/**
 * Get jet fuel price data
 */
export async function getJetFuelPrice(): Promise<FuelPriceData> {
    const data = await fetchSeries(SERIES.JET_FUEL, 5);

    if (data && data.observations.length >= 2) {
        const latest = parseFloat(data.observations[0].value);
        const previous = parseFloat(data.observations[1].value);
        const trend = ((latest - previous) / previous) * 100;

        return {
            date: data.observations[0].date,
            pricePerGallon: latest,
            trend: Math.round(trend * 10) / 10,
        };
    }

    // Simulated fallback
    return {
        date: new Date().toISOString().split('T')[0],
        pricePerGallon: 2.45,
        trend: -1.2,
    };
}

/**
 * Get economic indicators for demand modeling
 */
export async function getEconomicIndicators(): Promise<EconomicIndicators> {
    // Fetch multiple series in parallel
    const [gdpData, cpiData, confData] = await Promise.all([
        fetchSeries(SERIES.GDP_GROWTH, 2),
        fetchSeries(SERIES.CPI, 2),
        fetchSeries(SERIES.CONSUMER_CONF, 2),
    ]);

    // Parse GDP growth
    let gdpGrowth = 2.1; // Default
    if (gdpData && gdpData.observations.length > 0) {
        gdpGrowth = parseFloat(gdpData.observations[0].value) || 2.1;
    }

    // Parse inflation
    let inflationRate = 3.2; // Default
    if (cpiData && cpiData.observations.length >= 2) {
        const latest = parseFloat(cpiData.observations[0].value);
        const yearAgo = parseFloat(cpiData.observations[1].value);
        if (latest && yearAgo) {
            inflationRate = ((latest - yearAgo) / yearAgo) * 100;
        }
    }

    // Parse consumer confidence
    let consumerConfidence = 65; // Default
    if (confData && confData.observations.length > 0) {
        consumerConfidence = parseFloat(confData.observations[0].value) || 65;
    }

    return {
        gdpGrowth: Math.round(gdpGrowth * 10) / 10,
        exchangeRateUSDQAR: 3.64, // Fixed rate (pegged)
        consumerConfidence: Math.round(consumerConfidence),
        inflationRate: Math.round(inflationRate * 10) / 10,
    };
}

/**
 * Calculate demand impact from economic factors
 * Returns a multiplier for demand forecasting
 */
export async function getDemandMultiplier(): Promise<number> {
    const indicators = await getEconomicIndicators();

    // Simple model: combine factors into demand multiplier
    // Positive GDP and consumer confidence boost demand
    // High inflation slightly reduces demand

    let multiplier = 1.0;

    // GDP impact (±5% for each 1% GDP growth)
    multiplier += (indicators.gdpGrowth - 2.0) * 0.05;

    // Consumer confidence impact
    if (indicators.consumerConfidence > 70) {
        multiplier += 0.05;
    } else if (indicators.consumerConfidence < 50) {
        multiplier -= 0.05;
    }

    // Inflation impact (negative if high)
    if (indicators.inflationRate > 5) {
        multiplier -= 0.03;
    }

    // Clamp between 0.8 and 1.2
    return Math.max(0.8, Math.min(1.2, multiplier));
}

/**
 * Get fuel surcharge recommendation based on jet fuel prices
 */
export async function getFuelSurchargeRecommendation(): Promise<{
    currentPrice: number;
    trend: string;
    recommendedSurcharge: number;
    change: string;
}> {
    const fuelData = await getJetFuelPrice();

    // Fuel surcharge tiers (simplified model)
    // $2.00/gal = $0 surcharge, +$50 per $0.50 increase
    const basePrice = 2.0;
    const surchargePerHalf = 50;

    const surcharge = Math.max(0,
        Math.floor((fuelData.pricePerGallon - basePrice) / 0.5) * surchargePerHalf
    );

    return {
        currentPrice: fuelData.pricePerGallon,
        trend: fuelData.trend > 0 ? 'rising' : fuelData.trend < 0 ? 'falling' : 'stable',
        recommendedSurcharge: surcharge,
        change: fuelData.trend > 2 ? 'Consider increase' :
            fuelData.trend < -2 ? 'Consider decrease' : 'Maintain current',
    };
}

/**
 * Check if FRED API is available
 */
export function isAvailable(): boolean {
    return !!apiConfig.fred.apiKey;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    if (!apiConfig.fred.apiKey) return false;

    try {
        const data = await fetchSeries(SERIES.JET_FUEL, 1);
        return data !== null;
    } catch {
        return false;
    }
}
