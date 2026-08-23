import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

/** Legacy `/deal/[id]` route — agreements live at `/agreement/[id]`. */
export default function DealRedirectPage({ params }: Props) {
  redirect(`/agreement/${params.id}`);
}
