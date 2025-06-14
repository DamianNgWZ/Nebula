/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { ShopWithDetails } from "@/types/product";
import Link from "next/link";

export default function ShopDetail() {
  const params = useParams();
  const shopId = params.id as string;
  const [shop, setShop] = useState<ShopWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shop/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [shopId]);

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading business details...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6">
        <p>Business not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* back */}
      <Link href="/dashboard/customer/browse">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Button>
      </Link>

      {/* shop name */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{shop.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Owned by {shop.owner.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {shop._count.products} service
            {shop._count.products !== 1 ? "s" : ""}
          </Badge>

          {/* rating placeholder */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-muted stroke-muted" />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              (0 reviews)
            </span>
          </div>
        </div>
      </div>

      {/* services */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Services</h2>

        {shop.products.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              This business has not added any services yet.
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {shop.products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {product.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">
                      ${product.price}
                    </div>

                    <Link href={`/dashboard/customer/book/${product.id}`}>
                      <Button>Book Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}