import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Legacy demo form — deal creation lives on the dashboard. */
export default function ProtectRedirectPage() {
  redirect(ROUTES.dashboard);
}
