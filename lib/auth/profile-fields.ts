import type { SignUpMetadata } from "./auth-context";

export type ServiceCategory = SignUpMetadata["service_category"];

export type ProviderProfile = {
  full_name: string;
  business_name: string;
  phone_number: string;
  service_area: string;
  service_category: ServiceCategory;
};

/** Editable fields on the settings page (service category stays from signup). */
export type ProviderProfileSettingsInput = Omit<ProviderProfile, "service_category">;

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "General Contractor",
  "Renovations",
  "Electricity",
  "Cleaning",
  "Other"
];

export function normalizeServiceCategory(raw: unknown): ServiceCategory {
  const value = String(raw ?? "").trim();
  return (SERVICE_CATEGORIES.includes(value as ServiceCategory) ? value : "General Contractor") as ServiceCategory;
}

export function displayNamesFromMetadata(meta: Record<string, unknown> | undefined): {
  full_name: string;
  business_name: string;
} {
  const m = meta ?? {};
  let full_name = String(m.full_name ?? m.fullName ?? "").trim();
  let business_name = String(m.business_name ?? m.businessName ?? "").trim();
  if (!full_name && !business_name) {
    const legacy = String(m.full_name_or_business_name ?? "").trim();
    if (legacy) {
      const match = legacy.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (match) {
        business_name = match[1].trim();
        full_name = match[2].trim();
      } else {
        full_name = legacy;
      }
    }
  }
  return { full_name, business_name };
}

export function profileFromMetadata(meta: Record<string, unknown> | undefined): ProviderProfile {
  const names = displayNamesFromMetadata(meta);
  return {
    full_name: names.full_name,
    business_name: names.business_name,
    phone_number: String(meta?.phone_number ?? "").trim(),
    service_area: String(meta?.service_area ?? "").trim(),
    service_category: normalizeServiceCategory(meta?.service_category)
  };
}

export function metadataFromProfile(profile: ProviderProfile): Record<string, string> {
  const full_name = profile.full_name.trim();
  const business_name = profile.business_name.trim();
  const phone_number = profile.phone_number.trim();
  const service_area = profile.service_area.trim();
  const payload: Record<string, string> = {
    full_name,
    business_name,
    phone_number,
    service_area,
    service_category: profile.service_category
  };
  if (business_name && full_name) {
    payload.full_name_or_business_name = `${business_name} (${full_name})`;
  } else if (business_name || full_name) {
    payload.full_name_or_business_name = business_name || full_name;
  }
  return payload;
}

export function isProviderProfileComplete(profile: ProviderProfile): boolean {
  return Boolean(
    profile.full_name.trim() &&
      profile.business_name.trim() &&
      profile.phone_number.trim() &&
      profile.service_area.trim()
  );
}
