import { Router } from "express";
import { z } from "zod";
import { Project, ProjectMember, Deliverable, User, DeliverableResource } from "../models.js";

export const projectsRouter = Router();

/**
 * GET / - List all projects with member counts
 */
projectsRouter.get("/", async (req, res) => {
  const projects = await Project.findAll({
    order: [["createdAt", "DESC"]]
  });

  const result = [];
  for (const p of projects) {
    const members = await ProjectMember.findAll({ where: { ProjectId: p.id }, include: [{ model: User, attributes: ["id", "name"] }] });
    const pm = members.find(m => m.memberRole === "PM");
    const deliverableCount = await Deliverable.count({ where: { ProjectId: p.id } });

    result.push({
      id: p.id,
      title: p.title,
      description: p.description,
      createdAt: p.createdAt,
      pmName: pm?.User?.name || "Unknown",
      memberCount: members.length,
      deliverableCount
    });
  }

  return res.json(result);
});

/**
 * POST / - Create a new project (creator becomes PM)
 */
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

/**
 * GET /mine - Get projects where current user is a member
 */
projectsRouter.get("/mine", async (req, res) => {
  const rows = await ProjectMember.findAll({ where: { UserId: req.user.id } });
  const ids = rows.map(r => r.ProjectId);
  const projects = await Project.findAll({ where: { id: ids }, order: [["createdAt", "DESC"]] });

  const result = [];
  for (const p of projects) {
    const membership = rows.find(r => r.ProjectId === p.id);
    const deliverables = await Deliverable.findAll({ where: { ProjectId: p.id }, order: [["dueAt", "ASC"]] });

    result.push({
      id: p.id,
      title: p.title,
      description: p.description,
      createdAt: p.createdAt,
      myRole: membership?.memberRole || "MEMBER",
      deliverables: deliverables.map(d => ({
        id: d.id,
        title: d.title,
        dueAt: d.dueAt,
        gradingCloseAt: d.gradingCloseAt,
        juryAssignedAt: d.juryAssignedAt
      }))
    });
  }

  return res.json(result);
});

/**
 * GET /:projectId - Get project details with all deliverables
 */
projectsRouter.get("/:projectId", async (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = await Project.findByPk(projectId);
  if (!project) return res.status(404).json({ message: "project not found" });

  const members = await ProjectMember.findAll({
    where: { ProjectId: projectId },
    include: [{ model: User, attributes: ["id", "name", "email"] }]
  });

  const deliverables = await Deliverable.findAll({
    where: { ProjectId: projectId },
    include: [DeliverableResource],
    order: [["dueAt", "ASC"]]
  });

  // Check if current user is PM
  const userMembership = members.find(m => m.UserId === req.user.id);

  return res.json({
    id: project.id,
    title: project.title,
    description: project.description,
    createdAt: project.createdAt,
    isPM: userMembership?.memberRole === "PM",
    isMember: !!userMembership,
    members: members.map(m => ({
      id: m.User.id,
      name: m.User.name,
      role: m.memberRole
    })),
    deliverables: deliverables.map(d => ({
      id: d.id,
      title: d.title,
      dueAt: d.dueAt,
      gradingCloseAt: d.gradingCloseAt,
      jurySize: d.jurySize,
      juryAssignedAt: d.juryAssignedAt,
      resources: d.DeliverableResources || []
    }))
  });
});

/**
 * POST /:projectId/deliverables - Add a deliverable to a project (PM only)
 */
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