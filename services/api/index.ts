/**
 * API Services Index
 * Central export for all data services
 */

// External API Clients - named exports to avoid conflicts
export {
    getDepartures,
    getArrivals,
    getAircraftNearAirport,
    getRouteActivity,
    checkHealth as checkOpenSkyHealth
} from './opensky';

export {
    getFlightPrices,
    getCompetitorData,
    getPriceSnapshot,
    getUsageStats as getSerpAPIUsage,
    isAvailable as isSerpAPIAvailable
} from './serpapi';

export {
    getJetFuelPrice,
    getEconomicIndicators,
    getDemandMultiplier,
    getFuelSurchargeRecommendation,
    isAvailable as isFREDAvailable,
    checkHealth as checkFREDHealth
} from './fred';

export {
    getAirportWeather,
    getMultiAirportWeather,
    getAirportForecast,
    getWeatherImpact,
    isAvailable as isWeatherAvailable,
    checkHealth as checkWeatherHealth
} from './weather';

// Configuration
export { apiConfig, cacheConfig, routeMetadata, airportCoordinates, featureFlags } from './config';

// Cache utilities
export { apiCache, withCache } from './cache';

// Data Aggregation
export {
    getRouteKPIs,
    getBookingCurve,
    getWaterfallData,
    getAggregatedRouteData,
    getPricingData,
    getNoShowData,
    getElasticityData,
    getDataSourceStatuses,
    refreshAllData,
    getCacheStats,
} from './dataAggregator';

export type { DataSourceStatus, AggregatedRouteData } from './dataAggregator';
