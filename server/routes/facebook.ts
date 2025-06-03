
import { Router } from "express";
import { supabaseStorage } from "../supabaseStorage";
import { createFacebookApi } from "../api/facebook";
import { extractCompanyMiddleware } from "../middleware";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const facebookRouter = Router();

// API routes for Facebook integration
const facebookApi = createFacebookApi(supabaseStorage);

// Apply company middleware to all Facebook routes
facebookRouter.use(extractCompanyMiddleware);

facebookRouter.post("/send-event", async (req, res) => {
  try {
    const companyId = req.company!.id;
    
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
      validatedData.userData,
      companyId
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
