import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "malformed request", details: parsed.error.errors });

  const { name, email, password } = parsed.data;

  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ message: "email already used" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: "STUDENT" });

  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

authRouter.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "malformed request" });

  const { email, password } = parsed.data;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid credentials" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});