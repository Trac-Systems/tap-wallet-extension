/**
 * Token Price Configuration
 * Centralized config for token USD price feature
 */

// Supported tokens for USD price display
export const SUPPORTED_TOKENS = ['TAP', 'DMT-NAT', 'TRAC'] as const;

export type SupportedToken = typeof SUPPORTED_TOKENS[number];

/**
 * Type guard to check if a ticker is supported for USD price
 * Case-insensitive comparison
 * Handles both API tickers (TRAC) and display names (TNK)
 */
export function isSupportedToken(ticker: string): ticker is SupportedToken {
  const upperTicker = ticker.toUpperCase();

  // Check if it's directly in supported list
  if (SUPPORTED_TOKENS.includes(upperTicker as SupportedToken)) {
    return true;
  }

  // Check if it's a display name that maps to a supported API ticker
  const apiTicker = getApiTicker(upperTicker);
  return SUPPORTED_TOKENS.includes(apiTicker as SupportedToken);
}

/**
 * API Configuration
 */
export const TOKEN_PRICE_API = {
  TIMEOUT_MS: 10_000,
  PATH: '/v1/token-prices', // API path suffix
} as const;

/**
 * Display name mapping
 * TNK is the display name for TRAC token
 */
export const TOKEN_DISPLAY_NAMES: Record<string, string> = {
  TRAC: 'TNK',
} as const;

/**
 * Get API ticker from display name
 * Returns uppercase ticker for API calls
 */
export function getApiTicker(displayName: string): string {
  const upperDisplayName = displayName.toUpperCase();
  const entry = Object.entries(TOKEN_DISPLAY_NAMES).find(
    ([_, display]) => display.toUpperCase() === upperDisplayName
  );
  return entry ? entry[0] : upperDisplayName;
}

/**
 * Get display name from API ticker
 */
export function getDisplayName(apiTicker: string): string {
  return TOKEN_DISPLAY_NAMES[apiTicker] || apiTicker;
}
