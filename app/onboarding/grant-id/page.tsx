import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarCheckIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function OnboardingrouteTwo() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>You are almost finished!</CardTitle>
          <CardDescription>
            We have to now connect your calendar to your account.
          </CardDescription>
          <Image
            src="/LoadingGif.gif"
            alt="Almost finished gif"
            className="w-full rounded-lg"
          />
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <div>
              <CalendarCheckIcon className="size-4 mr-2" />
              <Link href="/api/auth">Connect Calendar to your Account</Link>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
