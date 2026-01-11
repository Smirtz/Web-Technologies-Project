import React, { useEffect } from "react";
import "./Modal.css";

/**
 * Modal component with backdrop and animations
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size ('sm', 'md', 'lg')
 */
export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className={`modal modal-${size} animate-scale-in`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
