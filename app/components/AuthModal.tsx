import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { signIn } from "../lib/auth";
import { GithubSubmitButton, GoogleSubmitButton } from "./SubmitButtons";

export function AuthModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In / Sign Up</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[370px] fixed top-1/2 left-1/2 !-translate-x-1/2 !-translate-y-1/2 bg-background text-foreground border">
        <DialogHeader className="flex flex-row items-center justify-center space-x-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <DialogTitle className="text-3xl font-bold">
            <span className="text-foreground dark:text-foreground">Ne</span>
            <span className="text-primary">Bula</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col mt-5 space-y-5">
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <GoogleSubmitButton />
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github");
            }}
          >
            <GithubSubmitButton />
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
