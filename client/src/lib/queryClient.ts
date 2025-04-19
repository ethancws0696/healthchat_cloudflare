import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { config } from "../config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Builds a full URL by combining the base API URL with the endpoint path
 */
function buildUrl(endpoint: string): string {
  // If endpoint already starts with http, it's an absolute URL
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Otherwise add the API base URL from config
  const baseUrl = config.apiUrl;
  
  // If endpoint already starts with /, just append it to the base URL
  if (endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint}`;
  }
  
  // Otherwise add a / between base URL and endpoint
  return `${baseUrl}/${endpoint}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token if available (for authenticated requests)
  const token = localStorage.getItem(config.auth.tokenStorageKey);
  
  // Prepare headers
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Build full URL
  const fullUrl = buildUrl(url);
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Prepare headers for authentication
    const headers: Record<string, string> = {};
    const token = localStorage.getItem(config.auth.tokenStorageKey);
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Build full URL
    const endpoint = queryKey[0] as string;
    const fullUrl = buildUrl(endpoint);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
