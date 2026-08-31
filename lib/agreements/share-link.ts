export type ShareChannel = "whatsapp" | "telegram" | "viber";

export function buildShareText(message: string, url: string): string {
  return `${message.trim()} ${url.trim()}`.trim();
}

export function buildWhatsAppShareUrl(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareText(message, url))}`;
}

export function buildTelegramShareUrl(message: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message.trim())}`;
}

export function buildViberShareUrl(message: string, url: string): string {
  return `viber://forward?text=${encodeURIComponent(buildShareText(message, url))}`;
}

export function buildShareChannelUrl(channel: ShareChannel, message: string, url: string): string {
  switch (channel) {
    case "whatsapp":
      return buildWhatsAppShareUrl(message, url);
    case "telegram":
      return buildTelegramShareUrl(message, url);
    case "viber":
      return buildViberShareUrl(message, url);
  }
}

export function openShareChannel(channel: ShareChannel, message: string, url: string): void {
  if (typeof window === "undefined") return;
  window.open(buildShareChannelUrl(channel, message, url), "_blank", "noopener,noreferrer");
}
