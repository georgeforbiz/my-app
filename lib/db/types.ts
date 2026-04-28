/**
 * JSON-ready shapes for persistence (Supabase tables, REST API, etc.).
 */

export type CreateDealPayload = {
  kind: "create_deal";
  createdAt: string;
  updatedAt?: string;
  submittedByEmail?: string;
  projectTitle: string;
  description: string;
  totalAmountAMD: number;
  currency: "AMD";
  renovationStages: string;
  clientName: string;
  clientEmail: string;
  contractorEmail?: string;
  notes?: string;
};

export type ProtectProjectPayload = {
  kind: "protect_project";
  createdAt: string;
  submittedByEmail?: string;
  homeownerEmail: string;
  homeownerName?: string;
  contractorInviteEmail: string;
  projectSummary: string;
  invitationMessage?: string;
};
