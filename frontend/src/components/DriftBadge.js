import React from "react";
import { ShieldCheck, TriangleAlert, Siren } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP = {
  stable: {
    icon: ShieldCheck,
    cls: "bg-muted text-muted-foreground border-border",
    testid: "drift-indicator-stable",
  },
  watch: {
    icon: TriangleAlert,
    cls: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
    testid: "drift-indicator-watch",
  },
  high: {
    icon: Siren,
    cls: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900",
    testid: "drift-indicator-high",
  },
};

export const DriftBadge = ({ drift, className }) => {
  if (!drift) return null;
  const m = MAP[drift.state] || MAP.stable;
  const Icon = m.icon;
  return (
    <span
      data-testid={m.testid}
      title={drift.detail}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", m.cls, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {drift.label}
    </span>
  );
};
