"use client";

import { Copy, Eye } from "lucide-react";
import { openShareChannel, type ShareChannel } from "@/lib/agreements/share-link";

export type AgreementShareLabels = {
  publicLink: string;
  shareHint: string;
  copyToClipboard: string;
  copied: string;
  shareVia: string;
  shareWhatsApp: string;
  shareTelegram: string;
  shareViber: string;
  shareMessage: string;
  close: string;
  previewAgreement?: string;
};

type AgreementShareDialogProps = {
  title: string;
  subtitle: string;
  url: string;
  labels: AgreementShareLabels;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
  onPreview?: () => void;
};

function MessengerButton({
  channel,
  label,
  className,
  onClick
}: {
  channel: ShareChannel;
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 ${className}`}
    >
      <MessengerIcon channel={channel} />
      <span>{label}</span>
    </button>
  );
}

function MessengerIcon({ channel }: { channel: ShareChannel }) {
  if (channel === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }

  if (channel === "telegram") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.43a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.166 8.166 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.48-.63 1.18-.77 1.41-.14.24-.29.27-.54.08-.25-.2-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z" />
    </svg>
  );
}

export function AgreementShareDialog({
  title,
  subtitle,
  url,
  labels,
  copied,
  onCopy,
  onClose,
  onPreview
}: AgreementShareDialogProps) {
  const share = (channel: ShareChannel) => {
    openShareChannel(channel, labels.shareMessage, url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-labelledby="agreement-share-title"
      >
        <h3 id="agreement-share-title" className="text-xl font-extrabold text-emerald-700">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.publicLink}</p>
          <p className="mt-1 break-all text-sm font-bold text-slate-900">{url}</p>
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2A800] px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95"
        >
          <Copy className="h-4 w-4" />
          {copied ? labels.copied : labels.copyToClipboard}
        </button>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.shareVia}</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <MessengerButton
            channel="whatsapp"
            label={labels.shareWhatsApp}
            className="bg-[#25D366]"
            onClick={() => share("whatsapp")}
          />
          <MessengerButton
            channel="telegram"
            label={labels.shareTelegram}
            className="bg-[#229ED9]"
            onClick={() => share("telegram")}
          />
          <MessengerButton
            channel="viber"
            label={labels.shareViber}
            className="bg-[#7360F2]"
            onClick={() => share("viber")}
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-500">{labels.shareHint}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              {labels.previewAgreement}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${onPreview ? "ml-auto" : "w-full sm:w-auto"}`}
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
}
