import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

/**
 * Navbar component with responsive design and role-based menu items
 * @param {Object} props - Component props
 * @param {Object} props.user - Current logged in user (null if not logged in)
 * @param {Function} props.onLogout - Callback when user logs out
 */
export default function Navbar({ user, onLogout }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
                    <span className="logo-icon">📊</span>
                    <span className="logo-text">GradeHub</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links hide-mobile">
                    {user ? (
                        <>
                            <Link
                                to="/"
                                className={`nav-link ${isActive("/") ? "active" : ""}`}
                            >
                                Dashboard
                            </Link>
                            {user.role === "PROFESSOR" && (
                                <Link
                                    to="/professor"
                                    className={`nav-link ${isActive("/professor") ? "active" : ""}`}
                                >
                                    Results
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={`nav-link ${isActive("/login") ? "active" : ""}`}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className={`nav-link ${isActive("/register") ? "active" : ""}`}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>

                {/* User Menu (Desktop) */}
                {user && (
                    <div className="navbar-user hide-mobile">
                        <div className="user-info">
                            <span className="user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="user-details">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                )}

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn show-mobile"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    <span className={`hamburger ${mobileMenuOpen ? "open" : ""}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
                {user ? (
                    <>
                        <div className="mobile-user-info">
                            <span className="user-avatar large">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                                <div className="user-name">{user.name}</div>
                                <div className="user-role">{user.role}</div>
                            </div>
                        </div>
                        <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
                            Dashboard
                        </Link>
                        {user.role === "PROFESSOR" && (
                            <Link
                                to="/professor"
                                className="mobile-nav-link"
                                onClick={closeMobileMenu}
                            >
                                Results
                            </Link>
                        )}
                        <button
                            className="btn btn-secondary w-full mt-4"
                            onClick={() => {
                                onLogout();
                                closeMobileMenu();
                            }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="mobile-nav-link"
                            onClick={closeMobileMenu}
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="mobile-nav-link"
                            onClick={closeMobileMenu}
                        >
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
