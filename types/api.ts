/**
 * API Types for Live Data Integration
 * Defines interfaces for all external API responses and transformers
 */

// ============ OpenSky Network API Types ============
export interface OpenSkyState {
    icao24: string;
    callsign: string | null;
    origin_country: string;
    time_position: number | null;
    last_contact: number;
    longitude: number | null;
    latitude: number | null;
    baro_altitude: number | null;
    on_ground: boolean;
    velocity: number | null;
    true_track: number | null;
    vertical_rate: number | null;
    sensors: number[] | null;
    geo_altitude: number | null;
    squawk: string | null;
    spi: boolean;
    position_source: number;
}

export interface OpenSkyResponse {
    time: number;
    states: (string | number | boolean | null)[][] | null;
}

export interface FlightArrival {
    icao24: string;
    firstSeen: number;
    estDepartureAirport: string | null;
    lastSeen: number;
    estArrivalAirport: string;
    callsign: string | null;
    estDepartureAirportHorizDistance: number | null;
    estDepartureAirportVertDistance: number | null;
    estArrivalAirportHorizDistance: number | null;
    estArrivalAirportVertDistance: number | null;
    departureAirportCandidatesCount: number;
    arrivalAirportCandidatesCount: number;
}

// ============ BTS (Bureau of Transportation Statistics) Types ============
export interface BTSCarrierStats {
    carrier: string;
    carrierName: string;
    year: number;
    month: number;
    passengers: number;
    loadFactor: number;
    availableSeats: number;
    revenue: number;
    rasm: number; // Revenue per Available Seat Mile
    yield: number;
}

export interface BTSRoutePerformance {
    origin: string;
    destination: string;
    carriers: string[];
    avgLoadFactor: number;
    totalPassengers: number;
    onTimePerformance: number;
    avgDelay: number;
}

// ============ SerpAPI (Google Flights) Types ============
export interface SerpAPIFlightResult {
    departure_airport: {
        name: string;
        id: string;
        time: string;
    };
    arrival_airport: {
        name: string;
        id: string;
        time: string;
    };
    duration: number;
    airplane: string;
    airline: string;
    airline_logo: string;
    travel_class: string;
    legroom: string;
    extensions: string[];
}

export interface SerpAPIFlightPrice {
    price: number;
    type: string;
    airline: string;
    booking_token: string;
    departure_token: string;
    flights: SerpAPIFlightResult[];
}

export interface GoogleFlightsResponse {
    search_metadata: {
        id: string;
        status: string;
        created_at: string;
    };
    best_flights: SerpAPIFlightPrice[];
    other_flights: SerpAPIFlightPrice[];
    price_insights: {
        lowest_price: number;
        price_history: number[][];
    };
}

// ============ FRED API Types ============
export interface FREDObservation {
    date: string;
    value: string; // FRED returns strings
}

export interface FREDSeriesResponse {
    realtime_start: string;
    realtime_end: string;
    observation_start: string;
    observation_end: string;
    units: string;
    output_type: number;
    file_type: string;
    order_by: string;
    sort_order: string;
    count: number;
    offset: number;
    limit: number;
    observations: FREDObservation[];
}

export interface FuelPriceData {
    date: string;
    pricePerGallon: number;
    trend: number; // % change from previous
}

export interface EconomicIndicators {
    gdpGrowth: number;
    exchangeRateUSDQAR: number;
    consumerConfidence: number;
    inflationRate: number;
}

// ============ OpenWeather API Types ============
export interface OpenWeatherResponse {
    coord: { lon: number; lat: number };
    weather: { id: number; main: string; description: string; icon: string }[];
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    visibility: number;
    wind: { speed: number; deg: number; gust?: number };
    clouds: { all: number };
    rain?: { '1h'?: number; '3h'?: number };
    snow?: { '1h'?: number; '3h'?: number };
    dt: number;
    sys: { country: string; sunrise: number; sunset: number };
    name: string;
}

export interface AirportWeather {
    airportCode: string;
    temperature: number;
    conditions: string;
    visibility: number;
    windSpeed: number;
    isSevere: boolean;
    disruptionRisk: 'low' | 'medium' | 'high';
}

// ============ Transformed/Aggregated Types ============
export interface LiveFlightData {
    flightNumber: string;
    origin: string;
    destination: string;
    status: 'on-time' | 'delayed' | 'cancelled' | 'in-flight' | 'landed';
    departureTime: Date;
    arrivalTime: Date;
    aircraft: string;
    position?: { lat: number; lon: number; altitude: number };
}

export interface CompetitorPriceSnapshot {
    route: string;
    timestamp: Date;
    ourPrice: number;
    competitors: { airline: string; price: number }[];
    marketAverage: number;
    lowestPrice: number;
}

export interface RouteAnalytics {
    route: string;
    loadFactor: number;
    targetLoadFactor: number;
    rask: number;
    raskTrend: number;
    yield: number;
    yieldTrend: number;
    bookings: number;
    capacity: number;
    lastUpdated: Date;
    dataSource: 'live' | 'cached' | 'simulated';
}

// ============ Cache Types ============
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

export interface CacheConfig {
    flightDataTTL: number;      // 5 minutes
    competitorPriceTTL: number; // 1 hour (due to rate limits)
    economicDataTTL: number;    // 24 hours
    weatherDataTTL: number;     // 30 minutes
}

// ============ API Configuration ============
export interface APIConfig {
    opensky: {
        baseUrl: string;
        username?: string;
        password?: string;
    };
    serpapi: {
        baseUrl: string;
        apiKey?: string;
    };
    fred: {
        baseUrl: string;
        apiKey?: string;
    };
    openweather: {
        baseUrl: string;
        apiKey?: string;
    };
}
