import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function Deliverable() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [grade, setGrade] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await api.get(`/deliverables/${id}`);
    setD(r.data);
    const g = await api.get(`/deliverables/${id}/my-grade`);
    setGrade(g.data?.value ?? "");
  }

  useEffect(() => { load().catch(() => {}); }, [id]);

  async function saveGrade() {
    setMsg("");
    try {
      await api.put(`/deliverables/${id}/my-grade`, { value: Number(grade) });
      setMsg("Saved.");
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "failed");
    }
  }

  if (!d) return <p>Loading...</p>;

  return (
    <div>
      <h2>Deliverable: {d.title}</h2>
      <p>Due: {String(d.dueAt)}</p>
      <p>Grading close: {String(d.gradingCloseAt)}</p>

      <h3>Resources (video/demo)</h3>
      <ul>
        {(d.DeliverableResources || []).map(r => (
          <li key={r.id}>
            <b>{r.type}</b> — {r.title || r.url} ({r.providerName || "unknown"})
          </li>
        ))}
      </ul>

      <h3>My grade (if I’m a juror)</h3>
      <input value={grade} onChange={e => setGrade(e.target.value)} type="number" step="0.01" min="1" max="10" />
      <button onClick={saveGrade}>Save</button>
      <p>{msg}</p>
    </div>
  );
}