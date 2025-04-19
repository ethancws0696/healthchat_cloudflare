/**
 * Helper functions for handling authentication in Cloudflare Workers
 */

// Required for JWT implementation
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Generate a JWT token for user authentication
 * @param {number} userId - The user ID to include in the token
 * @param {string} secret - The secret key used to sign the token
 * @param {number} expiration - Token expiration time in seconds (default: 24 hours)
 * @returns {Promise<string>} - The generated JWT token
 */
export async function generateToken(userId, secret, expiration = 86400) {
  try {
    // Create token header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Create token payload
    const payload = {
      sub: userId.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiration
    };

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // Create the signature base
    const signatureBase = `${encodedHeader}.${encodedPayload}`;
    
    // Sign the token using HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signatureBase)
    );
    
    // Convert signature to base64 URL safe format
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    // Return the complete JWT
    return `${signatureBase}.${signatureBase64}`;
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Failed to generate JWT token');
  }
}

/**
 * Verify a JWT token and extract the user ID
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The secret key used to verify the token
 * @returns {Promise<number>} - The user ID from the token
 */
export async function verifyToken(token, secret) {
  try {
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [encodedHeader, encodedPayload, providedSignature] = parts;
    
    // Decode payload
    const payload = JSON.parse(atob(encodedPayload));
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }
    
    // Verify signature
    const signatureBase = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Convert provided signature from base64 URL safe format to ArrayBuffer
    const providedSignatureFixed = providedSignature.replace(/-/g, '+').replace(/_/g, '/');
    const providedSignatureBinary = atob(providedSignatureFixed);
    const signatureArray = new Uint8Array(providedSignatureBinary.length);
    
    for (let i = 0; i < providedSignatureBinary.length; i++) {
      signatureArray[i] = providedSignatureBinary.charCodeAt(i);
    }
    
    // Verify the signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      encoder.encode(signatureBase)
    );
    
    if (!isValid) {
      throw new Error('Invalid token signature');
    }
    
    // Return the user ID from the token
    return parseInt(payload.sub, 10);
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new Error('Failed to verify JWT token');
  }
}

/**
 * Hash a password using SHA-256
 * @param {string} password - The password to hash
 * @param {string} salt - A unique salt for the user
 * @returns {Promise<string>} - The hashed password
 */
export async function hashPassword(password, salt) {
  try {
    // Combine password and salt
    const combined = `${password}${salt}`;
    
    // Create hash
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(combined)
    );
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Generate a random API key
 * @returns {string} - The generated API key
 */
export function generateApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Extract and verify authentication from a request
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables including JWT_SECRET
 * @returns {Promise<Object>} - The authentication result with userId if successful
 */
export async function authenticate(request, env) {
  // Get Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'No valid authorization token provided' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify the token
    const userId = await verifyToken(token, env.JWT_SECRET);
    
    return { authenticated: true, userId };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}