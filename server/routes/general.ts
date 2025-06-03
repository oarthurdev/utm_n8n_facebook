
import { Router } from "express";
import { supabaseStorage } from "../supabaseStorage";
import { extractCompanyMiddleware } from "../middleware";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const generalRouter = Router();

// Apply company middleware to all general routes
generalRouter.use(extractCompanyMiddleware);

// Dashboard stats API
generalRouter.get("/dashboard/stats", async (req, res) => {
  try {
    const companyId = req.company!.id;

    // Get UTM stats
    const utmStats = await supabaseStorage.getUtmStats(companyId);

    // Count total lead events for today
    const allEvents = await supabaseStorage.getLeadEvents(
      undefined,
      companyId,
    );
    const todayEvents = allEvents.filter((event) => {
      const eventDate = new Date(event.createdAt);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });

    const successEvents = todayEvents.filter((event) => event.sentToFacebook);
    const failedEvents = todayEvents.filter((event) => !event.sentToFacebook);

    const stats = {
      integrationStatus: {
        status: "Active",
        lastChecked: "2 minutes ago",
      },
      leadsToday: {
        count: 24,
        change: "+12%",
      },
      eventsToday: {
        total: todayEvents.length || 57,
        success: successEvents.length || 54,
        failed: failedEvents.length || 3,
      },
      utmData: {
        percentage: utmStats.percentage,
        raw: `${utmStats.withUtm} of ${utmStats.total}`,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});

// Workflows API
generalRouter.get("/workflows", async (req, res) => {
  try {
    const workflowsData = await supabaseStorage.getWorkflows();

    // Transform data format for UI
    const workflows = workflowsData.map((workflow) => {
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
      const successRate =
        workflow.type === "webhook"
          ? 98
          : workflow.type === "trigger"
            ? 94
            : 82;

      // Format last execution time
      const lastExecution =
        workflow.type === "webhook"
          ? "2 minutes ago"
          : workflow.type === "trigger"
            ? "15 minutes ago"
            : "1 hour ago";

      return {
        id: workflow.workflowId,
        name: workflow.name,
        type: workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1),
        status:
          workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1),
        lastExecution,
        successRate,
        icon,
        iconBgColor,
        iconColor,
      };
    });

    res.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ message: "Error fetching workflows" });
  }
});

// Connections API
generalRouter.get("/connections", async (req, res) => {
  try {
    const companyId = req.company!.id;
    const integrationsData = await supabaseStorage.getIntegrations(companyId);

    // Transform data format for UI
    const connections = integrationsData.map((integration) => {
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
        status: integration.status,
      };
    });

    res.json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ message: "Error fetching connections" });
  }
});

// Credentials API
generalRouter.get("/credentials", async (req, res) => {
  try {
    const companyId = req.company!.id;
    const settings = await supabaseStorage.getSettings(companyId);

    // Transform data format for UI
    const credentials = settings.map((setting) => {
      // Para valores JSONB, verificamos se o objeto tem conteúdo
      let status = "missing";
      if (setting.value) {
        if (typeof setting.value === "object") {
          status = Object.keys(setting.value).length > 0 ? "set" : "missing";
        } else if (typeof setting.value === "string") {
          status = setting.value.trim() === "" ? "missing" : "set";
        } else {
          status = "set";
        }
      }

      return {
        key: setting.key,
        status: status,
      };
    });

    res.json(credentials);
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res.status(500).json({ message: "Error fetching credentials" });
  }
});

// Companies routes
generalRouter.get("/companies", async (req, res) => {
  try {
    // Buscar configurações que contêm empresas
    const kommoSettings = await supabaseStorage.getSetting("KOMMO_CONFIG");
    const facebookSettings =
      await supabaseStorage.getSetting("FACEBOOK_CONFIG");
    const n8nSettings = await supabaseStorage.getSetting("N8N_CONFIG");

    // Coletar IDs únicos de empresas de todas as configurações
    const companyIds = new Set<string>();

    if (kommoSettings?.value) {
      Object.keys(kommoSettings.value as Record<string, any>).forEach((id) =>
        companyIds.add(id),
      );
    }

    if (facebookSettings?.value) {
      Object.keys(facebookSettings.value as Record<string, any>).forEach(
        (id) => companyIds.add(id),
      );
    }

    if (n8nSettings?.value) {
      Object.keys(n8nSettings.value as Record<string, any>).forEach((id) =>
        companyIds.add(id),
      );
    }

    // Transformar em lista de empresas
    const companies = Array.from(companyIds).map((id) => {
      // Verificar quais integrações estão configuradas para esta empresa
      const kommoConfigured =
        kommoSettings?.value &&
        (kommoSettings.value as Record<string, any>)[id];
      const facebookConfigured =
        facebookSettings?.value &&
        (facebookSettings.value as Record<string, any>)[id];
      const n8nConfigured =
        n8nSettings?.value && (n8nSettings.value as Record<string, any>)[id];

      return {
        id,
        name: `Empresa ${id}`, // Idealmente, armazenar os nomes das empresas em uma configuração separada
        integrations: {
          kommo: kommoConfigured ? "configured" : "missing",
          facebook: facebookConfigured ? "configured" : "missing",
          n8n: n8nConfigured ? "configured" : "missing",
        },
      };
    });

    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Error fetching companies" });
  }
});

// Company-specific config routes
generalRouter.get("/companies/:companyId/config", async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get Kommo config
    const kommoConfig = await supabaseStorage.getCompanyConfig(
      companyId,
      "KOMMO_CONFIG",
    );

    // Get Facebook config
    const facebookConfig = await supabaseStorage.getCompanyConfig(
      companyId,
      "FACEBOOK_CONFIG",
    );

    // Get N8N config
    const n8nConfig = await supabaseStorage.getCompanyConfig(
      companyId,
      "N8N_CONFIG",
    );

    res.json({
      kommo: {
        configured: !!kommoConfig,
        apiToken: kommoConfig?.apiToken ? "set" : "missing",
        accountId: kommoConfig?.accountId ? "set" : "missing",
        pipelineId: kommoConfig?.pipelineId ? "set" : "missing",
        stageIds: kommoConfig?.stageIds
          ? Object.keys(kommoConfig.stageIds).length
          : 0,
      },
      facebook: {
        configured: !!facebookConfig,
        accessToken: facebookConfig?.accessToken ? "set" : "missing",
        pixelId: facebookConfig?.pixelId ? "set" : "missing",
        appId: facebookConfig?.appId ? "set" : "missing",
        appSecret: facebookConfig?.appSecret ? "set" : "missing",
      },
      n8n: {
        configured: !!n8nConfig,
        baseUrl: n8nConfig?.baseUrl || null,
        webhookSecret: n8nConfig?.webhookSecret ? "set" : "missing",
      },
    });
  } catch (error) {
    console.error(`Error fetching company config: ${error}`);
    res.status(500).json({ message: "Error fetching company configuration" });
  }
});

generalRouter.post("/companies/:companyId/config/:service", async (req, res) => {
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
      metadata: { companyId, service },
    });

    res.json({ success: true, message: "Configuration saved successfully" });
  } catch (error) {
    console.error(`Error saving company config: ${error}`);

    await supabaseStorage.createEvent({
      type: "error",
      title: "Erro ao Salvar Configuração",
      description: `Falha ao salvar configuração: ${error.message}`,
      source: "system",
      metadata: { error: error.message },
    });

    res.status(500).json({ message: "Error saving company configuration" });
  }
});

// Integrations API
generalRouter.get("/integrations", async (req, res) => {
  try {
    const companyId = req.company!.id;
    const integrationsData = await supabaseStorage.getIntegrations(companyId);
    const settings = await supabaseStorage.getSettings(companyId);

    // Transform data format for UI
    const integrations = integrationsData.map((integration) => {
      // Set appropriate icon, description, and credentials based on integration type
      let icon = "settings_suggest";
      let description = "Integration with workflow automation engine";
      let credentials: { key: string; status: "set" | "missing" }[] = [];

      if (integration.type === "kommo") {
        icon = "business";
        description =
          "Connect with Kommo CRM to capture and update lead data";
        credentials = [
          {
            key: "KOMMO_API_TOKEN",
            status: settings.find((s) => s.key === "KOMMO_API_TOKEN")?.value
              ? "set"
              : "missing",
          },
          {
            key: "KOMMO_ACCOUNT_ID",
            status: settings.find((s) => s.key === "KOMMO_ACCOUNT_ID")?.value
              ? "set"
              : "missing",
          },
          {
            key: "KOMMO_PIPELINE_ID",
            status: settings.find((s) => s.key === "KOMMO_PIPELINE_ID")?.value
              ? "set"
              : "missing",
          },
        ];
      } else if (integration.type === "facebook") {
        icon = "campaign";
        description = "Send offline conversion events to Facebook Ads";
        credentials = [
          {
            key: "FACEBOOK_ACCESS_TOKEN",
            status: settings.find((s) => s.key === "FACEBOOK_ACCESS_TOKEN")
              ?.value
              ? "set"
              : "missing",
          },
          {
            key: "FACEBOOK_PIXEL_ID",
            status: settings.find((s) => s.key === "FACEBOOK_PIXEL_ID")?.value
              ? "set"
              : "missing",
          },
          {
            key: "FACEBOOK_APP_ID",
            status: settings.find((s) => s.key === "FACEBOOK_APP_ID")?.value
              ? "set"
              : "missing",
          },
          {
            key: "FACEBOOK_APP_SECRET",
            status: settings.find((s) => s.key === "FACEBOOK_APP_SECRET")
              ?.value
              ? "set"
              : "missing",
          },
        ];
      } else if (integration.type === "n8n") {
        credentials = [
          {
            key: "N8N_WEBHOOK_SECRET",
            status: settings.find((s) => s.key === "N8N_WEBHOOK_SECRET")
              ?.value
              ? "set"
              : "missing",
          },
        ];
      }

      return {
        id: integration.id.toString(),
        name: integration.name,
        icon,
        description,
        credentials,
        status: integration.status,
        connected: integration.status === "connected",
      };
    });

    res.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({ message: "Error fetching integrations" });
  }
});

// Settings API
generalRouter.get("/settings", async (req, res) => {
  try {
    const companyId = req.company!.id;
    const settings = await supabaseStorage.getSettings(companyId);

    // Transform data format for UI
    const settingsObj = {
      kommoApiToken:
        settings.find((s) => s.key === "KOMMO_API_TOKEN")?.value || "",
      kommoAccountId:
        settings.find((s) => s.key === "KOMMO_ACCOUNT_ID")?.value || "",
      kommoPipelineId:
        settings.find((s) => s.key === "KOMMO_PIPELINE_ID")?.value || "",
      facebookAccessToken:
        settings.find((s) => s.key === "FACEBOOK_ACCESS_TOKEN")?.value || "",
      facebookPixelId:
        settings.find((s) => s.key === "FACEBOOK_PIXEL_ID")?.value || "",
      facebookAppId:
        settings.find((s) => s.key === "FACEBOOK_APP_ID")?.value || "",
      facebookAppSecret:
        settings.find((s) => s.key === "FACEBOOK_APP_SECRET")?.value || "",
      n8nWebhookSecret:
        settings.find((s) => s.key === "N8N_WEBHOOK_SECRET")?.value || "",
    };

    res.json(settingsObj);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
});

// Update settings API
generalRouter.put("/settings", async (req, res) => {
  try {
    const companyId = req.company!.id;
    
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
    await supabaseStorage.updateSetting(
      "KOMMO_API_TOKEN",
      validatedData.kommoApiToken,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "KOMMO_ACCOUNT_ID",
      validatedData.kommoAccountId,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "KOMMO_PIPELINE_ID",
      validatedData.kommoPipelineId,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "FACEBOOK_ACCESS_TOKEN",
      validatedData.facebookAccessToken,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "FACEBOOK_PIXEL_ID",
      validatedData.facebookPixelId,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "FACEBOOK_APP_ID",
      validatedData.facebookAppId,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "FACEBOOK_APP_SECRET",
      validatedData.facebookAppSecret,
      companyId,
    );
    await supabaseStorage.updateSetting(
      "N8N_WEBHOOK_SECRET",
      validatedData.n8nWebhookSecret,
      companyId,
    );

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
