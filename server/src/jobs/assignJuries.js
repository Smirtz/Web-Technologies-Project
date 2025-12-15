import { Op } from "sequelize";
import { Deliverable, ProjectMember, User, JuryAssignment } from "../models.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function assignJuriesForDueDeliverables() {
  const now = new Date();

  const due = await Deliverable.findAll({
    where: { dueAt: { [Op.lte]: now }, juryAssignedAt: null }
  });

  for (const d of due) {
    const members = await ProjectMember.findAll({ where: { ProjectId: d.ProjectId } });
    const memberIds = new Set(members.map(m => m.UserId));

    const students = await User.findAll({ where: { role: "STUDENT" } });
    const eligible = students.filter(s => !memberIds.has(s.id));

    const jurySize = d.jurySize;
    const picked = shuffle(eligible).slice(0, Math.min(jurySize, eligible.length));

    for (const juror of picked) {
      await JuryAssignment.findOrCreate({
        where: { DeliverableId: d.id, UserId: juror.id }
      });
    }

    d.juryAssignedAt = new Date();
    await d.save();
  }
}