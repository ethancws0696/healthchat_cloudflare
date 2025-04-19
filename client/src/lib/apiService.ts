/**
 * Universal API Service
 * 
 * This service handles API requests with awareness of the deployment platform
 * to ensure that requests work correctly whether deployed on Vercel, Cloudflare,
 * or running locally in development.
 */

/**
 * Determines the correct API base URL based on the deployment environment
 */
export function getApiBaseUrl(): string {
  // Always use the Cloudflare worker URL
  return 'https://healthchat.ethan-c87.workers.dev/api';
}

/**
 * API Request method types
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Generic function to make API requests
 */
export async function apiRequest<T = any>(
  method: ApiMethod,
  endpoint: string,
  data?: any,
  headers: Record<string, string> = {}
): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (data) {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    console.log(`[API] ${method} request to ${url}`);
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}: ${errorText}`);
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    // For empty responses or non-JSON responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('[API] Request failed:', error);
    throw error;
  }
}

/**
 * Chat-specific API functions
 */
export interface ChatRequest {
  message: string;
  visitorId: string;
  conversationId?: number;
}

export interface ChatResponse {
  message: string;
  conversationId?: number;
}

export async function sendChatMessage(
  userId: string | number,
  request: ChatRequest
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('POST', `/chat/${userId}`, request);
}