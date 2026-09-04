import { ProductMark } from "@/components/product-mark";
import type { ElasticProduct } from "@/lib/solutions";

export function productAnchor(product: ElasticProduct) {
  return `#${product.toLowerCase().replace(/\s+/g, "-")}`;
}

export function CapabilityPills({ products }: { products: ElasticProduct[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {products.map((product) => (
        <a key={product} href={productAnchor(product)}>
          <ProductMark product={product} />
        </a>
      ))}
    </div>
  );
}
