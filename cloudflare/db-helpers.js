/**
 * Helper functions for working with Cloudflare D1 database
 */

/**
 * Execute a read query with parameters
 * @param {Object} env - Environment variables including D1 binding
 * @param {string} query - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} - Query result
 */
export async function executeQuery(env, query, params = []) {
  try {
    const stmt = env.HEALTHCHAT_DB.prepare(query);
    
    // Bind parameters if provided
    if (params.length > 0) {
      stmt.bind(...params);
    }
    
    // Execute the query
    const result = await stmt.all();
    
    return {
      success: true,
      results: result.results || [],
      meta: {
        count: result.results?.length || 0,
        query: query,
        params: params
      }
    };
  } catch (error) {
    console.error('DB query error:', error, { query, params });
    
    return {
      success: false,
      error: error.message,
      meta: {
        query: query,
        params: params
      }
    };
  }
}

/**
 * Execute a query and return a single row
 * @param {Object} env - Environment variables including D1 binding
 * @param {string} query - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} - Single result row or null
 */
export async function querySingle(env, query, params = []) {
  try {
    const stmt = env.HEALTHCHAT_DB.prepare(query);
    
    // Bind parameters if provided
    if (params.length > 0) {
      stmt.bind(...params);
    }
    
    // Execute the query
    const result = await stmt.first();
    
    return {
      success: true,
      result: result || null,
      meta: {
        found: result !== null,
        query: query,
        params: params
      }
    };
  } catch (error) {
    console.error('DB single query error:', error, { query, params });
    
    return {
      success: false,
      error: error.message,
      meta: {
        query: query,
        params: params
      }
    };
  }
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE)
 * @param {Object} env - Environment variables including D1 binding
 * @param {string} query - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} - Query result with metadata
 */
export async function executeWrite(env, query, params = []) {
  try {
    const stmt = env.HEALTHCHAT_DB.prepare(query);
    
    // Bind parameters if provided
    if (params.length > 0) {
      stmt.bind(...params);
    }
    
    // Execute the query
    const result = await stmt.run();
    
    return {
      success: result.success,
      meta: {
        changes: result.changes,
        lastRowId: result.lastRowId,
        query: query,
        params: params
      }
    };
  } catch (error) {
    console.error('DB write error:', error, { query, params });
    
    return {
      success: false,
      error: error.message,
      meta: {
        query: query,
        params: params
      }
    };
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Object} env - Environment variables including D1 binding
 * @param {Array<Object>} queries - Array of query objects: {query: string, params: Array}
 * @returns {Promise<Object>} - Transaction result
 */
export async function executeTransaction(env, queries) {
  if (!Array.isArray(queries) || queries.length === 0) {
    return {
      success: false,
      error: 'No queries provided for transaction',
      meta: { queries: 0 }
    };
  }
  
  // Start a new D1 batch
  const batch = env.HEALTHCHAT_DB.batch();
  
  // Add all queries to the batch
  for (const q of queries) {
    const stmt = env.HEALTHCHAT_DB.prepare(q.query);
    
    if (q.params && q.params.length > 0) {
      stmt.bind(...q.params);
    }
    
    batch.add(stmt);
  }
  
  try {
    // Execute the batch
    const results = await batch.run();
    
    return {
      success: true,
      results: results,
      meta: {
        queries: queries.length
      }
    };
  } catch (error) {
    console.error('DB transaction error:', error);
    
    return {
      success: false,
      error: error.message,
      meta: {
        queries: queries.length
      }
    };
  }
}

/**
 * Get user by ID
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} userId - User ID to look up
 * @returns {Promise<Object>} - User object or null
 */
export async function getUserById(env, userId) {
  const query = `
    SELECT id, username, email, company_name, website_url, role, created_at
    FROM users 
    WHERE id = ?
  `;
  
  const result = await querySingle(env, query, [userId]);
  
  if (!result.success || !result.result) {
    return null;
  }
  
  // Format the user object with camelCase properties
  return {
    id: result.result.id,
    username: result.result.username,
    email: result.result.email,
    companyName: result.result.company_name,
    websiteUrl: result.result.website_url,
    role: result.result.role,
    createdAt: result.result.created_at
  };
}

/**
 * Get user by username
 * @param {Object} env - Environment variables including D1 binding
 * @param {string} username - Username to look up
 * @returns {Promise<Object>} - User object or null
 */
export async function getUserByUsername(env, username) {
  // Query with all possible password field variations
  const query = `
    SELECT id, username, email, password_hash, password, company_name, companyName, website_url, role, created_at, api_key
    FROM users 
    WHERE username = ?
  `;
  
  const result = await querySingle(env, query, [username]);
  
  if (!result.success || !result.result) {
    console.log(`[DB] User not found for username: ${username}`);
    return null;
  }
  
  console.log(`[DB] Raw user result: ${JSON.stringify(result.result)}`);
  
  // Format the user object with camelCase properties
  // Handle all possible field name variations
  const user = {
    id: result.result.id,
    username: result.result.username,
    email: result.result.email,
    // Handle both password_hash and password column names
    passwordHash: result.result.password_hash || result.result.password,
    // Handle both company_name and companyName column names
    companyName: result.result.company_name || result.result.companyName,
    websiteUrl: result.result.website_url,
    role: result.result.role,
    createdAt: result.result.created_at,
    apiKey: result.result.api_key
  };
  
  console.log(`[DB] Formatted user object: ${JSON.stringify({
    id: user.id,
    username: user.username,
    has_password_hash: Boolean(user.passwordHash),
    password_hash_preview: user.passwordHash ? `${String(user.passwordHash).substring(0, 5)}...` : 'none'
  })}`);
  
  return user;
}

/**
 * Get provider profile by user ID
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} userId - User ID to look up
 * @returns {Promise<Object>} - Provider profile or null
 */
export async function getProviderProfile(env, userId) {
  const query = `
    SELECT id, user_id, services, locations, insurance, intake, contact, 
           last_scanned, raw_content, custom_rules
    FROM provider_profiles 
    WHERE user_id = ?
  `;
  
  const result = await querySingle(env, query, [userId]);
  
  if (!result.success || !result.result) {
    return null;
  }
  
  // Parse JSON fields
  const profile = result.result;
  
  return {
    id: profile.id,
    userId: profile.user_id,
    services: JSON.parse(profile.services),
    locations: JSON.parse(profile.locations),
    insurance: JSON.parse(profile.insurance),
    intake: profile.intake,
    contact: JSON.parse(profile.contact),
    lastScanned: profile.last_scanned,
    rawContent: profile.raw_content,
    customRules: profile.custom_rules ? JSON.parse(profile.custom_rules) : null
  };
}

/**
 * Get widget settings by user ID
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} userId - User ID to look up
 * @returns {Promise<Object>} - Widget settings or null
 */
export async function getWidgetSettings(env, userId) {
  const query = `
    SELECT id, user_id, primary_color, secondary_color, font_family, position,
           greeting, logo_url, bot_name, show_branding
    FROM widget_settings 
    WHERE user_id = ?
  `;
  
  const result = await querySingle(env, query, [userId]);
  
  if (!result.success || !result.result) {
    return null;
  }
  
  const settings = result.result;
  
  return {
    id: settings.id,
    userId: settings.user_id,
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    fontFamily: settings.font_family,
    position: settings.position,
    greeting: settings.greeting,
    logoUrl: settings.logo_url,
    botName: settings.bot_name,
    showBranding: Boolean(settings.show_branding)
  };
}

/**
 * Get leads by user ID
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} userId - User ID to look up
 * @param {number} limit - Maximum number of leads to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of leads
 */
export async function getLeadsByUserId(env, userId, limit = 100, offset = 0) {
  const query = `
    SELECT id, user_id, name, email, phone, interest, status, qualified_at, followed_up_at
    FROM leads 
    WHERE user_id = ?
    ORDER BY qualified_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const result = await executeQuery(env, query, [userId, limit, offset]);
  
  if (!result.success) {
    return [];
  }
  
  // Format leads with camelCase properties
  return result.results.map(lead => ({
    id: lead.id,
    userId: lead.user_id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    interest: lead.interest,
    status: lead.status,
    qualifiedAt: lead.qualified_at,
    followedUpAt: lead.followed_up_at
  }));
}

/**
 * Get conversations by user ID
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} userId - User ID to look up
 * @param {number} limit - Maximum number of conversations to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of conversations
 */
export async function getConversationsByUserId(env, userId, limit = 100, offset = 0) {
  const query = `
    SELECT id, user_id, visitor_id, messages, started_at, ended_at, is_qualified, lead_id
    FROM conversations 
    WHERE user_id = ?
    ORDER BY started_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const result = await executeQuery(env, query, [userId, limit, offset]);
  
  if (!result.success) {
    return [];
  }
  
  // Format conversations with camelCase properties and parse JSON
  return result.results.map(convo => ({
    id: convo.id,
    userId: convo.user_id,
    visitorId: convo.visitor_id,
    messages: JSON.parse(convo.messages),
    startedAt: convo.started_at,
    endedAt: convo.ended_at,
    isQualified: Boolean(convo.is_qualified),
    leadId: convo.lead_id
  }));
}

/**
 * Add message to conversation
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} conversationId - Conversation ID
 * @param {Object} message - Message object with role, content, timestamp
 * @returns {Promise<Object>} - Updated conversation or error
 */
export async function addMessageToConversation(env, conversationId, message) {
  // First, get the current conversation
  const getQuery = `
    SELECT id, messages
    FROM conversations 
    WHERE id = ?
  `;
  
  const convoResult = await querySingle(env, getQuery, [conversationId]);
  
  if (!convoResult.success || !convoResult.result) {
    return {
      success: false,
      error: 'Conversation not found'
    };
  }
  
  // Parse current messages
  const messages = JSON.parse(convoResult.result.messages);
  
  // Add new message
  messages.push(message);
  
  // Update conversation
  const updateQuery = `
    UPDATE conversations
    SET messages = ?
    WHERE id = ?
  `;
  
  const updateResult = await executeWrite(env, updateQuery, [
    JSON.stringify(messages),
    conversationId
  ]);
  
  if (!updateResult.success) {
    return {
      success: false,
      error: updateResult.error || 'Failed to update conversation'
    };
  }
  
  // Return updated messages
  return {
    success: true,
    messages: messages
  };
}

/**
 * Create a new lead
 * @param {Object} env - Environment variables including D1 binding
 * @param {Object} lead - Lead data
 * @returns {Promise<Object>} - Created lead ID or error
 */
export async function createLead(env, lead) {
  const query = `
    INSERT INTO leads (user_id, name, email, phone, interest, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const result = await executeWrite(env, query, [
    lead.userId,
    lead.name || '',
    lead.email || '',
    lead.phone || '',
    lead.interest || '',
    lead.status || 'new'
  ]);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to create lead'
    };
  }
  
  return {
    success: true,
    leadId: result.meta.lastRowId
  };
}

/**
 * Create a new conversation
 * @param {Object} env - Environment variables including D1 binding
 * @param {Object} conversation - Conversation data
 * @returns {Promise<Object>} - Created conversation ID or error
 */
export async function createConversation(env, conversation) {
  const query = `
    INSERT INTO conversations (user_id, visitor_id, messages)
    VALUES (?, ?, ?)
  `;
  
  const result = await executeWrite(env, query, [
    conversation.userId,
    conversation.visitorId,
    JSON.stringify(conversation.messages || [])
  ]);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to create conversation'
    };
  }
  
  return {
    success: true,
    conversationId: result.meta.lastRowId
  };
}

/**
 * Log usage for billing and analytics
 * @param {Object} env - Environment variables including D1 binding
 * @param {number} userId - User ID
 * @param {string} action - Action type
 * @param {number} count - Count to increment by
 * @returns {Promise<boolean>} - Success status
 */
export async function logUsage(env, userId, action, count = 1) {
  const query = `
    INSERT INTO usage_logs (user_id, action, count)
    VALUES (?, ?, ?)
  `;
  
  const result = await executeWrite(env, query, [userId, action, count]);
  
  return result.success;
}