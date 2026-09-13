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

function money(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ֏`;
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

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 14) return y;
  doc.addPage();
  return 16;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, 14, y);
  return y + 6;
}

function drawBody(doc: jsPDF, text: string, y: number, maxWidth = 182): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = wrapLines(doc, text, maxWidth);
  for (const line of lines) {
    y = ensureSpace(doc, y, 5);
    doc.text(line || " ", 14, y);
    y += 4.5;
  }
  return y + 2;
}

/** Build a printable PDF archive of a signed agreement (server-side). */
export async function buildSignedAgreementPdfBytes(
  agreement: NormalizedAgreement
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VSTAH — Signed Agreement", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Agreement ID: ${agreement.id}`, 14, y);
  y += 5;
  doc.text(`Created: ${formatDateDMY(agreement.created_at) || agreement.created_at}`, 14, y);
  y += 5;
  if (agreement.signed_at) {
    doc.text(`Signed: ${formatDateDMY(agreement.signed_at)}`, 14, y);
    y += 5;
  }
  doc.text(`Status: ${agreement.status}`, 14, y);
  y += 8;

  y = drawSectionTitle(doc, "Project", y);
  y = drawBody(
    doc,
    [
      `Title: ${agreement.project_title || "—"}`,
      `Service area: ${agreement.service_area || "—"}`,
      `Total: ${money(Number(agreement.total_price || 0))}`,
      `VAT: ${agreement.vat_mode === "exempt" ? "Exempt" : "Included"}`
    ].join("\n"),
    y
  );

  y = drawSectionTitle(doc, "Provider", y);
  y = drawBody(
    doc,
    [
      agreement.business_name || agreement.provider_name || "—",
      agreement.full_name ? `Contact: ${agreement.full_name}` : "",
      agreement.provider_phone ? `Phone: ${agreement.provider_phone}` : "",
      agreement.provider_email ? `Email: ${agreement.provider_email}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    y
  );

  y = drawSectionTitle(doc, "Client", y);
  y = drawBody(
    doc,
    [
      agreement.client_name || "—",
      agreement.client_phone ? `Phone: ${agreement.client_phone}` : "",
      agreement.client_email ? `Email: ${agreement.client_email}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    y
  );

  const terms = termsForDisplay(agreement.custom_terms || "");
  if (terms) {
    y = drawSectionTitle(doc, "Terms and Conditions", y);
    y = drawBody(doc, terms, y);
  }

  if (agreement.scope_of_work?.trim()) {
    y = drawSectionTitle(doc, "Scope of Work (Included)", y);
    y = drawBody(doc, agreement.scope_of_work.trim(), y);
  }

  if (agreement.scope_exclusions?.trim()) {
    y = drawSectionTitle(doc, "What is NOT Included", y);
    y = drawBody(doc, agreement.scope_exclusions.trim(), y);
  }

  if (agreement.deadline?.trim()) {
    y = drawSectionTitle(doc, "Offer Deadline", y);
    y = drawBody(doc, formatDateDMY(agreement.deadline), y);
  }

  const milestones = agreement.milestones ?? [];
  if (agreement.payment_type === "milestones" && milestones.length > 0) {
    y = drawSectionTitle(doc, "Payment Schedule", y);
    const rows = milestones.map((m, i) => {
      const due = m.payment_due?.trim() || (m.target_date ? formatDateDMY(m.target_date) : "—");
      return `${i + 1}. ${m.title || "Milestone"} — ${money(Number(m.amount || 0))} — ${due}`;
    });
    y = drawBody(doc, rows.join("\n"), y);
  }

  y = drawSectionTitle(doc, "Client Signature", y);
  const signature = agreement.client_signature?.trim() || "";
  if (signature.startsWith("data:image/")) {
    try {
      const mimeMatch = signature.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const format = mimeMatch?.[1]?.includes("png")
        ? "PNG"
        : mimeMatch?.[1]?.includes("jpeg") || mimeMatch?.[1]?.includes("jpg")
          ? "JPEG"
          : "PNG";
      y = ensureSpace(doc, y, 42);
      doc.addImage(signature, format, 14, y, 70, 28);
      y += 32;
    } catch {
      y = drawBody(doc, "[Signature image could not be embedded]", y);
    }
  } else if (signature) {
    y = drawBody(doc, "[Signature on file]", y);
  } else {
    y = drawBody(doc, "—", y);
  }

  if (agreement.signed_at) {
    y = drawBody(doc, formatDateDMY(agreement.signed_at), y);
  }

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
