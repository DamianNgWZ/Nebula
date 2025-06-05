"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { OnBoardingAction } from "../actions";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { zodSchema } from "../lib/zodSchemas";
import { SubmitButton } from "../components/SubmitButtons";

export default function OnboardingRoute() {
  const [lastResult, action] = useActionState(OnBoardingAction, undefined);

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: zodSchema,
      });
    },

    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-4xl font-bold tracking-tight">
            Welcome to Ne<span className="text-primary">Bula</span>
          </CardTitle>

          <CardDescription className="text-base leading-relaxed">
            <p className="mb-1">Let&apos;s get you started!</p>
            <p>Fill in the following information to set up your account.</p>
          </CardDescription>
        </CardHeader>

        <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-y-2">
              <Label>Full Name</Label>
              <Input
                name={fields.fullName.name}
                defaultValue={fields.fullName.initialValue}
                key={fields.fullName.key}
                placeholder="John Doe"
              />
              <p className="text-red-500 text-sm"> {fields.fullName.errors}</p>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Username</Label>
              <div className="flex rounded-md overflow-hidden">
                <span className="inline-flex items-center px-3 border border-r-0 border-muted bg-muted text-sm text-muted-foreground">
                  NeBula.com/
                </span>
                <Input
                  name={fields.userName.name}
                  defaultValue={fields.userName.initialValue}
                  key={fields.userName.key}
                  placeholder="Input your username here"
                />
              </div>
              <p className="text-red-500 text-sm"> {fields.userName.errors} </p>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Select your role</Label>
              <div className="flex gap-x-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={fields.role.name}
                    value="CUSTOMER"
                    defaultChecked={fields.role.initialValue === "CUSTOMER"}
                    className="accent-primary"
                  />
                  Customer
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={fields.role.name}
                    value="BUSINESS_OWNER"
                    className="accent-primary"
                  />
                  Business Owner
                </label>
              </div>
              <p className="text-red-500 text-sm"> {fields.role.errors} </p>
            </div>
          </CardContent>

          <CardFooter className="mt-4">
            <SubmitButton text="Submit" className="w-full" />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
