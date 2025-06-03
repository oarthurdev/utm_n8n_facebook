
import { Router } from "express";
import { supabaseStorage } from "../supabaseStorage";
import { createN8nApi } from "../api/n8n";
import { extractCompanyMiddleware } from "../middleware";
import * as fs from "fs";
import * as path from "path";

export const n8nRouter = Router();

// API routes for N8N integration
const n8nApi = createN8nApi(supabaseStorage);

// Apply company middleware to all N8N routes
n8nRouter.use(extractCompanyMiddleware);

n8nRouter.get("/workflows", async (req, res) => {
  try {
    const workflows = await n8nApi.getWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error("Error fetching N8N workflows:", error);
    res.status(500).json({ message: "Error fetching N8N workflows" });
  }
});

// Get N8N workflow files
n8nRouter.get("/workflow/:id", async (req, res) => {
  try {
    // Check if the workflow file exists in the n8n_workflows directory
    const workflowId = req.params.id;
    const workflowPath = path.join(
      process.cwd(),
      "n8n_workflows",
      `${workflowId}.json`,
    );

    if (fs.existsSync(workflowPath)) {
      const workflowContent = fs.readFileSync(workflowPath, "utf8");
      res.json(JSON.parse(workflowContent));
    } else {
      res.status(404).json({ message: "Workflow not found" });
    }
  } catch (error) {
    console.error("Error fetching N8N workflow:", error);
    res.status(500).json({ message: "Error fetching N8N workflow" });
  }
});
