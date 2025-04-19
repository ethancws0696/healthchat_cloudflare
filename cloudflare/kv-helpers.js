/**
 * Helper functions for handling KV operations for caching and other use cases
 */

/**
 * Default TTL for cache items in seconds (1 hour)
 */
const DEFAULT_CACHE_TTL = 3600;

/**
 * Set a value in KV with optional TTL
 * @param {Object} env - Environment variables including KV namespace binding
 * @param {string} key - The key to store the value under
 * @param {any} value - The value to store (will be JSON stringified if not a string)
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} - Success indicator
 */
export async function setKV(env, key, value, ttl = DEFAULT_CACHE_TTL) {
  try {
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Store in KV with TTL
    await env.HEALTHCHAT_KV.put(key, valueToStore, { expirationTtl: ttl });
    
    return true;
  } catch (error) {
    console.error('KV set error:', error);
    return false;
  }
}

/**
 * Get a value from KV
 * @param {Object} env - Environment variables including KV namespace binding
 * @param {string} key - The key to retrieve
 * @param {boolean} parseJson - Whether to parse the result as JSON
 * @returns {Promise<any>} - The stored value or null if not found
 */
export async function getKV(env, key, parseJson = true) {
  try {
    const value = await env.HEALTHCHAT_KV.get(key);
    
    if (value === null) {
      return null;
    }
    
    return parseJson ? JSON.parse(value) : value;
  } catch (error) {
    console.error('KV get error:', error);
    return null;
  }
}

/**
 * Delete a value from KV
 * @param {Object} env - Environment variables including KV namespace binding
 * @param {string} key - The key to delete
 * @returns {Promise<boolean>} - Success indicator
 */
export async function deleteKV(env, key) {
  try {
    await env.HEALTHCHAT_KV.delete(key);
    return true;
  } catch (error) {
    console.error('KV delete error:', error);
    return false;
  }
}

/**
 * List all keys in KV with optional prefix
 * @param {Object} env - Environment variables including KV namespace binding
 * @param {string} prefix - Optional prefix to filter keys
 * @param {number} limit - Maximum number of keys to return
 * @returns {Promise<Array<string>>} - Array of keys
 */
export async function listKVKeys(env, prefix = '', limit = 100) {
  try {
    const keys = await env.HEALTHCHAT_KV.list({ prefix, limit });
    return keys.keys.map(k => k.name);
  } catch (error) {
    console.error('KV list error:', error);
    return [];
  }
}

/**
 * Cache API response using KV
 * @param {Object} env - Environment variables including KV namespace binding
 * @param {Request} request - The original request
 * @param {Function} handler - Async function that generates the response
 * @param {number} ttl - Cache TTL in seconds
 * @returns {Promise<Response>} - Cached or fresh response
 */
export async function cacheResponse(env, request, handler, ttl = DEFAULT_CACHE_TTL) {
  // Generate cache key from request URL and method
  const cacheKey = `cache:${request.method}:${new URL(request.url).pathname}`;
  
  // Try to get from cache
  const cachedResponse = await getKV(env, cacheKey, false);
  
  if (cachedResponse) {
    // Return cached response
    return new Response(cachedResponse, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=0',
        'X-Cache': 'HIT'
      }
    });
  }
  
  // Generate fresh response
  const response = await handler();
  
  // Cache the response body
  if (response.status === 200) {
    const responseBody = await response.clone().text();
    await setKV(env, cacheKey, responseBody, ttl);
  }
  
  // Add cache header
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('X-Cache', 'MISS');
  
  // Return the response
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

/**
 * Rate limit a request based on IP or other identifier
 * @param {Object} env - Environment variables including KV namespace binding
 * @param {string} identifier - The identifier to rate limit (e.g., IP address)
 * @param {number} limit - Maximum number of requests allowed in the window
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<Object>} - Result object with allowed status and remaining quota
 */
export async function rateLimit(env, identifier, limit = 60, windowSeconds = 60) {
  const key = `ratelimit:${identifier}`;
  
  try {
    // Get current usage
    const usage = await getKV(env, key) || { count: 0, timestamp: Date.now() };
    
    // Check if window has expired
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    if (now - usage.timestamp > windowMs) {
      // Reset if window expired
      usage.count = 1;
      usage.timestamp = now;
    } else {
      // Increment count
      usage.count += 1;
    }
    
    // Update KV
    await setKV(env, key, usage, windowSeconds);
    
    // Check if rate limit exceeded
    const allowed = usage.count <= limit;
    
    return {
      allowed,
      remaining: Math.max(0, limit - usage.count),
      resetAt: new Date(usage.timestamp + windowMs),
      limit
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    
    // Allow the request if there's an error with rate limiting
    return {
      allowed: true,
      remaining: 0,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
      limit,
      error: true
    };
  }
}