/**
 * DEV-ONLY mock credential store (localStorage).
 * Replace with Supabase Auth in production.
 */

export type MockUser = {
  id: string;
  email: string;
  full_name?: string;
  business_name?: string;
};

const USERS_KEY = "vstah_mock_users";
const SESSION_KEY = "vstah_mock_session";

type StoredUser = {
  id: string;
  email: string;
  password: string;
  full_name?: string;
  business_name?: string;
};

export type MockRegisterMetadata = {
  full_name?: string;
  business_name?: string;
};

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

export function mockRegister(
  email: string,
  password: string,
  metadata?: MockRegisterMetadata
): { error?: string } {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "An account with this email already exists." };
  }
  const id = crypto.randomUUID();
  const full_name = metadata?.full_name?.trim() || undefined;
  const business_name = metadata?.business_name?.trim() || undefined;
  users.push({
    id,
    email: email.trim().toLowerCase(),
    password,
    ...(full_name ? { full_name } : {}),
    ...(business_name ? { business_name } : {})
  });
  writeUsers(users);
  return {};
}

export function mockVerifyCredentials(email: string, password: string): MockUser | null {
  const users = readUsers();
  const found = users.find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password
  );
  if (!found) return null;
  return {
    id: found.id,
    email: found.email,
    ...(found.full_name ? { full_name: found.full_name } : {}),
    ...(found.business_name ? { business_name: found.business_name } : {})
  };
}

export function mockLogin(email: string, password: string): { user?: MockUser; error?: string } {
  const user = mockVerifyCredentials(email, password);
  if (!user) return { error: "Invalid email or password." };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { user };
}

export function mockLogout() {
  localStorage.removeItem(SESSION_KEY);
}

export function mockGetSession(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as MockUser;
    const stored = readUsers().find((u) => u.id === session.id || u.email === session.email);
    if (!stored) return session;
    return {
      id: stored.id,
      email: stored.email,
      ...(stored.full_name ? { full_name: stored.full_name } : {}),
      ...(stored.business_name ? { business_name: stored.business_name } : {})
    };
  } catch {
    return null;
  }
}

/** Public mock user list for admin UI — never includes passwords. */
export function listMockUsers(): MockUser[] {
  return readUsers().map((u) => ({
    id: u.id,
    email: u.email,
    ...(u.full_name ? { full_name: u.full_name } : {}),
    ...(u.business_name ? { business_name: u.business_name } : {})
  }));
}
