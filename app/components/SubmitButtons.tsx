"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  text: string;

  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;

  className?: string;
}

export function SubmitButton({ text, variant, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled variant="outline" className={cn("w-fit", className)}>
          <Loader2 className="size-4 mr-2 animate-spin" />
          Loading...
        </Button>
      ) : (
        <Button
          type="submit"
          variant={variant}
          className={cn("w-fit", className)}
        >
          {text}
        </Button>
      )}
    </>
  );
}

export function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        <Button disabled variant="outline" className="w-full">
          <Loader2 className="size-4 mr-2 animate-spin" />
          Loading...
        </Button>
      ) : (
        <Button variant="outline" className="w-full">
          <Image
            src="/GoogleLogo.png"
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-2"
          />
          Sign in with Google
        </Button>
      )}
    </>
  );
}

export function GithubSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        <Button disabled variant="outline" className="w-full">
          <Loader2 className="size-4 mr-2 animate-spin" />
          Loading...
        </Button>
      ) : (
        <Button variant="outline" className="w-full">
          <Image
            src="/GithubLogo.svg"
            alt="Github Logo"
            width={20}
            height={20}
            className="mr-2"
          />
          Sign in with Github
        </Button>
      )}
    </>
  );
}
