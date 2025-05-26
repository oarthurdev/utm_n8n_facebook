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

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  getWorkflowByWorkflowId(workflowId: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;

  // Integration operations
  getIntegrations(): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationByType(type: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;

  // Event operations
  getEvents(limit?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // UTM data operations
  getUtmDataByLeadId(leadId: string): Promise<UtmData | undefined>;
  createUtmData(utmData: InsertUtmData): Promise<UtmData>;
  getUtmStats(): Promise<{ total: number; withUtm: number; percentage: number }>;

  // Lead event operations
  getLeadEvents(limit?: number): Promise<LeadEvent[]>;
  getLeadEventsByLeadId(leadId: string): Promise<LeadEvent[]>;
  getUnsentLeadEvents(): Promise<LeadEvent[]>;
  createLeadEvent(leadEvent: InsertLeadEvent): Promise<LeadEvent>;
  markLeadEventAsSent(id: number, sentAt: Date): Promise<LeadEvent | undefined>;
  markLeadEventAsError(id: number, errorMessage: string): Promise<LeadEvent | undefined>;

  // Settings operations
  getSettings(companyId: string): Promise<Setting[]>;
  getSetting(key: string, companyId: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: any, companyId: string): Promise<Setting | undefined>;
  getApiCredentials(companyId: string): Promise<Record<string, any>>;
  
  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyBySubdomain(subdomain: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Multi-company operations
  getCompanyConfig(companyId: string, configKey: string): Promise<any | null>;
  saveCompanyConfig(companyId: string, configKey: string, configValue: any): Promise<boolean>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private integrations: Map<number, Integration>;
  private events: Map<number, Event>;
  private utmData: Map<number, UtmData>;
  private leadEvents: Map<number, LeadEvent>;
  private settings: Map<number, Setting>;
  
  private userIdCounter: number;
  private workflowIdCounter: number;
  private integrationIdCounter: number;
  private eventIdCounter: number;
  private utmDataIdCounter: number;
  private leadEventIdCounter: number;
  private settingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.integrations = new Map();
    this.events = new Map();
    this.utmData = new Map();
    this.leadEvents = new Map();
    this.settings = new Map();
    
    this.userIdCounter = 1;
    this.workflowIdCounter = 1;
    this.integrationIdCounter = 1;
    this.eventIdCounter = 1;
    this.utmDataIdCounter = 1;
    this.leadEventIdCounter = 1;
    this.settingIdCounter = 1;
    
    // Initialize with default data
    this.initDefaultData();
  }

  private initDefaultData() {
    // Create sample workflows
    this.createWorkflow({
      name: "Capture UTM Parameters",
      type: "webhook",
      workflowId: "webhook_capture_utm",
      status: "active",
      config: {},
    });
    
    this.createWorkflow({
      name: "Send Offline Events to Facebook",
      type: "trigger",
      workflowId: "trigger_event_send_facebook",
      status: "active",
      config: {},
    });
    
    this.createWorkflow({
      name: "Pipeline Progress Tracker",
      type: "poll",
      workflowId: "monitor_pipeline_changes",
      status: "needs attention",
      config: {},
    });
    
    // Create sample integrations
    this.createIntegration({
      name: "Kommo CRM",
      type: "kommo",
      status: "connected",
      config: {},
    });
    
    this.createIntegration({
      name: "N8N Workflow Engine",
      type: "n8n",
      status: "connected",
      config: {},
    });
    
    this.createIntegration({
      name: "Facebook Ads API",
      type: "facebook",
      status: "connected",
      config: {},
    });
    
    // Create sample events
    this.createEvent({
      type: "success",
      title: "Lead Captured",
      description: "UTM parameters saved for lead <span class=\"font-medium\">João Silva</span>",
      source: "kommo",
      metadata: {},
    });
    
    this.createEvent({
      type: "success",
      title: "Event Sent to Facebook",
      description: "Event <span class=\"font-medium\">lead_atendido</span> for lead <span class=\"font-medium\">Ana Pereira</span>",
      source: "facebook",
      metadata: {},
    });
    
    this.createEvent({
      type: "warning",
      title: "Facebook API Warning",
      description: "Rate limit approaching - <span class=\"font-medium\">80%</span> of quota used",
      source: "facebook",
      metadata: {},
    });
    
    this.createEvent({
      type: "error",
      title: "Event Delivery Failed",
      description: "Failed to send <span class=\"font-medium\">lead_visita_feita</span> for lead <span class=\"font-medium\">Carlos Mendes</span>",
      source: "facebook",
      metadata: {},
    });
    
    this.createEvent({
      type: "success",
      title: "Lead Status Changed",
      description: "Lead <span class=\"font-medium\">Maria Santos</span> moved to <span class=\"font-medium\">Visita</span> stage",
      source: "kommo",
      metadata: {},
    });
    
    // Create sample settings
    this.createSetting({
      key: "KOMMO_API_TOKEN",
      value: "sample_kommo_token",
      isSecret: true,
    });
    
    this.createSetting({
      key: "KOMMO_ACCOUNT_ID",
      value: "12345",
      isSecret: false,
    });
    
    this.createSetting({
      key: "KOMMO_PIPELINE_ID",
      value: "67890",
      isSecret: false,
    });
    
    this.createSetting({
      key: "KOMMO_STAGE_IDS",
      value: JSON.stringify({ atendimento: "1", visita: "2", ganho: "3" }),
      isSecret: false,
    });
    
    this.createSetting({
      key: "FACEBOOK_ACCESS_TOKEN",
      value: "sample_facebook_token",
      isSecret: true,
    });
    
    this.createSetting({
      key: "FACEBOOK_PIXEL_ID",
      value: "123456789012345",
      isSecret: false,
    });
    
    this.createSetting({
      key: "FACEBOOK_APP_ID",
      value: "987654321",
      isSecret: false,
    });
    
    this.createSetting({
      key: "FACEBOOK_APP_SECRET",
      value: "",
      isSecret: true,
    });
    
    this.createSetting({
      key: "N8N_WEBHOOK_SECRET",
      value: "sample_n8n_secret",
      isSecret: true,
    });
    
    // Create sample UTM data (100 total, 89 with UTM data)
    for (let i = 1; i <= 100; i++) {
      const leadId = `lead_${i}`;
      if (i <= 89) {
        this.createUtmData({
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
      
      this.createLeadEvent({
        leadId,
        eventType,
        sentToFacebook,
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Workflow operations
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).sort((a, b) => b.id - a.id);
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getWorkflowByWorkflowId(workflowId: string): Promise<Workflow | undefined> {
    return Array.from(this.workflows.values()).find(workflow => workflow.workflowId === workflowId);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowIdCounter++;
    const now = new Date();
    const workflow: Workflow = { 
      ...insertWorkflow, 
      id, 
      createdAt: now, 
      updatedAt: now,
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow: Workflow = { 
      ...workflow, 
      ...updates, 
      updatedAt: new Date(),
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Integration operations
  async getIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values()).sort((a, b) => a.id - b.id);
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }

  async getIntegrationByType(type: string): Promise<Integration | undefined> {
    return Array.from(this.integrations.values()).find(integration => integration.type === type);
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const id = this.integrationIdCounter++;
    const now = new Date();
    const integration: Integration = { 
      ...insertIntegration, 
      id, 
      createdAt: now, 
      updatedAt: now,
    };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: number, updates: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration: Integration = { 
      ...integration, 
      ...updates, 
      updatedAt: new Date(),
    };
    this.integrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async deleteIntegration(id: number): Promise<boolean> {
    return this.integrations.delete(id);
  }

  // Event operations
  async getEvents(limit?: number): Promise<Event[]> {
    const events = Array.from(this.events.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (limit) {
      return events.slice(0, limit);
    }
    
    return events;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const now = new Date();
    const event: Event = { 
      ...insertEvent, 
      id, 
      timestamp: now,
    };
    this.events.set(id, event);
    return event;
  }

  // UTM data operations
  async getUtmDataByLeadId(leadId: string): Promise<UtmData | undefined> {
    return Array.from(this.utmData.values()).find(data => data.leadId === leadId);
  }

  async createUtmData(insertUtmData: InsertUtmData): Promise<UtmData> {
    const id = this.utmDataIdCounter++;
    const now = new Date();
    const utmData: UtmData = { 
      ...insertUtmData, 
      id, 
      createdAt: now,
    };
    this.utmData.set(id, utmData);
    return utmData;
  }

  async getUtmStats(): Promise<{ total: number; withUtm: number; percentage: number }> {
    const total = 100; // Mocked total number of leads
    const withUtm = 89;  // Mocked number of leads with UTM data
    const percentage = Math.round((withUtm / total) * 100);
    
    return { total, withUtm, percentage };
  }

  // Lead event operations
  async getLeadEvents(limit?: number): Promise<LeadEvent[]> {
    const events = Array.from(this.leadEvents.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (limit) {
      return events.slice(0, limit);
    }
    
    return events;
  }

  async getLeadEventsByLeadId(leadId: string): Promise<LeadEvent[]> {
    return Array.from(this.leadEvents.values())
      .filter(event => event.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnsentLeadEvents(): Promise<LeadEvent[]> {
    return Array.from(this.leadEvents.values())
      .filter(event => !event.sentToFacebook)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createLeadEvent(insertLeadEvent: InsertLeadEvent): Promise<LeadEvent> {
    const id = this.leadEventIdCounter++;
    const now = new Date();
    const leadEvent: LeadEvent = { 
      ...insertLeadEvent, 
      id, 
      createdAt: now,
      errorMessage: null,
      sentAt: insertLeadEvent.sentToFacebook ? now : null,
    };
    this.leadEvents.set(id, leadEvent);
    return leadEvent;
  }

  async markLeadEventAsSent(id: number, sentAt: Date): Promise<LeadEvent | undefined> {
    const leadEvent = this.leadEvents.get(id);
    if (!leadEvent) return undefined;
    
    const updatedLeadEvent: LeadEvent = { 
      ...leadEvent, 
      sentToFacebook: true,
      sentAt,
      errorMessage: null,
    };
    this.leadEvents.set(id, updatedLeadEvent);
    return updatedLeadEvent;
  }

  async markLeadEventAsError(id: number, errorMessage: string): Promise<LeadEvent | undefined> {
    const leadEvent = this.leadEvents.get(id);
    if (!leadEvent) return undefined;
    
    const updatedLeadEvent: LeadEvent = { 
      ...leadEvent, 
      sentToFacebook: false,
      errorMessage,
    };
    this.leadEvents.set(id, updatedLeadEvent);
    return updatedLeadEvent;
  }

  // Settings operations
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.key === key);
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const id = this.settingIdCounter++;
    const now = new Date();
    const setting: Setting = { 
      ...insertSetting, 
      id, 
      updatedAt: now,
    };
    this.settings.set(id, setting);
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const setting = Array.from(this.settings.values()).find(s => s.key === key);
    if (!setting) return undefined;
    
    const updatedSetting: Setting = { 
      ...setting, 
      value,
      updatedAt: new Date(),
    };
    this.settings.set(setting.id, updatedSetting);
    return updatedSetting;
  }

  async getApiCredentials(): Promise<Record<string, any>> {
    const settings = await this.getSettings();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }
  
  async getCompanyConfig(companyId: string, configKey: string): Promise<any | null> {
    const setting = await this.getSetting(configKey);
    if (!setting || !setting.value) return null;
    
    // O valor é um objeto com múltiplas empresas
    const companies = setting.value as Record<string, any>;
    return companies[companyId] || null;
  }
  
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
}

export const storage = new MemStorage();
