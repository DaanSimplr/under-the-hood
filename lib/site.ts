export const site = {
  name: "Under the Hood",
  tagline: "Learn what every car part does, where it sits, and how it comes apart.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const navItems = [
  { href: "/systems/", label: "Systems" },
  { href: "/explorer/", label: "Explorer" },
  { href: "/teardowns/", label: "Teardowns" },
  { href: "/glossary/", label: "Glossary" },
  { href: "/quiz/", label: "Quiz" },
  { href: "/progress/", label: "Progress" },
] as const;
