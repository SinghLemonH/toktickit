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
    headers: { "X-Dev-Requester-Id": String(requesterId) },
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
    headers: { "X-Dev-Requester-Id": String(requesterId) },
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