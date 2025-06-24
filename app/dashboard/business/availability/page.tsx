import { isLoggedIn } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import ShopTimeslotSettingsForm from "@/app/components/ShopTimeslotSettingsForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AvailabilityPage() {
  const session = await isLoggedIn();

  // Each business owner can only have one shop
  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4">You haven&apos;t created a shop yet.</p>
        <Link href="/dashboard/business/create-shop">
          <Button>Create Your Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Availability Settings</h1>
        <span className="text-gray-600">{shop.name}</span>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <ShopTimeslotSettingsForm shopId={shop.id} />
      </div>
    </div>
  );
}
