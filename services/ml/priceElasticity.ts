/**
 * Price Elasticity & Dynamic Pricing Service
 * Optimizes revenue through demand-based pricing
 */

import { getEconomicIndicators } from '../api/fred';
import { getPriceSnapshot } from '../api/serpapi';
import { routeMetadata } from '../api/config';

export interface ElasticityPoint {
    priceChange: number;
    demandChange: number;
    revenue: number;
    optimal: boolean;
}

export interface PricingRecommendation {
    cabin: string;
    currentPrice: number;
    recommendedPrice: number;
    expectedRevenueLift: number;
    elasticity: number;
    confidence: number;
}

export interface SensitivityMatrix {
    fareClasses: string[];
    daysToDepart: number[];
    matrix: number[][]; // Price sensitivity scores
}

// Base elasticity by market type
const MARKET_ELASTICITY: Record<string, number> = {
    'business': -0.8,   // Less price sensitive
    'leisure': -1.8,    // More price sensitive
    'mixed': -1.3,      // Average
    'vfr': -1.5,        // Visiting Friends/Relatives
};

// Time-based elasticity adjustments
const TIME_ELASTICITY_ADJ: Record<string, number> = {
    'peak': 0.3,        // Less elastic during peak
    'shoulder': 0.0,    // Normal
    'off-peak': -0.3,   // More elastic off-peak
};

/**
 * Calculate price elasticity for a route
 */
export async function calculateRouteElasticity(route: string): Promise<number> {
    const metadata = routeMetadata[route];
    const baseElasticity = MARKET_ELASTICITY[metadata?.marketType || 'mixed'];

    // Adjust for load factor (high load = less elastic)
    const loadFactorAdj = ((metadata?.avgLoadFactor || 0.80) - 0.80) * 0.5;

    // Get economic factors
    const indicators = await getEconomicIndicators();

    // Consumer confidence affects elasticity
    const confAdj = (indicators.consumerConfidence - 65) / 100;

    return baseElasticity + loadFactorAdj + confAdj;
}

/**
 * Generate elasticity curve data
 */
export async function getElasticityCurve(
    route: string,
    basePrice: number = 1000
): Promise<ElasticityPoint[]> {
    const elasticity = await calculateRouteElasticity(route);
    const baseDemand = routeMetadata[route]?.baseCapacity || 300;

    const priceChanges = [-30, -20, -15, -10, -5, 0, 5, 10, 15, 20, 30, 40, 50];
    let maxRevenue = 0;
    let optimalIndex = 0;

    const points = priceChanges.map((change, index) => {
        const pctChange = change / 100;
        const demandChange = pctChange * elasticity * 100;
        const newDemand = baseDemand * (1 + demandChange / 100);
        const newPrice = basePrice * (1 + pctChange);
        const revenue = Math.round(newPrice * newDemand);

        if (revenue > maxRevenue) {
            maxRevenue = revenue;
            optimalIndex = index;
        }

        return {
            priceChange: change,
            demandChange: Math.round(demandChange * 10) / 10,
            revenue,
            optimal: false,
        };
    });

    points[optimalIndex].optimal = true;
    return points;
}

/**
 * Generate pricing recommendations by cabin
 */
export async function generatePricingRecommendations(
    route: string
): Promise<PricingRecommendation[]> {
    const snapshot = await getPriceSnapshot(route);
    const elasticity = await calculateRouteElasticity(route);
    const metadata = routeMetadata[route];

    const cabins = [
        { name: 'First', multiplier: 5.0, elasticity: elasticity * 0.5 },
        { name: 'Business', multiplier: 2.5, elasticity: elasticity * 0.7 },
        { name: 'Premium Economy', multiplier: 1.5, elasticity: elasticity * 0.9 },
        { name: 'Economy', multiplier: 1.0, elasticity },
    ];

    const basePrice = snapshot.ourPrice || 1000;

    return cabins.map(cabin => {
        const currentPrice = Math.round(basePrice * cabin.multiplier);
        const competitorAvg = (snapshot.marketAverage || basePrice * 0.95) * cabin.multiplier;

        // Optimal price based on elasticity
        const optimalPriceChange = -1 / (cabin.elasticity - 1);
        let recommendedPrice = Math.round(currentPrice * (1 + optimalPriceChange * 0.1));

        // Constrain based on competitor pricing
        const minPrice = competitorAvg * 0.9;
        const maxPrice = competitorAvg * 1.2;
        recommendedPrice = Math.max(minPrice, Math.min(maxPrice, recommendedPrice));

        // Calculate expected revenue lift
        const priceDiff = (recommendedPrice - currentPrice) / currentPrice;
        const demandDiff = priceDiff * cabin.elasticity;
        const revenueLift = (1 + priceDiff) * (1 + demandDiff) - 1;

        return {
            cabin: cabin.name,
            currentPrice,
            recommendedPrice: Math.round(recommendedPrice),
            expectedRevenueLift: Math.round(revenueLift * 1000) / 10,
            elasticity: Math.round(cabin.elasticity * 100) / 100,
            confidence: Math.min(0.95, 0.7 + (metadata?.avgLoadFactor || 0.8) * 0.2),
        };
    });
}

/**
 * Generate price sensitivity matrix (heatmap data)
 */
export async function getSensitivityMatrix(route: string): Promise<SensitivityMatrix> {
    const elasticity = await calculateRouteElasticity(route);

    const fareClasses = ['F', 'J', 'W', 'Y', 'B', 'K', 'M'];
    const daysToDepart = [1, 3, 7, 14, 21, 30, 60, 90];

    // Sensitivity increases closer to departure for premium classes
    // Sensitivity increases further from departure for discount classes
    const classElasticityMod: Record<string, number> = {
        'F': 0.3, 'J': 0.4, 'W': 0.6, 'Y': 0.8, 'B': 1.0, 'K': 1.2, 'M': 1.4
    };

    const matrix = fareClasses.map((fc, i) => {
        return daysToDepart.map((days, j) => {
            const classMod = classElasticityMod[fc] || 1.0;

            // Days factor: 1 day = most inelastic for premium, most elastic for discount
            let daysFactor: number;
            if (i < 3) { // Premium classes
                daysFactor = 1 - (days / 100);
            } else { // Economy classes
                daysFactor = 0.5 + (days / 180);
            }

            const sensitivity = Math.abs(elasticity) * classMod * daysFactor;
            return Math.round(sensitivity * 100) / 100;
        });
    });

    return {
        fareClasses,
        daysToDepart,
        matrix,
    };
}

/**
 * Get dynamic pricing for a specific scenario
 */
export async function getDynamicPrice(
    route: string,
    basePrice: number,
    fareClass: string,
    daysToDeparture: number,
    currentLoadFactor: number
): Promise<{
    adjustedPrice: number;
    adjustment: number;
    factors: { name: string; impact: number }[];
}> {
    const elasticity = await calculateRouteElasticity(route);
    const snapshot = await getPriceSnapshot(route);

    const factors: { name: string; impact: number }[] = [];
    let adjustment = 0;

    // Load factor adjustment
    if (currentLoadFactor > 0.85) {
        const lfAdj = (currentLoadFactor - 0.85) * 0.5;
        adjustment += lfAdj;
        factors.push({ name: 'High Demand', impact: Math.round(lfAdj * basePrice) });
    } else if (currentLoadFactor < 0.6) {
        const lfAdj = (currentLoadFactor - 0.6) * 0.3;
        adjustment += lfAdj;
        factors.push({ name: 'Low Demand', impact: Math.round(lfAdj * basePrice) });
    }

    // Days to departure adjustment
    if (daysToDeparture <= 3) {
        const daysAdj = 0.15;
        adjustment += daysAdj;
        factors.push({ name: 'Last Minute', impact: Math.round(daysAdj * basePrice) });
    } else if (daysToDeparture >= 60) {
        const daysAdj = -0.10;
        adjustment += daysAdj;
        factors.push({ name: 'Early Bird', impact: Math.round(daysAdj * basePrice) });
    }

    // Competitor adjustment
    if (snapshot.lowestPrice && basePrice > snapshot.lowestPrice * 1.2) {
        const compAdj = -0.08;
        adjustment += compAdj;
        factors.push({ name: 'Competitor Gap', impact: Math.round(compAdj * basePrice) });
    }

    return {
        adjustedPrice: Math.round(basePrice * (1 + adjustment)),
        adjustment: Math.round(adjustment * 100),
        factors,
    };
}

/**
 * Get pricing data formatted for dashboard
 */
export async function getPricingChartData(route: string): Promise<{
    historical: { date: string; price: number; optimal: number; forecast: number }[];
    sensitivity: { x: number; y: number; z: number }[];
}> {
    const metadata = routeMetadata[route];
    const basePrice = metadata?.avgFare || 1000;

    // Generate historical + forecast data
    const historical = Array.from({ length: 14 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 7 + i);

        const isPast = i < 7;
        const trend = Math.sin(i * 0.5) * 50;
        const noise = (Math.random() - 0.5) * 30;

        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: isPast ? Math.round(basePrice + trend + noise) : 0,
            optimal: Math.round(basePrice + trend * 1.1),
            forecast: isPast ? 0 : Math.round(basePrice + trend * 0.9 + noise * 0.5),
        };
    });

    // Generate sensitivity heatmap data
    const matrix = await getSensitivityMatrix(route);
    const sensitivity = matrix.fareClasses.flatMap((fc, x) =>
        matrix.daysToDepart.map((days, y) => ({
            x,
            y,
            z: matrix.matrix[x][y],
        }))
    );

    return { historical, sensitivity };
}
