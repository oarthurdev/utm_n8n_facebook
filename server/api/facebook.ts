import { IStorage } from "../storage";
import fetch from "node-fetch";
import crypto from "crypto";

export interface FacebookApiConfig {
  accessToken: string;
  pixelId: string;
  appId: string;
  appSecret: string;
  apiVersion: string;
}

export interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

export interface FacebookEventResult {
  success: boolean;
  eventId?: string;
  message: string;
  leadId?: string;
}

export function createFacebookApi(storage: IStorage) {
  // Get API configuration from settings
  const getConfig = async (companyId: string): Promise<FacebookApiConfig> => {
    // Obter configurações específicas para esta empresa
    const fbConfig = await storage.getCompanyConfig(companyId, "FACEBOOK_CONFIG");
    
    if (!fbConfig) {
      // Fallback to direct settings lookup
      const settings = await storage.getApiCredentials(companyId);
      
      return {
        accessToken: settings.FACEBOOK_ACCESS_TOKEN || "",
        pixelId: settings.FACEBOOK_PIXEL_ID || "",
        appId: settings.FACEBOOK_APP_ID || "",
        appSecret: settings.FACEBOOK_APP_SECRET || "",
        apiVersion: "v18.0", // Use the latest stable version
      };
    }
    
    return {
      accessToken: fbConfig.accessToken || "",
      pixelId: fbConfig.pixelId || "",
      appId: fbConfig.appId || "",
      appSecret: fbConfig.appSecret || "",
      apiVersion: "v18.0", // Use the latest stable version
    };
  };

  // Hash user data for privacy compliance
  const hashUserData = (data: string): string => {
    if (!data) return "";
    return crypto.createHash("sha256").update(data.trim().toLowerCase()).digest("hex");
  };

  // Format user data for Facebook
  const formatUserData = (userData: UserData) => {
    const formattedData: Record<string, string> = {};
    
    if (userData.email) {
      formattedData.em = hashUserData(userData.email);
    }
    
    if (userData.phone) {
      // Remove any non-digit characters from phone number
      const cleanPhone = userData.phone.replace(/\D/g, "");
      formattedData.ph = hashUserData(cleanPhone);
    }
    
    if (userData.name) {
      formattedData.fn = hashUserData(userData.name.split(" ")[0] || ""); // First name
      
      const nameParts = userData.name.split(" ");
      if (nameParts.length > 1) {
        formattedData.ln = hashUserData(nameParts[nameParts.length - 1]); // Last name
      }
    }
    
    return formattedData;
  };

  // Send an offline conversion event to Facebook
  const sendOfflineEvent = async (
    leadId: string,
    eventName: string,
    userData: UserData,
    companyId: string
  ): Promise<FacebookEventResult> => {
    try {
      const config = await getConfig(companyId);
      
      if (!config.accessToken || !config.pixelId) {
        throw new Error(`Facebook API credentials not configured for company ${companyId || 'default'}`);
      }
      
      // Get UTM data for this lead to include in the event
      const utmData = await storage.getUtmDataByLeadId(leadId);
      
      // Prepare the event data
      const eventData = {
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000), // Current time in seconds
            action_source: "crm",
            user_data: formatUserData(userData),
            custom_data: {
              lead_id: leadId,
              // Include UTM parameters if available
              utm_source: utmData?.source || "",
              utm_medium: utmData?.medium || "",
              utm_campaign: utmData?.campaign || "",
              utm_content: utmData?.content || "",
              utm_term: utmData?.term || "",
            },
          },
        ],
        // Include pixel ID and access token
        pixel_id: config.pixelId,
        access_token: config.accessToken,
      };
      
      // Send the event to Facebook
      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
      
      // Look for the lead event to mark as sent
      const leadEvents = await storage.getLeadEventsByLeadId(leadId);
      const matchingEvent = leadEvents.find(event => !event.sentToFacebook && event.eventType.includes(eventName));
      
      if (matchingEvent) {
        await storage.markLeadEventAsSent(matchingEvent.id, new Date());
      }
      
      // Log the successful event
      await storage.createEvent({
        type: "success",
        title: "Event Sent to Facebook",
        description: `Event <span class="font-medium">${eventName}</span> for lead <span class="font-medium">${userData.name || leadId}</span>`,
        source: "facebook",
        metadata: { leadId, eventName, result },
      });
      
      return {
        success: true,
        eventId: result.events_received ? result.events_received[0]?.id : undefined,
        message: "Event sent successfully to Facebook",
        leadId,
      };
    } catch (error) {
      console.error(`Error sending Facebook event for lead ${leadId}:`, error);
      
      // Try to find the lead event and mark it as error
      const leadEvents = await storage.getLeadEventsByLeadId(leadId);
      const matchingEvent = leadEvents.find(event => !event.sentToFacebook && event.eventType.includes(eventName));
      
      if (matchingEvent) {
        await storage.markLeadEventAsError(matchingEvent.id, error.message);
      }
      
      // Log the error
      await storage.createEvent({
        type: "error",
        title: "Event Delivery Failed",
        description: `Failed to send <span class="font-medium">${eventName}</span> for lead <span class="font-medium">${userData.name || leadId}</span>`,
        source: "facebook",
        metadata: { leadId, eventName, error: error.message },
      });
      
      throw error;
    }
  };

  // Process any unsent lead events
  const processUnsentEvents = async (): Promise<{ processed: number; success: number; failed: number }> => {
    try {
      const unsentEvents = await storage.getUnsentLeadEvents();
      
      let success = 0;
      let failed = 0;
      
      for (const event of unsentEvents) {
        try {
          // In a real implementation, you would get the lead details from Kommo
          // For simplicity, we're using placeholder data
          const userData: UserData = {
            name: `Lead ${event.leadId}`,
            email: `lead${event.leadId}@example.com`,
            phone: `+1234567890`,
          };
          
          await sendOfflineEvent(
            event.leadId,
            event.eventType,
            userData
          );
          
          success++;
        } catch (error) {
          console.error(`Error processing unsent event ${event.id}:`, error);
          failed++;
        }
      }
      
      return {
        processed: unsentEvents.length,
        success,
        failed,
      };
    } catch (error) {
      console.error("Error processing unsent events:", error);
      throw error;
    }
  };

  // Check the Facebook token status
  const checkTokenStatus = async (companyId: string): Promise<{ valid: boolean; expiresAt?: Date; message: string }> => {
    try {
      const config = await getConfig(companyId);
      
      if (!config.accessToken) {
        return {
          valid: false,
          message: "Facebook access token not configured",
        };
      }
      
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${config.accessToken}&access_token=${config.appId}|${config.appSecret}`,
        {
          method: "GET",
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
      const { data } = result;
      
      if (!data.is_valid) {
        return {
          valid: false,
          message: data.error?.message || "Invalid token",
        };
      }
      
      let expiresAt: Date | undefined;
      if (data.expires_at) {
        expiresAt = new Date(data.expires_at * 1000);
      }
      
      return {
        valid: true,
        expiresAt,
        message: "Token is valid",
      };
    } catch (error) {
      console.error("Error checking Facebook token status:", error);
      
      return {
        valid: false,
        message: `Error checking token: ${error.message}`,
      };
    }
  };

  return {
    getConfig,
    sendOfflineEvent,
    processUnsentEvents,
    checkTokenStatus,
  };
}
