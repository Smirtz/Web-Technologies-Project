import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { deliverablesRouter } from "./routes/deliverables.js";
import { professorRouter } from "./routes/professor.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { adminRouter } from "./routes/admin.js";

export function buildApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);

  app.get("/me", requireAuth, (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role });
  });

  app.use("/projects", requireAuth, projectsRouter);
  app.use("/deliverables", requireAuth, deliverablesRouter);

  app.use("/professor", requireAuth, requireRole("PROFESSOR"), professorRouter);
  app.use("/admin", requireAuth, adminRouter);

  return app;
}