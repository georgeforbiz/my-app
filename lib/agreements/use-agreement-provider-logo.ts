"use client";

import { useEffect, useState } from "react";
import { readProviderLogoUrl, resolveAgreementProviderLogo } from "@/lib/agreements/logo-image";

/**
 * Prefer the logo stored on the agreement row (works for logged-out share links).
 * Only fall back to this device's localStorage when the viewer is the provider.
 */
export function useAgreementProviderLogo(
  agreement: { provider_id?: string; provider_logo_url?: string } | null | undefined,
  userId?: string | null
): string | undefined {
  const rowLogo = readProviderLogoUrl(agreement?.provider_logo_url) ?? undefined;
  const [logo, setLogo] = useState<string | undefined>(rowLogo);

  useEffect(() => {
    const fromRow = readProviderLogoUrl(agreement?.provider_logo_url) ?? undefined;
    if (fromRow) {
      setLogo(fromRow);
      return;
    }

    // Local fallback only when this browser belongs to the provider.
    const isProviderViewer =
      Boolean(userId) &&
      Boolean(agreement?.provider_id) &&
      userId === agreement?.provider_id;
    if (isProviderViewer) {
      setLogo(resolveAgreementProviderLogo(agreement, userId));
      return;
    }

    setLogo(undefined);
  }, [agreement?.provider_logo_url, agreement?.provider_id, userId]);

  return logo ?? rowLogo;
}
