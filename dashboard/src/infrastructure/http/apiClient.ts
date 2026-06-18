const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; email_verified: boolean }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, "Invalid credentials");
  const data = await res.json();
  return { token: data.access_token as string, email_verified: data.email_verified ?? true };
}

export async function apiRegister(
  email: string,
  name: string,
  password: string,
): Promise<{ token: string; user_id: string; email_verified: boolean }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, detail.detail ?? "Register failed");
  }
  const data = await res.json();
  return { token: data.access_token, user_id: data.user_id, email_verified: data.email_verified ?? false };
}

export async function apiInvite(
  workspaceId: string,
  token: string,
  role = "member",
  expiresHours = 72
): Promise<{ code: string; role: string; expires_at: string | null }> {
  const res = await fetch(`${API_BASE}/workspace/${workspaceId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role, expires_hours: expiresHours }),
  });
  if (!res.ok) throw new ApiError(res.status, "초대코드 생성 실패");
  return res.json();
}

export async function apiDeleteWorkspace(workspaceId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workspace/${workspaceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(res.status, "워크스페이스 삭제 실패");
}

export async function apiCliSession(): Promise<{ session_id: string; auth_url: string }> {
  const res = await fetch(`${API_BASE}/auth/cli/session`, { method: "POST" });
  if (!res.ok) throw new ApiError(res.status, "CLI session failed");
  return res.json();
}

export async function apiCliPoll(sessionId: string): Promise<{ status: string; token?: string; user_id?: string }> {
  const res = await fetch(`${API_BASE}/auth/cli/poll/${sessionId}`);
  if (!res.ok) throw new ApiError(res.status, "Poll failed");
  return res.json();
}

export async function apiCliAuthorize(sessionId: string, jwtToken: string, userId: string, bearerToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/cli/authorize/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearerToken}` },
    body: JSON.stringify({ jwt_token: jwtToken, user_id: userId }),
  });
  if (!res.ok) throw new ApiError(res.status, "Authorize failed");
}
