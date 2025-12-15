import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("STUDENT", "PROFESSOR"), allowNull: false, defaultValue: "STUDENT" }
});

export const Project = sequelize.define("Project", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true }
});

export const ProjectMember = sequelize.define("ProjectMember", {
  memberRole: { type: DataTypes.ENUM("PM", "MEMBER"), allowNull: false, defaultValue: "MEMBER" }
});

export const Deliverable = sequelize.define("Deliverable", {
  title: { type: DataTypes.STRING, allowNull: false },
  dueAt: { type: DataTypes.DATE, allowNull: false },
  gradingCloseAt: { type: DataTypes.DATE, allowNull: false },
  jurySize: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  juryAssignedAt: { type: DataTypes.DATE, allowNull: true }
});

export const DeliverableResource = sequelize.define("DeliverableResource", {
  type: { type: DataTypes.ENUM("VIDEO", "DEMO"), allowNull: false },
  url: { type: DataTypes.TEXT, allowNull: false },
  // external service metadata (Noembed)
  providerName: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  thumbnailUrl: { type: DataTypes.TEXT, allowNull: true },
  html: { type: DataTypes.TEXT, allowNull: true }
});

export const JuryAssignment = sequelize.define("JuryAssignment", {});

export const Grade = sequelize.define("Grade", {
  value: { type: DataTypes.DECIMAL(4, 2), allowNull: false }
});

// Relations
User.belongsToMany(Project, { through: ProjectMember });
Project.belongsToMany(User, { through: ProjectMember });

Project.hasMany(Deliverable, { onDelete: "CASCADE" });
Deliverable.belongsTo(Project);

Deliverable.hasMany(DeliverableResource, { onDelete: "CASCADE" });
DeliverableResource.belongsTo(Deliverable);

Deliverable.belongsToMany(User, { through: JuryAssignment, as: "Jurors" });
User.belongsToMany(Deliverable, { through: JuryAssignment, as: "JuryTasks" });

Deliverable.hasMany(Grade, { onDelete: "CASCADE" });
Grade.belongsTo(Deliverable);
Grade.belongsTo(User, { as: "Juror" });