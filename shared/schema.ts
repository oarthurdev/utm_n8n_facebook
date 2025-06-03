import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies table (for multi-tenancy)
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
});

// Workflows table (to store N8N workflow definitions)
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // webhook, trigger, poll
  workflowId: text("workflow_id").notNull(),
  status: text("status").notNull().default("inactive"), // active, inactive, error
  config: jsonb("config").notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Integrations table (to store connections to external services)
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // kommo, facebook, n8n
  config: jsonb("config").notNull(),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events table (to log integration events and errors)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // info, warning, error, success
  title: text("title").notNull(),
  description: text("description"),
  source: text("source").notNull(), // kommo, facebook, n8n, system
  metadata: jsonb("metadata"),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// UTM Data table (to store captured UTM parameters)
export const utmData = pgTable("utm_data", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  source: text("source"),
  medium: text("medium"),
  campaign: text("campaign"),
  content: text("content"),
  term: text("term"),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lead Events table (to track lead status changes for Facebook events)
export const leadEvents = pgTable("lead_events", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  eventType: text("event_type").notNull(), // lead_atendido, lead_visita_feita, lead_ganho
  sentToFacebook: boolean("sent_to_facebook").default(false).notNull(),
  errorMessage: text("error_message"),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

// Settings table (for API credentials and configs)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  isSecret: boolean("is_secret").default(false).notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define insert schemas
export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  subdomain: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  companyId: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  name: true,
  type: true,
  workflowId: true,
  config: true,
  status: true,
  companyId: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  name: true,
  type: true,
  config: true,
  status: true,
  companyId: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  type: true,
  title: true,
  description: true,
  source: true,
  metadata: true,
  companyId: true,
});

export const insertUtmDataSchema = createInsertSchema(utmData).pick({
  leadId: true,
  source: true,
  medium: true,
  campaign: true,
  content: true,
  term: true,
  companyId: true,
});

export const insertLeadEventSchema = createInsertSchema(leadEvents).pick({
  leadId: true,
  eventType: true,
  sentToFacebook: true,
  companyId: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  isSecret: true,
  companyId: true,
});

// Define types
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertUtmData = z.infer<typeof insertUtmDataSchema>;
export type UtmData = typeof utmData.$inferSelect;

export type InsertLeadEvent = z.infer<typeof insertLeadEventSchema>;
export type LeadEvent = typeof leadEvents.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
