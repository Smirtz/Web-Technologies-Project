import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import "./Deliverable.css";

/**
 * Deliverable Detail Page
 * Shows resources, grading interface, and allows PM to add resources
 */
export default function Deliverable({ me }) {
  const { id } = useParams();
  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeValue, setGradeValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResource, setNewResource] = useState({ type: "VIDEO", url: "" });
  const [addingResource, setAddingResource] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadDeliverable();
  }, [id]);

  async function loadDeliverable() {
    setLoading(true);
    try {
      const res = await api.get(`/deliverables/${id}`);
      setDeliverable(res.data);
      if (res.data.myGrade !== null) {
        setGradeValue(String(res.data.myGrade));
      }
    } catch (err) {
      toast.error("Failed to load deliverable");
    } finally {
      setLoading(false);
    }
  }

  async function saveGrade() {
    const value = parseFloat(gradeValue);
    if (isNaN(value) || value < 1 || value > 10) {
      toast.error("Grade must be between 1 and 10");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/deliverables/${id}/my-grade`, { value });
      toast.success("Grade saved successfully!");
      loadDeliverable();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  }

  async function addResource(e) {
    e.preventDefault();
    if (!newResource.url) {
      toast.error("Please enter a URL");
      return;
    }

    setAddingResource(true);
    try {
      await api.post(`/deliverables/${id}/resources`, newResource);
      toast.success("Resource added!");
      setShowResourceModal(false);
      setNewResource({ type: "VIDEO", url: "" });
      loadDeliverable();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add resource");
    } finally {
      setAddingResource(false);
    }
  }

  async function deleteResource(resourceId) {
    if (!confirm("Delete this resource?")) return;
    try {
      await api.delete(`/deliverables/${id}/resources/${resourceId}`);
      toast.success("Resource deleted");
      loadDeliverable();
    } catch (err) {
      toast.error("Failed to delete resource");
    }
  }

  if (loading) {
    return (
      <div className="deliverable-skeleton">
        <div className="skeleton" style={{ height: 200, marginBottom: 32 }}></div>
        <div className="skeleton" style={{ height: 150 }}></div>
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h2 className="empty-state-title">Deliverable Not Found</h2>
        <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const now = new Date();
  const isBeforeDue = now < new Date(deliverable.dueAt);
  const isGradingOpen = deliverable.isGradingOpen;

  return (
    <div className="deliverable-page animate-fade-in">
      {/* Hero Section */}
      <div className="deliverable-hero">
        <Link to={deliverable.project ? `/projects/${deliverable.project.id}` : "/"} className="back-link">
          ← Back to {deliverable.project?.title || "Dashboard"}
        </Link>
        <h1 className="deliverable-title">{deliverable.title}</h1>

        <div className="deliverable-meta">
          <div className="meta-item">
            <span className="meta-label">Due Date</span>
            <span className="meta-value">
              {new Date(deliverable.dueAt).toLocaleString()}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Grading Closes</span>
            <span className="meta-value">
              {new Date(deliverable.gradingCloseAt).toLocaleString()}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Status</span>
            {isBeforeDue ? (
              <span className="badge badge-primary">In Progress</span>
            ) : !deliverable.juryAssignedAt ? (
              <span className="badge badge-warning">Awaiting Jury</span>
            ) : isGradingOpen ? (
              <span className="badge badge-success">Grading Open</span>
            ) : (
              <span className="badge badge-secondary">Completed</span>
            )}
          </div>
        </div>

        {/* Final Grade Display */}
        {deliverable.finalGrade !== null && (
          <div className="final-grade-display">
            <div className="final-grade-value">{deliverable.finalGrade.toFixed(2)}</div>
            <div className="final-grade-label">Final Grade ({deliverable.gradeCount} reviews)</div>
          </div>
        )}
      </div>

      {/* Resources Section */}
      <section className="deliverable-section">
        <div className="section-header">
          <h2 className="section-title">📎 Resources</h2>
          {deliverable.isPM && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowResourceModal(true)}
            >
              + Add Resource
            </button>
          )}
        </div>

        {deliverable.resources.length === 0 ? (
          <div className="empty-section">
            <p>No resources attached yet.</p>
          </div>
        ) : (
          <div className="resources-grid">
            {deliverable.resources.map((r) => (
              <div key={r.id} className="resource-card card">
                {r.thumbnailUrl ? (
                  <div className="resource-thumbnail">
                    <img src={r.thumbnailUrl} alt={r.title || "Resource"} />
                  </div>
                ) : (
                  <div className="resource-thumbnail resource-placeholder">
                    {r.type === "VIDEO" ? "🎬" : "🔗"}
                  </div>
                )}
                <div className="resource-content">
                  <span className="badge badge-secondary mb-2">{r.type}</span>
                  <h4 className="resource-title">{r.title || "Untitled"}</h4>
                  <p className="resource-provider">{r.providerName || "Link"}</p>
                  <div className="resource-actions">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      Open
                    </a>
                    {deliverable.isPM && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => deleteResource(r.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Grading Section (for jurors) */}
      {deliverable.isJuror && (
        <section className="deliverable-section">
          <h2 className="section-title">⭐ Your Grade</h2>
          <div className="grading-card card">
            {!isGradingOpen ? (
              <div className="grading-closed">
                <p>Grading period has ended.</p>
                {deliverable.myGrade !== null && (
                  <p>Your submitted grade: <strong>{deliverable.myGrade}</strong></p>
                )}
              </div>
            ) : (
              <>
                <div className="grade-input-wrapper">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={gradeValue || 5}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="grade-slider"
                  />
                  <div className="grade-number-input">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.01"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                      placeholder="1-10"
                    />
                  </div>
                </div>
                <div className="grade-scale">
                  <span>1 (Poor)</span>
                  <span>5 (Average)</span>
                  <span>10 (Excellent)</span>
                </div>
                <button
                  className="btn btn-primary mt-4"
                  onClick={saveGrade}
                  disabled={saving}
                >
                  {saving ? "Saving..." : deliverable.myGrade !== null ? "Update Grade" : "Submit Grade"}
                </button>
                {deliverable.myGrade !== null && (
                  <p className="grade-hint">
                    You can modify your grade for a limited time after submission.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Add Resource Modal */}
      <Modal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        title="Add Resource"
        size="sm"
      >
        <form onSubmit={addResource}>
          <div className="form-group">
            <label>Resource Type</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="type"
                  value="VIDEO"
                  checked={newResource.type === "VIDEO"}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                />
                <span>Video (YouTube, Vimeo, etc.)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="type"
                  value="DEMO"
                  checked={newResource.type === "DEMO"}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                />
                <span>Demo Link (deployed app)</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="resourceUrl">URL</label>
            <input
              id="resourceUrl"
              type="url"
              placeholder="https://..."
              value={newResource.url}
              onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowResourceModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingResource}
            >
              {addingResource ? "Adding..." : "Add Resource"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}