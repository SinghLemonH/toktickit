import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext.js";
import ChangePassword from "../../src/pages/ChangePassword.js";

function renderChangePassword() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe("ChangePassword Component (UI-02, AC-04, AC-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form fields, headings, and password requirement checklist", () => {
    renderChangePassword();

    expect(
      screen.getByRole("heading", { name: "Change Your Password" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current (Temporary) Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Include uppercase and lowercase letters")).toBeInTheDocument();
    expect(screen.getByText("Include a number and a special character")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Continue to TokTickIT" });
    expect(submitBtn).toBeDisabled();
  });

  it("keeps submit button disabled while requirements are incomplete or passwords mismatch", async () => {
    renderChangePassword();
    const user = userEvent.setup();

    const currentPassInput = screen.getByLabelText("Current (Temporary) Password");
    const newPassInput = screen.getByLabelText("New Password");
    const confirmPassInput = screen.getByLabelText("Confirm New Password");
    const submitBtn = screen.getByRole("button", { name: "Continue to TokTickIT" });

    // Only current password filled
    await user.type(currentPassInput, "InitialPass123!");
    expect(submitBtn).toBeDisabled();

    // Partial new password (missing digit, special, and uppercase)
    await user.type(newPassInput, "short");
    await user.type(confirmPassInput, "short");
    expect(submitBtn).toBeDisabled();

    // Passwords do not match
    await user.clear(newPassInput);
    await user.clear(confirmPassInput);
    await user.type(newPassInput, "SecurePass2026!");
    await user.type(confirmPassInput, "DifferentPass2026!");
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("enables submit button only when all complexity rules and password match are satisfied", async () => {
    renderChangePassword();
    const user = userEvent.setup();

    const currentPassInput = screen.getByLabelText("Current (Temporary) Password");
    const newPassInput = screen.getByLabelText("New Password");
    const confirmPassInput = screen.getByLabelText("Confirm New Password");
    const submitBtn = screen.getByRole("button", { name: "Continue to TokTickIT" });

    await user.type(currentPassInput, "InitialPass123!");
    await user.type(newPassInput, "SecurePass2026!");
    await user.type(confirmPassInput, "SecurePass2026!");

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it("displays server error banner when change password request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/change-password")) {
        return new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "Current password is incorrect" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ user: null }), { status: 401 });
    });

    renderChangePassword();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Current (Temporary) Password"), "WrongInitialPass!");
    await user.type(screen.getByLabelText("New Password"), "SecurePass2026!");
    await user.type(screen.getByLabelText("Confirm New Password"), "SecurePass2026!");

    const submitBtn = screen.getByRole("button", { name: "Continue to TokTickIT" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Current password is incorrect")).toBeInTheDocument();
    });
  });
});
