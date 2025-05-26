
import { Request, Response, NextFunction } from "express";
import { supabaseStorage } from "./supabaseStorage";

// Extend Request type to include company
declare global {
  namespace Express {
    interface Request {
      company?: {
        id: string;
        name: string;
        subdomain: string;
      };
      user?: {
        id: number;
        username: string;
        companyId: string;
      };
    }
  }
}

// Middleware to extract company from subdomain
export const extractCompanyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract subdomain from hostname
    const hostname = req.get('host') || '';
    let subdomain = '';
    
    // Handle different formats: subdomain.domain.com or localhost with subdomain parameter
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('replit')) {
      // For development, use query parameter or header
      subdomain = req.query.subdomain as string || req.get('x-subdomain') || '';
    } else {
      // Extract subdomain from hostname
      const parts = hostname.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }
    
    if (!subdomain) {
      return res.status(400).json({ message: "Subdomain not provided" });
    }
    
    // Find company by subdomain
    const company = await supabaseStorage.getCompanyBySubdomain(subdomain);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Attach company to request
    req.company = {
      id: company.id,
      name: company.name,
      subdomain: company.subdomain
    };
    
    next();
  } catch (error) {
    console.error('Error in extractCompanyMiddleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to verify user belongs to company
export const verifyCompanyUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.company) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user.companyId !== req.company.id) {
    return res.status(403).json({ message: "Access denied - user does not belong to this company" });
  }
  
  next();
};
