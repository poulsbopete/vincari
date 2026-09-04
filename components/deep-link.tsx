import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeepLink({
  href,
  children,
  className,
}: {
  href?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  if (!href) {
    return (
      <span className="text-xs text-muted-foreground">Kibana URL not set</span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        className,
      )}
    >
      {children}
      <ExternalLink data-icon="inline-end" />
    </a>
  );
}
