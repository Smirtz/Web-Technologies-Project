import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Dashboard({ me, setMe }) {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!me) return;
    api.get("/projects/mine").then(r => setProjects(r.data)).catch(() => {});
  }, [me]);

  async function refreshMe() {
    const r = await api.get("/me");
    setMe(r.data);
  }

  async function createProject() {
    setMsg("");
    try {
      const r = await api.post("/projects", { title, description: "" });
      setProjects(p => [r.data, ...p]);
      setTitle("");
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "failed");
    }
  }

  if (!me) return <p>Login first.</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Logged in as: {me.name} ({me.role})</p>
      <button onClick={refreshMe}>Refresh me</button>

      <h3>Create project (you become PM)</h3>
      <input placeholder="project title" value={title} onChange={e => setTitle(e.target.value)} />
      <button onClick={createProject}>Create</button>
      <p>{msg}</p>

      <h3>My projects</h3>
      <ul>
        {projects.map(p => (
          <li key={p.id}>{p.title} (id: {p.id})</li>
        ))}
      </ul>

      <p>
        Tip: create a deliverable in Postman, then open it here: <code>/deliverables/:id</code>
      </p>
    </div>
  );
}