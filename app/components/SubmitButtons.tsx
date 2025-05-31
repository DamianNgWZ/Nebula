"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import Image from "next/image";

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
