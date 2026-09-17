import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext.js";
import Login from "../../src/pages/Login.js";

function renderLogin() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe("Login Component (UI-01, AC-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the login form with required fields and branding", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: "TokTickIT" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows validation error messages when submitting empty form", async () => {
    renderLogin();
    const user = userEvent.setup();

    const submitBtn = screen.getByRole("button", { name: "Sign In" });
    await user.click(submitBtn);

    expect(await screen.findByText("Email address is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("displays safe error banner on invalid credentials without user leakage", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/login")) {
        return new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ user: null }), { status: 401 });
    });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email Address"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "WrongPassword123!");

    const submitBtn = screen.getByRole("button", { name: "Sign In" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("disables the submit button while login request is in flight", async () => {
    let resolveLogin: (value: Response) => void;
    const loginPromise = new Promise<Response>((resolve) => {
      resolveLogin = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/login")) {
        return loginPromise;
      }
      return new Response(JSON.stringify({ user: null }), { status: 401 });
    });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");

    const submitBtn = screen.getByRole("button", { name: "Sign In" });
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();

    resolveLogin!(
      new Response(
        JSON.stringify({
          user: { id: 1, email: "test@example.com", name: "Test User", role: "REQUESTER", mustChangePassword: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  });
});
