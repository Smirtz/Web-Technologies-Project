import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { api, setToken } from "./api";
import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Deliverable from "./pages/Deliverable";
import Professor from "./pages/Professor";
import Project from "./pages/Project";

/**
 * Main Application Component
 * Handles authentication state and routing
 */
export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setToken(token);
      api
        .get("/me")
        .then((r) => setMe(r.data))
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Handle user logout
   */
  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setMe(null);
    nav("/login");
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Navbar user={me} onLogout={logout} />
      <main className="page">
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard me={me} setMe={setMe} />} />
            <Route path="/login" element={<Login setMe={setMe} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects/:id" element={<Project me={me} />} />
            <Route path="/deliverables/:id" element={<Deliverable me={me} />} />
            <Route path="/professor" element={<Professor me={me} />} />
          </Routes>
        </div>
      </main>
    </ToastProvider>
  );
}