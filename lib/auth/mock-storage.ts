/**
 * DEV-ONLY mock credential store (localStorage).
 * Replace with Supabase Auth in production.
 */

export type MockUser = { id: string; email: string };

const USERS_KEY = "vstah_mock_users";
const SESSION_KEY = "vstah_mock_session";

type StoredUser = { id: string; email: string; password: string };

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function mockRegister(email: string, password: string): { error?: string } {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "An account with this email already exists." };
  }
  const id = crypto.randomUUID();
  users.push({ id, email: email.trim().toLowerCase(), password });
  writeUsers(users);
  return {};
}

export function mockLogin(email: string, password: string): { user?: MockUser; error?: string } {
  const users = readUsers();
  const found = users.find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password
  );
  if (!found) return { error: "Invalid email or password." };
  const session: MockUser = { id: found.id, email: found.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session };
}

export function mockLogout() {
  localStorage.removeItem(SESSION_KEY);
}

export function mockGetSession(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}
