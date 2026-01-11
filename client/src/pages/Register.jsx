import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import "./Auth.css";

/**
 * Register Page Component
 * Student registration with modern design
 */
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const toast = useToast();

  // Simple password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: "", color: "" };
    if (password.length < 6) return { level: 1, text: "Too short", color: "var(--color-error)" };
    if (password.length < 8) return { level: 2, text: "Weak", color: "var(--color-warning)" };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: "Strong", color: "var(--color-success)" };
    }
    return { level: 3, text: "Good", color: "var(--color-accent)" };
  };

  const passwordStrength = getPasswordStrength();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password, role });
      toast.success("Account created! Please sign in.");
      nav("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join GradeHub to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="new-password"
            />
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${passwordStrength.level * 25}%`,
                      background: passwordStrength.color,
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>I am a...</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${role === "STUDENT" ? "active" : ""}`}
                onClick={() => setRole("STUDENT")}
              >
                <span className="role-icon">🎓</span>
                <span className="role-label">Student</span>
              </button>
              <button
                type="button"
                className={`role-option ${role === "PROFESSOR" ? "active" : ""}`}
                onClick={() => setRole("PROFESSOR")}
              >
                <span className="role-icon">👨‍🏫</span>
                <span className="role-label">Professor</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }}></span>
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
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