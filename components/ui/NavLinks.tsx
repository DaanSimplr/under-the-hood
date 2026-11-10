"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/site";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href);
}

export function NavLinks() {
  const pathname = usePathname() ?? "/";
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on route change
    setOpen(false);
  }, [pathname]);

  const links = navItems.map((item) => {
    const active = isActive(normalized, item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-2",
            active ? "text-accent" : "text-fg",
          )}
        >
          {item.label}
        </Link>
      </li>
    );
  });

  return (
    <nav aria-label="Main" className="flex items-center">
      <ul className="hidden items-center gap-1 lg:flex">{links}</ul>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium lg:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        Menu
      </button>
      <ul
        id="mobile-nav"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-surface p-3 shadow-lg lg:hidden"
      >
        {links}
      </ul>
    </nav>
  );
}
