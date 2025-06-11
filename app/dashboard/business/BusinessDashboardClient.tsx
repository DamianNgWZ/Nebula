/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "@conform-to/react";
import { useActionState } from "react";
import { parseWithZod } from "@conform-to/zod";
import { CreateProductAction } from "@/app/actions";
import { productSchema } from "@/app/lib/zodSchemas";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/app/components/SubmitButtons";
import { Product } from "@prisma/client";

type ProductFormData = z.infer<typeof productSchema>;

export default function BusinessDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lastResult, action] = useActionState(CreateProductAction, undefined);

  const [form, fields] = useForm<ProductFormData>({
    id: "product-form",
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: productSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      name: "",
      price: "",
      description: "",
      imageUrl: "",
    },
  });

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.filter((p: Product) => p !== null));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (lastResult?.status === "success") {
      fetchProducts();
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">My Products</h1>

      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="border p-4 rounded-xl shadow-sm space-y-2"
          >
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-sm text-muted-foreground">
              {product.description || "No description"}
            </p>
            <p className="text-green-600 font-medium">${product.price}</p>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full rounded"
              />
            )}
          </li>
        ))}
      </ul>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Create New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id={form.id}
            onSubmit={form.onSubmit}
            action={action}
            noValidate
            className="space-y-6"
          >
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.name.id}>Name</Label>
              <Input
                id={fields.name.id}
                name={fields.name.name}
                defaultValue={fields.name.initialValue}
                placeholder="Product name"
              />
              {fields.name.errors && (
                <p className="text-sm text-red-500">
                  {fields.name.errors.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.description.id}>
                Description (Optional)
              </Label>
              <Input
                id={fields.description.id}
                name={fields.description.name}
                defaultValue={fields.description.initialValue}
                placeholder="Optional description"
              />
              {fields.description.errors && (
                <p className="text-sm text-red-500">
                  {fields.description.errors.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.price.id}>Price</Label>
              <Input
                id={fields.price.id}
                name={fields.price.name}
                defaultValue={fields.price.initialValue}
                placeholder="10.99"
                type="number"
                step="0.01"
                min="0"
              />
              {fields.price.errors && (
                <p className="text-sm text-red-500">
                  {fields.price.errors.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.imageUrl.id}>Image URL (Optional)</Label>
              <Input
                id={fields.imageUrl.id}
                name={fields.imageUrl.name}
                defaultValue={fields.imageUrl.initialValue}
                placeholder="https://example.com/image.jpg"
              />
              {fields.imageUrl.errors && (
                <p className="text-sm text-red-500">
                  {fields.imageUrl.errors.join(", ")}
                </p>
              )}
            </div>

            {lastResult?.status === "error" && lastResult.error && (
              <div className="text-sm text-red-500">
                {lastResult.error._form && (
                  <p>{lastResult.error._form.join(", ")}</p>
                )}
              </div>
            )}

            <SubmitButton text="Create Product" className="w-full" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
