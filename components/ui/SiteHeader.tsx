import Link from "next/link";
import { site } from "@/lib/site";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ search }: { search?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>{site.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <NavLinks />
          {search}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 32 32" className="text-accent">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <circle
          key={deg}
          cx={16 + 8.5 * Math.cos((deg * Math.PI) / 180)}
          cy={16 + 8.5 * Math.sin((deg * Math.PI) / 180)}
          r="1.6"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
