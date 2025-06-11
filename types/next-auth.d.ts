import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "BUSINESS_OWNER";
      userName?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "CUSTOMER" | "BUSINESS_OWNER";
    userName?: string;
  }
}
