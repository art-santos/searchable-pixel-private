// Feature flags configuration
export const featureFlags = {
  // When false, the app will always use dark mode
  lightModeEnabled: false,
} as const

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature]
} 