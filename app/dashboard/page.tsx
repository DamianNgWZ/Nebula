import { isLoggedIn } from "../lib/hooks";

export default async function DashboardPage() {
  const session = await isLoggedIn();

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
