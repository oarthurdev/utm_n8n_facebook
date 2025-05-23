import { IStorage } from "../storage";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";

export interface N8NApiConfig {
  baseUrl: string;
  webhookSecret: string;
}

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  connections: any;
}

export function createN8nApi(storage: IStorage) {
  // Get API configuration from settings
  const getConfig = async (companyId?: string): Promise<N8NApiConfig> => {
    // Se não for especificado um ID de empresa, usa as configurações padrão
    if (!companyId) {
      const settings = await storage.getApiCredentials();
      return {
        baseUrl: process.env.N8N_BASE_URL || "http://localhost:5678",
        webhookSecret: settings.N8N_WEBHOOK_SECRET || "",
      };
    }
    
    // Obter configurações específicas para esta empresa
    const n8nConfig = await storage.getCompanyConfig(companyId, "N8N_CONFIG");
    
    if (!n8nConfig) {
      throw new Error(`Configurações N8N não encontradas para a empresa ${companyId}`);
    }
    
    return {
      baseUrl: n8nConfig.baseUrl || process.env.N8N_BASE_URL || "http://localhost:5678",
      webhookSecret: n8nConfig.webhookSecret || "",
    };
  };

  // Load workflow files from disk
  const loadWorkflowFile = (workflowId: string): any => {
    try {
      const filePath = path.join(process.cwd(), "n8n_workflows", `${workflowId}.json`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Workflow file not found: ${workflowId}.json`);
      }
      
      const fileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading workflow file ${workflowId}:`, error);
      throw error;
    }
  };

  // Get all available workflows
  const getWorkflows = async (): Promise<any[]> => {
    try {
      // Get workflows from database
      const workflowsData = await storage.getWorkflows();
      
      // For each workflow, try to load the corresponding JSON file
      const workflows = workflowsData.map(workflow => {
        try {
          const workflowContent = loadWorkflowFile(workflow.workflowId);
          
          return {
            id: workflow.id,
            workflowId: workflow.workflowId,
            name: workflow.name,
            type: workflow.type,
            status: workflow.status,
            active: workflow.status === "active",
            nodes: workflowContent.nodes || [],
            connections: workflowContent.connections || {},
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
          };
        } catch (error) {
          console.error(`Error loading workflow ${workflow.workflowId}:`, error);
          return {
            id: workflow.id,
            workflowId: workflow.workflowId,
            name: workflow.name,
            type: workflow.type,
            status: workflow.status,
            active: workflow.status === "active",
            nodes: [],
            connections: {},
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
            error: error.message,
          };
        }
      });
      
      return workflows;
    } catch (error) {
      console.error("Error getting workflows:", error);
      throw error;
    }
  };

  // Validate webhook signature
  const validateWebhookSignature = (signature: string, data: any): boolean => {
    // In a real implementation, you would validate the signature from N8N
    // For simplicity, we're just checking if a signature is provided
    return !!signature;
  };

  // Get URL for a specific workflow in N8N
  const getWorkflowWebhookUrl = async (workflowId: string): Promise<string> => {
    try {
      const config = await getConfig();
      
      // In a real implementation, you would get the webhook URL from N8N
      // For simplicity, we're constructing a URL based on the workflow ID
      return `${config.baseUrl}/webhook/${workflowId}`;
    } catch (error) {
      console.error(`Error getting webhook URL for workflow ${workflowId}:`, error);
      throw error;
    }
  };

  // Trigger a workflow in N8N
  const triggerWorkflow = async (workflowId: string, data: any): Promise<any> => {
    try {
      const webhookUrl = await getWorkflowWebhookUrl(workflowId);
      const config = await getConfig();
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-Signature": config.webhookSecret,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`N8N API error (${response.status}): ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error triggering workflow ${workflowId}:`, error);
      throw error;
    }
  };

  // Get latest execution of a workflow
  const getLatestExecution = async (workflowId: string): Promise<any> => {
    try {
      // In a real implementation, you would query the N8N API
      // For simplicity, we're returning a mock response
      const workflow = await storage.getWorkflowByWorkflowId(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
      
      return {
        id: `execution_${Date.now()}`,
        workflowId,
        status: workflow.status === "active" ? "success" : "error",
        startedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        finishedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting latest execution for workflow ${workflowId}:`, error);
      throw error;
    }
  };

  return {
    getConfig,
    getWorkflows,
    loadWorkflowFile,
    validateWebhookSignature,
    getWorkflowWebhookUrl,
    triggerWorkflow,
    getLatestExecution,
  };
}
