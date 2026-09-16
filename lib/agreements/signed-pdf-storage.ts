import type { SupabaseClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import { formatDateDMY } from "@/lib/format-date";
import {
  isMissingColumnOrSchemaCacheError,
  normalizeAgreementRow,
  termsForDisplay,
  type NormalizedAgreement
} from "@/lib/agreements/row";

export const SIGNED_AGREEMENTS_BUCKET = "signed-agreements";

/** Brand colors (RGB) for jsPDF — matches VSTAH navy / gold. */
const NAVY: [number, number, number] = [0, 51, 160];
const NAVY_SOFT: [number, number, number] = [232, 238, 248];
const SLATE: [number, number, number] = [51, 65, 85];
const SLATE_MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const EMERALD: [number, number, number] = [6, 95, 70];
const EMERALD_BG: [number, number, number] = [236, 253, 245];

const PAGE = {
  width: 210,
  height: 297,
  marginX: 16,
  marginTop: 18,
  marginBottom: 18,
  contentWidth: 178
} as const;

function money(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} AMD`;
}

function wrapLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const wrapped = doc.splitTextToSize(paragraph, maxWidth);
    if (Array.isArray(wrapped)) lines.push(...wrapped.map(String));
    else lines.push(String(wrapped));
  }
  return lines;
}

function shortId(id: string): string {
  const year = new Date().getFullYear();
  const prefix = id.split("-")[0]?.toUpperCase() || id.slice(0, 8).toUpperCase();
  return `VSTAH-${year}-${prefix}`;
}

type PdfCtx = {
  doc: jsPDF;
  y: number;
  page: number;
};

function ensureSpace(ctx: PdfCtx, needed: number): void {
  const limit = PAGE.height - PAGE.marginBottom;
  if (ctx.y + needed <= limit) return;
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = PAGE.marginTop;
  drawPageChrome(ctx);
}

function drawPageChrome(ctx: PdfCtx): void {
  const { doc } = ctx;
  // Top brand bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE.width, 3.2, "F");
  // Footer rule + page number
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginX, PAGE.height - 12, PAGE.width - PAGE.marginX, PAGE.height - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_MUTED);
  doc.text("VSTAH  ·  Building Trust in Every Project", PAGE.marginX, PAGE.height - 7);
  doc.text(String(ctx.page), PAGE.width - PAGE.marginX, PAGE.height - 7, { align: "right" });
}

function drawHeader(ctx: PdfCtx, agreement: NormalizedAgreement): void {
  const { doc } = ctx;
  drawPageChrome(ctx);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("VSTAH", PAGE.marginX, ctx.y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_MUTED);
  doc.text("Service Agreement", PAGE.marginX, ctx.y + 5);

  const statusLabel =
    agreement.status === "completed"
      ? "Completed"
      : agreement.status === "signed"
        ? "Signed & Approved"
        : "Pending signature";

  doc.setFillColor(...(agreement.status === "pending" ? NAVY_SOFT : EMERALD_BG));
  const badgeW = doc.getTextWidth(statusLabel) + 8;
  doc.roundedRect(PAGE.width - PAGE.marginX - badgeW, ctx.y - 4, badgeW, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...(agreement.status === "pending" ? NAVY : EMERALD));
  doc.text(statusLabel, PAGE.width - PAGE.marginX - badgeW / 2, ctx.y + 0.8, { align: "center" });

  ctx.y += 12;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(PAGE.marginX, ctx.y, PAGE.width - PAGE.marginX, ctx.y);
  ctx.y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text("SERVICE AGREEMENT", PAGE.marginX, ctx.y);
  ctx.y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_MUTED);
  const meta = [
    `Ref: ${shortId(agreement.id)}`,
    `Created: ${formatDateDMY(agreement.created_at) || "—"}`,
    agreement.signed_at ? `Signed: ${formatDateDMY(agreement.signed_at)}` : null
  ]
    .filter(Boolean)
    .join("   ·   ");
  doc.text(meta, PAGE.marginX, ctx.y);
  ctx.y += 10;
}

function drawSectionTitle(ctx: PdfCtx, title: string): void {
  ensureSpace(ctx, 14);
  const { doc } = ctx;
  doc.setFillColor(...NAVY_SOFT);
  doc.roundedRect(PAGE.marginX, ctx.y - 4.5, PAGE.contentWidth, 8, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(title.toUpperCase(), PAGE.marginX + 3, ctx.y);
  ctx.y += 8;
}

function drawKeyValueGrid(
  ctx: PdfCtx,
  rows: Array<{ label: string; value: string }>
): void {
  const { doc } = ctx;
  const labelW = 42;
  const valueW = PAGE.contentWidth - labelW - 2;

  for (const row of rows) {
    if (!row.value.trim()) continue;
    const valueLines = wrapLines(doc, row.value, valueW);
    const blockH = Math.max(1, valueLines.length) * 4.4 + 2;
    ensureSpace(ctx, blockH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(row.label, PAGE.marginX, ctx.y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    let lineY = ctx.y;
    for (const line of valueLines) {
      doc.text(line || " ", PAGE.marginX + labelW, lineY);
      lineY += 4.4;
    }
    ctx.y = Math.max(ctx.y + 5, lineY + 1);
  }
  ctx.y += 2;
}

function drawBodyText(ctx: PdfCtx, text: string): void {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  const lines = wrapLines(doc, text, PAGE.contentWidth);
  for (const line of lines) {
    ensureSpace(ctx, 5);
    doc.text(line || " ", PAGE.marginX, ctx.y);
    ctx.y += 4.4;
  }
  ctx.y += 3;
}

function drawTwoColumnCards(
  ctx: PdfCtx,
  left: { title: string; lines: string[] },
  right: { title: string; lines: string[] }
): void {
  const { doc } = ctx;
  const gap = 6;
  const cardW = (PAGE.contentWidth - gap) / 2;
  const pad = 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const leftBody = left.lines.filter(Boolean);
  const rightBody = right.lines.filter(Boolean);

  const measure = (title: string, body: string[]) => {
    const titleH = 5;
    const bodyLines = body.flatMap((line) => wrapLines(doc, line, cardW - pad * 2));
    return titleH + bodyLines.length * 4.2 + pad * 2 + 2;
  };

  const leftH = measure(left.title, leftBody);
  const rightH = measure(right.title, rightBody);
  const cardH = Math.max(leftH, rightH, 28);
  ensureSpace(ctx, cardH + 4);

  const drawCard = (x: number, title: string, body: string[]) => {
    doc.setDrawColor(...LINE);
    doc.setFillColor(...WHITE);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, ctx.y, cardW, cardH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(title.toUpperCase(), x + pad, ctx.y + pad + 3);

    doc.setDrawColor(...LINE);
    doc.line(x + pad, ctx.y + pad + 5, x + cardW - pad, ctx.y + pad + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    let ty = ctx.y + pad + 11;
    for (const line of body.flatMap((l) => wrapLines(doc, l, cardW - pad * 2))) {
      doc.text(line || " ", x + pad, ty);
      ty += 4.2;
    }
  };

  drawCard(PAGE.marginX, left.title, leftBody);
  drawCard(PAGE.marginX + cardW + gap, right.title, rightBody);
  ctx.y += cardH + 6;
}

function drawPaymentTable(ctx: PdfCtx, agreement: NormalizedAgreement): void {
  const milestones = agreement.milestones ?? [];
  if (agreement.payment_type !== "milestones" || milestones.length === 0) {
    drawSectionTitle(ctx, "Payment");
    drawKeyValueGrid(ctx, [
      { label: "Type", value: "Single payment" },
      { label: "Total", value: money(Number(agreement.total_price || 0)) },
      {
        label: "VAT",
        value: agreement.vat_mode === "exempt" ? "VAT exempt" : "VAT included"
      }
    ]);
    return;
  }

  drawSectionTitle(ctx, "Payment Schedule");
  const { doc } = ctx;
  const cols = [
    { label: "#", w: 10 },
    { label: "Stage", w: 78 },
    { label: "Amount", w: 36 },
    { label: "Due / Date", w: 54 }
  ];
  const rowH = 7;

  ensureSpace(ctx, rowH + 4);
  let x = PAGE.marginX;
  doc.setFillColor(...NAVY);
  doc.roundedRect(PAGE.marginX, ctx.y - 4, PAGE.contentWidth, rowH, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  for (const col of cols) {
    doc.text(col.label, x + 2, ctx.y);
    x += col.w;
  }
  ctx.y += rowH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  milestones.forEach((m, i) => {
    ensureSpace(ctx, rowH);
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(PAGE.marginX, ctx.y - 4, PAGE.contentWidth, rowH, "F");
    }
    const due = m.payment_due?.trim() || (m.target_date ? formatDateDMY(m.target_date) : "—");
    const cells = [
      String(i + 1),
      m.title || "Milestone",
      money(Number(m.amount || 0)),
      due
    ];
    let cx = PAGE.marginX;
    doc.setTextColor(...SLATE);
    cells.forEach((cell, ci) => {
      const maxW = cols[ci].w - 3;
      const clipped = doc.splitTextToSize(cell, maxW);
      const text = Array.isArray(clipped) ? String(clipped[0] ?? "") : String(clipped);
      doc.text(text, cx + 2, ctx.y);
      cx += cols[ci].w;
    });
    ctx.y += rowH;
  });

  ensureSpace(ctx, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(
    `Total  ${money(Number(agreement.total_price || 0))}  ·  ${
      agreement.vat_mode === "exempt" ? "VAT exempt" : "VAT included"
    }`,
    PAGE.marginX,
    ctx.y + 2
  );
  ctx.y += 10;
}

function drawSignatureBlock(ctx: PdfCtx, agreement: NormalizedAgreement): void {
  drawSectionTitle(ctx, "Client Signature");
  ensureSpace(ctx, 48);
  const { doc } = ctx;
  const boxH = 42;
  const boxW = PAGE.contentWidth;

  doc.setDrawColor(...LINE);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.35);
  doc.roundedRect(PAGE.marginX, ctx.y, boxW, boxH, 2, 2, "FD");

  // Signature line
  doc.setDrawColor(180, 190, 205);
  doc.setLineWidth(0.4);
  const lineY = ctx.y + boxH - 12;
  doc.line(PAGE.marginX + 10, lineY, PAGE.marginX + 95, lineY);

  const signature = agreement.client_signature?.trim() || "";
  if (signature.startsWith("data:image/")) {
    try {
      const mimeMatch = signature.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const format = mimeMatch?.[1]?.includes("png")
        ? "PNG"
        : mimeMatch?.[1]?.includes("jpeg") || mimeMatch?.[1]?.includes("jpg")
          ? "JPEG"
          : "PNG";
      doc.addImage(signature, format, PAGE.marginX + 12, ctx.y + 6, 70, 22);
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...SLATE_MUTED);
      doc.text("Signature on file", PAGE.marginX + 12, ctx.y + 18);
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(signature ? "Signature on file" : "—", PAGE.marginX + 12, ctx.y + 18);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_MUTED);
  doc.text("Client signature", PAGE.marginX + 10, lineY + 4);

  const dateLabel = agreement.signed_at
    ? `Date: ${formatDateDMY(agreement.signed_at)}`
    : "Date: —";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(dateLabel, PAGE.marginX + boxW - 10, lineY + 4, { align: "right" });

  if (agreement.client_name?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(agreement.client_name.trim(), PAGE.marginX + boxW - 10, ctx.y + 10, {
      align: "right"
    });
  }

  ctx.y += boxH + 8;
}

/** Build a printable PDF archive of a signed agreement (server-side). */
export async function buildSignedAgreementPdfBytes(
  agreement: NormalizedAgreement
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: PdfCtx = { doc, y: PAGE.marginTop, page: 1 };

  drawHeader(ctx, agreement);

  // Project spotlight
  drawSectionTitle(ctx, "Project / Service");
  drawKeyValueGrid(ctx, [
    { label: "Project", value: agreement.project_title || "—" },
    { label: "Service area", value: agreement.service_area || "—" },
    { label: "Total price", value: money(Number(agreement.total_price || 0)) },
    {
      label: "VAT",
      value: agreement.vat_mode === "exempt" ? "VAT exempt" : "VAT included (20%)"
    },
    ...(agreement.estimated_completion_date?.trim()
      ? [
          {
            label: "Est. completion",
            value: formatDateDMY(agreement.estimated_completion_date)
          }
        ]
      : []),
    ...(agreement.deadline?.trim() && agreement.status === "pending"
      ? [{ label: "Offer deadline", value: formatDateDMY(agreement.deadline) }]
      : [])
  ]);

  // Parties
  const providerName =
    agreement.business_name?.trim() ||
    agreement.provider_name?.trim() ||
    agreement.full_name?.trim() ||
    "—";
  drawTwoColumnCards(
    ctx,
    {
      title: "Provider",
      lines: [
        providerName,
        agreement.full_name && agreement.business_name ? agreement.full_name : "",
        agreement.provider_phone ? `Tel: ${agreement.provider_phone}` : "",
        agreement.provider_email ? `Email: ${agreement.provider_email}` : ""
      ]
    },
    {
      title: "Client",
      lines: [
        agreement.client_name || "—",
        agreement.client_phone ? `Tel: ${agreement.client_phone}` : "",
        agreement.client_email ? `Email: ${agreement.client_email}` : ""
      ]
    }
  );

  const terms = termsForDisplay(agreement.custom_terms || "");
  if (terms) {
    drawSectionTitle(ctx, "Terms and Conditions");
    drawBodyText(ctx, terms);
  }

  if (agreement.scope_of_work?.trim()) {
    drawSectionTitle(ctx, "Scope of Work (Included)");
    drawBodyText(ctx, agreement.scope_of_work.trim());
  }

  if (agreement.scope_exclusions?.trim()) {
    drawSectionTitle(ctx, "What is NOT Included");
    drawBodyText(ctx, agreement.scope_exclusions.trim());
  }

  drawPaymentTable(ctx, agreement);
  drawSignatureBlock(ctx, agreement);

  // Closing note
  ensureSpace(ctx, 10);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_MUTED);
  doc.text(
    "This document is an archived copy of the agreement executed on VSTAH.",
    PAGE.marginX,
    ctx.y
  );

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

export function signedAgreementObjectPath(agreement: NormalizedAgreement): string {
  const providerFolder = agreement.provider_id?.trim() || "unknown";
  return `${providerFolder}/${agreement.id}.pdf`;
}

/**
 * Generate a signed-agreement PDF, upload to Storage, and persist `pdf_url` on the row.
 * Soft-fails (returns null) if Storage/column is unavailable — signing still succeeds.
 */
export async function archiveSignedAgreementPdf(
  supabase: SupabaseClient,
  agreement: NormalizedAgreement
): Promise<{ pdfUrl?: string; error?: string }> {
  try {
    const bytes = await buildSignedAgreementPdfBytes(agreement);
    const path = signedAgreementObjectPath(agreement);
    const fileBody = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from(SIGNED_AGREEMENTS_BUCKET)
      .upload(path, fileBody, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600"
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(SIGNED_AGREEMENTS_BUCKET).getPublicUrl(path);

    if (!publicUrl) {
      return { error: "Could not resolve public PDF URL." };
    }

    const { error: updateError } = await supabase
      .from("agreements")
      .update({ pdf_url: publicUrl })
      .eq("id", agreement.id);

    if (updateError) {
      if (isMissingColumnOrSchemaCacheError(updateError.message)) {
        return { pdfUrl: publicUrl, error: "pdf_url column missing; PDF uploaded but URL not saved." };
      }
      return { pdfUrl: publicUrl, error: updateError.message };
    }

    return { pdfUrl: publicUrl };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to archive signed agreement PDF."
    };
  }
}

/** Load the agreement row and archive a signed PDF. Soft-fails with `{ error }`. */
export async function archiveSignedAgreementPdfById(
  supabase: SupabaseClient,
  agreementId: string
): Promise<{ pdfUrl?: string; error?: string }> {
  const { data, error } = await supabase.from("agreements").select("*").eq("id", agreementId).single();
  if (error || !data) {
    return { error: error?.message ?? "Agreement not found for PDF archive." };
  }
  const agreement = normalizeAgreementRow(data as Record<string, unknown>);
  return archiveSignedAgreementPdf(supabase, agreement);
}
