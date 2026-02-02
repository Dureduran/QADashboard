/**
 * ML Services Index
 * Exports all machine learning and analytics services
 */

// Demand Forecasting
export {
    forecastDemand,
    predictBookingCurve,
    calculateElasticity,
    getOptimalPrice,
} from './demandForecast';

export type { DemandForecast, BookingCurvePoint } from './demandForecast';

// No-Show Prediction
export {
    predictNoShowRisk,
    generateRiskProfiles,
    analyzeFlightNoShowRisk,
    getNoShowChartData,
} from './noShowPredictor';

export type {
    PassengerRiskProfile,
    NoShowAnalysis,
} from './noShowPredictor';

// Price Elasticity
export {
    calculateRouteElasticity,
    getElasticityCurve,
    generatePricingRecommendations,
    getSensitivityMatrix,
    getDynamicPrice,
    getPricingChartData,
} from './priceElasticity';

export type {
    ElasticityPoint,
    PricingRecommendation,
    SensitivityMatrix,
} from './priceElasticity';
