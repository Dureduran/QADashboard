/**
 * Demand Forecasting Service
 * Simulates ML-based demand prediction using economic indicators and historical patterns
 */

import { getDemandMultiplier, getEconomicIndicators } from '../api/fred';
import { getWeatherImpact } from '../api/weather';
import { routeMetadata } from '../api/config';

export interface DemandForecast {
    date: string;
    predictedDemand: number;
    confidence: number;
    factors: {
        seasonal: number;
        economic: number;
        weather: number;
        events: number;
    };
}

export interface BookingCurvePoint {
    daysOut: number;
    actual: number;
    predicted: number;
    optimal: number;
}

// Seasonal multipliers by month (based on typical travel patterns)
const SEASONAL_FACTORS: Record<number, number> = {
    1: 0.85,  // January - post-holiday lull
    2: 0.88,  // February
    3: 1.05,  // March - spring break
    4: 1.00,  // April
    5: 1.02,  // May
    6: 1.15,  // June - summer travel
    7: 1.20,  // July - peak summer
    8: 1.18,  // August
    9: 0.95,  // September
    10: 1.00, // October
    11: 1.10, // November - holidays begin
    12: 1.25, // December - peak holidays
};

// Day of week multipliers
const DOW_FACTORS: Record<number, number> = {
    0: 1.10, // Sunday
    1: 0.90, // Monday
    2: 0.85, // Tuesday
    3: 0.88, // Wednesday
    4: 1.05, // Thursday
    5: 1.15, // Friday
    6: 1.10, // Saturday
};

/**
 * Generate demand forecast for a route
 */
export async function forecastDemand(
    route: string,
    daysAhead: number = 30
): Promise<DemandForecast[]> {
    const metadata = routeMetadata[route];
    const baseDemand = metadata?.baseCapacity || 300;

    // Get economic factors
    const economicMultiplier = await getDemandMultiplier();
    const [origin, destination] = route.split('-');
    const weatherImpact = await getWeatherImpact(origin, destination);

    const forecasts: DemandForecast[] = [];

    for (let i = 0; i < daysAhead; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const month = date.getMonth() + 1;
        const dow = date.getDay();

        // Calculate component factors
        const seasonal = SEASONAL_FACTORS[month];
        const dayOfWeek = DOW_FACTORS[dow];
        const economic = economicMultiplier;
        const weather = 1 - (weatherImpact.factor - 1) * 0.5; // Dampen weather impact

        // Random noise for realism (±5%)
        const noise = 0.95 + Math.random() * 0.1;

        // Combined forecast
        const predicted = Math.round(
            baseDemand * seasonal * dayOfWeek * economic * weather * noise
        );

        // Confidence decreases with distance
        const confidence = Math.max(0.5, 0.95 - (i * 0.015));

        forecasts.push({
            date: date.toISOString().split('T')[0],
            predictedDemand: predicted,
            confidence: Math.round(confidence * 100) / 100,
            factors: {
                seasonal: Math.round(seasonal * 100) / 100,
                economic: Math.round(economic * 100) / 100,
                weather: Math.round(weather * 100) / 100,
                events: 1.0, // Placeholder for event-based adjustments
            },
        });
    }

    return forecasts;
}

/**
 * Generate booking curve prediction
 */
export async function predictBookingCurve(route: string): Promise<BookingCurvePoint[]> {
    const metadata = routeMetadata[route];
    const capacity = metadata?.baseCapacity || 300;

    // Typical booking curve shape (S-curve)
    const curveShape = [
        { daysOut: 90, pct: 0.10 },
        { daysOut: 60, pct: 0.25 },
        { daysOut: 45, pct: 0.40 },
        { daysOut: 30, pct: 0.55 },
        { daysOut: 21, pct: 0.70 },
        { daysOut: 14, pct: 0.82 },
        { daysOut: 7, pct: 0.92 },
        { daysOut: 3, pct: 0.97 },
        { daysOut: 1, pct: 0.99 },
        { daysOut: 0, pct: 1.00 },
    ];

    const economicMultiplier = await getDemandMultiplier();

    return curveShape.map(point => {
        // Add variation based on economic conditions
        const economicAdj = (economicMultiplier - 1) * 0.1;
        const adjustedPct = Math.min(1, point.pct * (1 + economicAdj));

        // Actual vs predicted variation (simulated)
        const actualVariation = 0.95 + Math.random() * 0.1;

        return {
            daysOut: point.daysOut,
            actual: Math.round(capacity * adjustedPct * actualVariation),
            predicted: Math.round(capacity * adjustedPct),
            optimal: Math.round(capacity * (adjustedPct * 1.02)), // Slight optimization target
        };
    });
}

/**
 * Calculate demand elasticity at different price points
 */
export function calculateElasticity(
    route: string,
    basePrice: number
): { pricePoint: number; demand: number; revenue: number }[] {
    const metadata = routeMetadata[route];
    const baseDemand = metadata?.baseCapacity || 300;

    // Price elasticity of demand (typically -1.5 to -2.5 for air travel)
    const elasticity = metadata?.avgLoadFactor > 0.85 ? -1.2 : -1.8;

    const pricePoints = [-30, -20, -10, 0, 10, 20, 30, 50, 75, 100];

    return pricePoints.map(delta => {
        const pricePoint = basePrice + delta;
        const pctChange = delta / basePrice;
        const demandChange = pctChange * elasticity;
        const demand = Math.round(baseDemand * (1 + demandChange));
        const revenue = pricePoint * demand;

        return {
            pricePoint,
            demand: Math.max(0, demand),
            revenue: Math.round(revenue),
        };
    });
}

/**
 * Get optimal pricing recommendation
 */
export async function getOptimalPrice(
    route: string,
    currentPrice: number,
    daysToDepature: number
): Promise<{
    recommendedPrice: number;
    adjustment: number;
    reason: string;
    confidence: number;
}> {
    const forecast = await forecastDemand(route, 1);
    const demandFactor = forecast[0]?.predictedDemand || 300;
    const metadata = routeMetadata[route];
    const capacity = metadata?.baseCapacity || 300;

    // Calculate load factor
    const expectedLoadFactor = demandFactor / capacity;

    let adjustment = 0;
    let reason = 'Maintain current pricing';

    // Pricing logic based on demand and days to departure
    if (daysToDepature < 7) {
        // Close to departure - maximize yield
        if (expectedLoadFactor > 0.9) {
            adjustment = Math.round(currentPrice * 0.15);
            reason = 'High demand, close to departure - increase yield';
        } else if (expectedLoadFactor < 0.7) {
            adjustment = -Math.round(currentPrice * 0.10);
            reason = 'Low demand, close to departure - stimulate bookings';
        }
    } else if (daysToDepature < 21) {
        // Mid-term - balance
        if (expectedLoadFactor > 0.85) {
            adjustment = Math.round(currentPrice * 0.08);
            reason = 'Strong demand - capture revenue opportunity';
        } else if (expectedLoadFactor < 0.6) {
            adjustment = -Math.round(currentPrice * 0.12);
            reason = 'Weak demand - promotional pricing recommended';
        }
    } else {
        // Early booking - stimulate demand
        if (expectedLoadFactor < 0.5) {
            adjustment = -Math.round(currentPrice * 0.15);
            reason = 'Early sales needed - offer advance purchase discounts';
        }
    }

    return {
        recommendedPrice: currentPrice + adjustment,
        adjustment,
        reason,
        confidence: forecast[0]?.confidence || 0.8,
    };
}
