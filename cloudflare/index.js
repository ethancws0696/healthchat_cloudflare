import { OpenAI } from 'openai';
import { executeWrite, executeTransaction, getUserById, getUserByUsername, getProviderProfile, getWidgetSettings } from './db-helpers.js';

/**
 * Main worker function that handles all requests
 */
export default {
  /**
   * Handle incoming fetch events
   */
  async fetch(request, env, ctx) {
    try {
      // Allow preflight requests
      if (request.method === 'OPTIONS') {
        return handleCors(request);
      }

      // Extract URL from the request
      const url = new URL(request.url);
      const path = url.pathname;

      // Add CORS headers to all responses
      const corsHeaders = {
        // Allow requests from your Cloudflare Pages domain and others as needed
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      };

      // API route handling
      if (path.startsWith('/api/')) {
        // Extract JWT token from request if present
        const authHeader = request.headers.get('Authorization');
        let userId = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          
          try {
            // Verify and decode JWT token
            userId = await verifyToken(token, env.JWT_SECRET);
          } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
        }

        // Handle user authentication
        if (path === '/api/auth/login') {
          return handleLogin(request, env, corsHeaders);
        }
        
        if (path === '/api/auth/register') {
          return handleRegister(request, env, corsHeaders);
        }

        // User must be authenticated for the following routes
        if (!userId && !path.startsWith('/api/widget/') && !path.startsWith('/api/chat/')) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Handle different API endpoints
        if (path.startsWith('/api/user/')) {
          return handleUserRequests(path, request, userId, env, corsHeaders);
        }
        
        if (path.startsWith('/api/provider-profile/')) {
          return handleProviderProfileRequests(path, request, userId, env, corsHeaders);
        }
        
        if (path.startsWith('/api/widget-settings/')) {
          return handleWidgetSettingsRequests(path, request, userId, env, corsHeaders);
        }
        
        if (path.startsWith('/api/leads/')) {
          return handleLeadsRequests(path, request, userId, env, corsHeaders);
        }
        
        if (path.startsWith('/api/conversations/')) {
          return handleConversationsRequests(path, request, userId, env, corsHeaders);
        }
        
        // Public API endpoints (no auth required)
        if (path.startsWith('/api/widget/')) {
          return handleWidgetRequests(path, request, env, corsHeaders);
        }
        
        if (path.startsWith('/api/chat/')) {
          return handleChatRequests(path, request, env, corsHeaders);
        }

        // If none of the above routes match
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Handle asset requests (from R2)
      if (path.startsWith('/assets/')) {
        return handleAssetRequests(path, request, env, corsHeaders);
      }

      // Default response for invalid routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      // Log the error (will be available in the Cloudflare dashboard)
      console.error('Worker error:', error);
      
      // Return a generic error response
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      });
    }
  }
};

/**
 * Helper Functions
 */

/**
 * Handle CORS preflight requests
 */
function handleCors(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

/**
 * Verify JWT token and extract user ID
 */
async function verifyToken(token, secret) {
  // IMPORTANT: This is a simplified version for the demo only
  // In production, use proper JWT verification with jose or jsonwebtoken
  if (token.startsWith('demo-token-')) {
    const parts = token.split('-');
    if (parts.length >= 3) {
      return Number(parts[2]);
    }
  }
  
  // If not a demo token or invalid, reject
  throw new Error('Invalid token');
}

/**
 * Handle user login requests
 */
async function handleLogin(request, env, corsHeaders) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Parse the request body
  const data = await request.json();
  const { username, password } = data;
  
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password are required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  try {
    // Get user from database
    const user = await getUserByUsername(env, username);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // IMPORTANT: This is a simplified version for the demo only
    // In production, use proper password hashing and comparison
    if (user.password !== password) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Generate a token
    // In a real implementation, use proper JWT generation
    const token = `demo-token-${user.id}-${Date.now()}`;
    
    return new Response(JSON.stringify({
      token,
      user: {
        id: user.id,
        username: user.username,
        companyName: user.companyName,
        email: user.email
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Handle user registration requests
 */
async function handleRegister(request, env, corsHeaders) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Parse the request body
  const data = await request.json();
  const { username, password, email, companyName, websiteUrl } = data;

  // Validate required fields
  if (!username || !password || !email || !companyName) {
    return new Response(JSON.stringify({ error: 'Username, password, email, and company name are required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Check if HEALTHCHAT_DB binding exists
    if (!env.HEALTHCHAT_DB) {
      console.error('HEALTHCHAT_DB binding is undefined');
      return new Response(JSON.stringify({ error: 'Database binding not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if username already exists
    const existingUser = await getUserByUsername(env, username);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Define transaction queries for atomic operations
    const queries = [
      {
        query: `INSERT INTO users (username, password_hash, email, company_name, website_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        params: [username, password, email, companyName, websiteUrl || null, new Date().toISOString()]
      },
      {
        query: `INSERT INTO provider_profiles (user_id, services, locations, insurance, intake, contact) VALUES ((SELECT last_insert_rowid()), ?, ?, ?, ?, ?)`,
        params: [JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), '', JSON.stringify({ phone: '', email: email, hours: '' })]
      },
      {
        query: `INSERT INTO widget_settings (user_id, primary_color, secondary_color, position, greeting, bot_name, show_branding) VALUES ((SELECT last_insert_rowid()), ?, ?, ?, ?, ?, ?)`,
        params: ['#4F46E5', '#14B8A6', 'bottom-right', 'Hello! How can I help you today?', 'Assistant', 1]
      }
    ];

    // Execute transaction to ensure atomicity
    const transactionResult = await executeTransaction(env, queries);
    if (!transactionResult.success) {
      throw new Error('Transaction failed: ' + transactionResult.error);
    }

    // Get the newly created user
    const newUser = await getUserByUsername(env, username);
    if (!newUser) {
      throw new Error('User creation failed');
    }

    // Generate a token
    const token = `demo-token-${newUser.id}-${Date.now()}`;

    return new Response(JSON.stringify({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        companyName: newUser.companyName,
        email: newUser.email
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed: ' + error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Handle provider profile requests
 */
async function handleProviderProfileRequests(path, request, userId, env, corsHeaders) {
  // Extract profile ID from path
  const profileId = path.split('/').pop();
  
  // GET request - fetch profile
  if (request.method === 'GET') {
    try {
      // If path ends with 'scan-website', handle website scanning
      if (path.endsWith('/scan-website')) {
        const { url } = await request.json();
        
        if (!url) {
          return new Response(JSON.stringify({ error: 'Website URL is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Call function to scan website and extract healthcare info
        return await handleWebsiteScan(url, userId, env, corsHeaders);
      }
      
      // Otherwise get provider profile
      const profile = await getProviderProfile(env, Number(profileId) || userId);
      
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // If this isn't the user's own profile, check if they have access
      if (profile.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to get profile' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // PUT request - update profile
  if (request.method === 'PUT') {
    try {
      const data = await request.json();
      
      // Make sure the profile exists
      const profile = await getProviderProfile(env, Number(profileId) || userId);
      
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Ensure user can only update their own profile
      if (profile.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Prepare data for update
      const services = data.services ? JSON.stringify(data.services) : profile.services;
      const locations = data.locations ? JSON.stringify(data.locations) : profile.locations;
      const insurance = data.insurance ? JSON.stringify(data.insurance) : profile.insurance;
      const intake = data.intake !== undefined ? data.intake : profile.intake;
      const contact = data.contact ? JSON.stringify(data.contact) : profile.contact;
      const customRules = data.customRules ? JSON.stringify(data.customRules) : profile.customRules;
      
      // Update the profile
      const updateResult = await executeWrite(env,
        `UPDATE provider_profiles 
         SET services = ?, locations = ?, insurance = ?, intake = ?, contact = ?, custom_rules = ?
         WHERE user_id = ?`,
        [services, locations, insurance, intake, contact, customRules, userId]
      );
      
      if (!updateResult.success) {
        throw new Error('Failed to update profile');
      }
      
      // Get the updated profile
      const updatedProfile = await getProviderProfile(env, userId);
      
      return new Response(JSON.stringify(updatedProfile), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // If the method is not supported
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Handle widget settings requests
 */
async function handleWidgetSettingsRequests(path, request, userId, env, corsHeaders) {
  // Extract settings ID from path
  const settingsId = path.split('/').pop();
  
  // GET request - fetch settings
  if (request.method === 'GET') {
    try {
      const settings = await getWidgetSettings(env, Number(settingsId) || userId);
      
      if (!settings) {
        return new Response(JSON.stringify({ error: 'Settings not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // If this isn't the user's own settings, check if they have access
      if (settings.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      return new Response(JSON.stringify(settings), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to get settings' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // PUT request - update settings
  if (request.method === 'PUT') {
    try {
      const data = await request.json();
      
      // Make sure the settings exist
      const settings = await getWidgetSettings(env, Number(settingsId) || userId);
      
      if (!settings) {
        return new Response(JSON.stringify({ error: 'Settings not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Ensure user can only update their own settings
      if (settings.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Update the settings
      const updateResult = await executeWrite(env,
        `UPDATE widget_settings 
         SET primary_color = ?, secondary_color = ?, position = ?, greeting = ?, bot_name = ?, show_branding = ?, font_family = ?, delay_load = ?
         WHERE user_id = ?`,
        [
          data.primaryColor || settings.primaryColor,
          data.secondaryColor || settings.secondaryColor,
          data.position || settings.position,
          data.greeting !== undefined ? data.greeting : settings.greeting,
          data.botName || settings.botName,
          data.showBranding !== undefined ? (data.showBranding ? 1 : 0) : settings.showBranding,
          data.fontFamily || settings.fontFamily,
          data.delayLoad || settings.delayLoad,
          userId
        ]
      );
      
      if (!updateResult.success) {
        throw new Error('Failed to update settings');
      }
      
      // Get the updated settings
      const updatedSettings = await getWidgetSettings(env, userId);
      
      return new Response(JSON.stringify(updatedSettings), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to update settings' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // If the method is not supported
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Handle widget script requests
 */
async function handleWidgetRequests(path, request, env, corsHeaders) {
  // Extract widget user ID from path
  const match = path.match(/\/api\/widget\/(\w+)\.js/);
  const userId = match ? match[1] : null;
  
  if (!userId) {
    return new Response('console.error("Invalid widget URL");', {
      status: 400,
      headers: {
        'Content-Type': 'application/javascript',
        ...corsHeaders
      }
    });
  }
  
  // GET request - serve widget script
  if (request.method === 'GET') {
    try {
      // Get widget settings
      let settings;
      let user;
      
      if (userId !== 'demo') {
        const userIdNum = Number(userId);
        settings = await getWidgetSettings(env, userIdNum);
        user = await getUserById(env, userIdNum);
        
        if (!settings || !user) {
          return new Response('console.error("Invalid user ID");', {
            status: 404,
            headers: {
              'Content-Type': 'application/javascript',
              ...corsHeaders
            }
          });
        }
      } else {
        // Demo widget with default settings
        settings = {
          primaryColor: "#4F46E5",
          secondaryColor: "#14B8A6",
          fontFamily: "Inter, sans-serif",
          position: "bottom-right",
          greeting: "👋 Hi there! I'm the virtual assistant for HealthChat Demo. How can I help you today?",
          botName: "Assistant",
          showBranding: true
        };
        user = { id: 'demo', companyName: 'HealthChat Demo' };
      }
      
      // Generate the widget script
      const widgetScript = generateWidgetScript(userId, settings, user);
      
      return new Response(widgetScript, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'max-age=3600',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response('console.error("Failed to load widget: ' + error.message + '");', {
        status: 500,
        headers: {
          'Content-Type': 'application/javascript',
          ...corsHeaders
        }
      });
    }
  }
  
  // If the method is not supported
  return new Response('console.error("Method not allowed");', {
    status: 405,
    headers: {
      'Content-Type': 'application/javascript',
      ...corsHeaders
    }
  });
}

/**
 * Generate widget script
 */
function generateWidgetScript(userId, settings, user) {
  return `
  // HealthChat Widget Loader v1.1.0
  (function() {
    // Prevent duplicate loading
    if (window.healthChatWidgetLoaded) {
      console.log("HealthChat widget already loaded, skipping");
      return;
    }
    window.healthChatWidgetLoaded = true;
    
    const userId = "${userId}";
    const companyName = "${user.companyName || 'Healthcare Provider'}";
    
    // Load widget settings
    const defaultSettings = {
      position: "${settings.position || 'bottom-right'}",
      primaryColor: "${settings.primaryColor || '#4F46E5'}",
      secondaryColor: "${settings.secondaryColor || '#14B8A6'}",
      botName: "${settings.botName || 'Assistant'}",
      greeting: "${settings.greeting || 'How can I help you today?'}",
      showBranding: ${settings.showBranding !== false},
      fontFamily: "${settings.fontFamily || 'Inter, sans-serif'}",
      width: "350px",
      height: "600px",
      borderRadius: "16px"
    };
    
    // Setup config object and ensure the Cloudflare Worker URL is always available
    window.healthChatConfig = window.healthChatConfig || {};
    
    // Always use Cloudflare Worker URL for API calls in widget mode
    window.healthChatConfig.apiUrl = 'https://healthchat.ethan-c87.workers.dev';
    window.HEALTHCHAT_API_BASE_URL = window.healthChatConfig.apiUrl + '/api';
    window.HEALTHCHAT_CHAT_API_URL = window.healthChatConfig.apiUrl + '/api/chat/';
    
    console.log('Set API base URL to:', window.HEALTHCHAT_API_BASE_URL);
    console.log('Set chat API URL to:', window.HEALTHCHAT_CHAT_API_URL);
    
    // Merge with any custom settings provided by the user
    const customSettings = window.healthChatConfig || {};
    const settings = { ...defaultSettings, ...customSettings };
    
    // Check if we should disable on mobile
    if (settings.disableMobile && window.innerWidth < 768) {
      console.log("HealthChat widget: Disabled on mobile devices");
      return;
    }
    
    // Add pulse animation CSS
    const addPulseAnimation = () => {
      if (document.getElementById('healthchat-widget-style')) return;
      
      const primaryColor = settings.primaryColor || '#4F46E5';
      const rgbValue = hexToRgb(primaryColor);
      
      const styleEl = document.createElement('style');
      styleEl.id = 'healthchat-widget-style';
      styleEl.textContent = \`
        @keyframes healthchat-widget-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(\${rgbValue.r}, \${rgbValue.g}, \${rgbValue.b}, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(\${rgbValue.r}, \${rgbValue.g}, \${rgbValue.b}, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(\${rgbValue.r}, \${rgbValue.g}, \${rgbValue.b}, 0);
          }
        }
        
        @keyframes healthchat-widget-fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        #healthchat-widget-container {
          font-family: \${settings.fontFamily};
          animation: healthchat-widget-fadeIn 0.5s ease forwards;
        }
        
        #healthchat-widget-button {
          animation: healthchat-widget-pulse 2s infinite;
        }
      \`;
      document.head.appendChild(styleEl);
    };
    
    // Utility function to convert hex color to RGB
    function hexToRgb(hex) {
      // Remove # if present
      hex = hex.replace(/^#/, '');
      
      // Parse shorthand form (e.g. "03F") to full form (e.g. "0033FF")
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      
      return { r, g, b };
    }
    
    // Add animation styles
    addPulseAnimation();
    
    // Create widget container
    const container = document.createElement('div');
    container.id = 'healthchat-widget-container';
    container.style.position = 'fixed';
    container.style.zIndex = '999999'; // Higher z-index to prevent other elements from overlapping
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.transition = 'all 0.3s ease';
    
    // Set position
    switch (settings.position) {
      case 'bottom-right':
        container.style.right = '20px';
        container.style.bottom = '20px';
        break;
      case 'bottom-left':
        container.style.left = '20px';
        container.style.bottom = '20px';
        break;
      case 'top-right':
        container.style.right = '20px';
        container.style.top = '20px';
        break;
      case 'top-left':
        container.style.left = '20px';
        container.style.top = '20px';
        break;
      default:
        container.style.right = '20px';
        container.style.bottom = '20px';
    }
    
    // Create button
    const button = document.createElement('div');
    button.id = 'healthchat-widget-button';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = settings.primaryColor;
    button.style.color = '#FFFFFF';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    button.style.position = 'absolute';
    button.style.right = settings.position.includes('left') ? 'auto' : '0';
    button.style.left = settings.position.includes('left') ? '0' : 'auto';
    button.style.bottom = settings.position.includes('top') ? 'auto' : '0';
    button.style.top = settings.position.includes('top') ? '0' : 'auto';
    button.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    button.style.zIndex = '2'; // Ensure button is above iframe when closed
    
    // Modern chat icon
    button.innerHTML = \`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 12H8.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 12H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 12H16.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    \`;
    button.setAttribute('aria-label', 'Open chat');
    
    // Create iframe for widget content
    const iframe = document.createElement('iframe');
    iframe.id = 'healthchat-widget-iframe';
    iframe.style.width = '80px'; // Start with visible size
    iframe.style.height = '80px'; // Start with visible size
    iframe.style.border = 'none';
    iframe.style.borderRadius = '50%'; // Start with circle for button
    iframe.style.backgroundColor = '#4F46E5'; // Visible background color
    iframe.style.overflow = 'hidden';
    iframe.style.transition = 'all 0.3s ease';
    iframe.style.opacity = '1'; // Start visible
    iframe.style.position = 'relative';
    iframe.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    iframe.setAttribute('loading', 'lazy'); // Improve performance
    iframe.setAttribute('allow', 'microphone'); // Allow potential voice input
    iframe.setAttribute('title', 'Healthcare Chat Widget');
    
    // Set iframe src to the widget page - ensure this loads the React app
    // Always use the Cloudflare Worker URL when running on Vercel
    let iframeSrc;
    
    // If we're on Vercel, use the Cloudflare Worker directly
    if (window.location.hostname.includes('vercel.app')) {
      iframeSrc = 'https://healthchat.ethan-c87.workers.dev/widget/' + userId + '?ts=' + Date.now();
      console.log('HealthChat Widget: Running on Vercel, using Cloudflare Worker directly');
    }
    // For development environment, use the full URL to prevent file:// protocol
    else if (window.location.protocol.startsWith('http')) {
      iframeSrc = window.location.protocol + '//' + window.location.host + '/widget/' + userId + '?ts=' + Date.now();
    }
    // Fallback to current origin
    else {
      iframeSrc = window.location.protocol + '//' + window.location.host + '/widget/' + userId + '?ts=' + Date.now();
    }
      
    iframe.src = iframeSrc; // Add timestamp to prevent caching
    console.log('HealthChat Widget: Setting iframe src to:', iframeSrc);
    
    // Add elements to DOM
    container.appendChild(iframe);
    container.appendChild(button);
    document.body.appendChild(container);
    
    // Function to open/close widget
    let isOpen = false;
    const toggleWidget = () => {
      isOpen = !isOpen;
      if (isOpen) {
        iframe.style.width = '350px';
        iframe.style.height = '600px';
        iframe.style.opacity = '1';
        button.style.transform = 'rotate(45deg)';
        button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        button.setAttribute('aria-label', 'Close chat');
      } else {
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.opacity = '0';
        button.style.transform = 'rotate(0deg)';
        button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        button.setAttribute('aria-label', 'Open chat');
      }
      
      // Send postMessage to iframe that chat was toggled
      iframe.contentWindow.postMessage({
        type: 'HEALTHCHAT_TOGGLE',
        isOpen,
        settings: { ...settings, userId }
      }, '*');
    };
    
    // Add click event to button
    button.addEventListener('click', toggleWidget);
    
    // Expose toggle function to global scope
    window.toggleHealthChat = toggleWidget;
    
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      // Validate origin for security - allow both the iframe origin and the Cloudflare Worker
      const allowedOrigins = [
        window.location.protocol + '//' + window.location.host,
        'https://healthchat.ethan-c87.workers.dev'
      ];
      
      if (!allowedOrigins.includes(event.origin) && event.origin !== '*') {
        console.log('Message received from unauthorized origin:', event.origin);
        return;
      }
      
      // Parse string messages as JSON if needed
      let data = event.data;
      try {
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
      } catch (e) {
        // Not JSON, use as is
      }
      
      // Handle events from the iframe
      if (data && typeof data === 'object') {
        console.log('Received message from widget:', data.type);
        
        if (data.type === 'HEALTHCHAT_READY') {
          // Widget is ready, send settings
          console.log('Widget is ready, sending settings');
          iframe.contentWindow.postMessage({
            type: 'HEALTHCHAT_INIT',
            settings: { ...settings, userId }
          }, '*');
        }
        
        else if (data.type === 'HEALTHCHAT_READY_CONFIRMED') {
          console.log('Widget initialized successfully');
        }
        
        else if (data.type === 'HEALTHCHAT_STATE_CHANGE') {
          console.log('Widget state changed:', data.state);
          // You could trigger events or callbacks here
        }
        
        else if (data.type === 'HEALTHCHAT_ERROR') {
          console.error('Widget error:', data.error);
        }
      }
    });
    
    // Auto-open if specified
    if (settings.autoOpen) {
      setTimeout(toggleWidget, settings.delayOpen || 0);
    }
    
    // Auto-hide if specified
    if (settings.autohide && parseInt(settings.autohide) > 0) {
      let autoHideTimer;
      const resetAutoHideTimer = () => {
        if (autoHideTimer) clearTimeout(autoHideTimer);
        if (isOpen) {
          autoHideTimer = setTimeout(() => {
            toggleWidget();
          }, parseInt(settings.autohide));
        }
      };
      
      // Reset timer on mousemove, click, scroll, etc.
      document.addEventListener('mousemove', resetAutoHideTimer);
      document.addEventListener('click', resetAutoHideTimer);
      document.addEventListener('scroll', resetAutoHideTimer);
      document.addEventListener('keypress', resetAutoHideTimer);
    }
    
    // Delayed load if requested
    if (settings.delayLoad && parseInt(settings.delayLoad) > 0) {
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.opacity = '1';
      }, parseInt(settings.delayLoad));
    }
  })();
  `;
}

/**
 * Handle chat/messaging requests
 */
async function handleChatRequests(path, request, env, corsHeaders) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  try {
    const data = await request.json();
    
    // Extract user ID from path or request body
    let userId;
    
    if (path.startsWith('/api/chat/')) {
      // Extract from URL if specified in path
      const parts = path.split('/');
      userId = parts[parts.length - 1];
    } else {
      // Otherwise get from request body
      userId = data.userId;
    }
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Get message content
    const message = data.message;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Get provider profile for context
    const profile = await getProviderProfile(env, Number(userId));
    
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Provider profile not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Get visitor ID or generate a new one
    const visitorId = data.visitorId || `visitor-${Date.now()}`;
    
    // Get conversation ID if available
    const conversationId = data.conversationId;
    
    // Process with AI
    try {
      // Get or create conversation
      let conversation;
      
      if (conversationId) {
        // Get existing conversation
        const result = await env.HEALTHCHAT_DB.prepare(
          `SELECT * FROM conversations WHERE id = ? AND user_id = ?`
        ).bind(conversationId, Number(userId)).first();
        
        if (!result) {
          return new Response(JSON.stringify({ error: 'Conversation not found' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        conversation = {
          id: result.id,
          userId: result.user_id,
          visitorId: result.visitor_id,
          messages: JSON.parse(result.messages || '[]'),
          isQualified: result.is_qualified === 1
        };
      } else {
        // Create new conversation
        const result = await executeWrite(env,
          `INSERT INTO conversations (user_id, visitor_id, messages, is_qualified)
           VALUES (?, ?, ?, ?)`,
          [Number(userId), visitorId, JSON.stringify([]), 0]
        );
        
        if (!result.success) {
          throw new Error('Failed to create conversation');
        }
        
        // Get the newly created conversation
        const newConversation = await env.HEALTHCHAT_DB.prepare(
          `SELECT * FROM conversations WHERE id = last_insert_rowid()`
        ).first();
        
        conversation = {
          id: newConversation.id,
          userId: newConversation.user_id,
          visitorId: newConversation.visitor_id,
          messages: [],
          isQualified: false
        };
      }
      
      // Add user message to the conversation
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      conversation.messages.push(userMessage);
      
      // Update conversation in database
      await executeWrite(env,
        `UPDATE conversations SET messages = ? WHERE id = ?`,
        [JSON.stringify(conversation.messages), conversation.id]
      );
      
      // Get user information for context
      const user = await getUserById(env, Number(userId));
      const companyName = user ? user.companyName : 'Healthcare Provider';
      
      // Generate system prompt
      const systemPrompt = generateSystemPrompt({ ...profile, companyName });
      
      // Process with OpenAI
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY
      });
      
      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add conversation history (limiting to last 10 messages for token count)
      const history = conversation.messages.slice(-10);
      history.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
      
      // Send request to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      // Get the response text
      const aiResponseText = response.choices[0].message.content.trim();
      
      // Add assistant message to conversation
      const assistantMessage = {
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString()
      };
      
      conversation.messages.push(assistantMessage);
      
      // Update conversation in database
      await executeWrite(env,
        `UPDATE conversations SET messages = ? WHERE id = ?`,
        [JSON.stringify(conversation.messages), conversation.id]
      );
      
      // Check for lead qualification
      if (conversation.messages.length >= 4 && !conversation.isQualified) {
        // Extract lead information
        const leadInfo = await extractLeadInfo(conversation.messages);
        
        // Try to identify if this is a qualified lead
        const isQualified = 
          (leadInfo.email !== null) || 
          (leadInfo.phone !== null) || 
          (conversation.messages.length >= 6);
        
        if (isQualified) {
          // Create a lead
          const leadResult = await executeWrite(env,
            `INSERT INTO leads (user_id, name, email, phone, interest, status, conversation_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              Number(userId),
              leadInfo.name || 'Unknown Visitor',
              leadInfo.email || '',
              leadInfo.phone || '',
              leadInfo.interest || 'General Inquiry',
              'new',
              conversation.id
            ]
          );
          
          if (leadResult.success) {
            // Mark conversation as qualified
            await executeWrite(env,
              `UPDATE conversations SET is_qualified = 1 WHERE id = ?`,
              [conversation.id]
            );
            
            // Update the conversation object
            conversation.isQualified = true;
          }
        }
      }
      
      // Return response
      return new Response(JSON.stringify({
        message: aiResponseText,
        conversationId: conversation.id
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      // If OpenAI error, handle gracefully
      if (error.message && error.message.includes('OpenAI')) {
        return new Response(JSON.stringify({
          message: "I'm sorry, I'm having trouble connecting to my AI services. Please try again later."
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      throw error; // Let the outer catch block handle other errors
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process chat: ' + error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Handle asset requests (from R2)
 */
async function handleAssetRequests(path, request, env, corsHeaders) {
  // Extract asset key from path
  const assetKey = path.replace('/assets/', '');
  
  if (!assetKey) {
    return new Response(JSON.stringify({ error: 'Asset key is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // GET request - serve asset
  if (request.method === 'GET') {
    try {
      // Get asset from R2 bucket
      const asset = await env.HEALTHCHAT_ASSETS.get(assetKey);
      
      if (!asset) {
        return new Response(JSON.stringify({ error: 'Asset not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Get asset data
      const data = await asset.arrayBuffer();
      
      // Determine content type based on file extension
      const contentType = asset.httpMetadata.contentType || 'application/octet-stream';
      
      // Return asset
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to get asset' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
  
  // If the method is not supported
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Generate system prompt for the AI based on provider profile
 */
function generateSystemPrompt(profile) {
  let prompt = `You are a virtual assistant for ${profile.companyName}, a healthcare provider. 
Your role is to provide helpful information to potential patients and existing patients.

About the healthcare provider:
`;

  // Add services
  if (profile.services && profile.services.length > 0) {
    prompt += `- Services offered: ${profile.services.join(', ')}\n`;
  }

  // Add locations
  if (profile.locations && profile.locations.length > 0) {
    prompt += `- Locations: \n`;
    profile.locations.forEach(location => {
      prompt += `  * ${location.name}: ${location.address}\n`;
      if (location.serviceArea) {
        prompt += `    Service area: ${location.serviceArea}\n`;
      }
    });
  }

  // Add insurance
  if (profile.insurance && profile.insurance.length > 0) {
    prompt += `- Accepted insurance plans: ${profile.insurance.join(', ')}\n`;
  }

  // Add intake info
  if (profile.intake) {
    prompt += `- New patient intake process: ${profile.intake}\n`;
  }

  // Add contact info
  if (profile.contact) {
    prompt += `- Contact information:\n`;
    if (profile.contact.phone) {
      prompt += `  * Phone: ${profile.contact.phone}\n`;
    }
    if (profile.contact.email) {
      prompt += `  * Email: ${profile.contact.email}\n`;
    }
    if (profile.contact.hours) {
      prompt += `  * Hours: ${profile.contact.hours}\n`;
    }
  }

  // Add custom rules if available
  if (profile.customRules) {
    prompt += `\nAdditional instructions:\n`;
    
    if (profile.customRules.commonQuestions) {
      prompt += `- Common questions and answers:\n`;
      profile.customRules.commonQuestions.forEach(qa => {
        prompt += `  * Q: ${qa.question}\n    A: ${qa.answer}\n`;
      });
    }
    
    if (profile.customRules.emergencyInfo) {
      prompt += `- Emergency information: ${profile.customRules.emergencyInfo}\n`;
    }
    
    if (profile.customRules.patientTypes) {
      prompt += `- Patient types served: ${profile.customRules.patientTypes.join(', ')}\n`;
    }
    
    if (profile.customRules.notes) {
      prompt += `- Additional notes: ${profile.customRules.notes}\n`;
    }
  }
  
  return prompt;
}

/**
 * Extract lead information from conversation messages
 */
async function extractLeadInfo(messages) {
  // In a real implementation, you would use OpenAI to extract lead information
  // For this example, we'll just return a simple object with name and email
  // based on basic text search
  
  const messageContent = messages.map(msg => msg.content).join(' ');
  
  // Simple extraction (would be much more sophisticated in production)
  const nameMatch = messageContent.match(/my name is (\w+)/i);
  const emailMatch = messageContent.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
  const phoneMatch = messageContent.match(/(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})/i);
  
  return {
    name: nameMatch ? nameMatch[1] : null,
    email: emailMatch ? emailMatch[1] : null,
    phone: phoneMatch ? phoneMatch[1] : null,
    interest: null,
    isQualified: Boolean(emailMatch || phoneMatch || (messages.length >= 6))
  };
}

/**
 * Handle user requests (stubbed for completeness)
 */
async function handleUserRequests(path, request, userId, env, corsHeaders) {
  // Implement user-specific endpoints as needed
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Handle leads requests (stubbed for completeness)
 */
async function handleLeadsRequests(path, request, userId, env, corsHeaders) {
  // Implement leads-specific endpoints as needed
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Handle conversations requests (stubbed for completeness)
 */
async function handleConversationsRequests(path, request, userId, env, corsHeaders) {
  // Implement conversations-specific endpoints as needed
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Handle website scan (stubbed for completeness)
 */
async function handleWebsiteScan(url, userId, env, corsHeaders) {
  // Implement website scanning logic as needed
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}