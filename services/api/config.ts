/**
 * API Configuration & Environment Variables
 * Centralized config for all external API integrations
 */

import { APIConfig, CacheConfig } from '../../types/api';

// Environment variable access (Vite-style)
const getEnv = (key: string, defaultValue = ''): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return (import.meta.env as Record<string, string>)[key] || defaultValue;
    }
    return defaultValue;
};

// API Configuration
export const apiConfig: APIConfig = {
    opensky: {
        baseUrl: 'https://opensky-network.org/api',
        username: getEnv('VITE_OPENSKY_USERNAME'),
        password: getEnv('VITE_OPENSKY_PASSWORD'),
    },
    serpapi: {
        baseUrl: 'https://serpapi.com/search',
        apiKey: getEnv('VITE_SERPAPI_KEY'),
    },
    fred: {
        baseUrl: 'https://api.stlouisfed.org/fred',
        apiKey: getEnv('VITE_FRED_API_KEY'),
    },
    openweather: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: getEnv('VITE_OPENWEATHER_KEY'),
    },
};

// Cache Configuration (in milliseconds)
export const cacheConfig: CacheConfig = {
    flightDataTTL: 5 * 60 * 1000,           // 5 minutes
    competitorPriceTTL: 60 * 60 * 1000,     // 1 hour (preserve rate limits)
    economicDataTTL: 24 * 60 * 60 * 1000,   // 24 hours
    weatherDataTTL: 30 * 60 * 1000,         // 30 minutes
};

// Feature Flags
export const featureFlags = {
    useLiveData: getEnv('VITE_USE_LIVE_DATA', 'false') === 'true',
    enableSerpAPI: !!apiConfig.serpapi.apiKey,
    enableFRED: !!apiConfig.fred.apiKey,
    enableOpenWeather: !!apiConfig.openweather.apiKey,
    enableOpenSky: true, // OpenSky has unauthenticated access
};

// Airport Coordinates (for weather lookups)
export const airportCoordinates: Record<string, { lat: number; lon: number; name: string }> = {
    DOH: { lat: 25.2608, lon: 51.6138, name: 'Hamad International Airport' },
    SFO: { lat: 37.6213, lon: -122.3790, name: 'San Francisco International' },
    JFK: { lat: 40.6413, lon: -73.7781, name: 'John F. Kennedy International' },
    LOS: { lat: 6.5774, lon: 3.3212, name: 'Murtala Muhammed International' },
    PVG: { lat: 31.1443, lon: 121.8083, name: 'Shanghai Pudong International' },
    ZAG: { lat: 45.7430, lon: 16.0688, name: 'Franjo Tuđman Airport' },
    LHR: { lat: 51.4700, lon: -0.4543, name: 'London Heathrow' },
};

// Route Metadata
export const routeMetadata: Record<string, {
    distance: number;
    avgFlightTime: number;
    competitors: string[];
    baseCapacity: number;
    avgLoadFactor: number;
    avgFare: number;
    marketType: 'business' | 'leisure' | 'mixed' | 'vfr';
}> = {
    'DOH-SFO': { distance: 13246, avgFlightTime: 16.5, competitors: ['Emirates', 'Turkish', 'United'], baseCapacity: 350, avgLoadFactor: 0.82, avgFare: 1400, marketType: 'mixed' },
    'DOH-JFK': { distance: 11013, avgFlightTime: 14.5, competitors: ['Emirates', 'Turkish', 'Delta'], baseCapacity: 400, avgLoadFactor: 0.88, avgFare: 1200, marketType: 'business' },
    'DOH-LOS': { distance: 5108, avgFlightTime: 6.5, competitors: ['Ethiopian', 'Turkish', 'Rwanda Air'], baseCapacity: 280, avgLoadFactor: 0.74, avgFare: 1800, marketType: 'vfr' },
    'DOH-PVG': { distance: 7478, avgFlightTime: 9.0, competitors: ['Emirates', 'Singapore', 'Cathay'], baseCapacity: 320, avgLoadFactor: 0.65, avgFare: 900, marketType: 'business' },
    'DOH-ZAG': { distance: 3418, avgFlightTime: 5.0, competitors: ['Turkish', 'Lufthansa', 'Croatia Airlines'], baseCapacity: 200, avgLoadFactor: 0.79, avgFare: 750, marketType: 'leisure' },
};

// Rate Limiting Configuration
export const rateLimits = {
    opensky: {
        requestsPerMinute: 10,
        requestsPerDay: 400,
    },
    serpapi: {
        requestsPerMonth: 100, // Free tier
        currentUsage: 0,
    },
    fred: {
        requestsPerMinute: 60,
    },
    openweather: {
        requestsPerDay: 1000, // Free tier
    },
};

// Logging utility
export const logAPICall = (api: string, endpoint: string, success: boolean, cached = false): void => {
    if (process.env.NODE_ENV === 'development') {
        const status = cached ? '📦 CACHED' : success ? '✅ SUCCESS' : '❌ FAILED';
        console.log(`[API] ${status} ${api}: ${endpoint}`);
    }
};
