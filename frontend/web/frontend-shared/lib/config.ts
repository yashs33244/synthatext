/**
 * Frontend App Configuration
 * 
 * URLs are configured based on NODE_ENV.
 * Uses 'development' for local, 'production' for deployed.
 */

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const isLocal = !isProduction;

// ============================================
// URL Configuration (with fallback)
// ============================================

/**
 * Backend API URL - uses localhost for local dev, production URL for production
 */
export const getBackendUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  
  if (isProduction) {
    return 'https://api-synthatext.itsyash.space';
  }
  return 'http://localhost:8000';
};

/**
 * Frontend App URL
 */
export const getAppUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (isProduction) {
    return 'https://app-synthatext.itsyash.space';
  }
  return 'http://localhost:3001';
};

/**
 * Landing Page URL
 */
export const getLandingUrl = (): string => {
  if (process.env.NEXT_PUBLIC_LANDING_URL) {
    return process.env.NEXT_PUBLIC_LANDING_URL;
  }
  
  if (isProduction) {
    return 'https://synthatext.itsyash.space';
  }
  return 'http://localhost:3000';
};

// ============================================
// API Endpoints Configuration
// ============================================

const BACKEND_URL = getBackendUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BACKEND_URL}/auth/login`,
    SIGNUP: `${BACKEND_URL}/auth/signup`,
    LOGOUT: `${BACKEND_URL}/auth/logout`,
    REFRESH: `${BACKEND_URL}/auth/refresh`,
    ME: `${BACKEND_URL}/auth/me`,
    GOOGLE_OAUTH: `${BACKEND_URL}/api/auth/google`,
    VERIFY_EMAIL: `${BACKEND_URL}/auth/verify-email`,
  },
  PPT: {
    BASE: `${BACKEND_URL}/api/ppt`,
    GENERATE: `${BACKEND_URL}/api/ppt/generate`,
    LIST: `${BACKEND_URL}/api/ppt/list`,
    DELETE: (id: string) => `${BACKEND_URL}/api/ppt/${id}`,
  },
  HEALTH: `${BACKEND_URL}/api/v1/health`,
} as const;

// ============================================
// App Configuration (hardcoded, not secrets)
// ============================================

export const APP_CONFIG = {
  name: 'Synthatext',
  environment,
  isDevelopment: isLocal,
  isProduction: isProduction,
} as const;

// ============================================
// Authentication Configuration (hardcoded)
// ============================================

export const AUTH_CONFIG = {
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  sessionKey: 'session',
  cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

// Export for backward compatibility
export const API_URL = BACKEND_URL;
export const BACKEND_API_URL = BACKEND_URL;
export const LANDING_URL = getLandingUrl();
export const APP_URL = getAppUrl();
