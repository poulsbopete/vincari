import Link from "next/link";
import { ProductMark } from "@/components/product-mark";
import { CAPABILITIES } from "@/lib/solutions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SolutionsMap() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CAPABILITIES.map((item) => (
        <Link key={item.id} href={item.href}>
          <Card className="h-full transition hover:border-primary/40">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {item.elasticProducts.map((product) => (
                  <ProductMark key={product} product={product} />
                ))}
              </div>
              <CardTitle className="text-lg">{item.msTitle}</CardTitle>
              <CardDescription>{item.msSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{item.elasticHow}</p>
              <p className="font-mono text-xs text-primary">
                service.name = {item.serviceName}
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {item.signals.map((signal) => (
                  <li key={signal}>· {signal}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
