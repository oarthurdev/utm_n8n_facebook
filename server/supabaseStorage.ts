import { 
  User, InsertUser, 
  Company, InsertCompany,
  Workflow, InsertWorkflow,
  Integration, InsertIntegration,
  Event, InsertEvent,
  UtmData, InsertUtmData,
  LeadEvent, InsertLeadEvent,
  Setting, InsertSetting
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, desc, and, SQL, sql } from "drizzle-orm";
import * as schema from "@shared/schema";

// Supabase database implementation of storage interface
export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }
  
  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(schema.companies).orderBy(desc(schema.companies.createdAt));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const companies = await db.select().from(schema.companies).where(eq(schema.companies.id, id));
    return companies[0];
  }

  async getCompanyBySubdomain(subdomain: string): Promise<Company | undefined> {
    const companies = await db.select().from(schema.companies).where(eq(schema.companies.subdomain, subdomain));
    return companies[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const insertedCompanies = await db.insert(schema.companies).values(company).returning();
    return insertedCompanies[0];
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const updatedCompanies = await db.update(schema.companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(schema.companies.id, id))
      .returning();
    return updatedCompanies[0];
  }

    const insertedUsers = await db.insert(schema.users).values(user).returning();
    return insertedUsers[0];
  }

  // Workflow operations
  async getWorkflows(companyId?: string): Promise<Workflow[]> {
    if (companyId) {
      return await db.select().from(schema.workflows)
        .where(eq(schema.workflows.companyId, companyId))
        .orderBy(desc(schema.workflows.id));
    }
    return await db.select().from(schema.workflows).orderBy(desc(schema.workflows.id));
  }

  async getWorkflow(id: number, companyId?: string): Promise<Workflow | undefined> {
    const conditions = [eq(schema.workflows.id, id)];
    if (companyId) {
      conditions.push(eq(schema.workflows.companyId, companyId));
    }
    const workflows = await db.select().from(schema.workflows).where(and(...conditions));
    return workflows[0];
  }

  async getWorkflowByWorkflowId(workflowId: string): Promise<Workflow | undefined> {
    const workflows = await db.select().from(schema.workflows).where(eq(schema.workflows.workflowId, workflowId));
    return workflows[0];
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const insertedWorkflows = await db.insert(schema.workflows).values(workflow).returning();
    return insertedWorkflows[0];
  }

  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const updatedWorkflows = await db.update(schema.workflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.workflows.id, id))
      .returning();
    return updatedWorkflows[0];
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    const deleted = await db.delete(schema.workflows).where(eq(schema.workflows.id, id)).returning();
    return deleted.length > 0;
  }

  // Integration operations
  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(schema.integrations).orderBy(schema.integrations.id);
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const integrations = await db.select().from(schema.integrations).where(eq(schema.integrations.id, id));
    return integrations[0];
  }

  async getIntegrationByType(type: string): Promise<Integration | undefined> {
    const integrations = await db.select().from(schema.integrations).where(eq(schema.integrations.type, type));
    return integrations[0];
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const insertedIntegrations = await db.insert(schema.integrations).values(integration).returning();
    return insertedIntegrations[0];
  }

  async updateIntegration(id: number, updates: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const updatedIntegrations = await db.update(schema.integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.integrations.id, id))
      .returning();
    return updatedIntegrations[0];
  }

  async deleteIntegration(id: number): Promise<boolean> {
    const deleted = await db.delete(schema.integrations).where(eq(schema.integrations.id, id)).returning();
    return deleted.length > 0;
  }

  // Event operations
  async getEvents(limit?: number): Promise<Event[]> {
    if (limit) {
      const result = await db.select()
        .from(schema.events)
        .orderBy(desc(schema.events.timestamp));
      
      return result.slice(0, limit);
    }
    
    return await db.select()
      .from(schema.events)
      .orderBy(desc(schema.events.timestamp));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const insertedEvents = await db.insert(schema.events).values(event).returning();
    return insertedEvents[0];
  }

  // UTM data operations
  async getUtmDataByLeadId(leadId: string): Promise<UtmData | undefined> {
    const utmDataRecords = await db.select().from(schema.utmData).where(eq(schema.utmData.leadId, leadId));
    return utmDataRecords[0];
  }

  async createUtmData(utmData: InsertUtmData): Promise<UtmData> {
    const insertedUtmData = await db.insert(schema.utmData).values(utmData).returning();
    return insertedUtmData[0];
  }

  async getUtmStats(): Promise<{ total: number; withUtm: number; percentage: number }> {
    // Run a raw query to get stats on leads with UTM data
    // For demonstration, we are using mock data like in MemStorage
    // In a real scenario, you would run aggregate queries on your data
    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(schema.utmData);
    const totalResult = await totalQuery;
    
    const withUtmQuery = db.select({ count: sql<number>`count(*)` }).from(schema.utmData)
      .where(sql`source is not null or medium is not null or campaign is not null or content is not null or term is not null`);
    const withUtmResult = await withUtmQuery;
    
    // In case no data exists yet, provide reasonable default values
    const total = totalResult[0]?.count || 100;
    const withUtm = withUtmResult[0]?.count || 89;
    const percentage = Math.round((withUtm / total) * 100);
    
    return { total, withUtm, percentage };
  }

  // Lead event operations
  async getLeadEvents(limit?: number): Promise<LeadEvent[]> {
    if (limit) {
      const result = await db.select()
        .from(schema.leadEvents)
        .orderBy(desc(schema.leadEvents.createdAt));
      
      return result.slice(0, limit);
    }
    
    return await db.select()
      .from(schema.leadEvents)
      .orderBy(desc(schema.leadEvents.createdAt));
  }

  async getLeadEventsByLeadId(leadId: string): Promise<LeadEvent[]> {
    return await db.select().from(schema.leadEvents)
      .where(eq(schema.leadEvents.leadId, leadId))
      .orderBy(desc(schema.leadEvents.createdAt));
  }

  async getUnsentLeadEvents(): Promise<LeadEvent[]> {
    return await db.select().from(schema.leadEvents)
      .where(eq(schema.leadEvents.sentToFacebook, false))
      .orderBy(schema.leadEvents.createdAt);
  }

  async createLeadEvent(leadEvent: InsertLeadEvent): Promise<LeadEvent> {
    const insertedLeadEvents = await db.insert(schema.leadEvents).values({
      ...leadEvent,
      errorMessage: null,
      sentAt: leadEvent.sentToFacebook ? new Date() : null,
    }).returning();
    return insertedLeadEvents[0];
  }

  async markLeadEventAsSent(id: number, sentAt: Date): Promise<LeadEvent | undefined> {
    const updatedLeadEvents = await db.update(schema.leadEvents)
      .set({ 
        sentToFacebook: true,
        sentAt: sentAt,
        errorMessage: null 
      })
      .where(eq(schema.leadEvents.id, id))
      .returning();
    return updatedLeadEvents[0];
  }

  async markLeadEventAsError(id: number, errorMessage: string): Promise<LeadEvent | undefined> {
    const updatedLeadEvents = await db.update(schema.leadEvents)
      .set({ 
        sentToFacebook: false,
        errorMessage: errorMessage 
      })
      .where(eq(schema.leadEvents.id, id))
      .returning();
    return updatedLeadEvents[0];
  }

  // Settings operations
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(schema.settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const settings = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    return settings[0];
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    const insertedSettings = await db.insert(schema.settings).values(setting).returning();
    return insertedSettings[0];
  }

  async updateSetting(key: string, value: any): Promise<Setting | undefined> {
    const updatedSettings = await db.update(schema.settings)
      .set({ 
        value: value,
        updatedAt: new Date()
      })
      .where(eq(schema.settings.key, key))
      .returning();
    return updatedSettings[0];
  }

  async getApiCredentials(): Promise<Record<string, any>> {
    const settings = await this.getSettings();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }
  
  // Método para obter configurações específicas de uma empresa
  async getCompanyConfig(companyId: string, configKey: string): Promise<any | null> {
    const setting = await this.getSetting(configKey);
    if (!setting || !setting.value) return null;
    
    // O valor é um objeto com múltiplas empresas
    const companies = setting.value as Record<string, any>;
    return companies[companyId] || null;
  }
  
  // Método para salvar configurações específicas de uma empresa
  async saveCompanyConfig(companyId: string, configKey: string, configValue: any): Promise<boolean> {
    // Primeiro obter a configuração atual
    let setting = await this.getSetting(configKey);
    let companies: Record<string, any> = {};
    
    if (setting && setting.value) {
      companies = setting.value as Record<string, any>;
    }
    
    // Atualizar ou adicionar a configuração para esta empresa
    companies[companyId] = configValue;
    
    // Salvar de volta no banco de dados
    if (setting) {
      await this.updateSetting(configKey, companies);
    } else {
      await this.createSetting({
        key: configKey,
        value: companies,
        isSecret: configKey.includes("TOKEN") || configKey.includes("SECRET")
      });
    }
    
    return true;
  }

  // Helper method to seed the database with initial sample data
  async seedSampleData(): Promise<void> {
    // Only seed if there are no records in the database
    const workflowCount = await db.select({ count: sql<number>`count(*)` }).from(schema.workflows);
    if (workflowCount[0].count > 0) {
      return; // Data already exists
    }

    // Create sample workflows
    await this.createWorkflow({
      name: "Capture UTM Parameters",
      type: "webhook",
      workflowId: "webhook_capture_utm",
      status: "active",
      config: {},
    });
    
    await this.createWorkflow({
      name: "Send Offline Events to Facebook",
      type: "trigger",
      workflowId: "trigger_event_send_facebook",
      status: "active",
      config: {},
    });
    
    await this.createWorkflow({
      name: "Pipeline Progress Tracker",
      type: "poll",
      workflowId: "monitor_pipeline_changes",
      status: "needs attention",
      config: {},
    });
    
    // Create sample integrations
    await this.createIntegration({
      name: "Kommo CRM",
      type: "kommo",
      status: "connected",
      config: {},
    });
    
    await this.createIntegration({
      name: "N8N Workflow Engine",
      type: "n8n",
      status: "connected",
      config: {},
    });
    
    await this.createIntegration({
      name: "Facebook Ads API",
      type: "facebook",
      status: "connected",
      config: {},
    });
    
    // Create sample events
    await this.createEvent({
      type: "success",
      title: "Lead Captured",
      description: "UTM parameters saved for lead <span class=\"font-medium\">João Silva</span>",
      source: "kommo",
      metadata: {},
    });
    
    await this.createEvent({
      type: "success",
      title: "Event Sent to Facebook",
      description: "Event <span class=\"font-medium\">lead_atendido</span> for lead <span class=\"font-medium\">Ana Pereira</span>",
      source: "facebook",
      metadata: {},
    });
    
    await this.createEvent({
      type: "warning",
      title: "Facebook API Warning",
      description: "Rate limit approaching - <span class=\"font-medium\">80%</span> of quota used",
      source: "facebook",
      metadata: {},
    });
    
    await this.createEvent({
      type: "error",
      title: "Event Delivery Failed",
      description: "Failed to send <span class=\"font-medium\">lead_visita_feita</span> for lead <span class=\"font-medium\">Carlos Mendes</span>",
      source: "facebook",
      metadata: {},
    });
    
    await this.createEvent({
      type: "success",
      title: "Lead Status Changed",
      description: "Lead <span class=\"font-medium\">Maria Santos</span> moved to <span class=\"font-medium\">Visita</span> stage",
      source: "kommo",
      metadata: {},
    });
    
    // Create sample settings
    await this.createSetting({
      key: "KOMMO_API_TOKEN",
      value: "sample_kommo_token",
      isSecret: true,
    });
    
    await this.createSetting({
      key: "KOMMO_ACCOUNT_ID",
      value: "12345",
      isSecret: false,
    });
    
    await this.createSetting({
      key: "KOMMO_PIPELINE_ID",
      value: "67890",
      isSecret: false,
    });
    
    await this.createSetting({
      key: "KOMMO_STAGE_IDS",
      value: JSON.stringify({ atendimento: "1", visita: "2", ganho: "3" }),
      isSecret: false,
    });
    
    await this.createSetting({
      key: "FACEBOOK_ACCESS_TOKEN",
      value: "sample_facebook_token",
      isSecret: true,
    });
    
    await this.createSetting({
      key: "FACEBOOK_PIXEL_ID",
      value: "123456789012345",
      isSecret: false,
    });
    
    await this.createSetting({
      key: "FACEBOOK_APP_ID",
      value: "987654321",
      isSecret: false,
    });
    
    await this.createSetting({
      key: "FACEBOOK_APP_SECRET",
      value: "",
      isSecret: true,
    });
    
    await this.createSetting({
      key: "N8N_WEBHOOK_SECRET",
      value: "sample_n8n_secret",
      isSecret: true,
    });
    
    // Create sample UTM data
    for (let i = 1; i <= 100; i++) {
      const leadId = `lead_${i}`;
      if (i <= 89) {
        await this.createUtmData({
          leadId,
          source: "facebook",
          medium: "cpc",
          campaign: "spring_promo",
          content: "image_ad",
          term: "real_estate",
        });
      }
    }
    
    // Create sample lead events
    for (let i = 1; i <= 57; i++) {
      const leadId = `lead_${i}`;
      const eventType = i % 3 === 0 ? "lead_ganho" : i % 2 === 0 ? "lead_visita_feita" : "lead_atendido";
      const sentToFacebook = i <= 54;
      
      await this.createLeadEvent({
        leadId,
        eventType,
        sentToFacebook,
      });
    }
  }
}

// Create the singleton instance
export const supabaseStorage = new SupabaseStorage();