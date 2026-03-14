"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCarrierRole } from "@/lib/auth/role-routing";

const shipperNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/loads", label: "My Loads", icon: "package_2" },
  { href: "/dashboard/tracking", label: "Active Shipments", icon: "local_shipping" },
  { href: "/dashboard/sustainability", label: "CO2 Impact", icon: "energy_savings_leaf" },
  { href: "/dashboard/reports", label: "Reports", icon: "bar_chart" },
];

const carrierNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: "travel_explore" },
  { href: "/dashboard/shipments", label: "Assigned Shipments", icon: "local_shipping" },
];

const systemNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname();
  const navItems = isCarrierRole(role) ? carrierNavItems : shipperNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="mt-4 flex-1 space-y-1 px-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            isActive(item.href)
              ? "bg-[var(--brand)]/10 text-[var(--brand)]"
              : "text-slate-400 hover:bg-[var(--brand)]/5 hover:text-[var(--brand)]"
          }`}
        >
          <span className="material-symbols-outlined text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      <div className="pb-4 pt-8">
        <p className="px-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          System
        </p>
      </div>

      {systemNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            isActive(item.href)
              ? "bg-[var(--brand)]/10 text-[var(--brand)]"
              : "text-slate-400 hover:bg-[var(--brand)]/5 hover:text-[var(--brand)]"
          }`}
        >
          <span className="material-symbols-outlined text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
