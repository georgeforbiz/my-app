import { redirect } from "next/navigation";

/** Legacy demo form — deal creation lives on the dashboard. */
export default function ProtectRedirectPage() {
  redirect("/dashboard");
}
