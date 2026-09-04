import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CapdWorkspace } from "@/components/capd-workspace";
import { getCase } from "@/lib/cases";

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
      <CapdWorkspace surgical={surgical} />
    </AppShell>
  );
}
