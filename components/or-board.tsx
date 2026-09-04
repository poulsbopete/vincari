"use client";

import Link from "next/link";
import { CASES, STATUS_LABEL, type CaseStatus } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TONE: Record<CaseStatus, string> = {
  "pre-op": "bg-muted text-muted-foreground",
  "in-or": "bg-sky-500/15 text-sky-300",
  documenting: "bg-amber-500/15 text-amber-300",
  "coding-hold": "bg-orange-500/15 text-orange-300",
  filed: "bg-emerald-500/15 text-emerald-300",
};

export function OrBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CASES.map((surgical) => (
        <Link key={surgical.id} href={`/cases/${surgical.id}`}>
          <Card className="h-full transition hover:border-primary/40">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{surgical.id}</CardTitle>
                <Badge className={TONE[surgical.status]} variant="secondary">
                  {STATUS_LABEL[surgical.status]}
                </Badge>
              </div>
              <CardDescription>
                {surgical.or} · {surgical.start} · {surgical.surgeon}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium leading-snug">{surgical.procedure}</p>
              <p className="text-muted-foreground">
                {surgical.patient} · {surgical.age}
                {surgical.sex} · MRN {surgical.mrn}
              </p>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>CAPD completeness</span>
                  <span>{surgical.completeness}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${surgical.completeness}%` }}
                  />
                </div>
              </div>
              {surgical.suggestions.length > 0 ? (
                <p className="text-xs text-amber-300">
                  {surgical.suggestions.length} documentation gap
                  {surgical.suggestions.length === 1 ? "" : "s"}
                </p>
              ) : (
                <p className="text-xs text-emerald-300">Ready to file</p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
