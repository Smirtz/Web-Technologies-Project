import { Router } from "express";
import { z } from "zod";
import { Deliverable, DeliverableResource, ProjectMember, JuryAssignment, Grade, Project, User } from "../models.js";
import { fetchNoembed } from "../services/noembed.js";

export const deliverablesRouter = Router();

/**
 * GET /my-jury-tasks - Get all deliverables assigned to current user as juror
 */
deliverablesRouter.get("/my-jury-tasks", async (req, res) => {
  const assignments = await JuryAssignment.findAll({
    where: { UserId: req.user.id },
    include: [{
      model: Deliverable,
      include: [{ model: Project, attributes: ["id", "title"] }, DeliverableResource]
    }]
  });

  const result = [];
  for (const a of assignments) {
    const d = a.Deliverable;
    if (!d) continue;

    // Check if user has already graded
    const existingGrade = await Grade.findOne({
      where: { DeliverableId: d.id, JurorId: req.user.id }
    });

    const now = new Date();
    const isGradingOpen = now <= new Date(d.gradingCloseAt);

    result.push({
      id: d.id,
      title: d.title,
      dueAt: d.dueAt,
      gradingCloseAt: d.gradingCloseAt,
      project: d.Project ? { id: d.Project.id, title: d.Project.title } : null,
      hasGraded: !!existingGrade,
      myGrade: existingGrade?.value ?? null,
      isGradingOpen,
      resourceCount: (d.DeliverableResources || []).length
    });
  }

  return res.json(result);
});

/**
 * GET /:id - Get deliverable details with resources and grading info
 */
deliverablesRouter.get("/:id", async (req, res) => {
  const d = await Deliverable.findByPk(req.params.id, {
    include: [
      DeliverableResource,
      { model: Project, attributes: ["id", "title"] }
    ]
  });
  if (!d) return res.status(404).json({ message: "not found" });

  // Check if user is a juror for this deliverable
  const isJuror = await JuryAssignment.findOne({
    where: { DeliverableId: d.id, UserId: req.user.id }
  });

  // Check if user is PM of the project
  const isPM = await ProjectMember.findOne({
    where: { ProjectId: d.ProjectId, UserId: req.user.id, memberRole: "PM" }
  });

  // Get user's grade if exists
  const myGrade = await Grade.findOne({
    where: { DeliverableId: d.id, JurorId: req.user.id }
  });

  // Get grade count and summary (anonymous)
  const grades = await Grade.findAll({ where: { DeliverableId: d.id } });
  const values = grades.map(g => Number(g.value)).sort((a, b) => a - b);
  let finalGrade = null;
  if (values.length > 0) {
    let used = [...values];
    if (used.length >= 3) used = used.slice(1, used.length - 1);
    finalGrade = Number((used.reduce((s, x) => s + x, 0) / used.length).toFixed(2));
  }

  const now = new Date();

  return res.json({
    id: d.id,
    title: d.title,
    dueAt: d.dueAt,
    gradingCloseAt: d.gradingCloseAt,
    jurySize: d.jurySize,
    juryAssignedAt: d.juryAssignedAt,
    project: d.Project ? { id: d.Project.id, title: d.Project.title } : null,
    resources: d.DeliverableResources || [],
    isJuror: !!isJuror,
    isPM: !!isPM,
    isGradingOpen: now <= new Date(d.gradingCloseAt),
    myGrade: myGrade?.value ?? null,
    gradeCount: values.length,
    finalGrade
  });
});

/**
 * POST /:id/resources - Add a resource to a deliverable (PM only)
 */
deliverablesRouter.post("/:id/resources", async (req, res) => {
  const schema = z.object({
    type: z.enum(["VIDEO", "DEMO"]),
    url: z.string().url()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "malformed request" });

  const d = await Deliverable.findByPk(req.params.id);
  if (!d) return res.status(404).json({ message: "deliverable not found" });

  // must be PM in the project
  const pm = await ProjectMember.findOne({ where: { ProjectId: d.ProjectId, UserId: req.user.id, memberRole: "PM" } });
  if (!pm) return res.status(403).json({ message: "only PM can add resources" });

  // external service call
  let meta = { providerName: null, title: null, thumbnailUrl: null, html: null };
  try {
    meta = await fetchNoembed(parsed.data.url);
  } catch (e) {
    console.error("Noembed fetch failed:", e.message);
  }

  const r = await DeliverableResource.create({
    DeliverableId: d.id,
    type: parsed.data.type,
    url: parsed.data.url,
    providerName: meta.providerName,
    title: meta.title,
    thumbnailUrl: meta.thumbnailUrl,
    html: meta.html
  });

  return res.status(201).json(r);
});

/**
 * DELETE /:id/resources/:resourceId - Remove a resource (PM only)
 */
deliverablesRouter.delete("/:id/resources/:resourceId", async (req, res) => {
  const d = await Deliverable.findByPk(req.params.id);
  if (!d) return res.status(404).json({ message: "deliverable not found" });

  const pm = await ProjectMember.findOne({ where: { ProjectId: d.ProjectId, UserId: req.user.id, memberRole: "PM" } });
  if (!pm) return res.status(403).json({ message: "only PM can delete resources" });

  const resource = await DeliverableResource.findByPk(req.params.resourceId);
  if (!resource || resource.DeliverableId !== d.id) {
    return res.status(404).json({ message: "resource not found" });
  }

  await resource.destroy();
  return res.json({ message: "deleted" });
});

/**
 * GET /:id/my-grade - Get current user's grade for this deliverable
 */
deliverablesRouter.get("/:id/my-grade", async (req, res) => {
  const grade = await Grade.findOne({ where: { DeliverableId: req.params.id, JurorId: req.user.id } });
  return res.json(grade || null);
});

/**
 * PUT /:id/my-grade - Submit or update grade (juror only, within time limit)
 */
deliverablesRouter.put("/:id/my-grade", async (req, res) => {
  const schema = z.object({ value: z.number().min(1).max(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "malformed request" });

  const d = await Deliverable.findByPk(req.params.id);
  if (!d) return res.status(404).json({ message: "deliverable not found" });

  // must be in jury
  const isJuror = await JuryAssignment.findOne({ where: { DeliverableId: d.id, UserId: req.user.id } });
  if (!isJuror) return res.status(403).json({ message: "not a jury member" });

  const now = new Date();
  if (now > new Date(d.gradingCloseAt)) return res.status(403).json({ message: "grading closed" });

  // upsert grade
  const [grade, created] = await Grade.findOrCreate({
    where: { DeliverableId: d.id, JurorId: req.user.id },
    defaults: { value: Number(parsed.data.value.toFixed(2)) }
  });

  if (!created) {
    // limited edit time
    const minutes = Number(process.env.GRADE_EDIT_MINUTES || 30);
    const editableUntil = new Date(grade.updatedAt.getTime() + minutes * 60 * 1000);
    if (now > editableUntil) return res.status(403).json({ message: "edit window expired" });

    grade.value = Number(parsed.data.value.toFixed(2));
    await grade.save();
  }

  return res.json({ message: "ok", grade });
});

/**
 * GET /:id/summary - Get grade summary (anonymous, no jury info)
 */
deliverablesRouter.get("/:id/summary", async (req, res) => {
  const d = await Deliverable.findByPk(req.params.id);
  if (!d) return res.status(404).json({ message: "deliverable not found" });

  const grades = await Grade.findAll({ where: { DeliverableId: d.id } });
  const values = grades.map(g => Number(g.value)).sort((a, b) => a - b);

  if (values.length === 0) return res.json({ count: 0, final: null });

  let used = [...values];
  if (used.length >= 3) used = used.slice(1, used.length - 1); // drop min/max

  const avg = used.reduce((s, x) => s + x, 0) / used.length;
  return res.json({ count: values.length, final: Number(avg.toFixed(2)) });
});