"use server";

import { createClient } from "@supabase/supabase-js";

type CreateAgreementInput = {
  providerId: string;
  clientName: string;
  projectTitle: string;
  totalPrice: number;
  paymentType: "single" | "milestones";
  milestones: { title: string; amount: number }[];
};

type CreateAgreementResult = {
  id?: string;
  error?: string;
};

export async function createAgreementAction(input: CreateAgreementInput): Promise<CreateAgreementResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { error: "Supabase is not configured." };
  }

  if (!input.providerId || !input.clientName || !input.projectTitle || input.totalPrice <= 0) {
    return { error: "Please fill all required fields." };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("agreements")
    .insert({
      provider_id: input.providerId,
      client_name: input.clientName,
      project_title: input.projectTitle,
      total_price: input.totalPrice,
      payment_type: input.paymentType,
      milestones: input.paymentType === "milestones" ? input.milestones : [],
      status: "pending"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: error?.message ?? "Failed to create agreement." };
  }

  return { id: data.id as string };
}
