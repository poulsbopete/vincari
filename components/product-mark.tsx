import type { ReactNode } from "react";
import type { ElasticProduct } from "@/lib/solutions";
import { cn } from "@/lib/utils";

const STYLES: Record<ElasticProduct, string> = {
  Observability:
    "border-[#00b7c3]/50 bg-[#00b7c3]/10 text-[#0e6e75]",
  Security: "border-[#ca5010]/40 bg-[#ca5010]/10 text-[#8a3410]",
  Search: "border-[#0078d4]/40 bg-[#0078d4]/10 text-[#004578]",
  "LLM observability":
    "border-[#8764b8]/40 bg-[#8764b8]/10 text-[#5c2e91]",
};

export function ProductMark({
  product,
  className,
}: {
  product: ElasticProduct;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-4xl border px-2 text-[10px] font-semibold tracking-wide uppercase",
        STYLES[product],
        className,
      )}
    >
      {product}
    </span>
  );
}

export function ProductBand({
  product,
  title,
  children,
}: {
  product: ElasticProduct;
  title: string;
  children: ReactNode;
}) {
  const rail: Record<ElasticProduct, string> = {
    Observability: "border-l-[#00b7c3]",
    Security: "border-l-[#ca5010]",
    Search: "border-l-[#0078d4]",
    "LLM observability": "border-l-[#8764b8]",
  };
  return (
    <section
      id={product.toLowerCase().replace(/\s+/g, "-")}
      className={cn(
        "space-y-2 rounded-lg border border-border bg-background/60 p-3 pl-3.5 border-l-4",
        rail[product],
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ProductMark product={product} />
        <p className="text-xs font-medium text-foreground">{title}</p>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
