"use client";

import { useEffect, useState } from "react";
import { readProviderLogoUrl, resolveAgreementProviderLogo } from "@/lib/agreements/logo-image";

/** Row-only logo for SSR and the first client paint — avoids localStorage hydration mismatches. */
export function useAgreementProviderLogo(
  agreement: { provider_id?: string; provider_logo_url?: string } | null | undefined,
  userId?: string | null
): string | undefined {
  const rowLogo = readProviderLogoUrl(agreement?.provider_logo_url) ?? undefined;
  const [logo, setLogo] = useState<string | undefined>(rowLogo);

  useEffect(() => {
    setLogo(resolveAgreementProviderLogo(agreement, userId));
  }, [agreement, userId]);

  return logo;
}
