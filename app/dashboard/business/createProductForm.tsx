"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { SubmitButton } from "@/app/components/SubmitButtons";
import { z } from "zod";
import { productSchema } from "../../lib/zodSchemas";
import { createProductAction } from "./actions";

type ProductFormData = z.infer<typeof productSchema>;

export default function CreateProductForm() {
  const [lastResult, action] = useActionState(createProductAction, undefined);

  const [form, fields] = useForm<ProductFormData>({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: productSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Create a Product</CardTitle>
        <CardDescription>
          Fill in the details to add a product to your shop.
        </CardDescription>
      </CardHeader>

      <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name={fields.name.name}
              defaultValue={fields.name.initialValue}
              key={fields.name.key}
              placeholder="e.g. Massage"
            />
            <p className="text-sm text-red-500">{fields.name.errors}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name={fields.description.name}
              defaultValue={fields.description.initialValue}
              key={fields.description.key}
              placeholder="Optional description"
            />
            <p className="text-sm text-red-500">{fields.description.errors}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="price">Price (SGD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              name={fields.price.name}
              defaultValue={fields.price.initialValue}
              key={fields.price.key}
              placeholder="88.00"
            />
            <p className="text-sm text-red-500">{fields.price.errors}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name={fields.imageUrl.name}
              defaultValue={fields.imageUrl.initialValue}
              key={fields.imageUrl.key}
              placeholder="https://example.com/product.jpg"
            />
            <p className="text-sm text-red-500">{fields.imageUrl.errors}</p>
          </div>
        </CardContent>

        <CardFooter>
          <SubmitButton text="Create Product" className="w-full" />
        </CardFooter>
      </form>
    </Card>
  );
}
