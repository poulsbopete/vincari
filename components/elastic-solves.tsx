import { ProductMark } from "@/components/product-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Capability } from "@/lib/solutions";

export function ElasticSolves({ capability }: { capability: Capability }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What Elastic is doing here</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {capability.layers.map((layer) => (
          <div key={layer.product} className="space-y-1">
            <ProductMark product={layer.product} />
            <p className="text-sm text-foreground">{layer.onScreen}</p>
            <p className="text-xs text-muted-foreground">{layer.inElastic}</p>
          </div>
        ))}
        <p className="font-mono text-xs text-primary">
          service.name = {capability.serviceName}
        </p>
      </CardContent>
    </Card>
  );
}
