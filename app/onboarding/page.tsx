import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingRoute() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md p-6 shadow-md">
        <CardHeader>
          <CardTitle>
            Welcome to NeBula!
            <br />
            Let's get you started.
          </CardTitle>

          <CardDescription>
            This is the onboarding page. Please fill out the necessary
            information to set up your account.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
