"use client";

import { useEffect } from "react";

/** Keeps APM charts populated while the demo is open. */
export function ApmHeartbeat() {
  useEffect(() => {
    const ping = () => {
      void fetch("/api/apm", { method: "POST", cache: "no-store" });
    };
    ping();
    const id = window.setInterval(ping, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
