import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import "./Professor.css";

/**
 * Professor View - Anonymous results dashboard
 * Shows all projects and their grades without revealing jury members
 */
export default function Professor({ me }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const toast = useToast();

  useEffect(() => {
    if (me?.role === "PROFESSOR") {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [me]);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await api.get("/professor/projects");
      setProjects(res.data);
      // Expand first 3 projects by default
      setExpandedProjects(new Set(res.data.slice(0, 3).map((p) => p.projectId)));
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  function toggleProject(projectId) {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }

  function getGradeClass(grade) {
    if (grade === null) return "grade-na";
    if (grade >= 8) return "grade-high";
    if (grade >= 5) return "grade-medium";
    return "grade-low";
  }

  // Not authorized
  if (!me || me.role !== "PROFESSOR") {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-state-icon">🔒</div>
        <h2 className="empty-state-title">Professor Access Only</h2>
        <p className="empty-state-text">
          This page is restricted to professors. Please sign in with a professor account.
        </p>
        <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="professor-skeleton">
        <div className="skeleton" style={{ height: 40, width: 250, marginBottom: 32 }}></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120, marginBottom: 16 }}></div>
        ))}
      </div>
    );
  }

  // Calculate overall stats
  const totalDeliverables = projects.reduce((sum, p) => sum + p.deliverables.length, 0);
  const gradedDeliverables = projects.reduce(
    (sum, p) => sum + p.deliverables.filter((d) => d.finalGrade !== null).length,
    0
  );
  const avgGrade =
    gradedDeliverables > 0
      ? projects.reduce(
        (sum, p) =>
          sum +
          p.deliverables
            .filter((d) => d.finalGrade !== null)
            .reduce((s, d) => s + d.finalGrade, 0),
        0
      ) / gradedDeliverables
      : null;

  return (
    <div className="professor-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Evaluation Results</h1>
        <p className="page-subtitle">Anonymous peer review summary for all projects</p>
      </div>

      {/* Stats */}
      <div className="professor-stats">
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalDeliverables}</div>
          <div className="stat-label">Total Deliverables</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{gradedDeliverables}</div>
          <div className="stat-label">Graded</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgGrade !== null ? avgGrade.toFixed(2) : "—"}</div>
          <div className="stat-label">Average Grade</div>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="empty-section">
          <p>No projects have been created yet.</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project) => (
            <div key={project.projectId} className="professor-project-card">
              <button
                className="project-toggle"
                onClick={() => toggleProject(project.projectId)}
              >
                <span className="toggle-icon">
                  {expandedProjects.has(project.projectId) ? "▼" : "▶"}
                </span>
                <h3 className="project-name">{project.title}</h3>
                <span className="project-count">
                  {project.deliverables.length} deliverable{project.deliverables.length !== 1 ? "s" : ""}
                </span>
              </button>

              {expandedProjects.has(project.projectId) && (
                <div className="project-deliverables">
                  {project.deliverables.length === 0 ? (
                    <div className="empty-deliverables">No deliverables</div>
                  ) : (
                    <table className="deliverables-table">
                      <thead>
                        <tr>
                          <th>Deliverable</th>
                          <th>Due Date</th>
                          <th>Reviews</th>
                          <th>Final Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.deliverables.map((d) => (
                          <tr key={d.deliverableId}>
                            <td className="deliverable-name">{d.title}</td>
                            <td>{new Date(d.dueAt).toLocaleDateString()}</td>
                            <td>
                              <span className="review-count">{d.gradeCount}</span>
                            </td>
                            <td>
                              <span className={`grade-badge ${getGradeClass(d.finalGrade)}`}>
                                {d.finalGrade !== null ? d.finalGrade.toFixed(2) : "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <span className="notice-icon">🔒</span>
        <p>
          All evaluations are anonymous. Jury member identities are not visible to professors.
        </p>
      </div>
    </div>
  );
}