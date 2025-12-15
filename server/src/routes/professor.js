import { Router } from "express";
import { Project, Deliverable, Grade } from "../models.js";

export const professorRouter = Router();

professorRouter.get("/projects", async (_req, res) => {
  const projects = await Project.findAll();
  const result = [];

  for (const p of projects) {
    const deliverables = await Deliverable.findAll({ where: { ProjectId: p.id } });

    const dSummaries = [];
    for (const d of deliverables) {
      const grades = await Grade.findAll({ where: { DeliverableId: d.id } });
      const values = grades.map(g => Number(g.value)).sort((a, b) => a - b);

      let used = [...values];
      if (used.length >= 3) used = used.slice(1, used.length - 1);

      const final = values.length ? Number((used.reduce((s, x) => s + x, 0) / used.length).toFixed(2)) : null;

      dSummaries.push({
        deliverableId: d.id,
        title: d.title,
        dueAt: d.dueAt,
        gradingCloseAt: d.gradingCloseAt,
        gradeCount: values.length,
        finalGrade: final
      });
    }

    result.push({ projectId: p.id, title: p.title, deliverables: dSummaries });
  }

  return res.json(result);
});