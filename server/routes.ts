import { Router } from "express";
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { extractCompanyMiddleware } from "./middleware";
import { authRouter } from "./routes/auth";
import { kommoRouter } from "./routes/kommo";
import { facebookRouter } from "./routes/facebook";
import { n8nRouter } from "./routes/n8n";
import { generalRouter } from "./routes/general";

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

  // Mount route modules
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/kommo", kommoRouter);
  apiRouter.use("/facebook", facebookRouter);
  apiRouter.use("/n8n", n8nRouter);
  apiRouter.use("/", generalRouter);

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
