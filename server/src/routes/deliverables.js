import { Router } from "express";
import { z } from "zod";
import { Deliverable, DeliverableResource, ProjectMember, JuryAssignment, Grade } from "../models.js";
import { fetchNoembed } from "../services/noembed.js";

export const deliverablesRouter = Router();

deliverablesRouter.get("/:id", async (req, res) => {
  const d = await Deliverable.findByPk(req.params.id, { include: [DeliverableResource] });
  if (!d) return res.status(404).json({ message: "not found" });
  return res.json(d);
});

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
  const meta = await fetchNoembed(parsed.data.url);

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

deliverablesRouter.get("/:id/my-grade", async (req, res) => {
  const grade = await Grade.findOne({ where: { DeliverableId: req.params.id, JurorId: req.user.id } });
  return res.json(grade || null);
});

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