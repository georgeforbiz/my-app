/**
 * DEV-ONLY mock credential store (localStorage).
 * Replace with Supabase Auth in production.
 */

export type MockUser = {
  id: string;
  email: string;
  full_name?: string;
  business_name?: string;
  phone_number?: string;
  service_area?: string;
  service_category?: string;
};

const USERS_KEY = "vstah_mock_users";
const SESSION_KEY = "vstah_mock_session";

type StoredUser = {
  id: string;
  email: string;
  password: string;
  full_name?: string;
  business_name?: string;
  phone_number?: string;
  service_area?: string;
  service_category?: string;
};

export type MockRegisterMetadata = {
  full_name?: string;
  business_name?: string;
  phone_number?: string;
  service_area?: string;
  service_category?: string;
};

export type MockProfileUpdate = MockRegisterMetadata;

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
  const phone_number = metadata?.phone_number?.trim() || undefined;
  const service_area = metadata?.service_area?.trim() || undefined;
  const service_category = metadata?.service_category?.trim() || undefined;
  users.push({
    id,
    email: email.trim().toLowerCase(),
    password,
    ...(full_name ? { full_name } : {}),
    ...(business_name ? { business_name } : {}),
    ...(phone_number ? { phone_number } : {}),
    ...(service_area ? { service_area } : {}),
    ...(service_category ? { service_category } : {})
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
    ...(found.business_name ? { business_name: found.business_name } : {}),
    ...(found.phone_number ? { phone_number: found.phone_number } : {}),
    ...(found.service_area ? { service_area: found.service_area } : {}),
    ...(found.service_category ? { service_category: found.service_category } : {})
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
      ...(stored.business_name ? { business_name: stored.business_name } : {}),
      ...(stored.phone_number ? { phone_number: stored.phone_number } : {}),
      ...(stored.service_area ? { service_area: stored.service_area } : {}),
      ...(stored.service_category ? { service_category: stored.service_category } : {})
    };
  } catch {
    return null;
  }
}

export function mockUpdateProfile(userId: string, profile: MockProfileUpdate): { user?: MockUser; error?: string } {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { error: "Account not found." };

  const current = users[index];
  const next: StoredUser = {
    ...current,
    ...(profile.full_name !== undefined ? { full_name: profile.full_name.trim() || undefined } : {}),
    ...(profile.business_name !== undefined ? { business_name: profile.business_name.trim() || undefined } : {}),
    ...(profile.phone_number !== undefined ? { phone_number: profile.phone_number.trim() || undefined } : {}),
    ...(profile.service_area !== undefined ? { service_area: profile.service_area.trim() || undefined } : {}),
    ...(profile.service_category !== undefined
      ? { service_category: profile.service_category.trim() || undefined }
      : {})
  };
  users[index] = next;
  writeUsers(users);

  const sessionRaw = localStorage.getItem(SESSION_KEY);
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as MockUser;
      if (session.id === userId) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            id: next.id,
            email: next.email,
            ...(next.full_name ? { full_name: next.full_name } : {}),
            ...(next.business_name ? { business_name: next.business_name } : {}),
            ...(next.phone_number ? { phone_number: next.phone_number } : {}),
            ...(next.service_area ? { service_area: next.service_area } : {}),
            ...(next.service_category ? { service_category: next.service_category } : {})
          })
        );
      }
    } catch {
      // ignore
    }
  }

  return {
    user: {
      id: next.id,
      email: next.email,
      ...(next.full_name ? { full_name: next.full_name } : {}),
      ...(next.business_name ? { business_name: next.business_name } : {}),
      ...(next.phone_number ? { phone_number: next.phone_number } : {}),
      ...(next.service_area ? { service_area: next.service_area } : {}),
      ...(next.service_category ? { service_category: next.service_category } : {})
    }
  };
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
