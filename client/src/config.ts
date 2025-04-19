/**
 * Application configuration for managing environment-specific settings
 */

type Environment = "development" | "staging" | "production";

// Determine current environment
const currentEnv: Environment =
  ((import.meta as any).env?.VITE_APP_ENV as Environment) || "development"; // Added 'as any' to fix TS error

// Check hosting environment
const isCloudflarePages = window.location.hostname.includes("pages.dev");
const isVercel = window.location.hostname.includes("vercel.app");

// Get base URL for current environment
function getBaseUrl() {
  // Always return the Cloudflare worker URL as the base for API calls
  return "https://healthchat.ethan-c87.workers.dev";
}

// Exported config object
export const config = {
  environment: currentEnv,
  apiUrl: getBaseUrl(),
  appVersion: "1.0.0",
  widgetVersion: "1.1.0",
  defaultTheme: "light",

  // Feature flags
  features: {
    websiteScanner: true,
    multipleLocations: true,
    customRules: true,
    analytics: currentEnv === "production",
  },

  // Auth settings
  auth: {
    tokenStorageKey: "healthchat_token",
    userStorageKey: "healthchat_user",
  },

  // External integrations
  integrations: {
    openai: {
      model: "gpt-4o", // The newest OpenAI model
    },
  },
};

// Helper functions
export function isDevelopment() {
  return currentEnv === "development";
}

export function isProduction() {
  return currentEnv === "production";
}

export function getWidgetScriptUrl(userId: string | number) {
  // Handle relative and absolute URLs correctly
  const prefix = '/api/widget/';
  
  // If we're in development and apiUrl is empty, use a relative path
  if (config.apiUrl === '') {
    return `${prefix}${userId}.js`;
  }
  
  // For production, use the full URL including protocol
  return `${config.apiUrl}${prefix}${userId}.js`;
}

// Removed redundant getChatApiUrl function

export default config;
