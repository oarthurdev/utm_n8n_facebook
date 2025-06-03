
import { Router } from "express";
import { supabaseStorage } from "../supabaseStorage";
import { createKommoApi } from "../api/kommo";
import { extractCompanyMiddleware } from "../middleware";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const kommoRouter = Router();

// API routes for Kommo integration
const kommoApi = createKommoApi(supabaseStorage);

// Apply company middleware to all Kommo routes
kommoRouter.use(extractCompanyMiddleware);

kommoRouter.post("/webhook", async (req, res) => {
  try {
    const companyId = req.company!.id;
    const result = await kommoApi.handleWebhook(req.body, companyId);
    res.json(result);
  } catch (error) {
    console.error("Error handling Kommo webhook:", error);
    res.status(500).json({ message: "Error handling Kommo webhook" });
  }
});

kommoRouter.post("/capture-utm", async (req, res) => {
  try {
    const companyId = req.company!.id;
    
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

    const result = await kommoApi.saveUtmParameters(validatedData.leadId, {
      source: validatedData.utm_source,
      medium: validatedData.utm_medium,
      campaign: validatedData.utm_campaign,
      content: validatedData.utm_content,
      term: validatedData.utm_term,
    }, companyId);

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
