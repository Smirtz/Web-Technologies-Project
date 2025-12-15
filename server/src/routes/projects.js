import { Router } from "express";
import { z } from "zod";
import { Project, ProjectMember, Deliverable } from "../models.js";

export const projectsRouter = Router();

projectsRouter.post("/", async (req, res) => {
  const schema = z.object({
    title: z.string().min(2),
    description: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "malformed request" });

  const project = await Project.create(parsed.data);

  // creator becomes PM
  await ProjectMember.create({ ProjectId: project.id, UserId: req.user.id, memberRole: "PM" });

  return res.status(201).json(project);
});

projectsRouter.get("/mine", async (req, res) => {
  const rows = await ProjectMember.findAll({ where: { UserId: req.user.id } });
  const ids = rows.map(r => r.ProjectId);
  const projects = await Project.findAll({ where: { id: ids } });
  return res.json(projects);
});

projectsRouter.post("/:projectId/deliverables", async (req, res) => {
  const schema = z.object({
    title: z.string().min(2),
    dueAt: z.string().datetime(),
    gradingCloseAt: z.string().datetime(),
    jurySize: z.number().int().min(3).max(20).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "malformed request", details: parsed.error.errors });

  const projectId = Number(req.params.projectId);

  // must be PM
  const pm = await ProjectMember.findOne({ where: { ProjectId: projectId, UserId: req.user.id, memberRole: "PM" } });
  if (!pm) return res.status(403).json({ message: "only PM can add deliverables" });

  const d = await Deliverable.create({
    ProjectId: projectId,
    title: parsed.data.title,
    dueAt: new Date(parsed.data.dueAt),
    gradingCloseAt: new Date(parsed.data.gradingCloseAt),
    jurySize: parsed.data.jurySize ?? Number(process.env.JURY_SIZE || 5)
  });

  return res.status(201).json(d);
});