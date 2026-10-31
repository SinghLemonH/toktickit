import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  titleId?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  titleId = "modal-dialog-title",
  size = "md",
  children,
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
          return;
        }

        if (e.key === "Tab" && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      const timer = setTimeout(() => {
        if (!modalRef.current) return;
        if (modalRef.current.contains(document.activeElement)) return;

        const autoFocusEl = modalRef.current.querySelector<HTMLElement>(
          "[autofocus], textarea, input, select, button:not(.btn-close)"
        );
        if (autoFocusEl) {
          autoFocusEl.focus();
        } else {
          modalRef.current.focus();
        }
      }, 0);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dialogClass = size === "lg" ? "modal-lg" : size === "sm" ? "modal-sm" : "";

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={modalRef}
    >
      <div className={`modal-dialog modal-dialog-centered ${dialogClass}`} role="document">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-bottom">
            <h5 id={titleId} className="modal-title fw-bold d-flex align-items-center gap-2">
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer border-top">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
