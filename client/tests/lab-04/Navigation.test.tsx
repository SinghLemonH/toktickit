import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppShell from "../../src/components/AppShell.js";
import RouteGuard from "../../src/components/RouteGuard.js";
import { AuthContext, type AuthContextType, type AuthUser } from "../../src/context/AuthContext.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

function renderAs(role: AuthUser["role"], path: string) {
  const user: AuthUser = {
    id: 7,
    email: "person@example.test",
    name: "Test Person",
    role,
    mustChangePassword: false,
  };
  const auth: AuthContextType = {
    user,
    loading: false,
    isConfigured: true,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    refreshUser: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={auth}>
        <RequesterProvider>
          <Routes>
            <Route
              path="/staff/dashboard"
              element={
                <RouteGuard allowedRoles={["IT_STAFF", "ADMINISTRATOR"]}>
                  <AppShell><h1>Staff dashboard content</h1></AppShell>
                </RouteGuard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RouteGuard allowedRoles={["ADMINISTRATOR"]}>
                  <AppShell><h1>Administrator content</h1></AppShell>
                </RouteGuard>
              }
            />
          </Routes>
        </RequesterProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Lab 4 role-aware navigation and route authorization", () => {
  it("shows staff dashboard and queue navigation to IT Staff", () => {
    renderAs("IT_STAFF", "/staff/dashboard");
    expect(screen.getByRole("heading", { name: "Staff dashboard content" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /Ticket Queue/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /User Management/ })).not.toBeInTheDocument();
  });

  it("shows administrator navigation including user management", () => {
    renderAs("ADMINISTRATOR", "/staff/dashboard");
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /User Management/ })).toHaveAttribute("href", "/admin/users");
  });

  it("renders a clear forbidden page for an authenticated user without permission", () => {
    renderAs("IT_STAFF", "/admin/users");
    expect(screen.getByRole("heading", { name: "Access Denied" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("heading", { name: "Administrator content" })).not.toBeInTheDocument();
  });
});
