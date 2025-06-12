"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopWithDetails } from "@/types/product";

export default function CustomerBrowse() {
  const [shops, setShops] = useState<ShopWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredShops, setFilteredShops] = useState<ShopWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShops = async () => {
    try {
      const res = await fetch("/api/shop/fetch");
      if (res.ok) {
        const data = await res.json();
        setShops(data);
        setFilteredShops(data);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredShops(shops);
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    const filtered = shops.filter((shop) => {
      const searchableText = [shop.name || "", shop.owner?.name || ""]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchLower);
    });

    setFilteredShops(filtered);
  }, [searchTerm, shops]);

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading businesses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Browse Businesses</h1>
        <p className="text-muted-foreground">
          Discover local businesses and their services
        </p>

        {/* search box */}
        <div className="max-w-md">
          <Input
            placeholder="Search businesses, owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* counter */}
      <div className="text-sm text-muted-foreground">
        {filteredShops.length} business
        {filteredShops.length !== 1 ? "es" : ""} found
      </div>

      {/* shops display */}
      {filteredShops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm
              ? "No businesses match your search."
              : "No businesses available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredShops.map((shop) => (
            <Card
              key={shop.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{shop.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  by {shop.owner.name}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {shop._count.products} service
                    {shop._count.products !== 1 ? "s" : ""}
                  </Badge>

                  {shop.products.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      From ${Math.min(...shop.products.map((p) => p.price))}
                    </div>
                  )}
                </div>

                {/* service preview */}
                {shop.products.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Services offered:</p>
                    <div className="flex flex-wrap gap-1">
                      {shop.products.slice(0, 3).map((product) => (
                        <Badge
                          key={product.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {product.name}
                        </Badge>
                      ))}
                      {shop.products.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{shop.products.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/dashboard/customer/shop/${shop.id}`;
                  }}
                >
                  View Services
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
