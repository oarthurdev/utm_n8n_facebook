
import { Router } from "express";
import { supabaseStorage } from "../supabaseStorage";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authRouter = Router();

// Authentication routes (public - don't require company middleware)
authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const subdomain =
      req.get("x-subdomain") || (req.query.subdomain as string);

    if (!subdomain) {
      return res.status(400).json({ message: "Subdomain is required" });
    }

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Find company by subdomain
    const company = await supabaseStorage.getCompanyBySubdomain(subdomain);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Find user by username and company
    const user = await supabaseStorage.getUserByUsername(username);
    if (!user || user.companyId !== company.id) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password (in production, use proper password hashing)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        companyId: company.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        companyId: user.companyId,
      },
      company: {
        id: company.id,
        name: company.name,
        subdomain: company.subdomain,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.get("/validate", async (req, res) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user and company still exist
    const user = await supabaseStorage.getUser(decoded.userId);
    const company = await supabaseStorage.getCompany(decoded.companyId);

    if (!user || !company || user.companyId !== company.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    res.json({ valid: true, user, company });
  } catch (error) {
    console.error("Error validating token:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
});
