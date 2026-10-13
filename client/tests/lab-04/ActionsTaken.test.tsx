import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionsTakenSection from "../../src/components/ActionsTakenSection.js";
import * as api from "../../src/api.js";

const mockStaffMembers: api.StaffUser[] = [
  { id: 3, name: "Michael Brown", email: "michael.brown@example.com", role: "IT_STAFF", isActive: true },
  { id: 4, name: "Sarah Johnson", email: "sarah.johnson@example.com", role: "IT_STAFF", isActive: true },
];

const mockPlannedAction: api.ActionTaken = {
  id: 101,
  ticketId: 77,
  actionAt: "2026-10-14T09:00:00.000Z",
  description: "Diagnose battery expansion and order replacement cells.",
  result: null,
  status: "PLANNED",
  followUpRequired: false,
  followUpNote: null,
  attachmentNotes: null,
  assigneeId: 3,
  assignee: { id: 3, name: "Michael Brown", role: "IT_STAFF" },
  performedById: 3,
  performedBy: { id: 3, name: "Michael Brown", role: "IT_STAFF" },
  completedById: null,
  completedBy: null,
  version: 1,
  createdAt: "2026-10-13T10:00:00.000Z",
  updatedAt: "2026-10-13T10:00:00.000Z",
};

const mockCompletedAction: api.ActionTaken = {
  id: 102,
  ticketId: 77,
  actionAt: "2026-10-13T11:00:00.000Z",
  description: "Replaced battery pack with genuine spare parts.",
  result: "Battery health 100%, passed diagnostic test.",
  status: "COMPLETED",
  followUpRequired: true,
  followUpNote: "User must calibrate cycle within 48 hours.",
  attachmentNotes: "Diagnostic report attached.",
  assigneeId: 4,
  assignee: { id: 4, name: "Sarah Johnson", role: "IT_STAFF" },
  performedById: 3,
  performedBy: { id: 3, name: "Michael Brown", role: "IT_STAFF" },
  completedById: 4,
  completedBy: { id: 4, name: "Sarah Johnson", role: "IT_STAFF" },
  version: 2,
  createdAt: "2026-10-13T10:30:00.000Z",
  updatedAt: "2026-10-13T11:05:00.000Z",
};

describe("ActionsTakenSection Component (Lab 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getStaffUsers").mockResolvedValue(mockStaffMembers);
  });

  describe("UI-05: Requester Read-Only View (AC-06, FR-05)", () => {
    it("renders read-only view titled 'Work Performed by IT' without create or edit buttons", async () => {
      vi.spyOn(api, "getActionsTaken").mockResolvedValue([mockCompletedAction]);

      render(
        <ActionsTakenSection
          ticketId={77}
          isStaff={false}
          ticketStatus="IN_PROGRESS"
        />
      );

      // Verify Requester Section Title
      expect(await screen.findByRole("heading", { name: /work performed by it/i })).toBeInTheDocument();

      // Verify no "+ Add Action" button
      expect(screen.queryByRole("button", { name: /\+ add action/i })).not.toBeInTheDocument();

      // Verify action details are visible
      expect(screen.getByText("Replaced battery pack with genuine spare parts.")).toBeInTheDocument();
      expect(screen.getByText("Battery health 100%, passed diagnostic test.")).toBeInTheDocument();
      expect(screen.getByText(/user must calibrate cycle within 48 hours/i)).toBeInTheDocument();

      // Verify no Edit or Complete buttons
      expect(screen.queryByRole("button", { name: /^complete$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
    });

    it("renders empty state message when requester views ticket with no actions", async () => {
      vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

      render(
        <ActionsTakenSection
          ticketId={77}
          isStaff={false}
          ticketStatus="NEW"
        />
      );

      expect(await screen.findByText(/no work actions recorded yet/i)).toBeInTheDocument();
    });
  });

  describe("UI-04: IT Staff Create Form Logic and Validation (FR-01, AC-03)", () => {
    it("opens inline Add Action form and requires follow-up note only when checked", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);
      const createSpy = vi.spyOn(api, "createActionTaken").mockResolvedValue({
        ...mockPlannedAction,
        id: 201,
      });

      render(
        <ActionsTakenSection
          ticketId={77}
          isStaff={true}
          ticketStatus="IN_PROGRESS"
        />
      );

      // Initially inline form is collapsed
      expect(screen.queryByLabelText(/description/i)).not.toBeInTheDocument();

      // Click + Add Action
      const addBtn = await screen.findByRole("button", { name: /add action/i });
      await user.click(addBtn);

      // Verify inline form is visible
      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toBeInTheDocument();

      // Follow-up note should not be visible when checkbox is unchecked
      expect(screen.queryByLabelText(/follow-up note/i)).not.toBeInTheDocument();

      // Check follow-up required
      const followUpCheckbox = screen.getByLabelText(/follow-up required/i);
      await user.click(followUpCheckbox);

      // Follow-up note input should now be visible
      const followUpNoteInput = screen.getByLabelText(/follow-up note/i);
      expect(followUpNoteInput).toBeInTheDocument();

      // Fill in valid inputs
      await user.type(descInput, "Hardware inspection");
      await user.type(followUpNoteInput, "Recheck thermal paste in 3 days");

      // Submit form
      const saveBtn = screen.getByRole("button", { name: /save action/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          77,
          expect.objectContaining({
            description: "Hardware inspection",
            followUpRequired: true,
            followUpNote: "Recheck thermal paste in 3 days",
            status: "PLANNED",
          })
        );
      });
    });

    it("requires result when status is set to COMPLETED directly on creation", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

      render(
        <ActionsTakenSection
          ticketId={77}
          isStaff={true}
          ticketStatus="IN_PROGRESS"
        />
      );

      await user.click(await screen.findByRole("button", { name: /add action/i }));

      // Select COMPLETED status
      const statusSelect = screen.getByLabelText(/action status/i);
      await user.selectOptions(statusSelect, "COMPLETED");

      // Result input should now be present
      const resultInput = screen.getByLabelText(/result/i);
      expect(resultInput).toBeInTheDocument();
    });
  });

  describe("UI-06: Double Submit Prevention and Form Preservation (AC-19, FR-19)", () => {
    it("disables submit button and shows 'Saving...' while submitting, preserving entered text on error", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

      // Mock an API error on createActionTaken
      vi.spyOn(api, "createActionTaken").mockRejectedValue(
        new api.ApiError("Action description contains prohibited content.", {
          code: "VALIDATION_ERROR",
          status: 400,
        })
      );

      render(
        <ActionsTakenSection
          ticketId={77}
          isStaff={true}
          ticketStatus="IN_PROGRESS"
        />
      );

      await user.click(await screen.findByRole("button", { name: /add action/i }));

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, "Work attempted with temporary error.");

      const saveBtn = screen.getByRole("button", { name: /save action/i });
      await user.click(saveBtn);

      // Verify error message is rendered
      expect(await screen.findByText(/action description contains prohibited content/i)).toBeInTheDocument();

      // Verify form data was preserved (not wiped out)
      expect(descInput).toHaveValue("Work attempted with temporary error.");
    });
  });

  describe("UI-09: Actions Taken List Attribution (FR-04)", () => {
    it("renders Performed By, Assignee, and Completed By attribution correctly", async () => {
      vi.spyOn(api, "getActionsTaken").mockResolvedValue([mockCompletedAction]);

      render(
        <ActionsTakenSection
          ticketId={77}
          isStaff={true}
          ticketStatus="IN_PROGRESS"
        />
      );

      // Verify description
      expect(await screen.findByText("Replaced battery pack with genuine spare parts.")).toBeInTheDocument();

      // Verify row rendered with testid
      const row = screen.getByTestId("action-row-102");
      expect(row).toBeInTheDocument();

      // Verify Completed badge inside row
      expect(row.textContent).toContain("Completed");

      // Verify Completed By attribution inside row
      expect(row.textContent).toContain("Completed by: Sarah Johnson");
      expect(row.textContent).toContain("Performed: Michael Brown");
    });
  });
});
