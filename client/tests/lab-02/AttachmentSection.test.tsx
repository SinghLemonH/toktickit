import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AttachmentSection from "../../src/components/AttachmentSection.js";
import * as api from "../../src/api.js";

const mockAttachments: api.AttachmentMetadata[] = [
  {
    id: 1,
    originalFilename: "active_log.pdf",
    sizeBytes: 204800,
    uploadedAt: "2026-09-05T08:00:00.000Z",
    removedAt: null,
    removalReason: null,
  },
  {
    id: 2,
    originalFilename: "obsolete_screenshot.png",
    sizeBytes: 512000,
    uploadedAt: "2026-09-05T08:10:00.000Z",
    removedAt: "2026-09-05T08:30:00.000Z",
    removalReason: "Uploaded wrong screenshot by mistake",
  },
];

describe("AttachmentSection Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active and soft-removed attachments distinctly (UI-12, AC-16)", () => {
    render(
      <AttachmentSection
        ticketId={123}
        requesterId={1}
        attachments={mockAttachments}
        onAttachmentsUpdated={() => {}}
      />
    );

    // Active item has Download button
    expect(screen.getByText("active_log.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download active_log\.pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove active_log\.pdf/i })).toBeInTheDocument();

    // Removed item has Unavailable indicator and shows reason, with download disabled or absent
    expect(screen.getByText("obsolete_screenshot.png")).toBeInTheDocument();
    expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded wrong screenshot by mistake/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download obsolete_screenshot\.png/i })
    ).not.toBeInTheDocument();
  });

  it("requires a non-empty removal reason before Confirm button is enabled (UI-11, AC-15)", async () => {
    const removeSpy = vi.spyOn(api, "removeAttachment").mockResolvedValue({
      id: 1,
      originalFilename: "active_log.pdf",
      sizeBytes: 204800,
      uploadedAt: "2026-09-05T08:00:00.000Z",
      removedAt: "2026-09-05T08:35:00.000Z",
      removalReason: "Confidential data removed",
    });

    const onUpdate = vi.fn();
    render(
      <AttachmentSection
        ticketId={123}
        requesterId={1}
        attachments={mockAttachments}
        onAttachmentsUpdated={onUpdate}
      />
    );

    // Click remove on the active attachment
    await userEvent.click(screen.getByRole("button", { name: /remove active_log\.pdf/i }));

    // Modal or input prompt appears
    const confirmButton = screen.getByRole("button", { name: /confirm remove/i });
    expect(confirmButton).toBeDisabled();

    // Type empty spaces
    const reasonInput = screen.getByLabelText(/removal reason/i);
    await userEvent.type(reasonInput, "   ");
    expect(confirmButton).toBeDisabled();

    // Type valid reason
    await userEvent.type(reasonInput, "Confidential data removed");
    expect(confirmButton).not.toBeDisabled();

    // Confirm removal
    await userEvent.click(confirmButton);
    expect(removeSpy).toHaveBeenCalledWith(1, 1, "Confidential data removed");
  });
});
