"use client";

import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  LucideProps,
  Settings,
  Wine,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForwardRefExoticComponent, RefAttributes } from "react";

interface NavProps {
  id: number;
  name: string;
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}

// customer links for dashboard
export const customerDashboardLinks: NavProps[] = [
  {
    id: 0,
    name: "My Bookings",
    href: "/dashboard/customer/bookings",
    icon: Wine,
  },
  {
    id: 1,
    name: "Browse Services",
    href: "/dashboard/customer/browse",
    icon: ShoppingBag,
  },
  {
    id: 2,
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// business owner links for dashboard
export const businessDashboardLinks: NavProps[] = [
  {
    id: 0,
    name: "Manage Bookings",
    href: "/dashboard/business/bookings",
    icon: Wine,
  },
  {
    id: 1,
    name: "My Services",
    href: "/dashboard/business/products",
    icon: Store,
  },
  {
    id: 2,
    name: "Manage Your Availability",
    href: "/dashboard/business/availability",
    icon: CalendarCheck,
  },
  {
    id: 3,
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardLinksProps {
  userRole: "CUSTOMER" | "BUSINESS_OWNER";
}

export function DashboardLinks({ userRole }: DashboardLinksProps) {
  const pathname = usePathname();
  const links =
    userRole === "BUSINESS_OWNER"
      ? businessDashboardLinks
      : customerDashboardLinks;

  return (
    <>
      {links.map((link) => (
        <Link
          className={cn(
            pathname === link.href
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground",
            "flex items-center gap-4 rounded-lg px-3 py-2 transition-all hover:text-primary"
          )}
          key={link.id}
          href={link.href}
        >
          <link.icon className="size-4" />
          {link.name}
        </Link>
      ))}
    </>
  );
}
