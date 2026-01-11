import React, { createContext, useContext, useState, useCallback } from "react";
import "./Toast.css";

const ToastContext = createContext(null);

/**
 * Toast types with their corresponding styles
 */
const TOAST_TYPES = {
    success: { icon: "✓", className: "toast-success" },
    error: { icon: "✕", className: "toast-error" },
    warning: { icon: "⚠", className: "toast-warning" },
    info: { icon: "ℹ", className: "toast-info" },
};

/**
 * ToastProvider - Wrap your app with this to enable toast notifications
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info", duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg, duration) => addToast(msg, "success", duration),
        error: (msg, duration) => addToast(msg, "error", duration),
        warning: (msg, duration) => addToast(msg, "warning", duration),
        info: (msg, duration) => addToast(msg, "info", duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast ${TOAST_TYPES[t.type].className} animate-slide-up`}
                        onClick={() => removeToast(t.id)}
                    >
                        <span className="toast-icon">{TOAST_TYPES[t.type].icon}</span>
                        <span className="toast-message">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * useToast hook - Call toast.success(), toast.error(), etc.
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
