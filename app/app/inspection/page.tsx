export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { resolveControlledSessionContext } from "../../../lib/server/controlled-session";

export default async function InspectionPage() {
  const sessionContext = await resolveControlledSessionContext({
    source: "inspection.page",
    allowFallback: false,
  });

  if (!sessionContext) redirect("/sign-in?callbackUrl=/app/inspection");

  redirect("/app/dashboard");
}
