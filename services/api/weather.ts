/**
 * OpenWeatherMap API Client
 * Free tier: 1000 calls/day
 * Docs: https://openweathermap.org/api
 */

import { OpenWeatherResponse, AirportWeather } from '../../types/api';
import { apiConfig, logAPICall, airportCoordinates } from './config';
import { withCache } from './cache';
import { cacheConfig } from './config';

const BASE_URL = apiConfig.openweather.baseUrl;

/**
 * Get current weather for an airport
 */
export async function getAirportWeather(airportCode: string): Promise<AirportWeather> {
    const coords = airportCoordinates[airportCode];

    if (!coords) {
        return getDefaultWeather(airportCode);
    }

    const apiKey = apiConfig.openweather.apiKey;

    if (!apiKey) {
        logAPICall('OpenWeather', airportCode, false);
        return getDefaultWeather(airportCode);
    }

    const cacheKey = `weather:airport:${airportCode}`;

    try {
        const { data, cached } = await withCache<OpenWeatherResponse>(
            cacheKey,
            cacheConfig.weatherDataTTL, // 30 min cache
            async () => {
                const params = new URLSearchParams({
                    lat: coords.lat.toString(),
                    lon: coords.lon.toString(),
                    appid: apiKey,
                    units: 'metric',
                });

                const response = await fetch(`${BASE_URL}/weather?${params}`);

                if (!response.ok) {
                    throw new Error(`OpenWeather API error: ${response.status}`);
                }

                return await response.json();
            }
        );

        logAPICall('OpenWeather', airportCode, true, cached);
        return transformWeatherData(airportCode, data);
    } catch (error) {
        logAPICall('OpenWeather', airportCode, false);
        console.error('OpenWeather error:', error);
        return getDefaultWeather(airportCode);
    }
}

/**
 * Get weather for multiple airports (batch)
 */
export async function getMultiAirportWeather(
    airportCodes: string[]
): Promise<Record<string, AirportWeather>> {
    const results: Record<string, AirportWeather> = {};

    // Fetch in parallel
    await Promise.all(
        airportCodes.map(async (code) => {
            results[code] = await getAirportWeather(code);
        })
    );

    return results;
}

/**
 * Get weather forecast for an airport (5 day)
 */
export async function getAirportForecast(airportCode: string): Promise<AirportWeather[]> {
    const coords = airportCoordinates[airportCode];
    const apiKey = apiConfig.openweather.apiKey;

    if (!coords || !apiKey) {
        return [getDefaultWeather(airportCode)];
    }

    const cacheKey = `weather:forecast:${airportCode}`;

    try {
        const { data, cached } = await withCache<{ list: OpenWeatherResponse[] }>(
            cacheKey,
            cacheConfig.weatherDataTTL,
            async () => {
                const params = new URLSearchParams({
                    lat: coords.lat.toString(),
                    lon: coords.lon.toString(),
                    appid: apiKey,
                    units: 'metric',
                    cnt: '8', // 24 hours (3-hour intervals)
                });

                const response = await fetch(`${BASE_URL}/forecast?${params}`);

                if (!response.ok) {
                    throw new Error(`OpenWeather Forecast API error: ${response.status}`);
                }

                return await response.json();
            }
        );

        logAPICall('OpenWeather', `forecast/${airportCode}`, true, cached);
        return data.list.map((item: any) => transformWeatherData(airportCode, item));
    } catch (error) {
        logAPICall('OpenWeather', `forecast/${airportCode}`, false);
        return [getDefaultWeather(airportCode)];
    }
}

/**
 * Transform OpenWeather response to our format
 */
function transformWeatherData(airportCode: string, data: OpenWeatherResponse): AirportWeather {
    const conditions = data.weather[0]?.main || 'Clear';
    const windSpeed = data.wind.speed;
    const visibility = data.visibility / 1000; // Convert to km

    // Determine if weather is severe
    const severeConditions = ['Thunderstorm', 'Tornado', 'Hurricane', 'Blizzard'];
    const isSevere = severeConditions.some(c =>
        conditions.toLowerCase().includes(c.toLowerCase())
    );

    // Calculate disruption risk
    let disruptionRisk: 'low' | 'medium' | 'high' = 'low';

    if (isSevere || visibility < 1 || windSpeed > 20) {
        disruptionRisk = 'high';
    } else if (visibility < 5 || windSpeed > 15 || conditions === 'Snow' || conditions === 'Rain') {
        disruptionRisk = 'medium';
    }

    return {
        airportCode,
        temperature: Math.round(data.main.temp),
        conditions,
        visibility: Math.round(visibility),
        windSpeed: Math.round(windSpeed),
        isSevere,
        disruptionRisk,
    };
}

/**
 * Get default weather when API unavailable
 */
function getDefaultWeather(airportCode: string): AirportWeather {
    // Typical weather by region
    const AIRPORT_CITIES: Record<string, string> = {
        DOH: 'Doha',
        SFO: 'San Francisco',
        LHR: 'London',
        JFK: 'New York',
        SIN: 'Singapore',
        HND: 'Tokyo',
        DXB: 'Dubai',
        CDG: 'Paris',
        FRA: 'Frankfurt',
        AMS: 'Amsterdam',
    };
    const defaults: Record<string, Partial<AirportWeather>> = {
        DOH: { temperature: 32, conditions: 'Clear', visibility: 10, windSpeed: 8 },
        SFO: { temperature: 18, conditions: 'Partly Cloudy', visibility: 12, windSpeed: 12 },
        JFK: { temperature: 4, conditions: 'Cloudy', visibility: 8, windSpeed: 15 },
        LOS: { temperature: 30, conditions: 'Humid', visibility: 6, windSpeed: 6 },
        PVG: { temperature: 12, conditions: 'Overcast', visibility: 7, windSpeed: 10 },
        ZAG: { temperature: 8, conditions: 'Clear', visibility: 15, windSpeed: 5 },
    };

    const def = defaults[airportCode] || {
        temperature: 20, conditions: 'Clear', visibility: 10, windSpeed: 8
    };

    return {
        airportCode,
        temperature: def.temperature!,
        conditions: def.conditions!,
        visibility: def.visibility!,
        windSpeed: def.windSpeed!,
        isSevere: false,
        disruptionRisk: 'low',
    };
}

/**
 * Calculate weather impact on operations
 * Returns adjustment factor for ETAs / delays
 */
export async function getWeatherImpact(
    origin: string,
    destination: string
): Promise<{ delayMinutes: number; factor: number }> {
    const [originWeather, destWeather] = await Promise.all([
        getAirportWeather(origin),
        getAirportWeather(destination),
    ]);

    let delayMinutes = 0;

    // Origin delays
    if (originWeather.disruptionRisk === 'high') delayMinutes += 45;
    else if (originWeather.disruptionRisk === 'medium') delayMinutes += 15;

    // Destination delays
    if (destWeather.disruptionRisk === 'high') delayMinutes += 60;
    else if (destWeather.disruptionRisk === 'medium') delayMinutes += 20;

    return {
        delayMinutes,
        factor: 1 + (delayMinutes / 300), // Normalize to factor
    };
}

/**
 * Check if API is available
 */
export function isAvailable(): boolean {
    return !!apiConfig.openweather.apiKey;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    return (await getAirportWeather('DOH')).disruptionRisk !== undefined;
}
