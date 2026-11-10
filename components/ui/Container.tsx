import { cn } from "@/lib/cn";

export function Container({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "header" | "footer" | "nav";
}) {
  return <Tag className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</Tag>;
}
