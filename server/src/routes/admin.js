import { Router } from "express";
import { User } from "../models.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

/**
 * Dev-only: promote a user to PROFESSOR by email.
 * Protected by a simple secret to avoid accidental use.
 */
adminRouter.post("/promote-professor", requireAuth, async (req, res) => {
  const { email, secret } = req.body || {};
  if (!email || !secret) return res.status(400).json({ message: "email/secret required" });

  if (secret !== (process.env.ADMIN_SECRET || "dev")) {
    return res.status(403).json({ message: "forbidden" });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "user not found" });

  user.role = "PROFESSOR";
  await user.save();

  res.json({ message: "ok", id: user.id, email: user.email, role: user.role });
});
