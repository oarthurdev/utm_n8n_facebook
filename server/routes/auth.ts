
import { Router } from "express";
import { supabaseStorage } from "../supabaseStorage";

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

    // Generate a simple token (in production, use JWT or similar)
    const token = Buffer.from(
      `${user.id}:${company.id}:${Date.now()}`,
    ).toString("base64");

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
    const decoded = Buffer.from(token, "base64").toString();
    const [userId, companyId, timestamp] = decoded.split(":");

    // Check if token is not too old (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ message: "Token expired" });
    }

    // Verify user and company still exist
    const user = await supabaseStorage.getUser(parseInt(userId));
    const company = await supabaseStorage.getCompany(companyId);

    if (!user || !company || user.companyId !== company.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    res.json({ valid: true, user, company });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});
