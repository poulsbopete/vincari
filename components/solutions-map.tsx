import Link from "next/link";
import { ProductMark } from "@/components/product-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_NOTES_KIBANA_URL } from "@/lib/config";
import { kibanaNotesDiscoverUrl } from "@/lib/deep-links";
import {
  CAPABILITIES,
  capabilityLinks,
  type Capability,
  type ElasticProduct,
} from "@/lib/solutions";

function productHref(item: Capability, product: ElasticProduct) {
  const kibana = capabilityLinks(undefined, item.serviceName);
  if (product === "Security") return "/security";
  if (product === "Search") return kibanaNotesDiscoverUrl(DEFAULT_NOTES_KIBANA_URL);
  if (product === "Observability" || product === "LLM observability") {
    return kibana.apmService;
  }
  return item.href;
}

export function SolutionsMap() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CAPABILITIES.map((item) => {
        const kibana = capabilityLinks(undefined, item.serviceName);
        return (
          <Card key={item.id} className="h-full transition hover:border-primary/40">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {item.elasticProducts.map((product) => {
                  const href = productHref(item, product);
                  const external = href?.startsWith("http");
                  if (!href) {
                    return <ProductMark key={product} product={product} />;
                  }
                  return (
                    <a
                      key={product}
                      href={href}
                      {...(external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                    >
                      <ProductMark product={product} />
                    </a>
                  );
                })}
              </div>
              <CardTitle className="text-lg">
                <Link href={item.href} className="hover:underline">
                  {item.msTitle}
                </Link>
              </CardTitle>
              <CardDescription>{item.msSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{item.elasticHow}</p>
              <p>
                <a
                  href={kibana.apmService ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  service.name = {item.serviceName}
                </a>
                <span className="ml-2 text-xs text-muted-foreground">
                  APM
                </span>
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {item.signals.map((signal) => (
                  <li key={signal}>· {signal}</li>
                ))}
              </ul>
              <Link
                href={item.href}
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                Open {item.msTitle}
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
