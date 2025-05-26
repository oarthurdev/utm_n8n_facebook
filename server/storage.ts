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

// Interface for all storage operations with multi-company support
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyBySubdomain(subdomain: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;

  // Workflow operations
  getWorkflows(companyId?: string): Promise<Workflow[]>;
  getWorkflow(id: number, companyId?: string): Promise<Workflow | undefined>;
  getWorkflowByWorkflowId(workflowId: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;

  // Integration operations
  getIntegrations(companyId?: string): Promise<Integration[]>;
  getIntegration(id: number, companyId?: string): Promise<Integration | undefined>;
  getIntegrationByType(type: string, companyId?: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;

  // Event operations
  getEvents(limit?: number, companyId?: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // UTM data operations
  getUtmDataByLeadId(leadId: string, companyId?: string): Promise<UtmData | undefined>;
  createUtmData(utmData: InsertUtmData): Promise<UtmData>;
  getUtmStats(companyId?: string): Promise<{ total: number; withUtm: number; percentage: number }>;

  // Lead event operations
  getLeadEvents(limit?: number, companyId?: string): Promise<LeadEvent[]>;
  getLeadEventsByLeadId(leadId: string, companyId?: string): Promise<LeadEvent[]>;
  getUnsentLeadEvents(companyId?: string): Promise<LeadEvent[]>;
  createLeadEvent(leadEvent: InsertLeadEvent): Promise<LeadEvent>;
  markLeadEventAsSent(id: number, sentAt: Date): Promise<LeadEvent | undefined>;
  markLeadEventAsError(id: number, errorMessage: string): Promise<LeadEvent | undefined>;

  // Settings operations
  getSettings(companyId?: string): Promise<Setting[]>;
  getSetting(key: string, companyId?: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: any, companyId?: string): Promise<Setting | undefined>;
  getApiCredentials(companyId?: string): Promise<Record<string, any>>;

  // Multi-company operations
  getCompanyConfig(companyId: string, configKey: string): Promise<any | null>;
  saveCompanyConfig(companyId: string, configKey: string, configValue: any): Promise<boolean>;

  // Seed data
  seedSampleData(): Promise<void>;
}