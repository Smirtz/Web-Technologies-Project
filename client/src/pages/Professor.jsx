import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Professor() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/professor/projects")
      .then(r => setData(r.data))
      .catch(e => setMsg(e?.response?.data?.message || "Only professor can see this."));
  }, []);

  if (msg) return <p>{msg}</p>;

  return (
    <div>
      <h2>Professor view (anonymous)</h2>
      {data.map(p => (
        <div key={p.projectId} style={{ marginBottom: 16 }}>
          <h3>{p.title}</h3>
          <ul>
            {p.deliverables.map(d => (
              <li key={d.deliverableId}>
                {d.title}: final={String(d.finalGrade)} (count={d.gradeCount})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}