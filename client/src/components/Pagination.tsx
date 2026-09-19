import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  itemLabel?: string;
  showRange?: boolean;
  ariaLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  itemLabel = "tickets",
  showRange = false,
  ariaLabel = "Page navigation",
}: PaginationProps) {
  const [jumpInput, setJumpInput] = useState<string>("");

  useEffect(() => {
    setJumpInput("");
  }, [page]);

  if (totalPages <= 0) {
    return null;
  }

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpInput("");
    }
  };

  // Generate numbered pages window with ellipses
  const getPageItems = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const delta = 1;
    const range: number[] = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    const items: (number | string)[] = [1];

    if (range.length > 0 && range[0] > 2) {
      items.push("…");
    }

    range.forEach((p) => items.push(p));

    if (range.length > 0 && range[range.length - 1] < totalPages - 1) {
      items.push("…");
    }

    items.push(totalPages);

    return items;
  };

  const pageItems = getPageItems();

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3 pt-2">
      {/* Information text */}
      <div className="text-muted small order-2 order-md-1">
        {showRange && totalItems !== undefined ? (
          <span>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalItems)} of{" "}
            {totalItems} {itemLabel}
          </span>
        ) : (
          <span>
            Page {page} of {totalPages}
            {totalItems !== undefined ? ` · ${totalItems} ${itemLabel}` : ""}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="d-flex align-items-center flex-wrap gap-2 order-1 order-md-2 justify-content-center">
        <nav aria-label={ariaLabel}>
          <ul className="pagination pagination-sm mb-0">
            {/* First Page button */}
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                aria-label="First page"
                title="First page"
              >
                <ChevronsLeft size={14} />
              </button>
            </li>

            {/* Previous Page button */}
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Previous"
              >
                <ChevronLeft size={14} />
                <span className="d-none d-md-inline ms-1">Previous</span>
              </button>
            </li>

            {/* Mobile Page indicator */}
            <li className="page-item disabled d-sm-none">
              <span className="page-link text-dark fw-semibold px-2">
                {page} / {totalPages}
              </span>
            </li>

            {/* Numbered Page Buttons */}
            {pageItems.map((item, idx) => {
              if (typeof item === "string") {
                return (
                  <li key={`ellipsis-${idx}`} className="page-item disabled d-none d-sm-inline-block">
                    <span className="page-link text-muted">…</span>
                  </li>
                );
              }
              const isActive = item === page;
              return (
                <li
                  key={item}
                  className={`page-item ${isActive ? "active" : ""} d-none d-sm-inline-block`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => onPageChange(item)}
                    aria-label={`Page ${item}`}
                  >
                    {item}
                  </button>
                </li>
              );
            })}

            {/* Next Page button */}
            <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Next"
              >
                <span className="d-none d-md-inline me-1">Next</span>
                <ChevronRight size={14} />
              </button>
            </li>

            {/* Last Page button */}
            <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                aria-label="Last page"
                title="Last page"
              >
                <ChevronsRight size={14} />
              </button>
            </li>
          </ul>
        </nav>

        {/* Quick Page Jump Form */}
        {totalPages > 2 && (
          <form
            onSubmit={handleJump}
            className="zg-pagination-jump"
            aria-label="Quick page jump"
          >
            <span className="text-muted small text-nowrap">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              aria-label="Jump to page"
              placeholder="#"
              className="text-center px-1"
              style={{ width: "48px" }}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-sm btn-outline-secondary"
              disabled={
                !jumpInput ||
                isNaN(parseInt(jumpInput, 10)) ||
                parseInt(jumpInput, 10) < 1 ||
                parseInt(jumpInput, 10) > totalPages ||
                parseInt(jumpInput, 10) === page
              }
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
