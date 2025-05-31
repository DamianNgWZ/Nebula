import { Button } from "@/components/ui/button";
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

export default function OnboardingRoute() {
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

        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Enter your full name here" />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex rounded-md overflow-hidden">
              <span className="inline-flex items-center px-3 border border-r-0 border-muted bg-muted text-sm text-muted-foreground">
                NeBula.com/
              </span>
              <Input
                id="username"
                placeholder="your-username"
                className="rounded-l-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Select your role</Label>
            <div className="flex gap-x-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  className="accent-primary"
                />
                Customer
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  className="accent-primary"
                />
                Owner
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button className="w-full">Submit</Button>
        </CardFooter>
      </Card>
    </div>
  );
}