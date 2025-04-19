-- Initial database schema for HealthChat SaaS Platform
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  company_name TEXT NOT NULL,
  website_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider Profiles Table
CREATE TABLE IF NOT EXISTS provider_profiles (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  services TEXT NOT NULL, -- JSON array
  locations TEXT NOT NULL, -- JSON array of objects with name, address, serviceArea
  insurance TEXT NOT NULL, -- JSON array
  intake TEXT,
  contact TEXT NOT NULL, -- JSON object with phone, email, hours
  last_scanned TIMESTAMP,
  raw_content TEXT,
  custom_rules TEXT, -- JSON object for custom rules
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Widget Settings Table
CREATE TABLE IF NOT EXISTS widget_settings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#FFFFFF',
  font_family TEXT DEFAULT 'Inter, sans-serif',
  position TEXT DEFAULT 'bottom-right',
  greeting TEXT DEFAULT 'Hello! How can I help you today?',
  logo_url TEXT,
  bot_name TEXT DEFAULT 'Healthcare Assistant',
  show_branding BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  interest TEXT,
  status TEXT DEFAULT 'new',
  qualified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  followed_up_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  messages TEXT NOT NULL, -- JSON array of message objects
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  is_qualified BOOLEAN DEFAULT FALSE,
  lead_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  external_id TEXT, -- For Stripe or other payment processor reference
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Usage Logs Table (for billing and analytics)
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX idx_provider_profiles_user_id ON provider_profiles(user_id);
CREATE INDEX idx_widget_settings_user_id ON widget_settings(user_id);
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);