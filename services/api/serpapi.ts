/**
 * SerpAPI Google Flights Client
 * Free tier: 100 searches/month
 * Docs: https://serpapi.com/google-flights-api
 * 
 * IMPORTANT: Uses aggressive caching to preserve quota
 */

import { GoogleFlightsResponse, CompetitorPriceSnapshot } from '../../types/api';
import { CompetitorDataPoint } from '../../types';
import { apiConfig, logAPICall, routeMetadata } from './config';
import { apiCache, withCache } from './cache';
import { cacheConfig } from './config';

const BASE_URL = apiConfig.serpapi.baseUrl;

// Track monthly usage
let monthlyUsage = 0;
const MONTHLY_LIMIT = 100;

/**
 * Get competitor flight prices for a route
 * Heavy caching: 1 hour TTL to preserve API quota
 */
export async function getFlightPrices(
    origin: string,
    destination: string,
    departureDate?: string
): Promise<GoogleFlightsResponse | null> {
    const apiKey = apiConfig.serpapi.apiKey;

    // If no API key, return null (will use simulated data)
    if (!apiKey) {
        logAPICall('SerpAPI', `prices/${origin}-${destination}`, false);
        return null;
    }

    // Check monthly limit
    if (monthlyUsage >= MONTHLY_LIMIT) {
        console.warn('SerpAPI monthly limit reached, using cached/simulated data');
        return null;
    }

    const date = departureDate || getDefaultDate();
    const cacheKey = `serpapi:flights:${origin}:${destination}:${date}`;

    try {
        const { data, cached } = await withCache<GoogleFlightsResponse>(
            cacheKey,
            cacheConfig.competitorPriceTTL, // 1 hour cache
            async () => {
                const params = new URLSearchParams({
                    engine: 'google_flights',
                    departure_id: origin,
                    arrival_id: destination,
                    outbound_date: date,
                    type: '2', // One-way
                    currency: 'USD',
                    hl: 'en',
                    api_key: apiKey,
                });

                const response = await fetch(`${BASE_URL}?${params}`);

                if (!response.ok) {
                    throw new Error(`SerpAPI error: ${response.status}`);
                }

                monthlyUsage++;
                apiCache.trackCall('serpapi');

                return await response.json();
            }
        );

        logAPICall('SerpAPI', `prices/${origin}-${destination}`, true, cached);
        return data;
    } catch (error) {
        logAPICall('SerpAPI', `prices/${origin}-${destination}`, false);
        console.error('SerpAPI error:', error);
        return null;
    }
}

/**
 * Get competitor data formatted for our dashboard
 */
export async function getCompetitorData(
    route: string
): Promise<CompetitorDataPoint[]> {
    const [origin, destination] = route.split('-');

    // Try live data first
    const liveData = await getFlightPrices(origin, destination);

    if (liveData && liveData.best_flights) {
        return transformToCompetitorData(route, liveData);
    }

    // Fallback to simulated data
    return generateSimulatedCompetitorData(route);
}

/**
 * Transform SerpAPI response to our format
 */
function transformToCompetitorData(
    route: string,
    data: GoogleFlightsResponse
): CompetitorDataPoint[] {
    const metadata = routeMetadata[route];
    const competitors = metadata?.competitors || ['Emirates', 'Turkish', 'Lufthansa'];

    // Get Qatar Airways price (or estimate)
    const qatarFlight = data.best_flights?.find(f =>
        f.flights.some(fl => fl.airline.toLowerCase().includes('qatar'))
    );
    const qatarPrice = qatarFlight?.price || data.price_insights?.lowest_price * 1.15 || 1000;

    // Get lowest competitor price
    const lowestPrice = data.price_insights?.lowest_price || 900;

    // Generate 7 days of data
    return Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Add some variation to make it realistic
        const variation = (Math.random() - 0.5) * 100;

        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            ourPrice: Math.round(qatarPrice + variation),
            compPrice: Math.round(lowestPrice + variation * 0.8),
            marketAverage: Math.round((qatarPrice + lowestPrice) / 2 - 20),
        };
    });
}

/**
 * Generate simulated competitor data when API is unavailable
 */
function generateSimulatedCompetitorData(route: string): CompetitorDataPoint[] {
    // Base prices by route (realistic estimates)
    const basePrices: Record<string, number> = {
        'DOH-SFO': 1400,
        'DOH-JFK': 1200,
        'DOH-LOS': 1800,
        'DOH-PVG': 900,
        'DOH-ZAG': 750,
    };

    const basePrice = basePrices[route] || 1000;

    return Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Simulate price fluctuations
        const dayVariation = Math.sin(i * 0.5) * 50;
        const randomVariation = (Math.random() - 0.5) * 100;

        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            ourPrice: Math.round(basePrice + dayVariation + randomVariation),
            compPrice: Math.round(basePrice - 50 + dayVariation + randomVariation * 0.8),
            marketAverage: Math.round(basePrice - 30 + dayVariation),
        };
    });
}

/**
 * Get price snapshot for analytics
 */
export async function getPriceSnapshot(route: string): Promise<CompetitorPriceSnapshot> {
    const [origin, destination] = route.split('-');
    const data = await getFlightPrices(origin, destination);
    const metadata = routeMetadata[route];

    if (data && data.best_flights) {
        const prices = data.best_flights.map(f => ({
            airline: f.flights[0]?.airline || 'Unknown',
            price: f.price,
        }));

        const qatarPrice = prices.find(p =>
            p.airline.toLowerCase().includes('qatar')
        )?.price || data.price_insights.lowest_price * 1.15;

        return {
            route,
            timestamp: new Date(),
            ourPrice: qatarPrice,
            competitors: prices.filter(p => !p.airline.toLowerCase().includes('qatar')),
            marketAverage: prices.reduce((sum, p) => sum + p.price, 0) / prices.length,
            lowestPrice: data.price_insights.lowest_price,
        };
    }

    // Simulated fallback
    const basePrice = { 'DOH-SFO': 1400, 'DOH-JFK': 1200, 'DOH-LOS': 1800, 'DOH-PVG': 900, 'DOH-ZAG': 750 }[route] || 1000;

    return {
        route,
        timestamp: new Date(),
        ourPrice: basePrice,
        competitors: (metadata?.competitors || ['Emirates', 'Turkish']).map(airline => ({
            airline,
            price: basePrice - Math.random() * 100,
        })),
        marketAverage: basePrice - 50,
        lowestPrice: basePrice - 100,
    };
}

/**
 * Get default search date (2 weeks out)
 */
function getDefaultDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
}

/**
 * Get API usage stats
 */
export function getUsageStats(): { used: number; remaining: number; limit: number } {
    return {
        used: monthlyUsage,
        remaining: MONTHLY_LIMIT - monthlyUsage,
        limit: MONTHLY_LIMIT,
    };
}

/**
 * Check if API is available
 */
export function isAvailable(): boolean {
    return !!apiConfig.serpapi.apiKey && monthlyUsage < MONTHLY_LIMIT;
}
