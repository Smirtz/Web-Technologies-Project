import jwt from "jsonwebtoken";
import { User } from "../models.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.userId);
    if (!user) return res.status(401).json({ message: "invalid token" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "invalid token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ message: "forbidden" });
    next();
  };
}