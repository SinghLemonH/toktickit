import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Key,
  ShieldAlert,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetUserPassword,
  type AdminUser,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import Pagination from "../components/Pagination.js";

function generateSafePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";

  let pass = "";
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += symbols[Math.floor(Math.random() * symbols.length)];

  const all = upper + lower + digits + symbols;
  for (let i = 0; i < 8; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return pass
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState<"REQUESTER" | "IT_STAFF" | "ADMINISTRATOR">("REQUESTER");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createPassword, setCreatePassword] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"REQUESTER" | "IT_STAFF" | "ADMINISTRATOR">("REQUESTER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset password state
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUsers({
        q: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Active admin count
  const activeAdminCount = users.filter(
    (u) => u.role === "ADMINISTRATOR" && u.isActive
  ).length;

  // Open Edit Modal
  const handleOpenEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditIsActive(u.isActive);
    setEditError(null);
  };

  // Open Reset Password Modal
  const handleOpenReset = (u: AdminUser) => {
    setResetTargetUser(u);
    setResetPasswordVal(generateSafePassword());
    setResetError(null);
    setIsResetPassOpen(true);
  };

  // Handle Create User Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await createAdminUser({
        name: createName.trim(),
        email: createEmail.trim(),
        role: createRole,
        isActive: createIsActive,
        initialPassword: createPassword,
      });
      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("REQUESTER");
      setCreateIsActive(true);
      setSuccessMsg("User account created successfully.");
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      await updateAdminUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        isActive: editIsActive,
      });
      setEditingUser(null);
      setSuccessMsg("User account updated successfully.");
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    try {
      setResetSubmitting(true);
      setResetError(null);
      await resetUserPassword(resetTargetUser.id, resetPasswordVal);
      setIsResetPassOpen(false);
      setResetTargetUser(null);
      setResetPasswordVal("");
      setSuccessMsg("Initial password reset successfully; user must change it upon next login.");
      fetchUsers();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Pagination calculation
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  // Safety checks for editing user
  const isEditingSelf = currentUser?.id === editingUser?.id;
  const isEditingSoleActiveAdmin =
    editingUser?.role === "ADMINISTRATOR" &&
    editingUser?.isActive &&
    activeAdminCount <= 1;

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "bg-success text-white";
      case "IT_STAFF":
        return "bg-primary text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Users size={26} className="text-success" />
            User Management
          </h2>
          <p className="text-muted small mb-0">
            Provision user accounts, configure roles, and manage credentials with security guards.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-1 shadow-sm"
          onClick={() => {
            setCreatePassword(generateSafePassword());
            setCreateError(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus size={16} />
          + Create User
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success d-flex justify-content-between align-items-center py-2" role="alert">
          <span className="d-flex align-items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </span>
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-8 col-md-4">
              <select
                aria-label="Role Filter"
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="REQUESTER">Requester</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            </div>
            <div className="col-4 col-md-2 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={() => fetchUsers()}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2 text-success" role="status" />
          Loading user directory...
        </div>
      ) : users.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <Users size={36} className="text-muted mb-2 opacity-50" />
            <h5 className="fw-bold text-secondary">No users found</h5>
            <p className="text-muted small">Try modifying your search or role filter criteria.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block card border-0 shadow-sm">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-3">Full Name</th>
                  <th scope="col">Email Address</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Must Change Pass</th>
                  <th scope="col" className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="ps-3 fw-semibold text-dark">
                      {u.name}
                      {currentUser?.id === u.id && (
                        <span className="badge bg-light text-success border ms-2 small">You</span>
                      )}
                    </td>
                    <td className="text-muted small">{u.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2">
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border rounded-pill px-2">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      {u.mustChangePassword ? (
                        <span className="badge bg-warning-subtle text-dark border border-warning-subtle small">
                          Yes
                        </span>
                      ) : (
                        <span className="text-muted small">No</span>
                      )}
                    </td>
                    <td className="text-end pe-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleOpenEdit(u)}
                        aria-label={`Edit ${u.name}`}
                      >
                        <Edit2 size={13} className="me-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="d-md-none">
            {paginatedUsers.map((u) => (
              <div key={u.id} className="card border-0 shadow-sm mb-2 p-3">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <h6 className="mb-0 fw-bold">
                      {u.name}
                      {currentUser?.id === u.id && (
                        <span className="badge bg-light text-success border ms-1 small">You</span>
                      )}
                    </h6>
                    <div className="text-muted small">{u.email}</div>
                  </div>
                  <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                  <div>
                    {u.isActive ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill me-1">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary border rounded-pill me-1">
                        Inactive
                      </span>
                    )}
                    {u.mustChangePassword && (
                      <span className="badge bg-warning-subtle text-dark border border-warning-subtle small">
                        Pwd Change
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleOpenEdit(u)}
                  >
                    <Edit2 size={13} className="me-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="users"
            ariaLabel="User Management Pagination"
          />
        </>
      )}

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" id="create-user-title">
                  + Create New User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsCreateOpen(false)}
                />
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {createError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="create-name" className="form-label small fw-semibold">
                      Full Name *
                    </label>
                    <input
                      id="create-name"
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. John Doe"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="create-email" className="form-label small fw-semibold">
                      Email Address *
                    </label>
                    <input
                      id="create-email"
                      type="email"
                      className="form-control"
                      required
                      placeholder="e.g. user@example.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="create-role" className="form-label small fw-semibold">
                      System Role *
                    </label>
                    <select
                      id="create-role"
                      className="form-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as any)}
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="create-password" className="form-label small fw-semibold mb-0">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-success text-decoration-none"
                        onClick={() => setCreatePassword(generateSafePassword())}
                      >
                        Generate Safe Password
                      </button>
                    </div>
                    <input
                      id="create-password"
                      type="text"
                      className="form-control font-monospace"
                      required
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                    />
                    <div className="form-text small text-muted">
                      User will be required to change password upon first login.
                    </div>
                  </div>
                  <div className="form-check form-switch mt-2">
                    <input
                      id="create-active"
                      type="checkbox"
                      className="form-check-input"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                    />
                    <label htmlFor="create-active" className="form-check-label small">
                      Active Account
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? "Saving..." : "Save User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" id="edit-user-title">
                  Edit User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingUser(null)}
                />
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  {editError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {editError}
                    </div>
                  )}

                  {/* Safety Guard Warning: Sole active admin */}
                  {isEditingSoleActiveAdmin && (
                    <div className="alert alert-warning py-2 small d-flex align-items-center gap-2" role="alert">
                      <AlertTriangle size={16} />
                      <span>At least one active Administrator must exist. Deactivation and demotion are disabled.</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="edit-name" className="form-label small fw-semibold">
                      Full Name *
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      className="form-control"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-email" className="form-label small fw-semibold">
                      Email Address *
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      className="form-control"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-role" className="form-label small fw-semibold">
                      System Role *
                    </label>
                    <select
                      id="edit-role"
                      className="form-select"
                      value={editRole}
                      disabled={isEditingSoleActiveAdmin}
                      onChange={(e) => setEditRole(e.target.value as any)}
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <div className="form-check form-switch">
                      <input
                        id="edit-active"
                        type="checkbox"
                        className="form-check-input"
                        checked={editIsActive}
                        disabled={isEditingSelf || isEditingSoleActiveAdmin}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                      />
                      <label htmlFor="edit-active" className="form-check-label small fw-semibold">
                        Active Account
                      </label>
                    </div>
                    {isEditingSelf && (
                      <div className="text-danger small mt-1">
                        <ShieldAlert size={14} className="me-1" />
                        You cannot deactivate your own account.
                      </div>
                    )}
                  </div>

                  {/* Password Reset Action */}
                  <div className="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="small fw-semibold text-dark">Password Management</div>
                      <div className="text-muted small">Set temporary credentials forcing next-login change.</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      onClick={() => handleOpenReset(editingUser)}
                    >
                      <Key size={13} />
                      Reset Initial Password
                    </button>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET INITIAL PASSWORD MODAL */}
      {isResetPassOpen && resetTargetUser && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-pass-title"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" id="reset-pass-title">
                  Reset Initial Password: {resetTargetUser.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsResetPassOpen(false)}
                />
              </div>
              <form onSubmit={handleResetSubmit}>
                <div className="modal-body">
                  {resetError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {resetError}
                    </div>
                  )}
                  <p className="text-muted small">
                    This will immediately overwrite the current password and mark the account as requiring a password change upon the next sign-in.
                  </p>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="reset-pass-input" className="form-label small fw-semibold mb-0">
                        New Initial Password *
                      </label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-success text-decoration-none"
                        onClick={() => setResetPasswordVal(generateSafePassword())}
                      >
                        Generate Safe Password
                      </button>
                    </div>
                    <input
                      id="reset-pass-input"
                      type="text"
                      className="form-control font-monospace"
                      required
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsResetPassOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? "Updating..." : "Set Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
