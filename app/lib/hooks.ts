import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function isLoggedIn() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/"); // redirect to home if not logged in
  }

  return session;
}
