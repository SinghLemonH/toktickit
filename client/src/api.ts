const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  let healthRes: Response;
  let categoriesRes: Response;
  try {
    healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok) throw new Error();
    categoriesRes = await fetch(`${API_URL}/api/categories`);
    if (!categoriesRes.ok) throw new Error();
  } catch {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

// Lab 2 — Issue #14
export interface DevRequester {
  id: number;
  name: string;
  email: string;
}

export async function getActiveRequesters(): Promise<DevRequester[]> {
  const res = await fetch(`${API_URL}/api/dev-requesters`);
  if (!res.ok) throw new Error("Unable to load development requesters");
  return res.json();
}

// Lab 2 — Issue #15
export async function getActiveCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Unable to load categories");
  return res.json();
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export async function getActiveRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) throw new Error("Unable to load related systems");
  return res.json();
}

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  categoryName: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH";
  itPriority: "LOW" | "MEDIUM" | "HIGH" | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  items: TicketListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface MyTicketsQuery {
  search?: string;
  categoryId?: number;
  requestedPriority?: string;
  itPriority?: string;
  currentStatus?: string;
  sortBy?: "createdAt" | "updatedAt" | "ticketNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getMyTickets(
  requesterId: number,
  query: MyTicketsQuery = {}
): Promise<TicketListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`, {
    headers: requesterId ? { "X-Dev-Requester-Id": String(requesterId) } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to load tickets");
  return res.json();
}
export interface CreateTicketInput {
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH";
  attachments: File[];
}

export interface CreateTicketResult {
  id: number;
  ticketNumber: string;
  failedAttachments: string[];
}

export interface ApiFieldError {
  fields?: Record<string, string>;
  message: string;
}

export class CreateTicketValidationError extends Error {
  fields: Record<string, string>;
  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.fields = fields;
  }
}

export async function createTicket(
  requesterId: number,
  input: CreateTicketInput
): Promise<CreateTicketResult> {
  const formData = new FormData();
  formData.append("categoryId", String(input.categoryId));
  formData.append("relatedSystemId", String(input.relatedSystemId));
  formData.append("summary", input.summary);
  formData.append("description", input.description);
  formData.append("requestedPriority", input.requestedPriority);
  for (const file of input.attachments) {
    formData.append("attachments", file);
  }

  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: requesterId ? { "X-Dev-Requester-Id": String(requesterId) } : {},
    credentials: "include",
    body: formData,
  });

  if (res.status === 400) {
    const body = await res.json();
    const err: ApiFieldError = body.error;
    throw new CreateTicketValidationError(err.message, err.fields ?? {});
  }

  if (!res.ok) {
    throw new Error("Unable to create ticket right now. Please try again.");
  }

  return res.json();
}

export interface AttachmentMetadata {
  id: number;
  originalFilename: string;
  sizeBytes: number;
  uploadedAt: string;
  removedAt: string | null;
  removalReason: string | null;
}

export interface TicketDetail {
  id: number;
  ticketNumber: string;
  ticketDate: string;
  createdAt: string;
  categoryName: string;
  relatedSystemName: string;
  requesterName: string;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH";
  itPriority: string | null;
  currentStatus: string;
  isProblemResolvedIndicated: boolean;
  assignedToId?: number | null;
  assignedTo?: { id: number; name: string; email?: string; role?: string } | null;
  attachments: AttachmentMetadata[];
}

export async function getTicketDetail(
  requesterId: number,
  ticketId: number
): Promise<TicketDetail> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: requesterId ? { "X-Dev-Requester-Id": String(requesterId) } : {},
    credentials: "include",
  });
  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!res.ok) {
    throw new Error("Unable to load ticket details");
  }
  return res.json();
}

export async function uploadAttachment(
  requesterId: number,
  ticketId: number,
  file: File
): Promise<AttachmentMetadata> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: requesterId ? { "X-Dev-Requester-Id": String(requesterId) } : {},
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to upload attachment");
  }

  return res.json();
}

export async function downloadAttachment(
  requesterId: number,
  attachmentId: number,
  filename: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
    headers: requesterId ? { "X-Dev-Requester-Id": String(requesterId) } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to download attachment");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function removeAttachment(
  requesterId: number,
  attachmentId: number,
  reason: string
): Promise<AttachmentMetadata> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      ...(requesterId ? { "X-Dev-Requester-Id": String(requesterId) } : {}),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Unable to remove attachment");
  }

  return res.json();
}

// ----------------------------------------------------------------------------
// SPRINT 3: PUBLIC COMMENTS & RESOLUTION INDICATION (ISSUE #32)
// ----------------------------------------------------------------------------

export interface CommentAuthor {
  id: number;
  name: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
}

export interface PublicComment {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

export async function getPublicComments(ticketId: number): Promise<PublicComment[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to load comments");
  return res.json();
}

export async function postPublicComment(
  ticketId: number,
  content: string
): Promise<PublicComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to post comment");
  }

  return res.json();
}

export async function indicateProblemResolved(
  ticketId: number
): Promise<{ id: number; ticketNumber: string; isProblemResolvedIndicated: boolean }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve-indicated`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to mark problem as resolved");
  }

  return res.json();
}

// ----------------------------------------------------------------------------
// SPRINT 3: IT STAFF TICKET QUEUE & OPERATIONS
// ----------------------------------------------------------------------------

export interface StaffQueueTicket {
  id: number;
  ticketNumber: string;
  createdAt: string;
  updatedAt?: string;
  summary: string;
  category: { id: number; name: string };
  requester: { id: number; name: string; email?: string };
  assignedTo: { id: number; name: string; email?: string; role?: string } | null;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH";
  itPriority: string | null;
  currentStatus: string;
  isProblemResolvedIndicated: boolean;
}

export interface StaffQueueResponse {
  tickets: StaffQueueTicket[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface StaffQueueParams {
  search?: string;
  status?: string;
  categoryId?: number;
  requestedPriority?: string;
  itPriority?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: "IT_STAFF" | "ADMINISTRATOR";
  isActive: boolean;
}

export interface InternalNote {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
}

export async function getStaffTickets(params?: StaffQueueParams): Promise<StaffQueueResponse> {
  const q = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        q.set(key, String(value));
      }
    }
  }
  const res = await fetch(`${API_URL}/api/staff/tickets?${q.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to load staff ticket queue");
  return res.json();
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  const res = await fetch(`${API_URL}/api/staff/users`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to load staff users");
  return res.json();
}

export async function assignStaffTicket(
  ticketId: number,
  assignedToId: number | null
): Promise<TicketDetail> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assignedToId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to assign ticket");
  }
  return res.json();
}

export async function updateTicketItPriority(
  ticketId: number,
  itPriority: string
): Promise<TicketDetail> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itPriority }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to update IT Priority");
  }
  return res.json();
}

export async function updateTicketStatus(
  ticketId: number,
  status: string
): Promise<TicketDetail> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to update ticket status");
  }
  return res.json();
}

export async function getInternalNotes(ticketId: number): Promise<InternalNote[]> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/notes`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unable to load internal notes");
  return res.json();
}

export async function addInternalNote(ticketId: number, content: string): Promise<InternalNote> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Failed to add internal note");
  }
  return res.json();
}

// Lab 3: Issue #34 Administrator User Management
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserFilterParams {
  q?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive?: boolean;
  initialPassword: string;
}

export interface UpdateAdminUserPayload {
  name?: string;
  email?: string;
  role?: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive?: boolean;
}

export async function getAdminUsers(params?: AdminUserFilterParams): Promise<AdminUser[]> {
  const q = new URLSearchParams();
  if (params) {
    if (params.q) q.set("q", params.q);
    if (params.role) q.set("role", params.role);
    if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  }
  const queryStr = q.toString() ? `?${q.toString()}` : "";
  const res = await fetch(`${API_URL}/api/admin/users${queryStr}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || data.error || "Failed to load users");
  }
  return res.json();
}

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || data.error || "Failed to create user");
  }
  return res.json();
}

export async function updateAdminUser(
  userId: number,
  payload: UpdateAdminUserPayload
): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || data.error || "Failed to update user");
  }
  return res.json();
}

export async function resetUserPassword(
  userId: number,
  initialPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ initialPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || data.error || "Failed to reset password");
  }
  return res.json();
}