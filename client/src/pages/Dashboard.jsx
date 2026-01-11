import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import "./Dashboard.css";

/**
 * Dashboard Page - Main hub for students
 * Shows user's projects, jury tasks, and quick actions
 */
export default function Dashboard({ me }) {
  const [projects, setProjects] = useState([]);
  const [juryTasks, setJuryTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    if (me) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [me]);

  async function loadData() {
    setLoading(true);
    try {
      const [projectsRes, juryRes] = await Promise.all([
        api.get("/projects/mine"),
        api.get("/deliverables/my-jury-tasks"),
      ]);
      setProjects(projectsRes.data);
      setJuryTasks(juryRes.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    if (!newProjectTitle.trim()) {
      toast.error("Please enter a project title");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/projects", {
        title: newProjectTitle.trim(),
        description: "",
      });
      toast.success("Project created successfully!");
      setShowCreateModal(false);
      setNewProjectTitle("");
      // Navigate to the new project
      nav(`/projects/${res.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  // Not logged in state
  if (!me) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-state-icon">🔐</div>
        <h2 className="empty-state-title">Welcome to GradeHub</h2>
        <p className="empty-state-text">
          Anonymous peer grading for student projects. Sign in to get started.
        </p>
        <Link to="/login" className="btn btn-primary btn-lg">
          Sign In
        </Link>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-skeleton">
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 32 }}></div>
        <div className="grid grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 180 }}></div>
          ))}
        </div>
      </div>
    );
  }

  const pendingTasks = juryTasks.filter((t) => !t.hasGraded && t.isGradingOpen);
  const completedTasks = juryTasks.filter((t) => t.hasGraded);

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {me.name}! Here's your overview.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">My Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{pendingTasks.length}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{completedTasks.length}</div>
            <div className="stat-label">Completed Reviews</div>
          </div>
        </div>
      </div>

      {/* Pending Jury Tasks */}
      {pendingTasks.length > 0 && (
        <section className="dashboard-section">
          <h2 className="section-title">
            <span className="section-icon">🎯</span>
            Pending Reviews
          </h2>
          <div className="grid grid-2">
            {pendingTasks.map((task) => (
              <Link
                key={task.id}
                to={`/deliverables/${task.id}`}
                className="task-card card card-hover"
              >
                <div className="task-header">
                  <span className="badge badge-warning">Needs Review</span>
                </div>
                <h3 className="task-title">{task.title}</h3>
                <p className="task-project">{task.project?.title}</p>
                <div className="task-footer">
                  <span className="task-date">
                    Due: {new Date(task.gradingCloseAt).toLocaleDateString()}
                  </span>
                  <span className="task-resources">
                    {task.resourceCount} resource{task.resourceCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* My Projects */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <span className="section-icon">📂</span>
          My Projects
        </h2>
        {projects.length === 0 ? (
          <div className="empty-section">
            <p>You haven't created any projects yet.</p>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card card card-hover card-glow"
              >
                <div className="project-header">
                  <span className={`badge ${project.myRole === "PM" ? "badge-primary" : "badge-secondary"}`}>
                    {project.myRole}
                  </span>
                </div>
                <h3 className="project-title">{project.title}</h3>
                <div className="project-stats">
                  <span>{project.deliverables?.length || 0} deliverables</span>
                </div>
                {project.deliverables && project.deliverables.length > 0 && (
                  <div className="project-deliverables">
                    {project.deliverables.slice(0, 2).map((d) => (
                      <div key={d.id} className="project-deliverable">
                        <span className="deliverable-dot"></span>
                        {d.title}
                      </div>
                    ))}
                    {project.deliverables.length > 2 && (
                      <div className="project-deliverable text-muted">
                        +{project.deliverables.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="sm"
      >
        <form onSubmit={createProject}>
          <div className="form-group">
            <label htmlFor="projectTitle">Project Title</label>
            <input
              id="projectTitle"
              type="text"
              placeholder="My Awesome Project"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              autoFocus
            />
            <span className="form-hint">
              You will become the Project Manager (PM) for this project.
            </span>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}