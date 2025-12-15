import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { api, setToken } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Deliverable from "./pages/Deliverable";
import Professor from "./pages/Professor";

export default function App() {
  const [me, setMe] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setToken(token);
      api.get("/me").then(r => setMe(r.data)).catch(() => {});
    }
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setMe(null);
    nav("/login");
  }

  return (
    <div style={{ padding: 16 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/">Dashboard</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/professor">Professor</Link>
        {me && <button onClick={logout}>Logout</button>}
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard me={me} setMe={setMe} />} />
        <Route path="/login" element={<Login setMe={setMe} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/deliverables/:id" element={<Deliverable />} />
        <Route path="/professor" element={<Professor />} />
      </Routes>
    </div>
  );
}