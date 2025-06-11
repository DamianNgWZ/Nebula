import { redirect } from "next/navigation";
import { isLoggedIn } from "../lib/hooks";

export default async function DashboardPage() {
  const session = await isLoggedIn();

  if (session.user.role === "BUSINESS_OWNER") {
    return redirect("/dashboard/business");
  }

  return redirect("/dashboard/customer");
}