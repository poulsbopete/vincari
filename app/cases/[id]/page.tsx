import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CapdWorkspace } from "@/components/capd-workspace";
import { CapabilityPills } from "@/components/capability-pills";
import { getCase } from "@/lib/cases";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("ai-assistance")!;

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const surgical = getCase(id);
  if (!surgical) notFound();

  return (
    <AppShell eyebrow={`${surgical.or} · ${surgical.start} · CPT ${surgical.cptHint}`}>
      <div className="mb-4">
        <CapabilityPills products={capability.elasticProducts} />
      </div>
      <CapdWorkspace surgical={surgical} />
    </AppShell>
  );
}
