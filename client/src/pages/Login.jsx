import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";
import { useToast } from "../components/Toast";
import "./Auth.css";

/**
 * Login Page Component
 * Beautiful centered card with gradient accents
 */
export default function Login({ setMe }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", r.data.token);
      setToken(r.data.token);
      setMe(r.data.user);
      toast.success(`Welcome back, ${r.data.user.name}!`);
      nav("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to GradeHub</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }}></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="auth-decoration auth-decoration-1"></div>
      <div className="auth-decoration auth-decoration-2"></div>
    </div>
  );
}