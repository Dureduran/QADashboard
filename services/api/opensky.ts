/**
 * OpenSky Network API Client
 * Free tier: unlimited unauthenticated requests (with rate limits)
 * Docs: https://openskynetwork.github.io/opensky-api/
 */

import { OpenSkyResponse, FlightArrival, LiveFlightData } from '../../types/api';
import { apiConfig, logAPICall, airportCoordinates } from './config';
import { apiCache, withCache } from './cache';
import { cacheConfig } from './config';

const BASE_URL = apiConfig.opensky.baseUrl;

// ICAO codes for our airports
const ICAO_CODES: Record<string, string> = {
    DOH: 'OTHH', // Hamad International
    SFO: 'KSFO',
    JFK: 'KJFK',
    LOS: 'DNMM', // Lagos Murtala Muhammed
    PVG: 'ZSPD', // Shanghai Pudong
    ZAG: 'LDZA',
    LHR: 'EGLL',
};

/**
 * Get current flights departing from an airport
 */
export async function getDepartures(
    airportCode: string,
    hours: number = 2
): Promise<FlightArrival[]> {
    const icao = ICAO_CODES[airportCode];
    if (!icao) {
        console.warn(`Unknown airport code: ${airportCode}`);
        return [];
    }

    const cacheKey = `opensky:departures:${airportCode}`;

    try {
        const { data, cached } = await withCache<FlightArrival[]>(
            cacheKey,
            cacheConfig.flightDataTTL,
            async () => {
                const end = Math.floor(Date.now() / 1000);
                const begin = end - (hours * 60 * 60);

                const url = `${BASE_URL}/flights/departure?airport=${icao}&begin=${begin}&end=${end}`;

                const response = await fetch(url, {
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`OpenSky API error: ${response.status}`);
                }

                const flights = await response.json();
                apiCache.trackCall('opensky');
                return flights || [];
            }
        );

        logAPICall('OpenSky', `departures/${airportCode}`, true, cached);
        return data;
    } catch (error) {
        logAPICall('OpenSky', `departures/${airportCode}`, false);
        console.error('OpenSky departures error:', error);
        return [];
    }
}

/**
 * Get current flights arriving at an airport
 */
export async function getArrivals(
    airportCode: string,
    hours: number = 2
): Promise<FlightArrival[]> {
    const icao = ICAO_CODES[airportCode];
    if (!icao) return [];

    const cacheKey = `opensky:arrivals:${airportCode}`;

    try {
        const { data, cached } = await withCache<FlightArrival[]>(
            cacheKey,
            cacheConfig.flightDataTTL,
            async () => {
                const end = Math.floor(Date.now() / 1000);
                const begin = end - (hours * 60 * 60);

                const url = `${BASE_URL}/flights/arrival?airport=${icao}&begin=${begin}&end=${end}`;

                const response = await fetch(url, {
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`OpenSky API error: ${response.status}`);
                }

                const flights = await response.json();
                apiCache.trackCall('opensky');
                return flights || [];
            }
        );

        logAPICall('OpenSky', `arrivals/${airportCode}`, true, cached);
        return data;
    } catch (error) {
        logAPICall('OpenSky', `arrivals/${airportCode}`, false);
        console.error('OpenSky arrivals error:', error);
        return [];
    }
}

/**
 * Get all aircraft states in a bounding box around an airport
 */
export async function getAircraftNearAirport(
    airportCode: string
): Promise<LiveFlightData[]> {
    const coords = airportCoordinates[airportCode];
    if (!coords) return [];

    const cacheKey = `opensky:aircraft:${airportCode}`;

    try {
        const { data, cached } = await withCache<LiveFlightData[]>(
            cacheKey,
            60 * 1000, // 1 minute cache for live positions
            async () => {
                // Create 100km bounding box around airport
                const delta = 1.0; // ~100km in degrees
                const lamin = coords.lat - delta;
                const lamax = coords.lat + delta;
                const lomin = coords.lon - delta;
                const lomax = coords.lon + delta;

                const url = `${BASE_URL}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

                const response = await fetch(url, {
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error(`OpenSky API error: ${response.status}`);
                }

                const result: OpenSkyResponse = await response.json();
                apiCache.trackCall('opensky');

                return parseStateVectors(result);
            }
        );

        logAPICall('OpenSky', `aircraft/${airportCode}`, true, cached);
        return data;
    } catch (error) {
        logAPICall('OpenSky', `aircraft/${airportCode}`, false);
        console.error('OpenSky aircraft error:', error);
        return [];
    }
}

/**
 * Get route activity (flights between two airports)
 */
export async function getRouteActivity(
    origin: string,
    destination: string
): Promise<{ departures: number; arrivals: number; inFlight: number }> {
    const [departures, arrivals] = await Promise.all([
        getDepartures(origin),
        getArrivals(destination),
    ]);

    // Filter to find flights between origin and destination
    const routeFlights = departures.filter(
        f => f.estArrivalAirport === ICAO_CODES[destination]
    );

    return {
        departures: departures.length,
        arrivals: arrivals.length,
        inFlight: routeFlights.length,
    };
}

/**
 * Parse OpenSky state vectors into our format
 */
function parseStateVectors(response: OpenSkyResponse): LiveFlightData[] {
    if (!response.states) return [];

    return response.states.map((state) => ({
        flightNumber: (state[1] as string)?.trim() || 'Unknown',
        origin: (state[2] as string) || 'Unknown',
        destination: 'Unknown', // Not available in state vectors
        status: (state[8] as boolean) ? 'landed' : 'in-flight',
        departureTime: new Date(),
        arrivalTime: new Date(),
        aircraft: (state[0] as string) || '',
        position: {
            lat: state[6] as number,
            lon: state[5] as number,
            altitude: (state[7] as number) || 0,
        },
    }));
}

/**
 * Get auth headers for OpenSky (optional, increases rate limits)
 */
function getAuthHeaders(): HeadersInit {
    const { username, password } = apiConfig.opensky;

    if (username && password) {
        const auth = btoa(`${username}:${password}`);
        return {
            'Authorization': `Basic ${auth}`,
        };
    }

    return {};
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/states/all?lamin=25&lomin=51&lamax=26&lomax=52`);
        return response.ok;
    } catch {
        return false;
    }
}
