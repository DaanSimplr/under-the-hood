import type { Metadata, Viewport } from "next";
import { resolveSlot } from "@/lib/assets";
import { site } from "@/lib/site";
import "./globals.css";

// Runs before paint so the page never flashes the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t}catch(e){}})();`;

export function generateMetadata(): Metadata {
  // The social image comes from the media manifest, and only once it exists.
  const og = resolveSlot("og-image");
  const images =
    og.available && og.src
      ? [{ url: og.src, width: 1200, height: 630, alt: og.slot.alt || site.name }]
      : undefined;
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: `%s · ${site.name}` },
    description: site.tagline,
    openGraph: { siteName: site.name, type: "website", images },
    twitter: { card: images ? "summary_large_image" : "summary", images },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
