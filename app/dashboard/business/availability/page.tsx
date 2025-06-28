/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import ShopTimeslotSettingsForm from "@/app/components/ShopTimeslotSettingsForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AvailabilityPage() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      try {
        const res = await fetch("/api/shop/check");
        if (res.ok) {
          const data = await res.json();
          // Check response structure
          console.log("Shop data:", data);
          if (data.hasShop && data.shop_id) {
            setShop(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch shop:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading shop information...</div>;
  }

  if (!shop || !shop.hasShop) {
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
        <span className="text-muted-foreground">{shop.shop_name}</span>
      </div>
      <div className="bg-background text-foreground p-6 rounded-lg shadow border">
        <ShopTimeslotSettingsForm shopId={shop.shop_id} />
      </div>
    </div>
  );
}
