import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (Healthcare Providers / Admins)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  companyName: text("company_name").notNull(),
  websiteUrl: text("website_url").notNull(),
  role: text("role").notNull().default("provider"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider Profiles (generated from website scanning)
export const providerProfiles = pgTable("provider_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  services: jsonb("services").notNull(),
  locations: jsonb("locations").notNull(),
  insurance: jsonb("insurance").notNull(),
  intake: text("intake"),
  contact: jsonb("contact").notNull(),
  lastScanned: timestamp("last_scanned"),
  rawContent: text("raw_content"),
  customRules: jsonb("custom_rules").default('{}'),
});

// Chat Widget Settings
export const widgetSettings = pgTable("widget_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  primaryColor: text("primary_color").notNull().default("#4F46E5"),
  secondaryColor: text("secondary_color").notNull().default("#14B8A6"),
  fontFamily: text("font_family").notNull().default("Inter, sans-serif"),
  position: text("position").notNull().default("bottom-right"),
  greeting: text("greeting").notNull().default("👋 Hi there! How can I help you today?"),
  logoUrl: text("logo_url"),
  botName: text("bot_name").notNull().default("Assistant"),
  showBranding: boolean("show_branding").notNull().default(true),
});

// Leads (qualified visitors from chat)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  interest: text("interest"),
  conversation: jsonb("conversation"),
  status: text("status").notNull().default("new"),
  qualifiedAt: timestamp("qualified_at").defaultNow(),
  followedUpAt: timestamp("followed_up_at"),
});

// Chat Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  visitorId: text("visitor_id").notNull(),
  messages: jsonb("messages").notNull().default([]),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  isQualified: boolean("is_qualified").notNull().default(false),
  leadId: integer("lead_id").references(() => leads.id),
});

// Define insert schemas and types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  companyName: true,
  websiteUrl: true,
  role: true,
});

export const insertProviderProfileSchema = createInsertSchema(providerProfiles).omit({
  id: true,
});

export const insertWidgetSettingsSchema = createInsertSchema(widgetSettings).omit({
  id: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  qualifiedAt: true,
  followedUpAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = z.infer<typeof insertProviderProfileSchema>;

export type WidgetSettings = typeof widgetSettings.$inferSelect;
export type InsertWidgetSettings = z.infer<typeof insertWidgetSettingsSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

// Message type for structured conversation storage
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};
