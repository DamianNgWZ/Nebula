import { redirect } from "next/navigation";
import { isLoggedIn } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import BusinessDashboardClient from "../BusinessDashboardClient";

export default async function BusinessProducts() {
  const session = await isLoggedIn();

  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (!shop) {
    redirect("/dashboard/business/create-shop");
  }

  return <BusinessDashboardClient />;
}
