import { InsertUtmData } from "@shared/schema";
import fetch from "node-fetch";
import { supabaseStorage } from "../supabaseStorage";

export interface KommoApiConfig {
  baseUrl: string;
  apiToken: string;
  accountId: string;
  pipelineId: string;
  stageIds: Record<string, string>;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface KommoUtmResult {
  success: boolean;
  leadId: string;
  message: string;
  utmData?: InsertUtmData;
}

export interface KommoWebhookResult {
  success: boolean;
  message: string;
  data?: any;
}

export function createKommoApi() {
  // Get API configuration from settings
  const getConfig = async (companyId?: string): Promise<KommoApiConfig> => {
    // Se não for especificado um ID de empresa, usa as configurações globais
    if (!companyId) {
      const settings = await supabaseStorage.getApiCredentials();

      let stageIds: Record<string, string> = {};
      try {
        if (settings.KOMMO_STAGE_IDS) {
          stageIds =
            typeof settings.KOMMO_STAGE_IDS === "string"
              ? JSON.parse(settings.KOMMO_STAGE_IDS)
              : settings.KOMMO_STAGE_IDS;
        }
      } catch (error) {
        console.error("Error parsing KOMMO_STAGE_IDS:", error);
      }

      return {
        baseUrl: "https://api.kommo.com",
        apiToken: settings.KOMMO_API_TOKEN || "",
        accountId: settings.KOMMO_ACCOUNT_ID || "",
        pipelineId: settings.KOMMO_PIPELINE_ID || "",
        stageIds,
      };
    }

    // Obter configurações específicas para esta empresa
    const kommoConfig = await supabaseStorage.getCompanyConfig(
      companyId,
      "KOMMO_CONFIG",
    );

    if (!kommoConfig) {
      throw new Error(
        `Configurações Kommo não encontradas para a empresa ${companyId}`,
      );
    }

    return {
      baseUrl: "https://api.kommo.com",
      apiToken: kommoConfig.apiToken || "",
      accountId: kommoConfig.accountId || "",
      pipelineId: kommoConfig.pipelineId || "",
      stageIds: kommoConfig.stageIds || {},
    };
  };

  // Make an API request to Kommo
  const apiRequest = async (
    endpoint: string,
    method = "GET",
    data?: any,
    companyId?: string,
  ) => {
    const config = await getConfig(companyId);

    if (!config.apiToken) {
      throw new Error("Kommo API token not configured");
    }

    const url = `${config.baseUrl}/${endpoint}`;
    const headers = {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kommo API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in Kommo API request to ${endpoint}:`, error);
      throw error;
    }
  };

  // Get lead details from Kommo
  const getLeadDetails = async (leadId: string, companyId?: string) => {
    try {
      return await apiRequest(`leads/${leadId}`, "GET", undefined, companyId);
    } catch (error) {
      console.error(`Error getting lead details for ${leadId}:`, error);
      throw error;
    }
  };

  // Update lead custom fields in Kommo
  const updateLeadCustomFields = async (
    leadId: string,
    customFields: any[],
    companyId?: string,
  ) => {
    try {
      return await apiRequest(
        `leads/${leadId}`,
        "PATCH",
        {
          custom_fields_values: customFields,
        },
        companyId,
      );
    } catch (error) {
      console.error(`Error updating custom fields for lead ${leadId}:`, error);
      throw error;
    }
  };

  // Save UTM parameters to Kommo lead and local storage
  const saveUtmParameters = async (
    leadId: string,
    utmParams: UtmParams,
    companyId?: string,
  ): Promise<KommoUtmResult> => {
    try {
      // First, check if we already have UTM data for this lead
      const existingUtmData = await supabaseStorage.getUtmDataByLeadId(
        leadId,
        companyId,
      );
      if (existingUtmData) {
        return {
          success: true,
          leadId,
          message: "UTM parameters already exist for this lead",
          utmData: existingUtmData,
        };
      }

      // Save UTM parameters to our internal storage
      const utmData = await supabaseStorage.createUtmData({
        leadId,
        source: utmParams.source || null,
        medium: utmParams.medium || null,
        campaign: utmParams.campaign || null,
        content: utmParams.content || null,
        term: utmParams.term || null,
        companyId,
      });

      // Create a log event
      await supabaseStorage.createEvent({
        type: "success",
        title: "UTM Parameters Captured",
        description: `UTM parameters saved for lead <span class="font-medium">${leadId}</span>`,
        source: "kommo",
        metadata: { leadId, utmParams },
        companyId,
      });

      // Prepare custom fields for Kommo
      // Note: In a real implementation, you would need to get the custom field IDs from Kommo's API
      // For this implementation, we're assuming you've created these custom fields in Kommo
      const customFields = [
        { field_id: 100001, values: [{ value: utmParams.source }] },
        { field_id: 100002, values: [{ value: utmParams.medium }] },
        { field_id: 100003, values: [{ value: utmParams.campaign }] },
        { field_id: 100004, values: [{ value: utmParams.content }] },
        { field_id: 100005, values: [{ value: utmParams.term }] },
      ].filter((field) => field.values[0].value); // Only include fields with values

      // If there are fields to update, send to Kommo
      if (customFields.length > 0) {
        await updateLeadCustomFields(leadId, customFields);
      }

      return {
        success: true,
        leadId,
        message: "UTM parameters captured and saved successfully",
        utmData,
      };
    } catch (error) {
      console.error("Error saving UTM parameters:", error);

      // Log the error
      await supabaseStorage.createEvent({
        type: "error",
        title: "UTM Capture Failed",
        description: `Failed to save UTM parameters for lead <span class="font-medium">${leadId}</span>`,
        source: "kommo",
        metadata: { leadId, utmParams, error: error.message },
        companyId,
      });

      throw error;
    }
  };

  // Handle webhook from Kommo for lead status changes
  const handleWebhook = async (
    webhookData: any,
    companyId?: string,
  ): Promise<KommoWebhookResult> => {
    try {
      console.log(companyId);
      // Validate webhook secret if provided
      const config = await getConfig(companyId);
      if (
        config.stageIds === undefined ||
        Object.keys(config.stageIds).length === 0
      ) {
        throw new Error("Kommo stage IDs not configured");
      }

      // Extract lead information from webhook data
      // In a real implementation, you would parse the specific webhook format from Kommo
      const { leads = [], leads_status = [] } = webhookData;

      if (!leads.length || !leads_status.length) {
        return {
          success: false,
          message: "No lead information in webhook data",
        };
      }

      // Process each lead status change
      for (const lead of leads) {
        const leadId = lead.id.toString();
        const statusChange = leads_status.find(
          (status: any) => status.lead_id.toString() === leadId,
        );

        if (!statusChange) continue;

        const stageId = statusChange.status_id.toString();

        // Determine the event type based on the stage ID
        let eventType = null;
        for (const [stage, id] of Object.entries(config.stageIds)) {
          if (id === stageId) {
            eventType = `lead_${stage}`;
            break;
          }
        }

        if (!eventType) {
          console.log(`No matching event type for stage ID ${stageId}`);
          continue;
        }

        // Get lead details to extract contact information
        const leadDetails = await getLeadDetails(leadId, companyId);
        const name = leadDetails.name || "";

        // Get contact details (email, phone) - in a real implementation, parse from lead details
        const email = leadDetails.email || "";
        const phone = leadDetails.phone || "";

        // Create a lead event
        await supabaseStorage.createLeadEvent({
          leadId,
          eventType,
          sentToFacebook: false,
          companyId,
        });

        // Log the event
        await supabaseStorage.createEvent({
          type: "success",
          title: "Lead Status Changed",
          description: `Lead <span class="font-medium">${name || leadId}</span> moved to <span class="font-medium">${eventType.replace("lead_", "")}</span> stage`,
          source: "kommo",
          metadata: { leadId, eventType, stageId },
          companyId,
        });
      }

      return {
        success: true,
        message: "Webhook processed successfully",
        data: {
          processedLeads: leads.length,
        },
      };
    } catch (error) {
      console.error("Error handling Kommo webhook:", error);

      // Log the error
      await supabaseStorage.createEvent({
        type: "error",
        title: "Webhook Processing Failed",
        description: `Failed to process Kommo webhook: ${error.message}`,
        source: "kommo",
        metadata: { error: error.message },
        companyId,
      });

      throw error;
    }
  };

  return {
    getConfig,
    getLeadDetails,
    updateLeadCustomFields,
    saveUtmParameters,
    handleWebhook,
  };
}
