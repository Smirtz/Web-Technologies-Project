import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import "./Project.css";

/**
 * Project Detail Page
 * Shows project info, deliverables, and allows PM to add deliverables/resources
 */
export default function Project({ me }) {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeliverableModal, setShowDeliverableModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({
        title: "",
        dueAt: "",
        gradingCloseAt: "",
        jurySize: 5,
    });
    const toast = useToast();

    useEffect(() => {
        loadProject();
    }, [id]);

    async function loadProject() {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (err) {
            toast.error("Failed to load project");
        } finally {
            setLoading(false);
        }
    }

    async function createDeliverable(e) {
        e.preventDefault();
        if (!newDeliverable.title || !newDeliverable.dueAt || !newDeliverable.gradingCloseAt) {
            toast.error("Please fill in all required fields");
            return;
        }

        setCreating(true);
        try {
            await api.post(`/projects/${id}/deliverables`, {
                title: newDeliverable.title,
                dueAt: new Date(newDeliverable.dueAt).toISOString(),
                gradingCloseAt: new Date(newDeliverable.gradingCloseAt).toISOString(),
                jurySize: newDeliverable.jurySize,
            });
            toast.success("Deliverable created successfully!");
            setShowDeliverableModal(false);
            setNewDeliverable({ title: "", dueAt: "", gradingCloseAt: "", jurySize: 5 });
            loadProject();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to create deliverable");
        } finally {
            setCreating(false);
        }
    }

    // Get status of a deliverable
    function getDeliverableStatus(d) {
        const now = new Date();
        const dueAt = new Date(d.dueAt);
        const gradingCloseAt = new Date(d.gradingCloseAt);

        if (now < dueAt) return { text: "In Progress", class: "badge-primary" };
        if (!d.juryAssignedAt) return { text: "Awaiting Jury", class: "badge-warning" };
        if (now < gradingCloseAt) return { text: "Grading Open", class: "badge-success" };
        return { text: "Completed", class: "badge-secondary" };
    }

    if (loading) {
        return (
            <div className="project-skeleton">
                <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 16 }}></div>
                <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 48 }}></div>
                <div className="skeleton" style={{ height: 200 }}></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h2 className="empty-state-title">Project Not Found</h2>
                <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="project-page animate-fade-in">
            {/* Header */}
            <div className="project-header">
                <div>
                    <Link to="/" className="back-link">← Back to Dashboard</Link>
                    <h1 className="page-title">{project.title}</h1>
                    <p className="page-subtitle">
                        {project.isPM ? "You are the Project Manager" : "Project Member"}
                    </p>
                </div>
                {project.isPM && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowDeliverableModal(true)}
                    >
                        + Add Deliverable
                    </button>
                )}
            </div>

            {/* Team Members */}
            <section className="project-section">
                <h2 className="section-title">Team Members</h2>
                <div className="team-grid">
                    {project.members.map((member) => (
                        <div key={member.id} className="team-member">
                            <div className="member-avatar">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="member-info">
                                <div className="member-name">{member.name}</div>
                                <div className="member-role">{member.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Deliverables */}
            <section className="project-section">
                <h2 className="section-title">Deliverables</h2>
                {project.deliverables.length === 0 ? (
                    <div className="empty-section">
                        <p>No deliverables yet.</p>
                        {project.isPM && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeliverableModal(true)}
                            >
                                Add First Deliverable
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="deliverables-list">
                        {project.deliverables.map((d) => {
                            const status = getDeliverableStatus(d);
                            return (
                                <Link
                                    key={d.id}
                                    to={`/deliverables/${d.id}`}
                                    className="deliverable-card card card-hover"
                                >
                                    <div className="deliverable-main">
                                        <div className="deliverable-info">
                                            <h3 className="deliverable-title">{d.title}</h3>
                                            <div className="deliverable-dates">
                                                <span>Due: {new Date(d.dueAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>Grading ends: {new Date(d.gradingCloseAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="deliverable-meta">
                                            <span className={`badge ${status.class}`}>{status.text}</span>
                                            <span className="deliverable-resources">
                                                {d.resources.length} resource{d.resources.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Create Deliverable Modal */}
            <Modal
                isOpen={showDeliverableModal}
                onClose={() => setShowDeliverableModal(false)}
                title="Add Deliverable"
                size="md"
            >
                <form onSubmit={createDeliverable}>
                    <div className="form-group">
                        <label htmlFor="delTitle">Title</label>
                        <input
                            id="delTitle"
                            type="text"
                            placeholder="Phase 1: Requirements"
                            value={newDeliverable.title}
                            onChange={(e) => setNewDeliverable({ ...newDeliverable, title: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="dueAt">Due Date</label>
                            <input
                                id="dueAt"
                                type="datetime-local"
                                value={newDeliverable.dueAt}
                                onChange={(e) => setNewDeliverable({ ...newDeliverable, dueAt: e.target.value })}
                            />
                            <span className="form-hint">Jury will be assigned after this date</span>
                        </div>
                        <div className="form-group">
                            <label htmlFor="gradingCloseAt">Grading Closes</label>
                            <input
                                id="gradingCloseAt"
                                type="datetime-local"
                                value={newDeliverable.gradingCloseAt}
                                onChange={(e) => setNewDeliverable({ ...newDeliverable, gradingCloseAt: e.target.value })}
                            />
                            <span className="form-hint">No grades accepted after this</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="jurySize">Jury Size</label>
                        <input
                            id="jurySize"
                            type="number"
                            min="3"
                            max="20"
                            value={newDeliverable.jurySize}
                            onChange={(e) => setNewDeliverable({ ...newDeliverable, jurySize: parseInt(e.target.value) || 5 })}
                        />
                        <span className="form-hint">Number of random students to assign as jurors (3-20)</span>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowDeliverableModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating}
                        >
                            {creating ? "Creating..." : "Create Deliverable"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
