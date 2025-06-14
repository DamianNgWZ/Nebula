"use client";

import { useForm } from "@conform-to/react";
import { useActionState } from "react";
import { parseWithZod } from "@conform-to/zod";
import { CreateShopAction } from "@/app/actions";
import { shopSchema } from "@/app/lib/zodSchemas";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/app/components/SubmitButtons";

type ShopFormData = z.infer<typeof shopSchema>;

export default function CreateShop() {
  const [lastResult, action] = useActionState(CreateShopAction, undefined);

  const [form, fields] = useForm<ShopFormData>({
    id: "shop-form",
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: shopSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      name: "",
    },
  });

  return (
    <div className="p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Create Your Shop</CardTitle>
          <p className="text-sm text-muted-foreground">
            You need to create a shop before you can add products.
          </p>
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
              <Label htmlFor={fields.name.id}>Shop Name</Label>
              <Input
                id={fields.name.id}
                name={fields.name.name}
                defaultValue={fields.name.initialValue}
                placeholder="Enter your shop name"
              />
              {fields.name.errors && (
                <p className="text-sm text-red-500">
                  {fields.name.errors.join(", ")}
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

            <SubmitButton text="Create Shop" className="w-full" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
