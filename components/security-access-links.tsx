import Link from "next/link";
import { DeepLink } from "@/components/deep-link";
import { DEFAULT_SECURITY_KIBANA_URL } from "@/lib/config";
import { kibanaSecurityAlertsUrl } from "@/lib/deep-links";

const alerts = kibanaSecurityAlertsUrl(DEFAULT_SECURITY_KIBANA_URL);

export function SecurityAccessLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/security"
        className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground"
      >
        Unusual EHR access
      </Link>
      <DeepLink href={alerts}>Security alerts</DeepLink>
    </div>
  );
}
