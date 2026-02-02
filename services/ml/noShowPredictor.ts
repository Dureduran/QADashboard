/**
 * No-Show Prediction Service
 * Simulates ML-based passenger no-show risk assessment
 */

import { getWeatherImpact } from '../api/weather';
import { routeMetadata } from '../api/config';

export interface PassengerRiskProfile {
    id: string;
    riskScore: number;
    riskCategory: 'low' | 'medium' | 'high';
    factors: {
        bookingChannel: number;
        fareClass: number;
        connectionRisk: number;
        historicalPattern: number;
        weatherImpact: number;
    };
    ticketValue: number;
    expectedShowRate: number;
}

export interface NoShowAnalysis {
    route: string;
    flightDate: string;
    totalPassengers: number;
    predictedNoShows: number;
    optimalOverbooking: number;
    riskDistribution: {
        low: number;
        medium: number;
        high: number;
    };
    revenueAtRisk: number;
    recommendedActions: string[];
}

// Risk weights by booking channel
const CHANNEL_RISK: Record<string, number> = {
    direct: 0.05,
    ota: 0.12,
    corporate: 0.03,
    gds: 0.08,
    agency: 0.07,
};

// Risk weights by fare class
const FARE_CLASS_RISK: Record<string, number> = {
    F: 0.02,  // First
    J: 0.03,  // Business
    W: 0.05,  // Premium Economy
    Y: 0.08,  // Economy Full Fare
    B: 0.10,  // Economy Discounted
    M: 0.12,  // Economy Promotional
};

/**
 * Predict no-show probability for a passenger profile
 */
export function predictNoShowRisk(
    bookingChannel: string,
    fareClass: string,
    hasConnection: boolean,
    daysToDeparture: number,
    historicalNoShowRate: number = 0.05
): number {
    // Base risk from channel
    let risk = CHANNEL_RISK[bookingChannel] || 0.08;

    // Fare class adjustment
    risk += (FARE_CLASS_RISK[fareClass] || 0.08) * 0.5;

    // Connection risk (missed connections)
    if (hasConnection) {
        risk += 0.05;
    }

    // Days to departure (last-minute bookings are higher risk)
    if (daysToDeparture < 3) {
        risk += 0.03;
    } else if (daysToDeparture > 60) {
        risk += 0.02; // Very early bookings have some change risk
    }

    // Historical pattern
    risk = risk * 0.7 + historicalNoShowRate * 0.3;

    // Cap between 0.01 and 0.25
    return Math.max(0.01, Math.min(0.25, risk));
}

/**
 * Generate passenger risk profiles for a flight
 */
export async function generateRiskProfiles(
    route: string,
    passengerCount: number = 280
): Promise<PassengerRiskProfile[]> {
    const [origin, destination] = route.split('-');
    const weatherImpact = await getWeatherImpact(origin, destination);

    const profiles: PassengerRiskProfile[] = [];

    // Distribution of booking channels (realistic mix)
    const channelDist = { direct: 0.35, ota: 0.30, corporate: 0.20, agency: 0.15 };
    const fareDist = { J: 0.15, W: 0.10, Y: 0.30, B: 0.25, M: 0.20 };

    for (let i = 0; i < passengerCount; i++) {
        const channel = weightedRandom(channelDist);
        const fareClass = weightedRandom(fareDist);
        const hasConnection = Math.random() < 0.25;
        const daysToDeparture = Math.floor(Math.random() * 90) + 1;

        const baseRisk = predictNoShowRisk(
            channel,
            fareClass,
            hasConnection,
            daysToDeparture
        );

        // Weather adjustment
        const weatherFactor = weatherImpact.delayMinutes > 30 ? 1.3 : 1.0;
        const adjustedRisk = baseRisk * weatherFactor;

        // Ticket value estimation
        const baseValue = { F: 8000, J: 4000, W: 2000, Y: 1200, B: 800, M: 500 }[fareClass] || 800;
        const routeMultiplier = routeMetadata[route]?.distance ?
            routeMetadata[route].distance / 5000 : 1;
        const ticketValue = Math.round(baseValue * routeMultiplier);

        profiles.push({
            id: `PAX-${i.toString().padStart(4, '0')}`,
            riskScore: Math.round(adjustedRisk * 100),
            riskCategory: adjustedRisk < 0.05 ? 'low' : adjustedRisk < 0.10 ? 'medium' : 'high',
            factors: {
                bookingChannel: CHANNEL_RISK[channel] || 0.08,
                fareClass: FARE_CLASS_RISK[fareClass] || 0.08,
                connectionRisk: hasConnection ? 0.05 : 0,
                historicalPattern: 0.05,
                weatherImpact: weatherFactor - 1,
            },
            ticketValue,
            expectedShowRate: 1 - adjustedRisk,
        });
    }

    return profiles.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Analyze no-show risk for a flight
 */
export async function analyzeFlightNoShowRisk(
    route: string,
    flightDate: string,
    bookedPassengers: number = 280
): Promise<NoShowAnalysis> {
    const profiles = await generateRiskProfiles(route, bookedPassengers);

    // Calculate aggregates
    const riskDist = {
        low: profiles.filter(p => p.riskCategory === 'low').length,
        medium: profiles.filter(p => p.riskCategory === 'medium').length,
        high: profiles.filter(p => p.riskCategory === 'high').length,
    };

    const avgRisk = profiles.reduce((sum, p) => sum + p.riskScore, 0) / profiles.length;
    const predictedNoShows = Math.round(bookedPassengers * (avgRisk / 100));

    // Revenue at risk (sum of high-risk passenger ticket values)
    const revenueAtRisk = profiles
        .filter(p => p.riskCategory === 'high')
        .reduce((sum, p) => sum + p.ticketValue, 0);

    // Calculate optimal overbooking
    const metadata = routeMetadata[route];
    const capacity = metadata?.baseCapacity || 300;
    const optimalOverbooking = calculateOptimalOverbooking(
        capacity,
        bookedPassengers,
        avgRisk / 100
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
        predictedNoShows,
        optimalOverbooking,
        riskDist,
        bookedPassengers
    );

    return {
        route,
        flightDate,
        totalPassengers: bookedPassengers,
        predictedNoShows,
        optimalOverbooking,
        riskDistribution: riskDist,
        revenueAtRisk,
        recommendedActions: recommendations,
    };
}

/**
 * Calculate optimal overbooking level
 */
function calculateOptimalOverbooking(
    capacity: number,
    bookings: number,
    noShowRate: number
): number {
    // Denied boarding cost vs empty seat cost ratio
    const costRatio = 3.0; // DB costs 3x more than empty seat

    // Calculate optimal based on economics
    const expectedNoShows = bookings * noShowRate;
    const safeOverbooking = Math.floor(expectedNoShows * (1 - 1 / costRatio));

    // Cap at reasonable levels
    const maxOverbooking = Math.floor(capacity * 0.08); // Max 8%

    return Math.min(safeOverbooking, maxOverbooking, capacity - bookings + 10);
}

/**
 * Generate action recommendations
 */
function generateRecommendations(
    predictedNoShows: number,
    optimalOverbooking: number,
    riskDist: { low: number; medium: number; high: number },
    totalPassengers: number
): string[] {
    const recommendations: string[] = [];

    if (optimalOverbooking > 5) {
        recommendations.push(`Increase overbooking to ${optimalOverbooking} seats`);
    }

    if (riskDist.high > totalPassengers * 0.15) {
        recommendations.push('High-risk segment elevated - consider seat protection');
    }

    if (predictedNoShows > 15) {
        recommendations.push('Send day-before reminder emails to medium/high risk');
    }

    const noShowRate = predictedNoShows / totalPassengers;
    if (noShowRate > 0.08) {
        recommendations.push('Review rebooking flexibility for discount fares');
    }

    if (recommendations.length === 0) {
        recommendations.push('Risk levels normal - maintain current strategy');
    }

    return recommendations;
}

/**
 * Helper: weighted random selection
 */
function weightedRandom<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let random = Math.random() * total;

    for (const [key, weight] of entries) {
        random -= weight;
        if (random <= 0) return key;
    }

    return entries[0][0];
}

/**
 * Get no-show data formatted for dashboard charts
 */
export async function getNoShowChartData(route: string): Promise<{
    riskProfile: { name: string; value: number; color: string }[];
    scatterData: { x: number; y: number; category: string }[];
}> {
    const profiles = await generateRiskProfiles(route, 200);

    const riskCounts = {
        low: profiles.filter(p => p.riskCategory === 'low').length,
        medium: profiles.filter(p => p.riskCategory === 'medium').length,
        high: profiles.filter(p => p.riskCategory === 'high').length,
    };

    return {
        riskProfile: [
            { name: 'Low Risk', value: riskCounts.low, color: '#10B981' },
            { name: 'Medium Risk', value: riskCounts.medium, color: '#F59E0B' },
            { name: 'High Risk', value: riskCounts.high, color: '#EF4444' },
        ],
        scatterData: profiles.slice(0, 50).map(p => ({
            x: p.ticketValue,
            y: p.riskScore,
            category: p.riskCategory,
        })),
    };
}
