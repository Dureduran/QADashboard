/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_LIVE_DATA: string;
    readonly VITE_OPENSKY_USERNAME?: string;
    readonly VITE_OPENSKY_PASSWORD?: string;
    readonly VITE_SERPAPI_KEY?: string;
    readonly VITE_FRED_API_KEY?: string;
    readonly VITE_OPENWEATHER_KEY?: string;
    readonly VITE_ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
