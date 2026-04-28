import type { CreateDealPayload, ProtectProjectPayload } from "./types";

export function prepareCreateDealPayload(input: {
  projectTitle: string;
  description: string;
  totalAmountAMD: number;
  renovationStages: string;
  clientName: string;
  clientEmail: string;
  contractorEmail?: string;
  notes?: string;
  submittedByEmail?: string;
}): CreateDealPayload {
  const now = new Date().toISOString();
  return {
    kind: "create_deal",
    createdAt: now,
    updatedAt: now,
    currency: "AMD",
    submittedByEmail: input.submittedByEmail,
    projectTitle: input.projectTitle.trim(),
    description: input.description.trim(),
    totalAmountAMD: Math.round(Number(input.totalAmountAMD)),
    renovationStages: input.renovationStages.trim(),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    contractorEmail: input.contractorEmail?.trim().toLowerCase() || undefined,
    notes: input.notes?.trim() || undefined
  };
}

export function prepareProtectProjectPayload(input: {
  homeownerEmail: string;
  homeownerName?: string;
  contractorInviteEmail: string;
  projectSummary: string;
  invitationMessage?: string;
  submittedByEmail?: string;
}): ProtectProjectPayload {
  return {
    kind: "protect_project",
    createdAt: new Date().toISOString(),
    submittedByEmail: input.submittedByEmail,
    homeownerEmail: input.homeownerEmail.trim().toLowerCase(),
    homeownerName: input.homeownerName?.trim() || undefined,
    contractorInviteEmail: input.contractorInviteEmail.trim().toLowerCase(),
    projectSummary: input.projectSummary.trim(),
    invitationMessage: input.invitationMessage?.trim() || undefined
  };
}
