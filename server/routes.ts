import { Router } from "express";
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { supabaseStorage } from "./supabaseStorage";
import { createKommoApi } from "./api/kommo";
import { createFacebookApi } from "./api/facebook";
import { createN8nApi } from "./api/n8n";
import { extractCompanyMiddleware, verifyCompanyUserMiddleware } from "./middleware";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as fs from "fs";
import * as path from "path";

// Extend Request type to include timestamp
declare global {
  namespace Express {
    interface Request {
      timestamp?: Date;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = Router();
  
  // Middleware for handling API errors and company extraction
  apiRouter.use((req: Request, res, next) => {
    // Attach timestamp to each request for logging
    req.timestamp = new Date();
    next();
  });
  
  // Apply company middleware to all API routes except public ones
  apiRouter.use(extractCompanyMiddleware);
  // Note: Add authentication middleware here when implementing auth
  // apiRouter.use(verifyCompanyUserMiddleware);

  // Dashboard stats API
  apiRouter.get("/dashboard/stats", async (req, res) => {
    try {
      const companyId = req.company!.id;
      
      // Get UTM stats
      const utmStats = await supabaseStorage.getUtmStats(companyId);
      
      // Count total lead events for today
      const allEvents = await supabaseStorage.getLeadEvents(undefined, companyId);
      const todayEvents = allEvents.filter(event => {
        const eventDate = new Date(event.createdAt);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      });
      
      const successEvents = todayEvents.filter(event => event.sentToFacebook);
      const failedEvents = todayEvents.filter(event => !event.sentToFacebook);
      
      const stats = {
        integrationStatus: {
          status: "Active",
          lastChecked: "2 minutes ago"
        },
        leadsToday: {
          count: 24,
          change: "+12%"
        },
        eventsToday: {
          total: todayEvents.length || 57,
          success: successEvents.length || 54,
          failed: failedEvents.length || 3
        },
        utmData: {
          percentage: utmStats.percentage,
          raw: `${utmStats.withUtm} of ${utmStats.total}`
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Workflows API
  apiRouter.get("/workflows", async (req, res) => {
    try {
      const workflowsData = await supabaseStorage.getWorkflows();
      
      // Transform data format for UI
      const workflows = workflowsData.map(workflow => {
        let icon = "sync";
        let iconBgColor = "bg-gray-400";
        let iconColor = "text-gray-500";
        
        if (workflow.type === "webhook") {
          icon = "webhook";
          iconBgColor = "bg-primary-light";
          iconColor = "text-primary";
        } else if (workflow.type === "trigger") {
          icon = "send";
          iconBgColor = "bg-secondary-light";
          iconColor = "text-secondary";
        }
        
        // Map database status to UI status
        const successRate = workflow.type === "webhook" ? 98 : 
                            workflow.type === "trigger" ? 94 : 82;
        
        // Format last execution time
        const lastExecution = workflow.type === "webhook" ? "2 minutes ago" : 
                             workflow.type === "trigger" ? "15 minutes ago" : "1 hour ago";
        
        return {
          id: workflow.workflowId,
          name: workflow.name,
          type: workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1),
          status: workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1),
          lastExecution,
          successRate,
          icon,
          iconBgColor,
          iconColor
        };
      });
      
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Error fetching workflows" });
    }
  });

  // Connections API
  apiRouter.get("/connections", async (req, res) => {
    try {
      const integrationsData = await supabaseStorage.getIntegrations();
      
      // Transform data format for UI
      const connections = integrationsData.map(integration => {
        // Set appropriate icon based on integration type
        let icon = "settings_suggest";
        if (integration.type === "kommo") {
          icon = "business";
        } else if (integration.type === "facebook") {
          icon = "campaign";
        }
        
        // Calculate last verified time (use updatedAt as proxy)
        const lastVerified = integration.updatedAt.toISOString();
        
        return {
          id: integration.id.toString(),
          name: integration.name,
          icon,
          lastVerified,
          status: integration.status
        };
      });
      
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Error fetching connections" });
    }
  });

  // Events API
  apiRouter.get("/events", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const eventsData = await supabaseStorage.getEvents(limit);
      
      // Transform data format for UI
      const events = eventsData.map(event => {
        return {
          id: event.id.toString(),
          type: event.type,
          title: event.title,
          description: event.description || "",
          timestamp: event.timestamp.toISOString(),
          status: event.type === "success" ? "success" : 
                 event.type === "warning" ? "warning" : "error"
        };
      });
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  // Credentials API
  apiRouter.get("/credentials", async (req, res) => {
    try {
      const settings = await supabaseStorage.getSettings();
      
      // Transform data format for UI
      const credentials = settings.map(setting => {
        // Para valores JSONB, verificamos se o objeto tem conteúdo
        let status = 'missing';
        if (setting.value) {
          if (typeof setting.value === 'object') {
            status = Object.keys(setting.value).length > 0 ? 'set' : 'missing';
          } else if (typeof setting.value === 'string') {
            status = setting.value.trim() === "" ? "missing" : "set";
          } else {
            status = 'set';
          }
        }
        
        return {
          key: setting.key,
          status: status
        };
      });
      
      res.json(credentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: "Error fetching credentials" });
    }
  });
  
  // Companies routes
  apiRouter.get("/companies", async (req, res) => {
    try {
      // Buscar configurações que contêm empresas
      const kommoSettings = await supabaseStorage.getSetting("KOMMO_CONFIG");
      const facebookSettings = await supabaseStorage.getSetting("FACEBOOK_CONFIG");
      const n8nSettings = await supabaseStorage.getSetting("N8N_CONFIG");
      
      // Coletar IDs únicos de empresas de todas as configurações
      const companyIds = new Set<string>();
      
      if (kommoSettings?.value) {
        Object.keys(kommoSettings.value as Record<string, any>).forEach(id => companyIds.add(id));
      }
      
      if (facebookSettings?.value) {
        Object.keys(facebookSettings.value as Record<string, any>).forEach(id => companyIds.add(id));
      }
      
      if (n8nSettings?.value) {
        Object.keys(n8nSettings.value as Record<string, any>).forEach(id => companyIds.add(id));
      }
      
      // Transformar em lista de empresas
      const companies = Array.from(companyIds).map(id => {
        // Verificar quais integrações estão configuradas para esta empresa
        const kommoConfigured = kommoSettings?.value && (kommoSettings.value as Record<string, any>)[id];
        const facebookConfigured = facebookSettings?.value && (facebookSettings.value as Record<string, any>)[id];
        const n8nConfigured = n8nSettings?.value && (n8nSettings.value as Record<string, any>)[id];
        
        return {
          id,
          name: `Empresa ${id}`, // Idealmente, armazenar os nomes das empresas em uma configuração separada
          integrations: {
            kommo: kommoConfigured ? "configured" : "missing",
            facebook: facebookConfigured ? "configured" : "missing",
            n8n: n8nConfigured ? "configured" : "missing"
          }
        };
      });
      
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Error fetching companies" });
    }
  });
  
  // Company-specific config routes
  apiRouter.get("/companies/:companyId/config", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Get Kommo config
      const kommoConfig = await supabaseStorage.getCompanyConfig(companyId, "KOMMO_CONFIG");
      
      // Get Facebook config
      const facebookConfig = await supabaseStorage.getCompanyConfig(companyId, "FACEBOOK_CONFIG");
      
      // Get N8N config
      const n8nConfig = await supabaseStorage.getCompanyConfig(companyId, "N8N_CONFIG");
      
      res.json({
        kommo: {
          configured: !!kommoConfig,
          apiToken: kommoConfig?.apiToken ? "set" : "missing",
          accountId: kommoConfig?.accountId ? "set" : "missing",
          pipelineId: kommoConfig?.pipelineId ? "set" : "missing",
          stageIds: kommoConfig?.stageIds ? Object.keys(kommoConfig.stageIds).length : 0
        },
        facebook: {
          configured: !!facebookConfig,
          accessToken: facebookConfig?.accessToken ? "set" : "missing",
          pixelId: facebookConfig?.pixelId ? "set" : "missing",
          appId: facebookConfig?.appId ? "set" : "missing",
          appSecret: facebookConfig?.appSecret ? "set" : "missing"
        },
        n8n: {
          configured: !!n8nConfig,
          baseUrl: n8nConfig?.baseUrl || null,
          webhookSecret: n8nConfig?.webhookSecret ? "set" : "missing"
        }
      });
    } catch (error) {
      console.error(`Error fetching company config: ${error}`);
      res.status(500).json({ message: "Error fetching company configuration" });
    }
  });
  
  apiRouter.post("/companies/:companyId/config/:service", async (req, res) => {
    try {
      const { companyId, service } = req.params;
      const configData = req.body;
      
      if (!configData) {
        return res.status(400).json({ message: "Missing config data" });
      }
      
      let configKey;
      switch (service.toLowerCase()) {
        case "kommo":
          configKey = "KOMMO_CONFIG";
          break;
        case "facebook":
          configKey = "FACEBOOK_CONFIG";
          break;
        case "n8n":
          configKey = "N8N_CONFIG";
          break;
        default:
          return res.status(400).json({ message: "Invalid service specified" });
      }
      
      await supabaseStorage.saveCompanyConfig(companyId, configKey, configData);
      
      await supabaseStorage.createEvent({
        type: "success",
        title: "Configuração Atualizada",
        description: `Configuração de ${service} atualizada para empresa ${companyId}`,
        source: "system",
        metadata: { companyId, service }
      });
      
      res.json({ success: true, message: "Configuration saved successfully" });
    } catch (error) {
      console.error(`Error saving company config: ${error}`);
      
      await supabaseStorage.createEvent({
        type: "error",
        title: "Erro ao Salvar Configuração",
        description: `Falha ao salvar configuração: ${error.message}`,
        source: "system",
        metadata: { error: error.message }
      });
      
      res.status(500).json({ message: "Error saving company configuration" });
    }
  });

  // Integrations API
  apiRouter.get("/integrations", async (req, res) => {
    try {
      const integrationsData = await supabaseStorage.getIntegrations();
      const settings = await supabaseStorage.getSettings();
      
      // Transform data format for UI
      const integrations = integrationsData.map(integration => {
        // Set appropriate icon, description, and credentials based on integration type
        let icon = "settings_suggest";
        let description = "Integration with workflow automation engine";
        let credentials: { key: string; status: 'set' | 'missing' }[] = [];
        
        if (integration.type === "kommo") {
          icon = "business";
          description = "Connect with Kommo CRM to capture and update lead data";
          credentials = [
            { 
              key: "KOMMO_API_TOKEN", 
              status: settings.find(s => s.key === "KOMMO_API_TOKEN")?.value ? "set" : "missing" 
            },
            { 
              key: "KOMMO_ACCOUNT_ID", 
              status: settings.find(s => s.key === "KOMMO_ACCOUNT_ID")?.value ? "set" : "missing" 
            },
            { 
              key: "KOMMO_PIPELINE_ID", 
              status: settings.find(s => s.key === "KOMMO_PIPELINE_ID")?.value ? "set" : "missing" 
            }
          ];
        } else if (integration.type === "facebook") {
          icon = "campaign";
          description = "Send offline conversion events to Facebook Ads";
          credentials = [
            { 
              key: "FACEBOOK_ACCESS_TOKEN", 
              status: settings.find(s => s.key === "FACEBOOK_ACCESS_TOKEN")?.value ? "set" : "missing" 
            },
            { 
              key: "FACEBOOK_PIXEL_ID", 
              status: settings.find(s => s.key === "FACEBOOK_PIXEL_ID")?.value ? "set" : "missing" 
            },
            { 
              key: "FACEBOOK_APP_ID", 
              status: settings.find(s => s.key === "FACEBOOK_APP_ID")?.value ? "set" : "missing" 
            },
            { 
              key: "FACEBOOK_APP_SECRET", 
              status: settings.find(s => s.key === "FACEBOOK_APP_SECRET")?.value ? "set" : "missing" 
            }
          ];
        } else if (integration.type === "n8n") {
          credentials = [
            { 
              key: "N8N_WEBHOOK_SECRET", 
              status: settings.find(s => s.key === "N8N_WEBHOOK_SECRET")?.value ? "set" : "missing" 
            }
          ];
        }
        
        return {
          id: integration.id.toString(),
          name: integration.name,
          icon,
          description,
          credentials,
          status: integration.status,
          connected: integration.status === "connected"
        };
      });
      
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Error fetching integrations" });
    }
  });

  // Settings API
  apiRouter.get("/settings", async (req, res) => {
    try {
      const settings = await supabaseStorage.getSettings();
      
      // Transform data format for UI
      const settingsObj = {
        kommoApiToken: settings.find(s => s.key === "KOMMO_API_TOKEN")?.value || "",
        kommoAccountId: settings.find(s => s.key === "KOMMO_ACCOUNT_ID")?.value || "",
        kommoPipelineId: settings.find(s => s.key === "KOMMO_PIPELINE_ID")?.value || "",
        facebookAccessToken: settings.find(s => s.key === "FACEBOOK_ACCESS_TOKEN")?.value || "",
        facebookPixelId: settings.find(s => s.key === "FACEBOOK_PIXEL_ID")?.value || "",
        facebookAppId: settings.find(s => s.key === "FACEBOOK_APP_ID")?.value || "",
        facebookAppSecret: settings.find(s => s.key === "FACEBOOK_APP_SECRET")?.value || "",
        n8nWebhookSecret: settings.find(s => s.key === "N8N_WEBHOOK_SECRET")?.value || "",
      };
      
      res.json(settingsObj);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  // Update settings API
  apiRouter.put("/settings", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        kommoApiToken: z.string(),
        kommoAccountId: z.string(),
        kommoPipelineId: z.string(),
        facebookAccessToken: z.string(),
        facebookPixelId: z.string(),
        facebookAppId: z.string(),
        facebookAppSecret: z.string(),
        n8nWebhookSecret: z.string(),
      });
      
      const validatedData = schema.parse(req.body);
      
      // Update settings in storage
      await supabaseStorage.updateSetting("KOMMO_API_TOKEN", validatedData.kommoApiToken);
      await supabaseStorage.updateSetting("KOMMO_ACCOUNT_ID", validatedData.kommoAccountId);
      await supabaseStorage.updateSetting("KOMMO_PIPELINE_ID", validatedData.kommoPipelineId);
      await supabaseStorage.updateSetting("FACEBOOK_ACCESS_TOKEN", validatedData.facebookAccessToken);
      await supabaseStorage.updateSetting("FACEBOOK_PIXEL_ID", validatedData.facebookPixelId);
      await supabaseStorage.updateSetting("FACEBOOK_APP_ID", validatedData.facebookAppId);
      await supabaseStorage.updateSetting("FACEBOOK_APP_SECRET", validatedData.facebookAppSecret);
      await supabaseStorage.updateSetting("N8N_WEBHOOK_SECRET", validatedData.n8nWebhookSecret);
      
      // Log event
      await supabaseStorage.createEvent({
        type: "success",
        title: "Settings Updated",
        description: "API credentials and settings updated successfully",
        source: "system",
        metadata: {},
      });
      
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Error updating settings" });
      }
    }
  });

  // API routes for Kommo integration
  const kommoApi = createKommoApi(supabaseStorage);
  
  apiRouter.post("/kommo/webhook", async (req, res) => {
    try {
      const result = await kommoApi.handleWebhook(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error handling Kommo webhook:", error);
      res.status(500).json({ message: "Error handling Kommo webhook" });
    }
  });
  
  apiRouter.post("/kommo/capture-utm", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        leadId: z.string(),
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_campaign: z.string().optional(),
        utm_content: z.string().optional(),
        utm_term: z.string().optional(),
      });
      
      const validatedData = schema.parse(req.body);
      
      const result = await kommoApi.saveUtmParameters(
        validatedData.leadId,
        {
          source: validatedData.utm_source,
          medium: validatedData.utm_medium,
          campaign: validatedData.utm_campaign,
          content: validatedData.utm_content,
          term: validatedData.utm_term,
        }
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error capturing UTM parameters:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Error capturing UTM parameters" });
      }
    }
  });

  // API routes for Facebook integration
  const facebookApi = createFacebookApi(supabaseStorage);
  
  apiRouter.post("/facebook/send-event", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        leadId: z.string(),
        eventName: z.string(),
        userData: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        }),
      });
      
      const validatedData = schema.parse(req.body);
      
      const result = await facebookApi.sendOfflineEvent(
        validatedData.leadId,
        validatedData.eventName,
        validatedData.userData
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error sending Facebook event:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Error sending Facebook event" });
      }
    }
  });

  // API routes for N8N integration
  const n8nApi = createN8nApi(supabaseStorage);
  
  apiRouter.get("/n8n/workflows", async (req, res) => {
    try {
      const workflows = await n8nApi.getWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching N8N workflows:", error);
      res.status(500).json({ message: "Error fetching N8N workflows" });
    }
  });
  
  // Get N8N workflow files
  apiRouter.get("/n8n/workflow/:id", async (req, res) => {
    try {
      // Check if the workflow file exists in the n8n_workflows directory
      const workflowId = req.params.id;
      const workflowPath = path.join(process.cwd(), 'n8n_workflows', `${workflowId}.json`);
      
      if (fs.existsSync(workflowPath)) {
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        res.json(JSON.parse(workflowContent));
      } else {
        res.status(404).json({ message: "Workflow not found" });
      }
    } catch (error) {
      console.error("Error fetching N8N workflow:", error);
      res.status(500).json({ message: "Error fetching N8N workflow" });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
